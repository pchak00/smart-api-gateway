# Smart API Gateway

Smart API Gateway is a developer-first API management platform built with Spring Boot, PostgreSQL, Redis, Docker, and a React/TypeScript management UI branded as `pacific`.

The gateway demonstrates a full-stack API operations workflow:

- API gateway routing and API-key enforcement
- Redis-backed rate limiting
- plan-based quotas and route-specific limits
- PostgreSQL persistence for platform data
- JWT admin authentication
- role-based authorization
- usage analytics
- blocked-request abuse detection
- Dockerized full-stack deployment
- Pacific React/TypeScript admin console

The goal is to show a practical, self-hostable gateway platform for demos, portfolio review, and local experimentation. It is not positioned as a replacement for production gateway products such as Kong, Apigee, AWS API Gateway, or NGINX.

## Architecture Overview

The platform has two request flows:

1. **API consumer flow** - external clients call protected `/api/**` routes with an `X-API-Key` header.
2. **Admin platform flow** - operators use the Pacific management UI or admin API with JWT authentication.

```text
Browser
  -> management-ui (Pacific console, http://localhost:3000)
  -> gateway-service (admin API, http://localhost:8080)
  -> postgres / redis

API Consumer
  -> gateway-service (API key validation, rate limiting)
  -> backend-service (demo upstream API)
```

### Services

| Service | Port | Responsibility |
|---|---:|---|
| `gateway-service` | `8080` | Public gateway and admin entry point. Validates API keys for `/api/**`, enforces rate limits, records usage, detects abuse, and serves JWT-protected admin APIs. |
| `backend-service` | `8081` | Demo upstream API used to verify gateway routing and traffic policies. |
| `postgres` | `5432` | Persistent platform data: clients, plans, route limits, usage logs, abuse alerts, and admin users. |
| `redis` | `6379` | Shared rate-limit counters for per-client/per-path request windows. |
| `management-ui` | `3000` | Pacific React admin console served by Nginx in Docker Compose. |

The browser UI calls `http://localhost:8080`. The Docker DNS name `gateway-service` is only for container-to-container communication and should not be used by browser code.

## Core Capabilities

### API Gateway

- API consumers authenticate with `X-API-Key`.
- Valid gateway requests are routed to the demo backend service.
- Rate limits are resolved from a route-specific override when one exists; otherwise the client's assigned plan limit is used.
- Redis stores rate-limit counters using per-client/per-path keys.

### Pacific Management UI

The Pacific console runs at `http://localhost:3000` when started through Docker Compose.

Current UI capabilities include:

- dashboard summary
- client list, detail, provisioning, deletion, plan changes, usage, stats, and abuse history
- plan list, creation, and deletion
- route-limit list, creation, update, and deletion
- admin-user list, creation, deletion, and role updates
- analytics pages for route, client, and traffic data
- global abuse-alert list

### Authentication And Roles

Admin authentication uses JWTs issued by `POST /auth/login`.

Backend enum values remain:

- `SUPER_ADMIN`
- `READ_ONLY_ADMIN`

The UI displays customer-facing labels:

- `SUPER_ADMIN` as `Admin`
- `READ_ONLY_ADMIN` as `Viewer`

`SUPER_ADMIN` users can create, update, and delete supported resources. `READ_ONLY_ADMIN` users can view allowed pages and data, cannot mutate resources, and are blocked from the Admin Users page.

### Analytics And Abuse Detection

Usage logs are written for gateway traffic and power dashboard and analytics endpoints. Abuse detection is based on blocked requests only. When a client repeatedly exceeds limits, the gateway persists abuse alerts.

Current limitation: alerts do not yet have lifecycle statuses such as `Open`, `Acknowledged`, or `Resolved`, so alert counts represent persisted alerts.

## Quick Start

Run from the repository root:

```bash
docker compose up --build
```

Open:

