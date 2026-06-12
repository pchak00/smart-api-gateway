# PROJECT_HANDOFF.md - Smart API Gateway

Last updated: 2026-06-12  
Repo path: `/home/prakash/Desktop/Projects/Smart Api Gateaway`

## Current State

This project is a Spring Boot Smart API Gateway with a separate React/Vite management UI. The current active UI brand is lowercase `pacific`.

Current branch:

```bash
feat/ui-calm-polish
```

Current branch stack:

```text
origin/main
  -> main
    -> feat/ui/stabilize-scaffold
      -> feat/ui-product-polish
        -> feat/ui-calm-polish
```

Recent commits:

```text
6694437 feat(ui): calm Pacific product interface
729896b feat(ui): polish Pacific product dashboard
699dafc fix(ui): stabilize management scaffold
3e5af5d chore(ui): init vite + react + typescript + tailwind
```

Open PR links:

```text
https://github.com/pchak00/smart-api-gateway/pull/new/feat/ui/stabilize-scaffold
https://github.com/pchak00/smart-api-gateway/pull/new/feat/ui-product-polish
https://github.com/pchak00/smart-api-gateway/pull/new/feat/ui-calm-polish
```

Merge the branches in stack order to avoid conflict churn.

## Backend Context

The backend is a Spring Boot API gateway and management platform with two request flows:

- API consumers call `/api/**` using `X-API-Key`.
- Admin users call `/auth/**` and `/admin/**` using JWT authentication.

Core services:

- `gateway-service` on port `8080`
- `backend-service` on port `8081`
- PostgreSQL on port `5432`
- Redis on port `6379`
- `management-ui` on port `3000` in Docker, `5173` in Vite dev

Important backend behavior:

- API key validation happens in `ApiKeyFilter`.
- Rate limits are Redis-backed and per API-key/per-path.
- Route-specific limits override plan limits.
- Admin roles are backend enum values:
  - `SUPER_ADMIN`
  - `READ_ONLY_ADMIN`
- Do not rename backend enum values or JWT claims.

## Management UI Context

UI app path:

```bash
management-ui/
```

Stack:

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- jwt-decode
- Recharts
- lucide-react

Important UI files:

```text
management-ui/src/api/client.ts
management-ui/src/context/AuthContext.tsx
management-ui/src/routes/ProtectedRoute.tsx
management-ui/src/routes/AppRoutes.tsx
management-ui/src/layout/AppLayout.tsx
management-ui/src/components/Sidebar.tsx
management-ui/src/components/TopBar.tsx
management-ui/src/components/PageShell.tsx
management-ui/src/utils/roles.ts
management-ui/src/utils/demoData.ts
management-ui/src/assets/pacific-logo.png
```

The Pacific logo is a real PNG now:

```text
management-ui/src/assets/pacific-logo.png
```

Use this exact asset wherever the brand appears. Do not recreate it in CSS or replace it with an icon.

## Current UI Behavior

Auth:

- Token is stored at `localStorage` key `smart-gateway:token`.
- JWT role claim is decoded client-side.
- Authorization logic still uses backend enum values.
- Visible UI labels are mapped through `management-ui/src/utils/roles.ts`:
  - `SUPER_ADMIN` displays as `Owner`
  - `READ_ONLY_ADMIN` displays as `Viewer`

Protected routes:

- `/login`
- `/`
- `/clients`
- `/clients/:id`
- `/plans`
- `/route-limits`
- `/analytics`
- `/abuse-alerts`
- `/admin-users`
- 404 fallback

Role UX:

- `READ_ONLY_ADMIN` can view allowed pages.
- `Admin Users` remains blocked for `READ_ONLY_ADMIN`.
- Restricted admin-user navigation shows: `You need Owner access to perform this action.`
- Mutation controls remain disabled for non-owners.

Data behavior:

- Existing real data calls are preserved.
- Demo/fallback data remains in `src/utils/demoData.ts`.
- No new backend integrations were added during the recent polish milestones.
- Fallback/demo data is labeled subtly as demo/seeded preview data.

