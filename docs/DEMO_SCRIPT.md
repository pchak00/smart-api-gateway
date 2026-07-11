# Pacific Public Demo Script

Pacific is a self-hostable API gateway management platform for small teams that need API key access, plan-based quotas, route-specific rate limits, analytics, abuse alerts, provisioning, API key rotation, role-based admin access, and runtime gateway configuration without adopting a heavyweight enterprise API management product.

Use this script for a recruiter screen, technical interview, portfolio review, or recorded walkthrough. Keep real Railway URLs, passwords, API keys, JWT secrets, database passwords, Redis passwords, and provisioning tokens out of the script and out of recordings when possible.

## Demo Prerequisites

Use placeholders in notes and shared materials:

```text
PACIFIC_UI_URL=https://<management-ui-public-url>
PACIFIC_API_URL=https://<gateway-service-public-url>
PACIFIC_BACKEND_URL=https://<backend-service-public-url>
OWNER_USERNAME=<owner-username>
OWNER_PASSWORD=<owner-password>
VIEWER_USERNAME=<viewer-username>
VIEWER_PASSWORD=<viewer-password>
CLIENT_API_KEY=<demo-client-api-key>
```

Before presenting, confirm the public deployment is seeded with demo-safe users, one active demo client, plans, route limits, gateway settings, and enough traffic data for the dashboard to look useful.

## Local Docker Walkthrough

Use this flow for a local recruiter demo or technical walkthrough.

### A. Clone And Start Pacific

```bash
git clone https://github.com/pchak00/pacific-api-gateway.git
cd pacific-api-gateway
docker compose up --build
```

Local service URLs:

| Service | URL |
|---|---|
| Pacific Management UI | `http://localhost:3000` |
| Gateway and Admin API | `http://localhost:8080` |
| Demo Backend | `http://localhost:8081` |

### B. Login As Seeded Owner

Open the Pacific Management UI:

```text
http://localhost:3000
```

Use the local-development seeded Owner credentials:

```text
username: owner
password: Coastal gateway passphrase 2026!
```

### C. Dashboard And Analytics

Show the Dashboard and Analytics pages. Point out:

- request totals
- allowed and blocked traffic
- open abuse alerts
- top routes
- route and traffic analytics
- client analytics

These views use real usage logs recorded by the Gateway Service.

### D. Clients And API Key

Open Clients and inspect or create a client. For a clean local database, the seeded free client has this local-development API key:

```text
free-demo-api-key
```

Explain that clients represent API consumers, API keys identify callers, and plans attach default quotas.

### E. Call A Protected Route

```bash
curl -i http://localhost:8080/api/products \
  -H "X-API-Key: free-demo-api-key"
```

Explain that the gateway validates the API key, checks client state, applies the matching quota, forwards allowed traffic to the demo backend, and records the result for analytics.

### F. Trigger A Route-Specific Rate Limit

The seeded FREE `/api/products` route limit allows 5 requests per minute.

```bash
for i in {1..15}; do
  curl -i http://localhost:8080/api/products \
    -H "X-API-Key: free-demo-api-key"
  echo
done
```

Return to the UI and confirm:

- allowed and blocked request counts update
- traffic analytics changes
- route analytics shows the affected route
- an abuse alert appears after the blocked-request threshold is crossed

### G. Routes, Rate Limits, And Route Groups

Open Routes. Explain:

- Rate limits are enforcement rules that override a plan quota for specific paths.
- Route groups are analytics rules that group related paths into operations.

Show that route analytics can be read by operation-level groupings rather than only raw paths.

### H. Abuse Alerts

Open Abuse Alerts. If an alert was generated, acknowledge it and then resolve it as the seeded Owner.

Explain that repeated blocked traffic becomes visible to operators instead of only returning `429` responses to clients.

### I. Viewer Permissions

Logout and sign in with the seeded Viewer account:

```text
username: viewer
password: Coastal gateway passphrase 2026!
```

Confirm that the Viewer can inspect allowed pages but cannot mutate resources. Mutation controls should be disabled, blocked, or unavailable for Viewer users. The Admins area and protected actions are restricted.