```text
Pacific management UI: http://localhost:3000
Gateway/Admin API:     http://localhost:8080
Demo backend API:      http://localhost:8081
```

Stop the stack:

```bash
docker compose down
```

Reset local Docker volumes and reload seed data on the next startup:

```bash
docker compose down -v
```

Use `docker compose down -v` when you want a clean local PostgreSQL database with the seeded demo accounts, plans, clients, and route limits.

## Seeded Local Demo Data

Seed data is loaded from `gateway-service/src/main/resources/data.sql`.

### Admin Users

```text
Super admin:
username: super admin
password: admin123
role: SUPER_ADMIN
UI label: Admin

Read-only viewer:
username: viewer
password: admin123
role: READ_ONLY_ADMIN
UI label: Viewer
```

These credentials are for local demo use only.

### Plans

| Plan | Requests Per Minute | Price |
|---|---:|---:|
| `FREE` | 10 | 0.00 |
| `PRO` | 100 | 29.00 |
| `ENTERPRISE` | 1000 | 199.00 |

Custom plan names are also supported by the admin API and UI.

### Demo Clients

| Client | API Key | Plan |
|---|---|---|
| Demo Free Client | `free-demo-api-key` | `FREE` |
| Demo Pro Client | `pro-demo-api-key` | `PRO` |

### Seeded Route Limits

| Plan | Route | Requests Per Minute |
|---|---|---:|
| `FREE` | `/api/products` | 5 |
| `FREE` | `/api/reports` | 2 |

These route-specific limits override the `FREE` plan default for those exact paths.

## Demo Walkthrough

This flow lets a reviewer run and exercise the platform in about 10 minutes.

### A. Start The Stack

```bash
docker compose up --build
```

Wait until `management-ui`, `gateway-service`, `backend-service`, `postgres`, and `redis` are running.

### B. Open Pacific

Open:

```text
http://localhost:3000
```

### C. Log In As Admin

Use the seeded super-admin credentials:

```text
username: super admin
password: admin123
```

### D. Review Dashboard

The dashboard shows live platform counts and request activity where data exists:

- client count
- plan count
- route-limit count
- total, allowed, and blocked requests
- persisted abuse-alert count

Fresh databases may show no request analytics until traffic is sent through the gateway.

### E. Create Or Inspect An API Client

Use the Clients page to inspect the seeded clients or create a new API client. Manual admin provisioning is currently supported through the Pacific console and admin API.

Each client receives:

- a generated API key
- an assigned plan
- an active/inactive state

This is useful for demos, internal service clients, enterprise/manual onboarding, and support operations. Programmatic provisioning for external application signup is planned for a future milestone.

### F. Call A Protected Route Through The Gateway

Use a seeded API key or copy the API key from a client created in the UI:

```bash
curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/products
```

Other demo backend routes behind the gateway:

```bash
curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/orders
curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/reports
curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/health
```

### G. Trigger Rate Limiting

The seeded `FREE` route limit for `/api/products` is 5 requests per minute. This loop should produce allowed responses followed by `429 Too Many Requests` responses:

```bash
for i in {1..8}; do curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/products; echo; done
```

Abuse alerts require repeated blocked requests. Current abuse detection creates an alert after at least 10 blocked requests for the same client within the detection window:

```bash
for i in {1..18}; do curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/products; echo; done
```

### H. Return To Pacific

Refresh the dashboard and analytics pages. Request activity should appear in:

- dashboard summary
- traffic analytics
- route analytics
- client analytics
- client detail usage/stats views

Abuse alerts may appear after blocked-request thresholds are crossed.

### I. Verify Viewer Permissions

Log out and log in as:

```text
username: viewer
password: admin123
```

Verify that the Viewer can inspect dashboard, clients, plans, route limits, analytics, and alerts, but cannot create, update, or delete resources. The Admin Users page is blocked for the Viewer role.

## Client Onboarding Model

### Current Model

Admins can manually provision API clients from the Pacific console or admin API. Each client receives an API key and assigned plan.

