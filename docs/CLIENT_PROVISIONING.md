# Client Provisioning

## Overview

Client provisioning creates an API client, assigns a plan, generates an API key, and makes the client ready to call protected APIs through Pacific.

This flow is intended for trusted server-to-server integrations. For example, when an external application creates a user during signup, its backend can call Pacific to provision an API client for that user. The external backend can then associate the returned Pacific client ID and API key with its own user record.

Provisioning is not a browser or frontend flow. Provisioning tokens must remain on trusted backend systems.

## Architecture

```text
External app user signs up
↓
External app backend creates its own user
↓
External app backend calls Pacific provisioning API
↓
Pacific validates provisioning token
↓
Pacific creates API client + API key
↓
External app stores Pacific client id/API key against its user
↓
User can call APIs through the gateway using X-API-Key
```

## Token Types

| Credential | Used By | Purpose and Scope |
|---|---|---|
| Admin JWT | Pacific admin console and admin API clients | Provides API management access according to the admin's role. |
| Client API key | API consumers | Authorizes calls through the gateway to protected APIs using `X-API-Key`. |
| Provisioning token | Trusted external backends | Creates API clients through the provisioning endpoint only. It cannot manage plans, admin users, route limits, or analytics. |

A provisioning token is neither an admin JWT nor a client API key. Each credential has a separate authentication path and scope.

## Provision a Client

### Endpoint

```http
POST /provisioning/clients
X-Provisioning-Token: <token>
Content-Type: application/json
```

A successful request returns `201 Created`.

### Request Body

| Field | Required | Description |
|---|---|---|
| `clientName` | Yes | Unique, nonblank name for the API client. |
| `planName` | No | Plan to assign. If omitted, the provisioning token's default plan is used. The current token rules only allow the configured default plan. |
| `externalReference` | No | External application user ID, account ID, or other integration reference to store with the client. |

```json
{
  "clientName": "signup-user-123",
  "planName": "FREE",
  "externalReference": "user_123"
}
```

### Response Body

| Field | Description |
|---|---|
| `id` | Pacific client ID. |
| `clientName` | Name assigned to the new client. |
| `apiKey` | Generated API key for gateway requests. |
| `planName` | Plan assigned under the provisioning token's rules. |
| `active` | Whether the client can currently access protected APIs. Provisioned clients are created active. |
| `externalReference` | Stored external reference, or `null` when omitted. |

```json
{
  "id": 42,
  "clientName": "signup-user-123",
  "apiKey": "<generated-api-key>",
  "planName": "FREE",
  "active": true,
  "externalReference": "user_123"
}
```

The response contains the generated client API key. The calling backend should store it securely and use it only as an API-consumer credential.

## Local Example

The local seed provides `demo-provisioning-token`, restricted to the seeded `FREE` plan. This token is for local development only.

```bash
curl -X POST http://localhost:8080/provisioning/clients \
  -H "X-Provisioning-Token: demo-provisioning-token" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "signup-user-123",
    "planName": "FREE",
    "externalReference": "user_123"
  }'
```

Use the returned API key to call a protected route through the gateway:

```bash
curl -i http://localhost:8080/api/products \
  -H "X-API-Key: <returned-api-key>"
```

## Admin Token Management

Admins can manage provisioning tokens through the admin API without editing seed data.

| Endpoint | Roles | Description |
|---|---|---|
| `GET /admin/provisioning-tokens` | `SUPER_ADMIN`, `READ_ONLY_ADMIN` | Lists safe token metadata only. Raw tokens and token hashes are never returned. |
| `POST /admin/provisioning-tokens` | `SUPER_ADMIN` | Creates a provisioning token and returns the raw token once. |
| `PATCH /admin/provisioning-tokens/{id}/disable` | `SUPER_ADMIN` | Disables a token so it can no longer provision clients. |

Create a token:

```bash
curl -X POST http://localhost:8080/admin/provisioning-tokens \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme signup integration",
    "defaultPlanName": "FREE"
  }'
```

The create response includes a `token` field. Store it immediately in the trusted external backend's secret store; it cannot be retrieved again from list or disable responses.

## Error Behavior

| Condition | Status | Meaning |
|---|---|---|
| Missing provisioning token | `401 Unauthorized` | The `X-Provisioning-Token` header was not supplied. |
| Invalid provisioning token | `401 Unauthorized` | The token does not match a stored provisioning token. |
| Inactive provisioning token | `403 Forbidden` | The token exists but is disabled. |
| Disallowed plan override | `403 Forbidden` | The requested plan differs from the token's configured default plan. |
| Duplicate client name | `409 Conflict` | A client with that name already exists, ignoring case. |
| Blank client name | `400 Bad Request` | `clientName` is required and cannot be blank. |

## Security Rules

- Call the provisioning endpoint only from a trusted backend, never from browser code.
- Do not expose provisioning tokens in frontend applications, public repositories, logs, or client-facing responses.
- Store provisioning tokens as secrets in the calling backend's secret-management system.
- Pacific stores only BCrypt hashes of provisioning tokens, not their raw values.
- New provisioning tokens are generated server-side and the raw value is returned only once when created.
- The seeded demo token is for local development only and must not be used as a production credential.
- An admin JWT alone does not authorize `POST /provisioning/clients`; the provisioning header is still required.
- A provisioning token can assign only its configured default plan in the current implementation.

## Current Limitations

- Local development still includes one seeded provisioning token.
- Each token can assign only its configured default plan.
- No frontend UI exists for provisioning token management.
- A public developer self-service portal is future work.

## Future Improvements

- Admin UI support to create and revoke provisioning tokens.
- Token re-enable workflows.
- Per-token allowed-plan lists.
- Token expiration and rotation.
- Audit logs for provisioning events.
- A public developer portal as a separate product direction.
