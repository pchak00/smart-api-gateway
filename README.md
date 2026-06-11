# Smart API Gateway

A self-hostable API gateway and API management platform built with Spring Boot, Redis, PostgreSQL, and Docker.

Features include:
- distributed Redis-backed rate limiting
- plan-based quotas
- route-specific throttling
- JWT authentication
- role-based authorization
- usage analytics
- abuse detection

Designed as a developer-first, SaaS-oriented gateway platform for small-to-mid sized teams.

## Why This Project?

Modern applications increasingly rely on API gateways for authentication,
traffic management, rate limiting, observability, and security.

Existing solutions such as Kong, AWS API Gateway, Apigee, and NGINX-based setups
are powerful, but can be very expensive and often optimized toward either:

- infrastructure-heavy configurations
- enterprise-scale deployments
- or paid platform ecosystems

At the same time, many free open-source gateway solutions provide strong routing and proxy capabilities but lack 
built-in product-oriented features such as:
- plan-based quota management
- integrated analytics
- abuse monitoring
- developer-focused administration
- and simplified onboarding experiences

Smart API Gateway was built to explore a middle ground:
a developer-first, self-hostable API management platform that combines infrastructure capabilities with SaaS-style management features.

The goal is not to compete with low-level high-performance proxies,
but to provide a more accessible and product-oriented gateway experience for developers, startups, and small-to-mid sized teams.

## Architecture Overview

Smart API Gateway is designed as a containerized, multi-service backend system where the gateway acts as the central policy enforcement layer between API consumers and backend services.

Instead of acting only as a request router, the gateway is responsible for enforcing access rules, applying traffic policies, recording usage, detecting abuse, and protecting administrative platform features.

The architecture is easiest to understand through two main request flows:

1. **API Consumer Flow** — requests made by external clients using API keys
2. **Admin Platform Flow** — requests made by admins using JWT authentication and role-based authorization

### API Consumer Flow

This flow represents requests made by external API consumers to protected backend services.

```mermaid
flowchart TD
    A[API Consumer] --> B[Gateway Service]
    B --> C[API Key Validation]
    C --> D{Valid API Key?}

    D -- No --> E[Reject Request]
    D -- Yes --> F[Determine Request Limit<br/>Based on service policy<br/>Use Route-Specific Limit<br/>or a default plan limit]

    F --> G{Within Limit?}

    G -- Yes --> H[Forward Request to Backend Service]
    H --> I[Backend Service Response]
    I --> J[Record Usage Log & Update Analytics]
    J --> K[Return Response to API Consumer]

    G -- No --> L[Return 429 Too Many Requests]
    L --> M[Record Blocked Request]
    M --> N[Check Abuse Thresholds<br/>Create or Update Alert<br/>if Threshold exceeded]
    
```


### Admin Platform Flow

Admin authentication is intentionally separated from API consumer authentication. API consumers access protected backend services using API keys, while platform administrators use JWT-based authentication to manage internal gateway resources and administrative features.

The platform currently supports two administrative roles:

- `READ_ONLY_ADMIN` — can access read-only administrative endpoints such as analytics, usage statistics,view clients, plans, route specific policies and abuse alerts
- `SUPER_ADMIN` — has full administrative access, including managing clients, plans, route policies, and other gateway configuration resources

This separation allows the platform to enforce role-based access control for sensitive management operations while still supporting restricted monitoring and observability access.

```mermaid
flowchart TD
    A[Admin User] --> B[Login with Admin Credentials]
    B --> C[Generate JWT Access Token]
    C --> D[Request Protected Admin Endpoint]
    D --> E[Validate JWT]
    E --> F{Valid Token?}

    F -- No --> G[Reject Request]
    F -- Yes --> H[Check Admin Role]

    H --> I{Authorized for Action?}
    I -- No --> J[Return 403 Forbidden]
    I -- Yes --> K[Execute Admin Operation]

    K --> L[Return Admin Response]
```

### Infrastructure & Service Responsibilities

The system is separated into multiple services so each component has a clear responsibility.

#### Gateway Service

