# Pacific API Examples

These examples target the local Docker Compose environment at:

`http://localhost:8080`

Values such as demo passwords, API keys, provisioning tokens, and recovery tokens in this file are local-development examples. Do not treat them as production credentials.

## Local Demo Data

The application seeds local demo data when the database is empty.

### Demo Admins

| Username | Password | Backend role | UI label |
|---|---|---|---|
| `owner` | `Coastal gateway passphrase 2026!` | `OWNER` | Owner |
| `super admin` | `Coastal gateway passphrase 2026!` | `SUPER_ADMIN` | Admin |
| `viewer` | `Coastal gateway passphrase 2026!` | `READ_ONLY_ADMIN` | Viewer |

### Seeded Plans

| Plan | Requests per minute |
|---|---:|
| `FREE` | 10 |
| `PRO` | 100 |
| `ENTERPRISE` | 1000 |

### Seeded Clients

| Client | Local API key | Plan |
|---|---|---|
| Demo Free Client | `free-demo-api-key` | `FREE` |
| Demo Pro Client | `pro-demo-api-key` | `PRO` |

### Seeded Provisioning Token

The local seed includes `demo-provisioning-token`, restricted to the `FREE` plan. This value is for local development only.

## Authentication

### Admin Login

Login returns a short-lived JWT access token and a longer-lived refresh token. Use the access token for protected `/admin/**` requests.

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username":"owner",
    "password":"Coastal gateway passphrase 2026!"
  }'
```

Example response:

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "admref_...",
  "username": "owner",
  "role": "OWNER",
  "expiresInMs": 3600000
}
```

Use the access token on admin requests:

```http
Authorization: Bearer <token>
```

### Refresh Access Token

Refresh tokens are accepted only by `/auth/refresh`; they do not authorize `/admin/**` requests directly.

```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"admref_..."}'
```

### Logout

Logout revokes the refresh token.

```bash
curl -X POST http://localhost:8080/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"admref_..."}'
```

Token lifetimes are configured with `JWT_EXPIRATION_MS` for access tokens and `ADMIN_REFRESH_TOKEN_EXPIRATION_MS` for refresh sessions.

## Dashboard And Analytics

### Dashboard Summary

```bash
curl http://localhost:8080/admin/dashboard/summary \
  -H "Authorization: Bearer <token>"
```

### Traffic Analytics

```bash
curl http://localhost:8080/admin/analytics/traffic \
  -H "Authorization: Bearer <token>"

curl "http://localhost:8080/admin/analytics/traffic?startDate=2026-07-01&endDate=2026-07-07" \
  -H "Authorization: Bearer <token>"
```

### Route Analytics

```bash
curl http://localhost:8080/admin/analytics/routes \
  -H "Authorization: Bearer <token>"

curl "http://localhost:8080/admin/analytics/routes?startDate=2026-07-01&endDate=2026-07-07&groupBy=OPERATION" \
  -H "Authorization: Bearer <token>"

curl "http://localhost:8080/admin/analytics/route-traffic?startDate=2026-07-01&endDate=2026-07-07&groupBy=PATTERN" \
  -H "Authorization: Bearer <token>"
```

### Client Analytics

```bash
curl http://localhost:8080/admin/analytics/clients \
  -H "Authorization: Bearer <token>"

curl "http://localhost:8080/admin/analytics/clients?planName=FREE&startDate=2026-07-01&endDate=2026-07-07" \
  -H "Authorization: Bearer <token>"
```

### Analytics Parameters

Analytics date parameters use ISO dates. The Pacific UI's 7d, 30d, 90d, and 12m controls generate explicit `startDate` and `endDate` values.

Route analytics endpoints accept `groupBy=OPERATION`, `groupBy=PATTERN`, or `groupBy=RAW_PATH`; the default is `OPERATION`.

- `OPERATION` groups traffic by active route groups first, then falls back to normalized patterns.
- `PATTERN` normalizes numeric and UUID path segments, such as `/api/users/:id`.
- `RAW_PATH` preserves the request path shape without route group or pattern normalization.

## Gateway Settings

### Read Gateway Settings

```bash
curl http://localhost:8080/admin/settings/gateway \
  -H "Authorization: Bearer <token>"
```

### Update Gateway Settings

Owners and Admins can update runtime gateway settings.

```bash
curl -X PUT http://localhost:8080/admin/settings/gateway \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "upstreamBaseUrl":"http://backend-service:8081",
    "healthCheckPath":"/health",
    "timeoutMs":5000
  }'
```

### Test Upstream Connection

The test endpoint accepts draft `upstreamBaseUrl`, `healthCheckPath`, and `timeoutMs` values, or uses saved settings when the request body is empty.

