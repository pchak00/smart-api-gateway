# Pacific Deployment Guide

This guide explains how to run Pacific beyond localhost as a public portfolio demo or a self-hosted single-organization deployment.

Pacific can run on any platform that can run Docker services and provide PostgreSQL and Redis. Suitable targets include Railway, Render, DigitalOcean App Platform, Fly.io, or a VPS with Docker Compose. This guide stays vendor-neutral and does not deploy the app.

## Deployment Levels

### A. Local Docker Demo

Use this for development and local demos.

```bash
docker compose up --build
```

Local URLs:

```text
Management UI: http://localhost:3000
Gateway/Admin API: http://localhost:8080
Backend demo API: http://localhost:8081
```

Docker Compose runs PostgreSQL on `5432` and Redis on `6379`. Local defaults are documented in the root `.env.example`.

### B. Public Portfolio Demo

This is the immediate recommended public target.

A public demo should have:

- a public management UI URL, such as `https://your-pacific-ui.example.com`
- a public gateway/admin API URL, such as `https://your-pacific-api.example.com`
- managed PostgreSQL
- managed Redis
- the demo `backend-service`, or another configured upstream API

This keeps the deployment close to the local architecture while replacing local-only URLs and secrets with public deployment configuration.

### C. Self-Hosted Deployment

Use this when running Pacific for one organization on a VPS or Docker host.

Deploy the same services, provide real environment variables, and configure HTTPS and a reverse proxy separately. The current repository does not include a production reverse proxy configuration.

### D. SaaS / Multi-Tenant Deployment

This is future direction only. The current deployment target is a public portfolio demo or self-hosted single-organization installation, not a full SaaS platform.

## Deployable Services

```text
Browser
  -> management-ui
  -> gateway-service
       -> postgres
       -> redis
       -> backend-service / configured upstream
```

For API consumers:

```text
API consumer
  -> gateway-service
       -> configured upstream API
```

| Service | Port | Deployment role |
|---|---:|---|
| `management-ui` | `80` in container, `3000` in local Compose | React/Vite management UI served by Nginx. Public browser-facing frontend. |
| `gateway-service` | `8080` | Public gateway/admin API. Validates API keys, enforces rate limits, serves admin APIs, and talks to PostgreSQL, Redis, and the upstream backend. |
| `backend-service` | `8081` | Demo upstream API behind the gateway. |
| `postgres` | `5432` | Persistent platform data: clients, plans, gateway settings, usage logs, abuse alerts, admin users, and refresh sessions. |
| `redis` | `6379` | Shared Redis state for rate limiting counters. |

Current Dockerfiles:

- `gateway-service/Dockerfile`
- `backend-service/Dockerfile`
- `management-ui/Dockerfile`

The Spring service Dockerfiles copy `target/*.jar`, so the JARs must be built before those images are built unless your deployment pipeline replaces that behavior.

## URL Rules

The management UI is browser code. It must call a gateway/admin API URL that the user's browser can reach.

Local Docker Compose:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Public deployment:

```env
VITE_API_BASE_URL=https://your-pacific-api.example.com
```

Do not use Docker-internal service names in browser code:

```text
http://gateway-service:8080
```

That hostname only works inside Docker networks. It does not resolve in a user's browser unless you add separate DNS or proxying that makes it public, which is not the current architecture.

Container-to-container URLs are different. For example, `BACKEND_SERVICE_URL=http://backend-service:8081` is valid inside local Docker Compose because the gateway container can resolve the `backend-service` service name.

## Environment Variables

Use the root `.env.example` as the source of truth for variable names. Do not commit real secrets.

### Database

| Variable | Purpose | Local example | Deployment note |
|---|---|---|---|
| `POSTGRES_DB` | Database name created by the local PostgreSQL container. | `gateway_db` | Use the managed database name if your platform requires it. |
| `POSTGRES_USER` | PostgreSQL user created by the local container. | `postgres` | Use a dedicated deployment user. |
| `POSTGRES_PASSWORD` | PostgreSQL password for the local container. | `change-me` | Use a strong generated secret. |
| `SPRING_DATASOURCE_URL` | JDBC URL used by `gateway-service`. | `jdbc:postgresql://postgres:5432/gateway_db` | Use the managed PostgreSQL internal/private connection URL when available. |
| `SPRING_DATASOURCE_USERNAME` | Database username used by `gateway-service`. | `postgres` | Match the managed database credential. |
| `SPRING_DATASOURCE_PASSWORD` | Database password used by `gateway-service`. | `change-me` | Store as a secret in the deployment platform. |

### Redis

| Variable | Purpose | Local example | Deployment note |
|---|---|---|---|
| `SPRING_DATA_REDIS_HOST` | Redis host used by `gateway-service`. | `redis` | Use the managed Redis internal/private host if available. |
| `SPRING_DATA_REDIS_PORT` | Redis port used by `gateway-service`. | `6379` | Match the managed Redis port. |

