export type AdminRole = 'OWNER' | 'SUPER_ADMIN' | 'READ_ONLY_ADMIN';

// Auth & Admin
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: AdminRole;
  expiresInMs: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AdminUserDto {
  id?: number;
  username: string;
  role: AdminRole | string;
}

// Plans
export interface PlanDto {
  id?: number;
  planName: string;
  requestsPerMinute: number;
  price?: number;
}

export interface CreatePlanRequest {
  planName: string;
  requestsPerMinute: number;
  price?: number;
}

export interface UpdatePlanRequest {
  planName: string;
  requestsPerMinute: number;
  price?: number;
}

// Clients
export interface ClientDto {
  id?: number;
  clientName: string;
  apiKey: string;
  active: boolean;
  plan?: PlanDto;
  planName?: string;
  createdAt?: string;
}

export interface CreateClientRequest {
  name: string;
  planId: number;
  active: boolean;
}

export interface UpdateClientPlanRequest {
  planId: number;
}

export interface ClientApiKeyRotationResponse {
  id: number;
  clientName: string;
  apiKey: string;
  planName: string;
  active: boolean;
  rotatedAt?: string;
}

export interface ClientMetadataResponse {
  id: number;
  clientName: string;
  active: boolean;
  planName: string;
}

export interface ClientStatsDto {
  clientId?: number;
  totalRequests: number;
  allowedRequests?: number;
  blockedRequests: number;
  blockRate?: number;
  lastRequestTime?: string | null;
}

// Route Limits
export interface RouteLimitDto {
  id?: number;
  planId?: number;
  planName?: string;
  routePattern?: string;
  path?: string;
  requestsPerMinute?: number;
  requestPerMinute?: number;
}

export interface CreateRouteLimitRequest {
  planId: number;
  routePattern: string;
  requestsPerMinute: number;
}

export interface UpdateRouteLimitRequest {
  routePattern: string;
  requestPerMinute: number;
}

// Provisioning tokens
export interface ProvisioningTokenDto {
  id: number;
  name: string;
  defaultPlanName: string;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string | null;
}

export interface CreateProvisioningTokenRequest {
  name: string;
  defaultPlanName: string;
}

export interface CreateProvisioningTokenResponse extends ProvisioningTokenDto {
  token: string;
}

// Gateway settings
export interface GatewaySettingsDto {
  upstreamBaseUrl: string;
  healthCheckPath: string;
  timeoutMs: number;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface UpdateGatewaySettingsRequest {
  upstreamBaseUrl: string;
  healthCheckPath: string;
  timeoutMs: number;
}

export interface TestGatewayConnectionRequest {
  upstreamBaseUrl: string;
  healthCheckPath: string;
  timeoutMs: number;
}

export interface TestGatewayConnectionResponse {
  reachable: boolean;
  statusCode: number | null;
  checkedUrl: string;
  responseTimeMs: number;
  message: string;
}

// Usage Logs
export interface UsageLogDto {
  id: number;
  clientId?: number;
  path: string;
  method: string;
  isAllowed?: boolean;
  allowed?: boolean;
  statusCode: number;
  message?: string;
  reason?: string;
  timestamp: string;
}

// Abuse Alerts
export type AbuseAlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface AbuseAlertQueryParams {
  status?: AbuseAlertStatus;
}

export interface AbuseAlertDto {
  id: number;
  clientId: number;
  clientName: string;
  blockedCount: number;
  severity: string;
  message: string;
  status: AbuseAlertStatus;
  windowStart: string;
  createdAt: string;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  lastStatusChangedAt: string | null;
  blockedRequestCount?: number;
  alertedAt?: string;
  lastUpdatedAt?: string;
}

// Analytics
export interface AnalyticsDataPoint {
  timestamp: string;
  allowedRequests: number;
  blockedRequests: number;
}

export interface DashboardSummaryDto {
  clientCount?: number;
  planCount?: number;
  routeLimitCount?: number;
  totalRequests?: number;
  allowedRequests?: number;
  blockedRequests?: number;
  openAlertCount?: number;
}

export interface RouteAnalyticsDto {
  route?: string;
  totalRequests?: number;
  allowedRequests?: number;
  blockedRequests?: number;
}

export interface RouteTrafficAnalyticsDto {
  bucket?: string;
  route?: string;
  totalRequests?: number;
  allowedRequests?: number;
  blockedRequests?: number;
}

export interface ClientAnalyticsDto {
  clientId?: number;
  clientName?: string | null;
  totalRequests?: number;
  allowedRequests?: number;
  blockedRequests?: number;
}

export interface TrafficAnalyticsDto {
  bucket?: string;
  totalRequests?: number;
  allowedRequests?: number;
  blockedRequests?: number;
}