```bash
curl -X POST http://localhost:8080/admin/settings/gateway/test-connection \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "upstreamBaseUrl":"http://backend-service:8081",
    "healthCheckPath":"/health",
    "timeoutMs":5000
  }'
```

## Abuse Alerts

### List Open Alerts

```bash
curl "http://localhost:8080/admin/abuse-alerts?status=OPEN" \
  -H "Authorization: Bearer <token>"
```

### Alert Lifecycle

Abuse alerts use lifecycle states: `OPEN`, `ACKNOWLEDGED`, and `RESOLVED`. Owners and Admins can move alerts forward; Viewers can inspect alert lists only.

```bash
curl -X PATCH http://localhost:8080/admin/abuse-alerts/<alert-id>/acknowledge \
  -H "Authorization: Bearer <token>"

curl -X PATCH http://localhost:8080/admin/abuse-alerts/<alert-id>/resolve \
  -H "Authorization: Bearer <token>"
```

## Plan Management

### Create Plan

```bash
curl -X POST http://localhost:8080/admin/clients/plans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planName":"STARTUP",
    "requestsPerMinute":250,
    "price":49.99
  }'
```

### Delete Plan

```bash
curl -X DELETE http://localhost:8080/admin/clients/plans/4 \
  -H "Authorization: Bearer <token>"
```

Plans assigned to clients or referenced by route limits cannot be deleted.

## Client Management

### Create Client

```bash
curl -X POST http://localhost:8080/admin/clients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Acme Corp",
    "planId":2,
    "active":true
  }'
```

### Change Client Plan

```bash
curl -X PATCH http://localhost:8080/admin/clients/1/plan \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId":3
  }'
```

### Rotate API Key

Owners and Admins can rotate a client API key. Viewers cannot rotate keys. Rotation replaces the stored key immediately; the old key stops authorizing gateway requests, and the new raw key is returned only in the rotation response.

```bash
curl -X POST http://localhost:8080/admin/clients/<client-id>/rotate-api-key \
  -H "Authorization: Bearer <admin-token>"
```

### Disable Or Enable Client

Disabled clients receive `403 Forbidden` on protected gateway routes until enabled again.

```bash
curl -X PATCH http://localhost:8080/admin/clients/<client-id>/disable \
  -H "Authorization: Bearer <admin-token>"

curl -X PATCH http://localhost:8080/admin/clients/<client-id>/enable \
  -H "Authorization: Bearer <admin-token>"
```

### Delete Client

```bash
curl -X DELETE http://localhost:8080/admin/clients/1 \
  -H "Authorization: Bearer <token>"
```

## Server-To-Server Provisioning

Manual client management remains available through the Pacific UI or admin API. Trusted backend systems can also create clients during signup through the provisioning API.

Provisioning tokens are server-to-server secrets. They must stay in trusted backend systems and must never be used from browser code.

For the complete onboarding guide, see [Client Provisioning](CLIENT_PROVISIONING.md).

```bash
curl -X POST http://localhost:8080/provisioning/clients \
  -H "X-Provisioning-Token: demo-provisioning-token" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName":"signup-user-123",
    "planName":"FREE",
    "externalReference":"user_123"
  }'
```

If `planName` is omitted, the token's default plan is used. A request cannot override that plan.

## Routes

The Pacific UI labels this area as Routes and separates configuration into Rate limits and Route groups.

Rate limits are enforcement rules. They override a plan's default quota for specific API paths. Backend API names still use route-limit terminology.

Route groups are analytics rules. They group related raw request paths into product-level operations, such as "Product catalog" or "Report generation".

### Rate Limits

Route limits support exact paths and simple wildcard patterns. Use `*` for one path segment and `**` at the end of a pattern to match nested routes.

```bash
curl -X POST http://localhost:8080/admin/clients/routeLimits \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "planId":1,
    "routePattern":"/api/reports",
    "requestsPerMinute":2
  }'
```

Pattern examples:

- `/api/products` matches only `/api/products`
- `/api/users/*` matches `/api/users/123`
- `/api/reports/**` matches `/api/reports`, `/api/reports/daily`, and deeper nested paths

### Update Rate Limit

The update request uses the backend field name `requestPerMinute`.

```bash
curl -X PATCH http://localhost:8080/admin/clients/route-limits/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "routePattern":"/api/reports",
    "requestPerMinute":5
  }'
```

### Delete Rate Limit

```bash
curl -X DELETE http://localhost:8080/admin/clients/route-limits/1 \
  -H "Authorization: Bearer <token>"
```

### Route Groups

Route groups are configured at `/admin/route-groups` and contain one or more rules. Rules can optionally specify an HTTP method. If method is omitted, the rule can match any method.

Rule matching supports:

