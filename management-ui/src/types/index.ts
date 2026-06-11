// Auth & Admin
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface AdminUserDto {
  id: number;
  username: string;
  role: 'SUPER_ADMIN' | 'READ_ONLY_ADMIN';
}

// Plans
export interface PlanDto {
  id: number;
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
  id: number;
  clientName: string;
  apiKey: string;
  plan: PlanDto;
  active: boolean;
  createdAt: string;
}

export interface CreateClientRequest {
  clientName: string;
  planId: number;
}

export interface UpdateClientPlanRequest {
  planId: number;
}

export interface ClientStatsDto {
  totalRequests: number;
  blockedRequests: number;
  lastRequestTime: string | null;
}

// Route Limits
export interface RouteLimitDto {
  id: number;
  planId: number;
  routePattern: string;
  requestsPerMinute: number;
}

export interface CreateRouteLimitRequest {
  planId: number;
  routePattern: string;
  requestsPerMinute: number;
}

export interface UpdateRouteLimitRequest {
  routePattern: string;
  requestsPerMinute: number;
}

// Usage Logs
export interface UsageLogDto {
  id: number;
  clientId: number;
  path: string;
  method: string;
  isAllowed: boolean;
  statusCode: number;
  message: string;
  timestamp: string;
}

// Abuse Alerts
export interface AbuseAlertDto {
  id: number;
  clientId: number;
  blockedRequestCount: number;
  alertedAt: string;
  lastUpdatedAt: string;
}

// Analytics
export interface AnalyticsDataPoint {
  timestamp: string;
  allowedRequests: number;
  blockedRequests: number;
}

