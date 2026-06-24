import { ClientDto, PlanDto, RouteLimitDto, UsageLogDto, AbuseAlertDto, AnalyticsDataPoint } from '../types';

export const demoPlan: PlanDto = {
  id: 1,
  planName: 'FREE',
  requestsPerMinute: 10,
  price: 0
};

export const demoPlansList: PlanDto[] = [
  { id: 1, planName: 'FREE', requestsPerMinute: 10, price: 0 },
  { id: 2, planName: 'PRO', requestsPerMinute: 100, price: 29.99 },
  { id: 3, planName: 'ENTERPRISE', requestsPerMinute: 1000, price: 299.99 }
];

export const demoClient: ClientDto = {
  id: 1,
  clientName: 'Demo Client',
  apiKey: 'demo-free-client-key',
  plan: demoPlan,
  active: true,
  createdAt: new Date().toISOString()
};

export const demoClientsList: ClientDto[] = [
  {
    id: 1,
    clientName: 'Demo Free Client',
    apiKey: 'demo-free-client-key',
    plan: demoPlansList[0],
    active: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    clientName: 'Demo Pro Client',
    apiKey: 'demo-pro-client-key',
    plan: demoPlansList[1],
    active: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const demoUsageLogs: UsageLogDto[] = [
  {
    id: 1,
    clientId: 1,
    path: '/api/products',
    method: 'GET',
    isAllowed: true,
    statusCode: 200,
    message: 'Request allowed',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    clientId: 1,
    path: '/api/products',
    method: 'GET',
    isAllowed: true,
    statusCode: 200,
    message: 'Request allowed',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    clientId: 1,
    path: '/api/reports',
    method: 'GET',
    isAllowed: false,
    statusCode: 429,
    message: 'Rate limit exceeded',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  }
];

export const demoRouteLimitsList: RouteLimitDto[] = [
  { id: 1, planId: 1, routePattern: '/api/reports', requestsPerMinute: 2 },
  { id: 2, planId: 1, routePattern: '/api/products', requestsPerMinute: 10 },
  { id: 3, planId: 2, routePattern: '/api/reports', requestsPerMinute: 20 }
];

export const demoAbuseAlerts: AbuseAlertDto[] = [
  {
    id: 1,
    clientId: 2,
    clientName: 'Demo Pro Client',
    blockedCount: 5,
    blockedRequestCount: 5,
    severity: 'HIGH',
    message: 'Client exceeded blocked request threshold',
    status: 'OPEN',
    windowStart: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    lastStatusChangedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    alertedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

export const demoAnalyticsData: AnalyticsDataPoint[] = [
  { timestamp: '2024-01-01', allowedRequests: 450, blockedRequests: 22 },
  { timestamp: '2024-01-02', allowedRequests: 520, blockedRequests: 18 },
  { timestamp: '2024-01-03', allowedRequests: 380, blockedRequests: 35 },
  { timestamp: '2024-01-04', allowedRequests: 610, blockedRequests: 8 },
  { timestamp: '2024-01-05', allowedRequests: 690, blockedRequests: 12 },
  { timestamp: '2024-01-06', allowedRequests: 740, blockedRequests: 5 },
  { timestamp: '2024-01-07', allowedRequests: 820, blockedRequests: 15 }
];