### Auth

| Variable | Purpose | Local example | Deployment note |
|---|---|---|---|
| `JWT_SECRET` | Signing secret for admin JWT access tokens. | `replace-with-at-least-32-random-characters` | Must be replaced with a long random secret before any public deployment. |
| `JWT_EXPIRATION_MS` | Admin access token lifetime. | `3600000` | Tune for your demo or organization policy. |
| `ADMIN_REFRESH_TOKEN_EXPIRATION_MS` | Admin refresh token lifetime. | `604800000` | Tune for your demo or organization policy. |

### Gateway / Upstream

| Variable | Purpose | Local example | Deployment note |
|---|---|---|---|
| `BACKEND_SERVICE_URL` | Fallback upstream URL used by gateway routing when no valid DB gateway settings row is available. | `http://backend-service:8081` | Use an internal service URL when the upstream is deployed beside the gateway, or a public/private upstream URL for a separate API. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of management UI origins allowed to call the gateway/admin API. | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173` | Set this to the deployed UI origin, for example `https://your-pacific-ui.example.com`. |

### Frontend

| Variable | Purpose | Local example | Deployment note |
|---|---|---|---|
| `VITE_API_BASE_URL` | Browser-visible gateway/admin API base URL embedded into the management UI bundle at build time. | `http://localhost:8080` | Set to the public API URL before building the UI image or static bundle. |

### Demo / Provisioning

There is no provisioning token environment variable in `.env.example` today.

The local database seed currently includes demo admin credentials, demo API keys, and a local `demo-provisioning-token`. These are acceptable for local demos but need a deployment policy before a public demo or production deployment. Options include rotating seeded values, disabling demo seed data, or replacing demo seed data with deployment-specific bootstrap data.

## CORS

`CORS_ALLOWED_ORIGINS` must include the deployed management UI origin.

Local:

```env
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Public deployment:

```env
CORS_ALLOWED_ORIGINS=https://your-pacific-ui.example.com
```

Avoid unrestricted wildcard origins for admin APIs. Update this value whenever the public UI URL changes.

## Managed PostgreSQL and Redis

For a public demo, prefer managed PostgreSQL and Redis when the platform provides them.

General setup:

1. Create managed PostgreSQL.
2. Create managed Redis.
3. Copy the database connection details into `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`.
4. Copy the Redis connection details into `SPRING_DATA_REDIS_HOST` and `SPRING_DATA_REDIS_PORT`.
5. Keep PostgreSQL and Redis private if the platform supports private networking.
6. Do not expose PostgreSQL or Redis publicly unless your platform requires it and you have strong network restrictions.

## Recommended Deployment Order

1. Create PostgreSQL.
2. Create Redis.
3. Build and deploy `backend-service`.
4. Build and deploy `gateway-service`.
5. Build and deploy `management-ui`.
6. Configure `VITE_API_BASE_URL` to the public gateway/admin API URL.
7. Configure `CORS_ALLOWED_ORIGINS` to the public management UI URL.
8. Smoke test the deployment.

## Public Demo Smoke Test

Use placeholders for your deployment:

```text
UI_URL=https://your-pacific-ui.example.com
API_URL=https://your-pacific-api.example.com
BACKEND_URL=https://your-pacific-backend.example.com
API_KEY=<demo-api-key>
```

Checklist:

- Open `${UI_URL}` and confirm the Pacific UI loads.
- Confirm `${API_URL}/health` returns `200`.
- Confirm `${BACKEND_URL}/health` returns `200`, or confirm the configured upstream health check works.
- Log in with the intended demo admin account.
- Confirm the dashboard loads.
- Create or inspect a client.
- Call a gateway route with `X-API-Key: ${API_KEY}`.
- Trigger rate limiting on a low-limit route and confirm `429` responses.
- Confirm analytics update after gateway traffic.
- Confirm an abuse alert appears after repeated blocked requests and can be acknowledged/resolved by an allowed admin.
- Rotate an API key and confirm the old key no longer works.
- Confirm gateway settings load.
- Run the gateway settings test connection flow.
- Log in as a viewer and confirm the viewer cannot mutate resources.

## Security Notes

- Change `JWT_SECRET` before any public deployment.
- Do not commit a real `.env` file.
- Use strong database passwords.
- Restrict `CORS_ALLOWED_ORIGINS` to the deployed UI origin.
- Treat provisioning tokens and API keys as secrets.
- Demo credentials are for local/demo use only.
- Use HTTPS for public deployment.
- Do not expose PostgreSQL or Redis publicly if avoidable.
- Store deployment secrets in your platform's secret manager or environment variable system.

## Future Production Hardening

Before a serious production deployment, add a plan for:

- database backups and restore testing
- logs and monitoring
- a real secret manager
- HTTPS and custom domain automation
- database migration strategy
- production seed/bootstrap policy
- multi-tenancy, if Pacific is pursued as SaaS