The Gateway Service is the core application in the system. It acts as the central policy enforcement layer for incoming traffic.

Responsibilities include:

- validating API keys for API consumers
- resolving plan-based and route-specific rate limits
- forwarding valid requests to backend services
- recording usage logs for analytics
- tracking blocked requests for abuse detection
- protecting admin endpoints with JWT authentication and role-based authorization

#### Redis

Redis is used for fast, shared rate-limiting counters.

Rate limit state is kept outside the gateway process so the system is not dependent on local application memory. This allows multiple gateway instances to share request counters and supports a more horizontally scalable design.

#### PostgreSQL

PostgreSQL stores persistent platform data such as:

- clients and API keys
- plans and quota rules
- route-specific limits
- usage logs
- abuse alerts
- admin users and roles

#### Backend Service

The Backend Service is a demo service used to validate gateway behavior.

It exists mainly for routing demonstrations, integration testing, and showing how protected backend APIs can sit behind the gateway.

#### Docker Compose

Docker Compose is used to run the full system locally with separate containers for the gateway, backend service, Redis, and PostgreSQL.

This creates a more production-like development environment and demonstrates container networking, service isolation, and infrastructure configuration.

## Core Features

### Traffic Management

#### Plan-Based Rate Limiting

Clients are assigned to centralized plans such as `FREE`, `PRO`, and `ENTERPRISE`, each with configurable default request quotas.

This allows quota policies to be managed centrally without duplicating configuration across individual clients.

#### Route-Specific Traffic Policies

The gateway supports route-level rate limit overrides for endpoints with different operational costs.

For example, expensive endpoints such as AI inference, image generation, or report-processing APIs can enforce stricter limits than lightweight endpoints, even when clients belong to the same plan.

When a route-specific policy exists, it overrides the default plan quota for that endpoint.

#### Distributed Redis-Backed Rate Limiting

Rate limiting uses Redis-based shared counters instead of local in-memory tracking.

This allows multiple gateway instances to share rate limit state consistently and supports a more horizontally scalable architecture compared to application-local counters.

#### Centralized Policy Enforcement

Traffic policies are enforced at the gateway layer before requests reach backend services.

This allows authentication, quota enforcement, and traffic control to remain centralized rather than being duplicated across individual backend applications.

### Authentication & Authorization

#### API Key Authentication

External API consumers authenticate using API keys provided through the `X-API-Key` header.

Requests are validated at the gateway layer before traffic is forwarded to backend services.

#### JWT-Based Admin Authentication

Administrative platform endpoints are protected using JWT-based authentication.

Admins authenticate through a login endpoint and receive a signed JWT access token used for subsequent protected requests.

#### Role-Based Authorization

Administrative actions are protected using role-based access control.

Current roles include:

- `READ_ONLY_ADMIN` — can access monitoring and observability endpoints such as analytics, usage statistics, and abuse alerts
- `SUPER_ADMIN` — has full access to management operations including clients, plans, route policies, and administrative configuration

This separation allows sensitive platform operations to remain protected while still supporting restricted operational visibility for lower-privileged administrators.

#### Centralized Security Enforcement

Authentication and authorization are enforced centrally at the gateway layer rather than being duplicated across backend services.

This keeps security policies consistent across the platform and simplifies backend service design.## Analytics & Abuse Detection

### Analytics & Abuse Detection

#### Usage Logging

Requests processed through the gateway are recorded for monitoring and analytics purposes.

Logged information includes:
- client identity
- request path
- HTTP method
- status code
- request timestamp
- allowed or blocked request state

#### Analytics & Monitoring

Usage data is aggregated to support operational analytics and platform monitoring.

This allows administrators to observe:
- request activity
- blocked traffic patterns
- client usage behavior
- route-level traffic trends

#### Abuse Detection

The platform monitors blocked request activity to identify potentially abusive behavior.

When clients repeatedly exceed configured rate limits within a defined time window, the system evaluates abuse thresholds and tracks suspicious activity patterns.

#### Alerting System

When abuse thresholds are exceeded, the gateway creates or updates abuse alerts associated with the affected client.

