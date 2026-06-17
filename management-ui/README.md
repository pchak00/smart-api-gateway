# Smart API Gateway Management UI

A modern, role-based management dashboard for the Smart API Gateway built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- Role-based access control (SUPER_ADMIN and READ_ONLY_ADMIN)
- Client management
- Plan configuration
- Route-specific rate limiting
- Usage analytics
- Abuse alert monitoring
- Admin user management
- JWT-based authentication with localStorage persistence

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend gateway service running on `http://localhost:8080`

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (Vite proxy will forward API calls to localhost:8080):
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

4. Login with demo credentials:
   - **Owner username:** `super admin` / password: `admin123`
   - **Viewer username:** `viewer` / password: `admin123`

### Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Lint & Type Check

```bash
npm run lint
```

## Docker

### Build Image

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8080 \
  -t smart-api-gateway-ui:latest .
```

### Run Container

```bash
docker run -p 3000:80 smart-api-gateway-ui:latest
```

Access the UI at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── api/              # API client wrapper
├── components/       # Reusable UI components
├── context/          # React context providers (Auth, Toast)
├── hooks/            # Custom hooks (useAuth, useToast)
├── layout/           # Layout components (Sidebar, TopBar)
├── pages/            # Page components
├── routes/           # Route setup and guards
├── types/            # TypeScript type definitions
├── utils/            # Utilities (JWT, demo data)
└── main.tsx          # Application entry point
```

## Technology Stack

- **React 18** — UI framework
- **TypeScript** — Type safety
- **Vite** — Fast build tool and dev server
- **Tailwind CSS** — Utility-first styling
- **React Router v6** — Client-side routing
- **Axios** — HTTP client
- **jwt-decode** — JWT token decoding
- **Recharts** — Data visualization (ready for analytics)

## API Integration

The API client (`src/api/client.ts`) handles all backend communication. It:

- Automatically includes the JWT token from localStorage in request headers
- Uses Axios interceptors for centralized token management
- Provides typed methods for all endpoints

### Base URL Configuration

- **Development:** Vite dev proxy routes `/api`, `/auth`, and `/admin` requests to `http://localhost:8080` when `VITE_API_BASE_URL=/`
- **Production (Docker):** Set `VITE_API_BASE_URL` as a Docker build argument. Vite embeds it into the static browser bundle at build time.
- **Docker Compose demo:** Uses `VITE_API_BASE_URL=http://localhost:8080` so browser requests target the host-published gateway, not the internal Docker hostname.

### Example API Call

```typescript
// In a component
import { api } from '../api/client';

const clients = await api.getClients();
```

## Authentication

JWT tokens are stored in `localStorage` at key `smart-gateway:token`. The `AuthContext` provides:

- Token management
- Role extraction from JWT claim
- Login/logout functionality
- Automatic token validation

## Role-Based Access Control

### SUPER_ADMIN

- Full access to all pages and features
- Can create, update, and delete clients, plans, route limits, and admin users

### READ_ONLY_ADMIN

- Can view all pages except "Admin Users"
- All mutation controls (Create, Edit, Delete buttons) are disabled
- Permission denied toast appears when attempting restricted actions

## Demo Data

The app includes demo data fallbacks in `src/utils/demoData.ts`. When API calls fail, the app gracefully displays demo data and shows a notice that the backend is unavailable.

## Security Considerations

- JWT tokens are stored in `localStorage` for MVP convenience
- **Future:** Consider HTTP-only cookies for production deployments
- XSS vulnerability exists with localStorage; sanitize responses appropriately
- CORS configuration is required on the backend for cross-origin requests

## Troubleshooting

### API calls not working in dev?

Ensure the Vite dev proxy is correctly configured in `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:8080',
    '/auth': 'http://localhost:8080',
    '/admin': 'http://localhost:8080'
  }
}
```

### Build fails?

Run `npm ci` to ensure clean dependency installation, then retry `npm run build`.

## License

MIT