This supports:

- local demos
- internal service clients
- enterprise/manual onboarding
- support and operations workflows

### Future Model

Programmatic client provisioning is planned so an external application backend can call Pacific during user signup. That flow should use a limited provisioning token rather than a full admin JWT.

A public developer self-service portal may be added later as a separate extension.

## API Examples

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "super admin",
    "password": "admin123"
  }'
```

Copy the returned token and use it for admin API calls:

```bash
TOKEN="<paste-token-here>"
```

### List Clients

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/admin/clients
```

### Create Client

```bash
curl -X POST http://localhost:8080/admin/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Demo Client",
    "planId": 1,
    "active": true
  }'
```

The response includes the generated `apiKey`.

### Change Client Plan

```bash
curl -X PATCH http://localhost:8080/admin/clients/1/plan \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": 2
  }'
```

### Client Detail Data

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/clients/1/stats
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/clients/1/usage
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/clients/1/abuse
```

### List Plans

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/admin/plans
```

### Create Plan

The current create-plan endpoint is nested under `/admin/clients`:

```bash
curl -X POST http://localhost:8080/admin/clients/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "STARTUP",
    "requestsPerMinute": 250,
    "price": 49.99
  }'
```

### List Route Limits

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/admin/route-limits
```

### Create Route Limit

The current create-route-limit endpoint uses the legacy path `/admin/clients/routeLimits`:

```bash
curl -X POST http://localhost:8080/admin/clients/routeLimits \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": 2,
    "routePattern": "/api/reports",
    "requestsPerMinute": 20
  }'
```

### Update Route Limit

The current update request body uses `requestPerMinute`:

```bash
curl -X PATCH http://localhost:8080/admin/clients/route-limits/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routePattern": "/api/products",
    "requestPerMinute": 10
  }'
```

### Dashboard Summary

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/admin/dashboard/summary
```

### Analytics

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/analytics/routes
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/analytics/clients
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/analytics/traffic
```

### Abuse Alerts

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/admin/abuse-alerts
```

### Admin Users

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:8080/admin/users

curl -X POST http://localhost:8080/admin/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ops-viewer",
    "password": "admin123",
    "role": "READ_ONLY_ADMIN"
  }'

curl -X PATCH http://localhost:8080/admin/users/2/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "SUPER_ADMIN"
  }'
```

The backend prevents deleting or demoting the last `SUPER_ADMIN`.

### Gateway API Traffic

```bash
curl -i -H "X-API-Key: free-demo-api-key" http://localhost:8080/api/products
```

Missing or invalid API keys return `401`. Inactive clients return `403`. Exceeded rate limits return `429`.

## Local Development

### Gateway Service

```bash
cd gateway-service
./mvnw clean package
```

### Backend Service

```bash
cd backend-service
./mvnw clean package
```

### Management UI

```bash
cd management-ui
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` and proxies `/api`, `/auth`, and `/admin` to `http://localhost:8080` unless `VITE_API_BASE_URL` is set differently.

## Current Limitations And Roadmap

Planned improvements include:

- client provisioning API with a limited provisioning token
- gateway settings UI/API for runtime upstream configuration
- dynamic upstream routing from database settings with environment fallback
- alert lifecycle statuses such as `Open`, `Acknowledged`, and `Resolved`
- API key hashing and rotation if not fully implemented
- improved test profile and Testcontainers support if Spring context currently requires PostgreSQL
- pagination and filtering for admin lists and analytics
- expanded production deployment guidance

These are future improvements, not current platform behavior.

## Repository Notes

- Full-stack demo usage should run from the repository root with `docker compose up --build`.
- The compose build serves the management UI with Nginx on host port `3000`.
- Browser frontend code should call `http://localhost:8080`, not `http://gateway-service:8080`.
- The demo backend routes currently available through the gateway are `/api/products`, `/api/orders`, `/api/reports`, and `/api/health`.