### J. Stop Or Reset The Local Environment

Stop the platform:

```bash
docker compose down
```

If local PostgreSQL contains stale seeded data and you need a clean demo database:

```bash
docker compose down -v
```

## Suggested Length

- 3-minute version: quick portfolio or recruiter demo focused on the UI, dashboard, clients, and one rate-limit proof.
- 7-minute version: technical interview demo covering the main operator workflow, smoke script, analytics, and abuse alerts.
- 12-minute version: deeper architecture walkthrough including provisioning, role behavior, gateway settings, and deployment proof points.

## Main Demo Flow

### A. Open Pacific UI

1. Open `PACIFIC_UI_URL`.
2. Explain that this is the management console for API access, quotas, route policies, analytics, alerts, and gateway runtime settings.
3. Keep the opening concise: Pacific protects upstream APIs while giving operators a practical admin interface.

### B. Login As Owner

1. Login with `OWNER_USERNAME` and `OWNER_PASSWORD`.
2. Show the current Owner role in the UI.
3. Explain the role hierarchy:
   - Owner: full access, including ownership-level admin management.
   - Admin: operational access for managing gateway resources.
   - Viewer: read-only access for inspection and demos.
4. Mention that the backend enforces role-based authorization, while the UI also disables restricted controls for read-only users.

### C. Dashboard

Show:

- Gateway summary
- Requests
- Blocked requests
- Open alerts
- Gateway health
- Top routes
- Quick actions

Explain:

The dashboard gives an operator a quick view of client activity, rate-limit pressure, gateway health, and alerts without digging through logs.

### D. Clients

Show:

- Clients list
- Active and inactive status
- Plan assignment
- API key behavior
- API key rotation, if available in the UI

Explain:

Clients represent API consumers. API keys identify callers at the gateway, and plans attach default quotas to each client. Key rotation helps recover from leaked keys without deleting the client or rebuilding its plan assignment.

### E. Plans

Show:

- Free, Pro, Enterprise, or other configured plans
- Requests-per-minute quota for each plan

Explain:

Plans define the default quota a client receives. Route limits can override the plan quota for specific endpoints.

### F. Route Limits

Show:

- Route-specific override limits
- Exact path policies
- Wildcard route patterns

Explain:

Expensive or sensitive endpoints can have stricter limits than the default plan. For example, a client can have a generous plan but still be tightly limited on a reporting or order endpoint.

### G. Generate Demo Traffic

Run the smoke demo script with environment variables:

```bash
PACIFIC_API_URL="$PACIFIC_API_URL" \
PACIFIC_ADMIN_USERNAME="$OWNER_USERNAME" \
PACIFIC_ADMIN_PASSWORD="$OWNER_PASSWORD" \
PACIFIC_CLIENT_API_KEY="$CLIENT_API_KEY" \
./scripts/railway-smoke-demo.sh
```

Expanded placeholder example:

```bash
PACIFIC_API_URL="https://<gateway-service-public-url>" \
PACIFIC_ADMIN_USERNAME="<owner-username>" \
PACIFIC_ADMIN_PASSWORD="<owner-password>" \
PACIFIC_CLIENT_API_KEY="<demo-client-api-key>" \
./scripts/railway-smoke-demo.sh
```

Explain that the script:

- Logs in as an admin.
- Sends API traffic through the gateway.
- Hits `/api/products`, `/api/reports`, and `/api/orders`.
- Triggers both allowed and blocked requests.
- Checks dashboard and analytics endpoints.
- Creates realistic dashboard, analytics, and abuse alert data.

### H. Analytics

Show:

- Route trend comparison
- Top routes
- Route analytics
- Client analytics
- Total, Allowed, and Blocked toggles
- Custom route comparison, if implemented in the current UI

Explain:

Analytics helps identify which routes are active, which routes are being blocked, and which clients generate the most traffic. This is the operator view that turns gateway events into something reviewable.

### I. Abuse Alerts

Show:

- An alert generated by repeated blocked requests.
- Lifecycle actions such as acknowledge or resolve, if available in the UI.

