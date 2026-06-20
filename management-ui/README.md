# Pacific Management UI

Pacific is the React/TypeScript admin console for the Smart API Gateway. It provides a calm dark management interface for operating clients, plans, route limits, analytics, abuse alerts, and admin users.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The gateway service should be running on:

```text
http://localhost:8080
```

The Vite dev proxy forwards `/api`, `/auth`, and `/admin` requests to `http://localhost:8080` when `VITE_API_BASE_URL` is not set or is `/`.

## Production Compose Usage

For the full local demo, run from the repository root:

```bash
docker compose up --build
```

Docker Compose builds this UI and serves it through Nginx at:

```text
http://localhost:3000
```

The compose build passes:

```text
VITE_API_BASE_URL=http://localhost:8080
```

This is intentional: browser requests must target the host-published gateway URL. Do not use the internal Docker hostname `http://gateway-service:8080` in browser code unless a reverse proxy is added later.

## Demo Login

Local seed data creates:

| UI Label | Backend Role | Username | Password |
|---|---|---|---|
| Admin | `SUPER_ADMIN` | `super admin` | `admin123` |
| Viewer | `READ_ONLY_ADMIN` | `viewer` | `admin123` |

These credentials are for local demo use only.

## Available Scripts

```bash
npm run dev
npm run build
npm run lint
```

`npm run lint` currently runs `tsc --noEmit`.

## Configuration

`VITE_API_BASE_URL` controls the API base URL embedded into the browser bundle.

Common values:

```text
VITE_API_BASE_URL=/                      # Vite dev proxy
VITE_API_BASE_URL=http://localhost:8080  # Docker Compose browser demo
```

JWT tokens are stored in `localStorage` under:

```text
smart-gateway:token
```

## Role Behavior

- `SUPER_ADMIN` is displayed as `Admin` and can create, update, and delete supported resources.
- `READ_ONLY_ADMIN` is displayed as `Viewer` and can view allowed pages/data, but mutation controls are disabled.
- The Admin Users page is blocked for Viewer accounts.

## Project Structure

```text
src/
|-- api/
|-- components/
|-- context/
|-- hooks/
|-- layout/
|-- pages/
|-- routes/
|-- types/
|-- utils/
`-- main.tsx
```