- `EXACT` - matches one normalized path exactly, such as `/api/products`.
- `PREFIX` - matches the path and nested children, such as `/api/reports` and `/api/reports/daily`.
- `GLOB` - supports whole-segment `*` and trailing `**`, such as `/api/users/*` or `/api/reports/**`.

Higher-priority active route groups are considered first for `OPERATION` analytics grouping.

```bash
curl -X POST http://localhost:8080/admin/route-groups \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Product catalog",
    "description":"Read operations for product browsing",
    "active":true,
    "priority":10,
    "rules":[
      {
        "method":"GET",
        "pattern":"/api/products/**",
        "matchType":"GLOB"
      }
    ]
  }'
```

## Admin Management

The UI labels this area as Admins. Backend endpoint paths continue to use `/admin/users`.

### Create Admin

```bash
curl -X POST http://localhost:8080/admin/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"newadmin",
    "password":"<new-admin-password>",
    "role":"READ_ONLY_ADMIN"
  }'
```

### Promote Admin

```bash
curl -X PATCH http://localhost:8080/admin/users/2/role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "role":"SUPER_ADMIN"
  }'
```

### Reset Admin Password

Owners can reset passwords for any admin. Admins can reset Viewer passwords only. New passwords must pass the same admin password policy used at account creation.

```bash
curl -X PATCH http://localhost:8080/admin/users/2/password \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "newPassword":"<new-admin-password>",
    "confirmPassword":"<new-admin-password>"
  }'
```

### Delete Admin

```bash
curl -X DELETE http://localhost:8080/admin/users/2 \
  -H "Authorization: Bearer <token>"
```

### Emergency Owner Recovery

`POST /admin/recovery/owner` is a break-glass recovery endpoint for restoring or creating an Owner account. It is disabled unless `ADMIN_RECOVERY_TOKEN` is set, and callers must provide the matching local-development recovery token in the `X-Admin-Recovery-Token` header.

```bash
curl -X POST http://localhost:8080/admin/recovery/owner \
  -H "X-Admin-Recovery-Token: <local-recovery-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username":"owner",
    "newPassword":"<new-owner-password>",
    "confirmPassword":"<new-owner-password>"
  }'
```

### Admin Safety Rules

- Owners can create, update, or delete Owner, Admin, and Viewer accounts.
- Admins can create or delete Viewer accounts, but cannot manage Owners or other Admins.
- Viewers cannot mutate admin users.
- The system prevents deletion or demotion of the last Owner.
- Admin passwords must be 12 to 128 characters, must not contain the username, must not be common/demo passwords, and must meet the built-in strength check.
- Emergency owner recovery should remain unset unless a deployment intentionally enables break-glass recovery.

## Gateway Usage

### Protected Gateway Request

Clients authenticate with API keys through the `X-API-Key` header.

```bash
curl -X GET http://localhost:8080/api/products \
  -H "X-API-Key: free-demo-api-key"
```

Example successful response:

```json
[
  {"id":1,"name":"Laptop","price":1299.99},
  {"id":2,"name":"Keyboard","price":89.99},
  {"id":3,"name":"Mouse","price":49.99}
]
```

### Plan-Based Rate Limiting

Each client inherits the request limit defined by its assigned plan.

| Plan | Requests per minute |
|---|---:|
| `FREE` | 10 |
| `PRO` | 100 |
| `ENTERPRISE` | 1000 |

### Route-Specific Rate Limiting

Route-specific limits override plan defaults.

```text
FREE Plan
|-- Default: 10 requests/minute
|-- /api/products: 5 requests/minute
`-- /api/reports: 2 requests/minute
```

In this case:

- Requests to `/api/products` use the route-specific limit of 5 RPM.
- Requests to `/api/reports` use the route-specific limit of 2 RPM.
- Requests to `/api/orders` use the `FREE` plan limit of 10 RPM.

### Rate-Limit Responses

When a client exceeds its allowed request rate:

```http
HTTP 429 Too Many Requests
```

Example body:

```text
Rate limit exceeded
```

The gateway records the blocked request, updates usage analytics, evaluates abuse thresholds, and creates or updates alerts when thresholds are exceeded.

## Role-Based Access Matrix

| Endpoint type | `READ_ONLY_ADMIN` | `SUPER_ADMIN` | `OWNER` |
|---|---|---|---|
| View data | allowed | allowed | allowed |
| Create resources | denied | allowed | allowed |
| Update resources | denied | allowed | allowed |
| Delete resources | denied | allowed | allowed |

The UI presents these roles with customer-facing labels Owner, Admin, and Viewer, while API payloads and JWT authorization continue to use `OWNER`, `SUPER_ADMIN`, and `READ_ONLY_ADMIN`.
