# AGENTS.md — Smart API Gateway Developer Guide

## Architecture Overview

**Smart API Gateway** is a Spring Boot-based API gateway and management platform with two distinct request flows that determine authentication and authorization:

### Request Flow Separation

1. **API Consumer Flow** — External clients use `X-API-Key` headers to access `/api/**` routes through the gateway. The `ApiKeyFilter` validates keys, resolves rate limits (from Redis), logs usage, and detects abuse before forwarding to the backend service.

2. **Admin Platform Flow** — Administrators access management endpoints (`/admin/**`, `/auth/**`) using JWT-based authentication with role-based authorization (`SUPER_ADMIN` or `READ_ONLY_ADMIN`).

The gateway does NOT use Spring Cloud Gateway's routing rules; instead, it manually implements routing in `GatewayRoutesConfig` using functional router beans with explicit filter chains.

### Service Architecture

| Service | Port | Responsibility |
|---------|------|-----------------|
| **Gateway Service** | 8080 | Core policy enforcement, request validation, usage logging |
| **Backend Service** | 8081 | Demo application for testing gateway behavior |
| **PostgreSQL** | 5432 | Persistent data: clients, plans, routes, usage logs, abuse alerts |
| **Redis** | 6379 | Rate limit counters (shared state for horizontal scaling) |

## Critical Components & Patterns

### Rate Limiting Pipeline

The request handling order matters:

1. `ApiKeyFilter.filter()` receives the request
2. Validates `X-API-Key` header existence and validity
3. Calls `RateLimitResolverService.resolveLimit()` to determine limit (route-specific or plan-based)
4. Calls `RateLimiterService.isAllowed()` which uses Redis with key: `rate_limit:{apiKey}:{path}`
5. If allowed, logs via `UsageLogService` and calls `AbuseDetectionService.checkAndCreateAlert()`
6. If allowed, continues to backend; otherwise returns 429

**Key Pattern**: Rate limit state is per-client-per-path in Redis. Expiration is set to 60 seconds when counter is first created (when `currentCount == 1`).

```java
// From RateLimiterService
String key = "rate_limit:" + apiKey + ":" + path;  // Client-path isolation
Long currentCount = redisTemplate.opsForValue().increment(key);
if (currentCount == 1) {
    redisTemplate.expire(key, Duration.ofSeconds(60));  // 60-second window
}
return currentCount <= limit;
```

### Plan vs Route Limits

- **Plan Limits**: Default quota for a client (stored in `Plan` entity as `requestsPerMinute`)
- **Route Limits**: Override plan defaults for specific paths (stored in `RouteLimitRepository`)

`RateLimitResolverService.resolveLimit()` first checks for route-specific limits, falls back to plan limit.

### Abuse Detection

Called twice per request in `ApiKeyFilter`:
- When rate limit is exceeded: tracks blocked requests
- On every allowed request: evaluates block count against thresholds

Thresholds are checked in `AbuseDetectionService.checkAndCreateAlert()`. Uses a cooldown mechanism to prevent duplicate alerts.

### Authentication Separation

- **API Consumer**: No authentication in traditional sense; validated by API key existence and association with active client
- **Admin**: JwtService generates tokens via `/auth/login`. JwtAuthenticationFilter validates tokens on admin endpoints

JWT configuration: stored in `application.properties` as `jwt.secret` and `jwt.expiration-ms`

## Developer Workflows

### Start the Platform

```bash
cd /home/prakash/Desktop/Projects/Smart\ Api\ Gateaway
docker compose up --build
```

Containers use DNS service names for communication (e.g., `jdbc:postgresql://postgres:5432/gateway_db` in `docker-compose.yml`).

### Build Individual Services

```bash
# Gateway Service
cd gateway-service
./mvnw clean package

# Backend Service
cd backend-service
./mvnw clean package
```

Services use Spring Boot Maven Plugin. Built JARs are in `target/` as `-SNAPSHOT.jar`.

### Database Initialization

PostgreSQL uses automatic schema creation (`spring.jpa.hibernate.ddl-auto=update`). Database initialization SQL is in `gateway-service/src/main/resources/data.sql` and runs on startup due to `spring.sql.init.mode=always`.