A cooldown mechanism is used to avoid repeatedly generating duplicate alerts for the same abusive activity window.

## Infrastructure & Deployment

### Dockerized Multi-Service Architecture

The platform is fully containerized using Docker and Docker Compose.

Separate containers are used for:
- Gateway Service
- Backend Service
- Redis
- PostgreSQL

This keeps infrastructure responsibilities isolated and creates a more production-like development environment.

### Container Networking

Services communicate through Docker Compose networking using service-level DNS resolution rather than localhost-based communication.

This more closely mirrors real distributed backend deployments where services communicate across isolated runtime environments.

### Environment-Based Configuration

Service configuration is managed through environment variables and container configuration rather than hardcoded infrastructure settings.

This simplifies deployment portability and environment-specific configuration management.

### Production-Oriented Separation

The architecture separates:
- traffic management
- backend business services
- distributed caching/state
- persistent storage

into independent services that can be scaled, replaced, or deployed separately.

## Getting Started

### Prerequisites

Before running the project, ensure Docker is installed and running and for convenience use an api tester like Insomnia or Postman.

---

### Clone the Repository

```bash
git clone https://github.com/pchak00/gateway-api.git
cd smart-api-gateway
```

---

### Start the Platform

Build and start all services:

```bash
docker compose up --build
```

This starts the following services:

| Service | Port |
|---|---|
| Gateway Service | `8080` |
| Backend Service | `8081` |
| PostgreSQL | `5432` |
| Redis | `6379` |

---

### Verify the Gateway

Example request using an API key:

```bash
curl -X GET http://localhost:8080/api/products \
  -H "X-API-Key: YOUR_API_KEY"
```

---

### Stop the Platform

```bash
docker compose down
```
## API Usage Examples

### Demo Credentials

The application automatically seeds demo data when the database is empty.

#### Admin Users

| Username | Role |
|-----------|---------|
| admin | SUPER_ADMIN |
| viewer | READ_ONLY_ADMIN |

#### Plans

| Plan | Requests Per Minute |
|------|---------------------|
| FREE | 10 |
| PRO | 100 |
| ENTERPRISE | 1000 |

#### Demo Clients

| Client | Plan |
|---------|------|
| demo-free-client | FREE |
| demo-pro-client | PRO |

---

### Authentication

Obtain a JWT token before accessing administrative endpoints.

#### Login

```bash
curl -X POST http://localhost:8080/auth/login \
-H "Content-Type: application/json" \
-d '{
  "username":"admin",
  "password":"password"
}'
```

#### Response

```json
{
  "token":"eyJhbGciOiJIUzI1NiJ9..."
}
```

Use the token for all admin endpoints:

```http
Authorization: Bearer <token>
```

---

### Plan Management

#### Create Plan

```bash
curl -X POST http://localhost:8080/admin/plans \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "planName":"STARTUP",
  "requestsPerMinute":250,
  "price":49.99
}'
```

#### Delete Plan

```bash
curl -X DELETE http://localhost:8080/admin/plans/4 \
-H "Authorization: Bearer <token>"
```

#### Safety Rules

- Plans assigned to clients cannot be deleted.
- Plans referenced by route limits cannot be deleted.

---

### Client Management

#### Create Client

```bash
curl -X POST http://localhost:8080/admin/clients \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "clientName":"Acme Corp",
  "planId":2
}'
```

#### Upgrade Client Plan

```bash
curl -X PATCH http://localhost:8080/admin/clients/1/plan \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "planId":3
}'
```

#### Delete Client

```bash
curl -X DELETE http://localhost:8080/admin/clients/1 \
-H "Authorization: Bearer <token>"
```

---

### Route Limit Management

#### Create Route Limit

```bash
curl -X POST http://localhost:8080/admin/route-limits \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "planId":1,
  "routePattern":"/api/reports",
  "requestsPerMinute":2
}'
```

#### Update Route Limit

```bash
curl -X PATCH http://localhost:8080/admin/route-limits/1 \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "routePattern":"/api/reports",
  "requestsPerMinute":5
}'
```

