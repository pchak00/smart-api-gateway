# Railway Deployment Plan

This guide prepares Pacific for a Railway public demo deployment. It does not deploy the app and does not include real secrets.

Use this together with the general [Deployment Guide](DEPLOYMENT.md). Railway can run Pacific as separate services backed by managed PostgreSQL and Redis.

## Railway Service Layout

Create one Railway project with these services:

```text
PostgreSQL
Redis
backend-service
gateway-service
management-ui
```

| Service | Purpose | Public domain? |
|---|---|---|
| PostgreSQL | Persistent platform data for clients, plans, route limits, gateway settings, usage logs, abuse alerts, admin users, and refresh sessions. | No. Keep private/internal. |
| Redis | Shared rate-limit counter state used by `gateway-service`. | No. Keep private/internal. |
| `backend-service` | Demo upstream API behind the gateway. | Prefer private/internal. Public is acceptable temporarily for a demo if private routing is not configured yet. |
| `gateway-service` | Public gateway/admin API. Browser UI and API consumers call this service. | Yes. |
| `management-ui` | React/Vite UI served by Nginx. Browser-facing admin interface. | Yes. |

Recommended traffic shape:

```text
Browser
  -> management-ui public domain
  -> gateway-service public domain
       -> Railway PostgreSQL private connection
       -> Railway Redis private connection
       -> backend-service private URL or temporary public URL
```

For API consumers:

```text
API consumer
  -> gateway-service public domain
       -> configured upstream API
```

## Deployment Order

1. Create the Railway project.
2. Add a PostgreSQL managed database.
3. Add a Redis managed database.
4. Deploy `backend-service`.
5. Deploy `gateway-service`.
6. Deploy `management-ui`.
7. Configure public domains for `gateway-service` and `management-ui`.
8. Configure environment variables.
9. Smoke test.

## Service Build Notes

| Service | Railway service root | Dockerfile / build method | App port | Health endpoint |
|---|---|---|---:|---|
| `backend-service` | `backend-service` | `backend-service/Dockerfile` copies `target/*.jar` into an Eclipse Temurin image. Build the JAR first unless the Railway build pipeline is changed later. | `8081` | `GET /health` |
| `gateway-service` | `gateway-service` | `gateway-service/Dockerfile` copies `target/*.jar` into an Eclipse Temurin image. Build the JAR first unless the Railway build pipeline is changed later. | `8080` | `GET /health` |
| `management-ui` | `management-ui` | `management-ui/Dockerfile` builds Vite assets with `VITE_API_BASE_URL`, then serves them through Nginx. | `80` | UI root `/` |

The local Docker Compose workflow maps these to:

```text
management-ui: http://localhost:3000
gateway-service: http://localhost:8080
backend-service: http://localhost:8081
```

Do not change local Compose behavior for Railway. Configure Railway services separately.

## Environment Variable Mapping

Use the Pacific variable names from the root `.env.example`. Railway-provided database variables can be referenced from the app services, but the final variable names consumed by Pacific must match the tables below.

The examples use `Postgres` and `Redis` as Railway service reference prefixes. If your Railway services are named differently, use the names from your Railway project.

### PostgreSQL