Demo data includes:
- Admin users: `super admin` (SUPER_ADMIN), `viewer` (READ_ONLY_ADMIN), password `admin123`
- Plans: FREE (10 RPM), PRO (100 RPM), ENTERPRISE (1000 RPM)
- Clients: `demo-free-client`, `demo-pro-client` (auto-generated API keys)

### Testing API Endpoints

Admin login to get JWT token:
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"super admin","password":"admin123"}'
```

Gateway request with API key:
```bash
curl -X GET http://localhost:8080/api/products \
  -H "X-API-Key: demo-free-client-key"
```

## Code Organization & Navigation

### Configuration Files

- `application.properties`: Environment-based config with fallbacks (JWT, DB URLs, Redis host)
- `docker-compose.yml`: Infrastructure definitions with service networking and environment variables
- `pom.xml`: Maven dependencies (Spring Boot 4.0.6, Spring Cloud 2025.1.1, JJWT 0.11.5)

### Key Directories

- `Controller/`: REST endpoints split by domain (AuthController, AdminController, GatewayController)
- `Service/`: Business logic (RateLimiterService, UsageLogService, AbuseDetectionService, etc.)
- `Filter/`: Request preprocessing (ApiKeyFilter, JwtAuthenticationFilter)
- `Entity/`: JPA entities (Client, Plan, RouteLimit, UsageLog, AbuseAlert, AdminUser)
- `Repository/`: Spring Data JPA repositories for database access
- `DTO/`: Data transfer objects for request/response serialization

### Exception Handling

Custom exceptions are thrown for domain violations:
- `PlanNotFoundException`, `ClientNotFoundException` (not found)
- `PlanInUseException`, `RouteLimitExistException` (constraint violations)
- `LastSuperAdminException` (safety rule: prevent deletion of last SUPER_ADMIN)

Callers must handle these gracefully; no global exception handler is visible in the codebase, so exceptions will return 500s unless caught explicitly.

## Integration Points

### Admin Endpoints (JWT Protected)

- `POST /auth/login` — Generate JWT token
- `POST /admin/plans` — Create plan (SUPER_ADMIN only)
- `POST /admin/clients` — Create client (SUPER_ADMIN only)
- `POST /admin/route-limits` — Create route limit
- `PATCH /admin/clients/{id}/plan` — Update client plan (SUPER_ADMIN only)
- `GET /admin/clients/{clientId}/usage` — View usage logs

### Consumer Endpoints (API Key Protected)

- `GET /api/**` — Routed to backend service after filter validation

### Backend Service

The backend is a simple Spring Boot app deployed as a separate Docker service. Routes `/api/**` requests are forwarded to `http://backend-service:8081` via Spring Cloud Gateway WebMVC routing.

## Project-Specific Patterns

### Naming Conventions

- Table/Entity: `Client`, `Plan` (singular, PascalCase)
- API Keys: Auto-generated and stored in Client entity (example: `demo-free-client-key`)
- Rate limit Redis keys: `rate_limit:{apiKey}:{path}` (colon-delimited, lowercase)
- Request timestamps: ISO-8601 (stored in `UsageLog.timestamp`)

### Error Responses

- Invalid API Key or missing header: `401 Unauthorized` with message "Missing API Key" or "Invalid API Key"
- Rate limit exceeded: `429 Too Many Requests` with message "Rate limit exceeded"
- Inactive client: `403 Forbidden` with message "Client is inactive"
- JWT invalid/expired: Handled by `JwtAuthenticationFilter` (exact status/message depends on implementation)

### DTO Pattern

DTOs are used for all REST endpoints:
- `ClientRequestDto` / `ClientResponseDto` for client operations
- `RouteLimitDto` / `RouteLimitResponse` for route limits
- `PlanDto` for plan creation

This keeps entity structure decoupled from API contracts.

## Performance & Scalability Considerations

1. **Horizontal Scaling**: Redis-backed rate limiting allows multiple gateway instances to share state. Each request increments a shared counter; TTL ensures cleanup.

2. **Database Load**: Usage logs and abuse alerts are written synchronously. High traffic may cause DB bottleneck. Future design may batch writes.

3. **Redis Connection**: Single StringRedisTemplate bean configured via spring.data.redis properties. No connection pooling tuning visible; defaults are used.

## Common Debugging Patterns

- Check if API key exists: `clientRepository.findByApiKey(apiKey)`
- Check Redis rate limit counter: `redisTemplate.opsForValue().get("rate_limit:{apiKey}:{path}")`
- Check abuse alerts for client: `abuseDetectionService.findClientAbuse(clientId)`
- Verify JWT token: Decode at jwt.io and check `exp` claim matches current time
- Check database connectivity: logs show SQL queries due to `spring.jpa.show-sql=true`

## Development Workflow

**Small milestone, feature-branch workflow** (how contributors and automated agents should work):

- **Work in short, verifiable milestones.** Each milestone implements one logical piece. Avoid large all-in-one commits.
- **Create a dedicated feature branch** for every milestone or feature. Use descriptive branch names, e.g., `feat/ui/auth-context`, `feat/ui/sidebar`, `chore/ui/docker`.

### After finishing a milestone:

1. Verify the code builds and (where applicable) runs locally.
2. Run linters and type checks before committing.
3. Commit with a focused message describing the change.
4. Push the branch and open a PR to `main` for review.

### Merge strategy

- Prefer many small, reviewed merges over long-lived branches.
- Merge only after build succeeds locally and the feature is stable.
- Squash commits only when a single coherent unit of work should be represented.

### Management UI Frontend Milestones (recommended order)

1. **Initial Vite + React + TypeScript + Tailwind scaffold** — Project initialization, package.json, config files.
2. **Routing setup and page skeletons** — React Router, basic page structure.
3. **AuthContext and JWT handling** — Store token at `localStorage` key `smart-gateway:token`, extract `role` claim.
4. **API client layer** — Centralized `/api` wrapper with Axios, token header injection.
5. **Layout (Sidebar + TopBar)** — Role-aware navigation, greyed items for restricted actions.
6. **Toast system** — Top-right notifications, permission-denied preset: "You need SUPER_ADMIN access to perform this action."
7. **Page wiring and demo-data fallbacks** — Connect pages to API, disabled controls for `READ_ONLY_ADMIN`, demo data when API unavailable.
8. **Dockerfile and docker-compose service** — Containerize UI, add `management-ui` service to compose with port 3000.

### Commit message examples

```
chore(ui): init vite + react + typescript + tailwind
feat(auth): add AuthContext and useAuth hook
feat(api): add centralized api client with token header
feat(ui): sidebar + topbar + responsive layout
feat(toast): add ToastManager and permission toast preset
chore(docker): add management-ui Dockerfile and compose service
```

### Verification checklist before merging

- Project builds (`npm run build`) without errors.
- Dev server runs (`npm run dev`) and Vite dev proxy routes API calls to `http://localhost:8080`.
- Lint/type checks pass.
- Role behavior confirmed:
  - `READ_ONLY_ADMIN` sees mutation controls disabled (Create/Edit/Delete buttons disabled).
  - `Admin Users` menu is greyed and clicking triggers permission toast: "You need SUPER_ADMIN access to perform this action."
- Dockerized UI available at `http://localhost:3000` and calls `http://localhost:8080` for backend during demo usage.

### Technology Stack (Frontend)

- **React + TypeScript** — type-safe UI components.
- **Vite** — fast dev server with dev proxy to `http://localhost:8080`.
- **Tailwind CSS** — utility-first styling.
- **React Router v6** — client-side routing.
- **Axios** — HTTP client with request/response interceptors.
- **jwt-decode** — client-side JWT decoding.
- **Recharts** — analytics charts (added later, after foundation).
- **localStorage token key** — `smart-gateway:token` for JWT persistence.

### Security & Deployment Notes

- **localStorage tokens**: Chosen for MVP convenience. Documented risk: XSS vulnerability. Recommend HTTP-only cookies for production.
- **Vite dev proxy**: Dev server routes `/api` and `/auth` to `http://localhost:8080`. Browser runs on 5173 during development.
- **Docker/Demo usage**: Browser is external to containers. UI calls `http://localhost:8080` for backend (not `http://gateway-service:8080`) unless a reverse proxy is added. Configuration via `VITE_API_BASE_URL` environment variable.

### Branching & Commit Conventions

- Branch name format: `feat/<area>/<short-desc>` or `chore/<area>/<short-desc>`
- Keep commits small, descriptive, and focused (easier to review, test, and rollback).
- Reference issue IDs where relevant.
- Example: `feat(sidebar): add role-based menu item disabling and permission toast`