#### Delete Route Limit

```bash
curl -X DELETE http://localhost:8080/admin/route-limits/1 \
-H "Authorization: Bearer <token>"
```

---

### Admin Management

#### Create Admin

```bash
curl -X POST http://localhost:8080/admin/users \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "username":"newadmin",
  "password":"password",
  "role":"READ_ONLY_ADMIN"
}'
```

#### Promote Admin

```bash
curl -X PATCH http://localhost:8080/admin/users/2/role \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{
  "role":"SUPER_ADMIN"
}'
```

#### Delete Admin

```bash
curl -X DELETE http://localhost:8080/admin/users/2 \
-H "Authorization: Bearer <token>"
```

#### Safety Rules

- Only SUPER_ADMIN users can create, update, or delete administrators.
- The system prevents deletion of the last SUPER_ADMIN.
- The system prevents demotion of the last SUPER_ADMIN.

---

### Gateway Usage

Clients authenticate using API keys.

```http
X-API-Key: <client-api-key>
```

---

#### Accessing a Protected Endpoint

```bash
curl -X GET http://localhost:8080/api/products \
-H "X-API-Key: demo-free-client-key"
```

#### Successful Response

```json
{
  "message":"Request forwarded successfully"
}
```

---

#### Plan Based Rate Limiting

Each client inherits the request limit defined by its assigned plan.

| Plan | Requests Per Minute |
|--------|------------------|
| FREE | 10 |
| PRO | 100 |
| ENTERPRISE | 1000 |

---

#### Route Specific Rate Limiting

Route-specific limits override plan defaults.

Example:

```text
FREE Plan
├── Default: 10 requests/minute
└── /api/reports: 2 requests/minute
```

In this case:

- Requests to `/api/products` use the FREE plan limit (10 RPM).
- Requests to `/api/reports` use the route-specific limit (2 RPM).

---

#### Exceeding Rate Limits

When a client exceeds its allowed request rate:

```http
HTTP 429 Too Many Requests
```

Example:

```json
{
  "message":"Rate limit exceeded"
}
```

The gateway:

- Records the blocked request.
- Updates usage analytics.
- Evaluates abuse thresholds.
- Creates or updates alerts when thresholds are exceeded.

---

### Role Based Access Control

| Endpoint Type | READ_ONLY_ADMIN | SUPER_ADMIN |
|--------------|-----------------|-------------|
| View Data | allowed         | allowed     |
| Create Resources | denied          | allowed     |
| Update Resources | denied          | allowed     |
| Delete Resources | denied          | allowed     |

This separation allows operational users to monitor the platform while restricting configuration changes to SUPER_ADMIN accounts.

## Upcomming Updates

Planned improvements and future platform enhancements include:

### Advanced Rate Limiting Algorithms

The current implementation uses a fixed-window rate limiting strategy.

Future versions will introduce:
- sliding window rate limiting
- token bucket algorithms
- burst traffic handling
- dynamic quota policies

to provide more accurate and flexible traffic control behavior.

### Multi-Tenant Platform Support

Future versions will support tenant or organization-level resource management, allowing multiple teams or companies to manage clients, plans, and gateway configuration within isolated platform boundaries.

### Webhook-Based Alerting

The abuse detection system may be extended with webhook notifications for operational alerts such as:
- repeated rate limit violations
- suspicious traffic activity
- quota exhaustion events

### Enhanced Analytics & Observability

Planned improvements include:
- real-time traffic dashboards
- request trend visualization
- client-level usage insights
- route-level analytics
- operational monitoring improvements

### Management UI

A future management interface may provide a web-based dashboard for operating the gateway without manually calling admin APIs.

Planned UI capabilities may include:

- admin login page
- client creation and API key management
- plan assignment and quota updates
- route-specific rate limit configuration
- analytics and usage dashboards
- abuse alert review
- admin user management

## Feedback & Contributions

Feedback, bug reports, and improvement suggestions are welcome.

If you encounter issues while running the platform or have ideas for improvements, feel free to open an issue or reach out through GitHub discussions.