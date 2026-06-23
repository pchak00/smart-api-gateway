import axios, { AxiosInstance } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  ClientDto,
  CreateClientRequest,
  PlanDto,
  CreatePlanRequest,
  RouteLimitDto,
  CreateRouteLimitRequest,
  UsageLogDto,
  AbuseAlertDto,
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
  CreateProvisioningTokenResponse
} from '../types';

const baseURL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/';

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor to include auth token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem('smart-gateway:token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.axiosInstance.post<LoginResponse>('/auth/login', credentials);
    return response.data;
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

  // Usage log endpoints
  async getUsageLogs(clientId: number): Promise<UsageLogDto[]> {
    const response = await this.axiosInstance.get<UsageLogDto[]>(`/admin/clients/${clientId}/usage`);
    return response.data;
  }

  // Abuse alert endpoints
  async getAbuseAlerts(clientId: number): Promise<AbuseAlertDto[]> {
    const response = await this.axiosInstance.get<AbuseAlertDto[]>(`/admin/clients/${clientId}/abuse`);
    return response.data;
  }

  async getGlobalAbuseAlerts(): Promise<AbuseAlertDto[]> {
    const response = await this.axiosInstance.get<AbuseAlertDto[]>('/admin/abuse-alerts');
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
