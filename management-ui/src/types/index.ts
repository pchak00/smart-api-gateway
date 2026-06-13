export type AdminRole = 'SUPER_ADMIN' | 'READ_ONLY_ADMIN';

// Auth & Admin
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AdminUserDto {
  id?: number;
  username: string;
  role: AdminRole;
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
export interface AbuseAlertDto {
  id?: number;
  clientId?: number;
  clientName?: string;
  blockedRequestCount?: number;
  blockedCount?: number;
  severity?: string;
  message?: string;
  alertedAt?: string;
  lastUpdatedAt?: string;
  windowStart?: string;
  createdAt?: string;
}

// Analytics
export interface AnalyticsDataPoint {
  timestamp: string;
  allowedRequests: number;
  blockedRequests: number;
}
