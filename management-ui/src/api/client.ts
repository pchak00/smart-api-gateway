import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  ClientDto,
  CreateClientRequest,
  PlanDto,
  CreatePlanRequest,
  UpdatePlanRequest,
  RouteLimitDto,
  CreateRouteLimitRequest,
  UsageLogDto,
  AbuseAlertDto,
  AbuseAlertQueryParams,
  UpdateClientPlanRequest,
  UpdateRouteLimitRequest,
  AdminUserDto,
  ClientStatsDto,
  DashboardSummaryDto,
  RouteAnalyticsDto,
  ClientAnalyticsDto,
  TrafficAnalyticsDto,
  ProvisioningTokenDto,
  CreateProvisioningTokenRequest,
  CreateProvisioningTokenResponse,
  GatewaySettingsDto,
  UpdateGatewaySettingsRequest,
  TestGatewayConnectionRequest,
  TestGatewayConnectionResponse
} from '../types';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/';
export const ACCESS_TOKEN_KEY = 'smart-gateway:token';
export const REFRESH_TOKEN_KEY = 'smart-gateway:refresh-token';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface AuthCallbacks {
  onSessionRefreshed?: (response: LoginResponse) => void;
  onSessionExpired?: () => void;
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private refreshPromise: Promise<LoginResponse> | null = null;
  private authCallbacks: AuthCallbacks = {};

  constructor() {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as RetriableRequestConfig | undefined;
        const status = error.response?.status;
        const url = originalRequest?.url ?? '';
        const isAuthEndpoint = url.includes('/auth/login') ||
          url.includes('/auth/refresh') ||
          url.includes('/auth/logout');

        if (status !== 401 || !originalRequest || originalRequest._retry || isAuthEndpoint) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
          const session = await this.refreshAccessToken();
          originalRequest.headers.Authorization = `Bearer ${session.token}`;
          return this.axiosInstance(originalRequest);
        } catch (refreshError) {
          this.clearStoredSession();
          this.authCallbacks.onSessionExpired?.();
          return Promise.reject(refreshError);
        }
      }
    );
  }

  setAuthCallbacks(callbacks: AuthCallbacks) {
    this.authCallbacks = callbacks;
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  }

  async refreshAccessToken(): Promise<LoginResponse> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('Missing refresh token');
    }

    if (!this.refreshPromise) {
      const payload: RefreshTokenRequest = { refreshToken };
      this.refreshPromise = axios
        .post<LoginResponse>('/auth/refresh', payload, {
          baseURL,
          headers: {
            'Content-Type': 'application/json'
          }
        })
        .then((response) => {
          this.storeSession(response.data);
          this.authCallbacks.onSessionRefreshed?.(response.data);
          return response.data;
        })
        .finally(() => {
          this.refreshPromise = null;
        });
    }

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      await axios.post('/auth/logout', { refreshToken }, {
        baseURL,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  storeSession(session: LoginResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.token);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  }

  clearStoredSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  // Client endpoints
  async getClients(): Promise<ClientDto[]> {
    const response = await this.axiosInstance.get<ClientDto[]>('/admin/clients');
    return response.data;
  }

  async createClient(payload: CreateClientRequest): Promise<ClientDto> {
    const response = await this.axiosInstance.post<ClientDto>('/admin/clients', payload);
    return response.data;
  }

  async updateClient(id: number, payload: UpdateClientPlanRequest): Promise<ClientDto> {
    const response = await this.axiosInstance.patch<ClientDto>(`/admin/clients/${id}/plan`, payload);
    return response.data;
  }

  async deleteClient(id: number): Promise<void> {
    await this.axiosInstance.delete(`/admin/clients/${id}`);
  }

  async getClientStats(clientId: number): Promise<ClientStatsDto> {
    const response = await this.axiosInstance.get<ClientStatsDto>(`/admin/clients/${clientId}/stats`);
    return response.data;
  }

  // Plan endpoints
  async getPlans(): Promise<PlanDto[]> {
    const response = await this.axiosInstance.get<PlanDto[]>('/admin/plans');
    return response.data;
  }

  async createPlan(payload: CreatePlanRequest): Promise<PlanDto> {
    const response = await this.axiosInstance.post<PlanDto>('/admin/clients/plans', payload);
    return response.data;
  }

  async updatePlan(id: number, payload: UpdatePlanRequest): Promise<PlanDto> {
    const response = await this.axiosInstance.patch<PlanDto>(`/admin/clients/plans/${id}`, payload);
    return response.data;
  }

  async deletePlan(id: number): Promise<void> {
    await this.axiosInstance.delete(`/admin/clients/plans/${id}`);
  }

  // Route limit endpoints
  async getRouteLimits(): Promise<RouteLimitDto[]> {
    const response = await this.axiosInstance.get<RouteLimitDto[]>('/admin/route-limits');
    return response.data;
  }

  async createRouteLimit(payload: CreateRouteLimitRequest): Promise<RouteLimitDto> {
    const response = await this.axiosInstance.post<RouteLimitDto>('/admin/clients/routeLimits', payload);
    return response.data;
  }

  async updateRouteLimit(id: number, payload: UpdateRouteLimitRequest): Promise<RouteLimitDto> {
    const response = await this.axiosInstance.patch<RouteLimitDto>(`/admin/clients/route-limits/${id}`, payload);
    return response.data;
  }

  async deleteRouteLimit(id: number): Promise<void> {
    await this.axiosInstance.delete(`/admin/clients/route-limits/${id}`);
  }

  // Provisioning token endpoints
  async getProvisioningTokens(): Promise<ProvisioningTokenDto[]> {
    const response = await this.axiosInstance.get<ProvisioningTokenDto[]>('/admin/provisioning-tokens');
    return response.data;
  }

  async createProvisioningToken(
    payload: CreateProvisioningTokenRequest
  ): Promise<CreateProvisioningTokenResponse> {
    const response = await this.axiosInstance.post<CreateProvisioningTokenResponse>(
      '/admin/provisioning-tokens',
      payload
    );
    return response.data;
  }

  async disableProvisioningToken(id: number): Promise<ProvisioningTokenDto> {
    const response = await this.axiosInstance.patch<ProvisioningTokenDto>(
      `/admin/provisioning-tokens/${id}/disable`
    );
    return response.data;
  }

  // Gateway settings endpoints
  async getGatewaySettings(): Promise<GatewaySettingsDto> {
    const response = await this.axiosInstance.get<GatewaySettingsDto>('/admin/settings/gateway');
    return response.data;
  }

  async updateGatewaySettings(payload: UpdateGatewaySettingsRequest): Promise<GatewaySettingsDto> {
    const response = await this.axiosInstance.put<GatewaySettingsDto>('/admin/settings/gateway', payload);
    return response.data;
  }

  async testGatewayConnection(
    payload: TestGatewayConnectionRequest
  ): Promise<TestGatewayConnectionResponse> {
    const response = await this.axiosInstance.post<TestGatewayConnectionResponse>(
      '/admin/settings/gateway/test-connection',
      payload
    );
    return response.data;
  }

  // Usage log endpoints
  async getUsageLogs(clientId: number): Promise<UsageLogDto[]> {
    const response = await this.axiosInstance.get<UsageLogDto[]>(`/admin/clients/${clientId}/usage`);
    return response.data;
  }

  // Abuse alert endpoints
  async getClientAbuseAlerts(clientId: number): Promise<AbuseAlertDto[]> {
    const response = await this.axiosInstance.get<AbuseAlertDto[]>(`/admin/clients/${clientId}/abuse`);
    return response.data;
  }

  async getAbuseAlerts(params?: AbuseAlertQueryParams): Promise<AbuseAlertDto[]> {
    const response = await this.axiosInstance.get<AbuseAlertDto[]>('/admin/abuse-alerts', { params });
    return response.data;
  }

  async acknowledgeAbuseAlert(id: number): Promise<AbuseAlertDto> {
    const response = await this.axiosInstance.patch<AbuseAlertDto>(`/admin/abuse-alerts/${id}/acknowledge`);
    return response.data;
  }

  async resolveAbuseAlert(id: number): Promise<AbuseAlertDto> {
    const response = await this.axiosInstance.patch<AbuseAlertDto>(`/admin/abuse-alerts/${id}/resolve`);
    return response.data;
  }

  // Admin user endpoints
  async getAdminUsers(): Promise<AdminUserDto[]> {
    const response = await this.axiosInstance.get<AdminUserDto[]>('/admin/users');
    return response.data;
  }

  async createAdminUser(payload: { username: string; password: string; role: string }): Promise<AdminUserDto> {
    const response = await this.axiosInstance.post<AdminUserDto>('/admin/users', payload);
    return response.data;
  }

  async updateAdminUserRole(id: number, payload: { role: string }): Promise<AdminUserDto> {
    const response = await this.axiosInstance.patch<AdminUserDto>(`/admin/users/${id}/role`, payload);
    return response.data;
  }

  async deleteAdminUser(id: number): Promise<void> {
    await this.axiosInstance.delete(`/admin/users/${id}`);
  }

  // Dashboard and analytics endpoints
  async getDashboardSummary(): Promise<DashboardSummaryDto> {
    const response = await this.axiosInstance.get<DashboardSummaryDto>('/admin/dashboard/summary');
    return response.data;
  }

  async getRouteAnalytics(): Promise<RouteAnalyticsDto[]> {
    const response = await this.axiosInstance.get<RouteAnalyticsDto[]>('/admin/analytics/routes');
    return response.data;
  }

  async getClientAnalytics(): Promise<ClientAnalyticsDto[]> {
    const response = await this.axiosInstance.get<ClientAnalyticsDto[]>('/admin/analytics/clients');
    return response.data;
  }

  async getTrafficAnalytics(): Promise<TrafficAnalyticsDto[]> {
    const response = await this.axiosInstance.get<TrafficAnalyticsDto[]>('/admin/analytics/traffic');
    return response.data;
  }
}

export const api = new ApiClient();