Explain:

Pacific surfaces repeated blocked traffic as abuse alerts for review. The goal is not only to reject requests, but also to make suspicious behavior visible to an operator.

### J. Gateway Settings

Show:

- Upstream API URL
- Health check path
- Test connection
- Runtime configuration

Explain:

The gateway can point to an upstream API without code changes. This makes demos and environment changes easier because the runtime target can be updated through the management workflow.

### K. Provisioning

Show:

- Provisioning tokens
- Active and disabled status
- Server-to-server onboarding workflow

Explain:

External apps can use a trusted provisioning token to create API clients during signup. Provisioning tokens are server-side credentials and should never be used in browser code.

### L. Viewer Role Demo

1. Logout.
2. Login with `VIEWER_USERNAME` and `VIEWER_PASSWORD`.
3. Show that Viewer can inspect pages.
4. Show that mutation controls are disabled or blocked.
5. Show that Admin Users or restricted actions are unavailable, greyed out, or rejected.

Explain:

The role hierarchy separates ownership, operations, and read-only access. This lets someone inspect platform state without receiving mutation privileges.

## Public Smoke Test

Set the public demo variables locally first:

```bash
export PACIFIC_UI_URL="https://<management-ui-public-url>"
export PACIFIC_API_URL="https://<gateway-service-public-url>"
export PACIFIC_BACKEND_URL="https://<backend-service-public-url>"
export CLIENT_API_KEY="<demo-client-api-key>"
```

Then run:

```bash
curl -i "$PACIFIC_BACKEND_URL/health"

curl -i "$PACIFIC_BACKEND_URL/api/products"

curl -i "$PACIFIC_API_URL/api/products" \
  -H "X-API-Key: $CLIENT_API_KEY"
```

Expected behavior:

- Backend health returns `200`.
- Backend products returns `200`.
- Gateway products returns `200` until the applicable limit is reached.
- Gateway returns `429` after quota is exceeded.

## What A Successful Smoke Run Proves

A successful smoke run proves:

- Public UI can call the public gateway.
- Gateway can authenticate admins.
- Gateway can validate API keys.
- Gateway can connect to Redis for rate limiting.
- Gateway can forward to `backend-service`.
- Gateway records usage logs.
- Analytics endpoints return data.
- Abuse alerts are created from blocked traffic.

## Common Demo Issues

Login fails:

- Check `VITE_API_BASE_URL`.
- Check `CORS_ALLOWED_ORIGINS`.
- Check Railway seeded credentials.

Gateway API routes return `500`:

- Check Redis host and port environment variables.
- Check `BACKEND_SERVICE_URL`.
- Check gateway logs.

Gateway API routes return `401`:

- Check the client API key.
- Check the client active status.
- Check API key rotation state.

UI calls the wrong URL:

- Ensure `VITE_API_BASE_URL` includes `https://`.
- Redeploy the management UI after changing Vite environment variables.

Analytics is empty:

- Run the smoke demo script.
- Refresh dashboard and analytics pages.

## Talking Points

- Self-hostable API management platform for small teams.
- Plan-based quotas.
- Route-specific rate limits.
- Redis-backed sliding-window limiter.
- API key lifecycle and rotation.
- Provisioning tokens for server-side onboarding.
- Analytics and abuse alert lifecycle.
- Owner, Admin, and Viewer role hierarchy.
- Dockerized local flow and Railway public deployment.

## Honest Positioning

Do not claim:

- Better than Kong, NGINX, or Traefik in raw proxy performance.
- Enterprise production-ready.
- Multi-tenant SaaS-ready.
- Kubernetes-native.

Do claim:

- Self-hostable API gateway management platform.
- Small-team API access management.
- Portfolio-grade API gateway platform with real deployment, analytics, rate limiting, and security workflows.

## Future Work

- Tenant and workspace isolation if Pacific becomes SaaS.
- API key hashing with prefix lookup.
- Audit logs.
- Production secret manager.
- Backups and monitoring.
- Private internal upstream networking on Railway.
- Custom domain and HTTPS hardening if not already handled by the platform.