Railway PostgreSQL commonly provides values such as `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, and `DATABASE_URL`.

Set these on `gateway-service`:

| Pacific variable | Railway source | Example value |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `PGHOST`, `PGPORT`, `PGDATABASE` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `SPRING_DATASOURCE_USERNAME` | `PGUSER` | `${{Postgres.PGUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `PGPASSWORD` | `${{Postgres.PGPASSWORD}}` |

Railway also provides `DATABASE_URL`, but this Spring app currently expects a JDBC URL through `SPRING_DATASOURCE_URL`.

### Redis

Railway Redis commonly provides values such as `REDISHOST`, `REDISPORT`, `REDISUSER`, `REDISPASSWORD`, and `REDIS_URL`.

Set these on `gateway-service`:

| Pacific variable | Railway source | Example value |
|---|---|---|
| `SPRING_DATA_REDIS_HOST` | `REDISHOST` | `${{Redis.REDISHOST}}` |
| `SPRING_DATA_REDIS_PORT` | `REDISPORT` | `${{Redis.REDISPORT}}` |

Current Pacific code only reads Redis host and port. If the selected Railway Redis service requires username/password or TLS-only `REDIS_URL` connections, add Redis authentication/TLS support in a later code milestone before deploying.

### Gateway Service

Set these on `gateway-service`:

| Variable | Example value | Note |
|---|---|---|
| `JWT_SECRET` | `replace-with-a-long-random-secret` | Required. Do not reuse local demo defaults. |
| `JWT_EXPIRATION_MS` | `3600000` | Admin access token lifetime. |
| `ADMIN_REFRESH_TOKEN_EXPIRATION_MS` | `604800000` | Admin refresh token lifetime. |
| `BACKEND_SERVICE_URL` | `http://backend-service.railway.internal:8081` | Prefer Railway private networking if available. Use the actual internal hostname Railway assigns. |
| `CORS_ALLOWED_ORIGINS` | `https://<management-ui-public-domain>` | Must match the public UI origin exactly. |
| `SPRING_JPA_SHOW_SQL` | `false` | Leave disabled so Railway logs stay readable. Enable only for short local database-query debugging sessions. |

If private routing for `backend-service` is not configured yet, temporarily set `BACKEND_SERVICE_URL` to the public backend URL for a demo:

```env
BACKEND_SERVICE_URL=https://<backend-service-public-domain>
```

Do not use Docker Compose service names like `http://backend-service:8081` unless Railway internal DNS makes that exact name valid. Railway private service DNS commonly uses a `.railway.internal` hostname.

### Management UI

Set this on `management-ui` before building the UI image:

| Variable | Example value | Note |
|---|---|---|
| `VITE_API_BASE_URL` | `https://<gateway-service-public-domain>` | Browser-visible API URL embedded into the static bundle at build time. |

If the deployed UI still calls `localhost`, rebuild `management-ui` after setting `VITE_API_BASE_URL`.

## URL and CORS Rules

Local:

```env
VITE_API_BASE_URL=http://localhost:8080
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

Railway:

```env
VITE_API_BASE_URL=https://<gateway-service-public-domain>
CORS_ALLOWED_ORIGINS=https://<management-ui-public-domain>
```

Rules:

- `management-ui` gets a public domain.
- `gateway-service` gets a public domain.
- Browser code must call the public `gateway-service` URL.
- `backend-service` should stay private if Railway private networking is configured cleanly.
- PostgreSQL and Redis should remain private/internal.
- Do not put Railway private hostnames into `VITE_API_BASE_URL`; browsers cannot resolve private Railway network names.

## Seed and Demo Caveats

The repository currently seeds demo users, demo clients, demo API keys, and a local `demo-provisioning-token`.

For a public portfolio demo, seeded demo credentials may be acceptable only if intentionally kept and clearly treated as demo data. For production or a serious shared demo:

- replace demo passwords and secrets
- rotate demo API keys and provisioning tokens
- treat provisioning tokens and API keys as secrets
- do not expose or commit `.env`
- change `JWT_SECRET`

Do not change seed data as part of this Railway prep milestone.

## Railway Smoke Test Checklist

Use placeholders:

```text
UI_URL=https://<management-ui-public-domain>
API_URL=https://<gateway-service-public-domain>
BACKEND_URL=https://<backend-service-public-domain-or-private-health-test>
API_KEY=<demo-api-key>
```

Checklist:

- Open `${UI_URL}` and confirm the Pacific UI loads.
- Confirm `${API_URL}/health` returns `200`.
- Confirm `${BACKEND_URL}/health` returns `200` if `backend-service` is public, or verify backend health through the gateway settings test connection if it is private.
- Log in as the intended demo Owner/Admin.
- Confirm the dashboard loads.
- Create or inspect a client.
- Rotate an API key.
- Call `${API_URL}/api/products` with `X-API-Key: ${API_KEY}`.
- Trigger a route rate limit and confirm `429`.
- Confirm analytics update.
- Confirm abuse alert lifecycle works: open, acknowledge, resolve.
- Confirm gateway settings load.
- Run the gateway settings test connection flow.
- Log in as Viewer and confirm the Viewer cannot mutate resources.

## Generate Demo Traffic

Use `scripts/railway-smoke-demo.sh` from your local shell to generate realistic public-demo traffic against the deployed Railway gateway. The script reads all connection details and credentials from environment variables, so do not edit the script with real Railway domains, passwords, tokens, or API keys.

Required variables:

```text
PACIFIC_API_URL=https://<gateway-service-public-domain>
PACIFIC_ADMIN_USERNAME=<admin-username>
PACIFIC_ADMIN_PASSWORD=<admin-password>
```

Optional variables:

```text
PACIFIC_CLIENT_API_KEY=<client-api-key>
PACIFIC_PRODUCTS_CALLS=12
PACIFIC_REPORTS_CALLS=6
```

Example:

```bash
PACIFIC_API_URL=https://your-gateway.up.railway.app \
PACIFIC_ADMIN_USERNAME=owner \
PACIFIC_ADMIN_PASSWORD=admin123 \
PACIFIC_CLIENT_API_KEY=your-client-key \
./scripts/railway-smoke-demo.sh
```

If `PACIFIC_CLIENT_API_KEY` is omitted, the script logs in and tries to use the first active client API key returned by `GET /admin/clients`. If the API no longer returns raw API keys, copy or rotate a client API key from the UI and rerun with `PACIFIC_CLIENT_API_KEY`.

The script calls `/api/products`, `/api/reports`, and one known `/api/orders` route with `X-API-Key`, then checks dashboard and analytics admin endpoints. After it runs, the Dashboard, Analytics, Abuse Alerts, and Clients pages should show updated demo data.

## Troubleshooting

### UI Cannot Reach the API

- Check `VITE_API_BASE_URL` on `management-ui`.
- Confirm it points to the public `gateway-service` domain.
- Confirm `gateway-service` has a public domain.
- Check `CORS_ALLOWED_ORIGINS` on `gateway-service`.

### CORS Error

- Set `CORS_ALLOWED_ORIGINS=https://<management-ui-public-domain>`.
- Do not include paths in the origin.
- Recheck the exact scheme and hostname.

### Gateway Cannot Connect to PostgreSQL

- Check `SPRING_DATASOURCE_URL`.
- Check `SPRING_DATASOURCE_USERNAME`.
- Check `SPRING_DATASOURCE_PASSWORD`.
- Confirm Railway PostgreSQL variables are referenced from `gateway-service`.

### Gateway Cannot Connect to Redis

- Check `SPRING_DATA_REDIS_HOST`.
- Check `SPRING_DATA_REDIS_PORT`.
- If Railway Redis requires authentication or TLS, the current code needs Redis auth/TLS support before deployment.

### Gateway Cannot Reach the Upstream

- Check `BACKEND_SERVICE_URL`.
- Confirm the backend app is running on port `8081`.
- Confirm `GET /health` works for `backend-service`.
- If using a private Railway URL, confirm the internal hostname and port are correct.

### UI Still Calls Localhost

- Set `VITE_API_BASE_URL=https://<gateway-service-public-domain>`.
- Rebuild and redeploy `management-ui`.
- Clear the browser cache or hard refresh.

## Config Files

No Railway config files are added in this milestone.

That is intentional: Railway can deploy from service roots and Dockerfiles, but the exact setup depends on whether the deployment uses prebuilt JARs, a Railway build command, or future multi-stage Dockerfiles. Keeping this milestone docs-only avoids breaking local Docker Compose or committing premature platform-specific assumptions.