Vite proxy:

```ts
'/api'   -> 'http://localhost:8080'
'/auth'  -> 'http://localhost:8080'
'/admin' -> 'http://localhost:8080'
```

Browser networking rule:

- Browser UI should call `http://localhost:8080`.
- Do not use `http://gateway-service:8080` in browser code unless a reverse proxy is added later.

## Recent Progress

### `feat/ui/stabilize-scaffold`

Stabilized the initial UI scaffold.

Key work:

- Fixed `ProtectedRoute` hook-rule issue.
- Added `/clients/:id`.
- Added `isSuperAdmin` and `username` to auth context.
- Made top bar show current page title.
- Added `/admin` to Vite proxy.
- Improved demo fallback display so badges only show when fallback data is used.

Verification:

```bash
cd management-ui
npm run lint
npm run build
```

Both passed.

### `feat/ui-product-polish`

Added Pacific product dashboard polish.

Key work:

- Added `lucide-react`.
- Added shared `PageShell` primitives.
- Added Pacific logo usage.
- Polished login, layout, sidebar, top bar, dashboard, page shells, tables, badges, and empty states.
- Removed visible demo credentials from login.
- Added Recharts-powered analytics preview using existing dependency.

Verification:

```bash
npm run lint
npm run build
```

Both passed. Build reported a large chunk warning because of Recharts/lucide usage.

### `feat/ui-calm-polish`

Refined the UI into a calmer, more mature dark SaaS dashboard.

Key work:

- Replaced empty logo placeholder with real Pacific PNG.
- Brand displays as lowercase `pacific`.
- Simplified the login page into a centered card.
- Reduced neon/cyan usage, border noise, boxed icon containers, and heavy surfaces.
- Removed sidebar footer marketing copy.
- Replaced visible raw role labels with `Owner` and `Viewer`.
- Kept all backend/API/auth/routing behavior intact.

Verification:

```bash
npm run lint
npm run build
```

Both passed. Build still reports the known large chunk warning.

## How To Test Locally

From repo root, start backend services:

```bash
docker compose up --build postgres redis backend-service gateway-service
```

In another terminal:

```bash
cd management-ui
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

Manual smoke test:

- `/login` renders calm centered pacific login.
- Login succeeds with seeded backend admin credentials when backend is running.
- `/` dashboard renders cards and subtle demo preview text.
- `/clients` renders real or fallback client table.
- `/clients/1` renders client detail shell.
- `/plans`, `/route-limits`, `/analytics`, `/abuse-alerts`, `/admin-users` render polished shells.
- Random route renders styled 404 page.
- Owner can access Admin Users.
- Viewer sees Admin Users locked and receives Owner-access toast.
- Viewer mutation controls remain disabled.

Automated checks:

```bash
cd management-ui
npm run lint
npm run build
```

Known build note:

- Vite may warn that some chunks are larger than 500 kB because Recharts/lucide are bundled. This is currently accepted.

Known npm note:

- `npm install` previously reported 2 moderate vulnerabilities. No `npm audit fix` has been run because dependency remediation was outside the UI polish milestones.

## Next Good Milestones

Recommended order:

1. Merge current UI branch stack in order.
2. Wire read-only real data for plans, route limits, abuse alerts, admin users, and client detail where backend supports it.
3. Add forms/modals for Owner-only mutations.
4. Add clearer API error and fallback handling.
5. Consider code-splitting Recharts analytics to reduce the Vite chunk warning.
6. Optional: optimize `pacific-logo.png`, currently about 888 KB.

## Guardrails For Future Work

Do not casually change:

- Backend enum values.
- JWT role handling.
- Protected route behavior.
- API contracts.
- Browser networking base rule.
- Token storage key.
- Existing demo fallback behavior unless replacing it with real data.

Keep future UI work:

- Calm and premium.
- Lowercase `pacific` for visible brand text.
- Dark neutral surfaces.
- Low-noise tables.
- Minimal borders.
- Muted icons.
- Owner/Viewer labels in UI, backend enums in logic only.

