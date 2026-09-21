# Financial Application Frontend

The web client for a personal finance and investment management platform. The application provides authenticated users with a dashboard for cash flow, investments, savings goals, transactions, financial reports, portfolio monitoring, tax reports, notifications, and account settings. It also includes subscription-aware feature access and role-protected administration screens.

This project is the frontend only. It expects the Financial Application backend to be running locally at `https://localhost:7085/` unless the API configuration is changed.

## Contents

- [Capabilities](#capabilities)
- [Technology](#technology)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Application architecture](#application-architecture)
- [Routes](#routes)
- [Authentication and authorization](#authentication-and-authorization)
- [Backend API surface](#backend-api-surface)
- [Project structure](#project-structure)
- [Available commands](#available-commands)
- [Production build and deployment](#production-build-and-deployment)
- [Troubleshooting](#troubleshooting)
- [Development guidelines](#development-guidelines)

## Capabilities

### User experience

- Login and account registration flows.
- Google sign-in, TOTP verification, recovery-code login, and email verification flows.
- Protected application shell with responsive sidebar navigation and header actions.
- Light and dark theme support.
- Guided onboarding and in-app tour support using React Joyride.
- Toast notifications for user feedback and asynchronous operations.

### Financial management

- Dashboard summary with income, expenses, net balance, savings rate, investments, goals, and recent activity.
- Transaction browsing and transaction details.
- Investment monitoring and portfolio management.
- Savings goals and contributions.
- Budget planning.
- Tax data, tax computation, and tax reports.
- Analytics and report generation.
- News feeds from database and external financial-news providers.

### Account and administration

- Profile, account, billing, plan, password, notification, and feedback screens.
- Notification inbox with read/unread state.
- Subscription-aware feature gates for paid functionality.
- Admin hub with user, plan, feature, subscription, notification, and account management screens.

## Technology

- React 19 with TypeScript.
- Vite 8 for development and production builds.
- React Router 7 for client-side routing.
- Tailwind CSS 4 and CSS modules for styling.
- Chart.js for dashboard and finance visualizations.
- Axios and the Fetch API for HTTP requests.
- `lucide-react` and `react-icons` for icons.
- `react-hot-toast` for notifications.
- `react-joyride` for guided tours.
- ESLint and TypeScript for static quality checks.

## Requirements

- Node.js 20 or newer is recommended for the current dependency set.
- npm.
- The Financial Application backend available at `https://localhost:7085/`.
- A trusted local HTTPS certificate for the backend, or an equivalent backend URL configured in the frontend.

## Getting started

1. Clone the repository and open the frontend directory.

```bash
cd Frontend
```

2. Install dependencies.

```bash
npm install
```

3. Start the Vite development server.

```bash
npm run dev
```

4. Open the URL printed by Vite, normally `http://localhost:5173`.

5. Confirm that the backend is running and that its HTTPS certificate is trusted by the browser. Authentication and finance requests will fail when the API cannot be reached.

## Configuration

The primary frontend API configuration is in [`src/config/apiconfig.ts`](src/config/apiconfig.ts). The current default backend URL is:

```text
https://localhost:7085/
```

The Vite development server also proxies `/api` requests to `https://localhost:7085` with certificate verification disabled for local development. This proxy is configured in [`vite.config.ts`](vite.config.ts).

The API configuration currently contains external news-provider URLs and credentials in source code. Treat those values as exposed client-side credentials. Before production deployment, move provider credentials behind the backend or inject non-secret public configuration through a deployment-specific mechanism. Do not commit new private keys, tokens, or secrets to this repository.

## Application architecture

The application is composed of the following runtime layers:

1. `main.tsx` mounts the React application and providers.
2. `AuthProvider` restores authentication state by calling `api/Auth/checkauth` and stores the returned JWT tokens in browser storage.
3. `App.tsx` defines public, protected, feature-gated, and admin routes.
4. `ProtectedRoute` prevents unauthenticated access to the application shell.
5. `MainLayout` renders the shared sidebar, header, and nested page outlet.
6. `SubscriptionProvider` loads the current plan and feature keys for authenticated users and refreshes them periodically.
7. Individual pages call the backend endpoints described by the API configuration modules.

The dashboard computes a client-side financial health score from savings, balance, investment, and goal signals. Financial totals and source data remain backend-owned.

## Routes

### Public routes

| Path | Purpose |
| --- | --- |
| `/` | Redirects to `/dashboard` for authenticated users or `/login` for signed-out users |
| `/login` | Login and multi-factor authentication flow |
| `/signup` | Account registration and email verification flow |

### Authenticated routes

| Area | Paths |
| --- | --- |
| Core | `/dashboard`, `/onboarding`, `/main`, `/news`, `/roadmap`, `/faq` |
| Finance | `/profile`, `/cards`, `/transaction`, `/transaction-details`, `/goals`, `/budget-planning`, `/investment-monitoring`, `/portfolio-management`, `/tax-reports`, `/audit-log` |
| Reports | `/analytics`, `/reports-analytics`, `/report-generation` |
| Accounts | `/manage-accounts`, `/transactions`, `/security`, `/user-management` |
| Settings | `/settings`, `/reset-password`, `/myaccount`, `/plans`, `/billing`, `/notifications`, `/settings/notifications`, `/feedback` |
| Administration | `/admin`, `/admin/users`, `/admin/plans`, `/admin/features`, `/admin/subscriptions`, `/admin/notifications`, `/admin/account` |

Some authenticated routes are additionally restricted by subscription feature keys. The route-level checks are implemented with `FeatureRoute`, and page-level controls can use `FeatureGate`.

## Authentication and authorization

`AuthContext` manages the client authentication lifecycle:

- Tokens returned by login flows are stored in `localStorage` under `token` and `refreshtoken`.
- Requests include the bearer token and `credentials: "include"` for cookie-backed authentication support.
- Startup authentication is checked through `api/Auth/checkauth`.
- The context exposes standard login, Google login, TOTP, recovery-code, email-recovery, signup-verification, logout, and auth-refresh operations.
- `ProtectedRoute` redirects unauthenticated users away from protected pages.

`SubscriptionContext` calls `api/subscription/my-features` and `api/subscription/current` after authentication. It exposes `hasFeature(featureKey)` to the UI and refreshes subscription data every five minutes while a user is signed in.

Administrative pages are routed through the authenticated shell and perform role checks in the admin feature area. Backend authorization remains the source of truth; hiding a route or control in the frontend is not a security boundary.

## Backend API surface

Endpoint groups currently represented in `src/config/apiconfig.ts` include:

- Authentication: `api/Auth/*`.
- Transactions: list, summary, categories, and individual transaction endpoints.
- Investments: list, summary, and individual investment endpoints.
- Goals: list, individual goal, contribution, and status endpoints.
- Dashboard: summary, monthly trends, category breakdown, and recent activity.
- Portfolio: list, summary, and individual portfolio endpoints.
- Tax: list, compute, report, and create endpoints.
- Notifications: paginated list, unread count, mark read, and mark all read.
- Admin notifications: broadcast and notification history.
- Finance news: database-backed news endpoints and configured external news providers.

When adding a new API integration, keep endpoint construction in the configuration layer where practical, pass authentication consistently, and handle loading, empty, unauthorized, and network-error states in the consuming page.

## Project structure

```text
.
├── public/                 # Static assets copied as-is by Vite
├── src/
│   ├── Component/          # Shared UI, layouts, feature gates, charts, and partials
│   ├── config/             # API endpoint configuration
│   ├── context/            # Authentication and subscription state
│   ├── hooks/              # Reusable React hooks
│   ├── layouts/            # Layout-level components
│   ├── lib/                # API and utility helpers
│   ├── pages/              # Route-level screens grouped by product area
│   ├── tours/              # Guided tour provider and step definitions
│   ├── utils/              # Shared utilities such as CSV export
│   ├── App.tsx             # Providers and route definitions
│   ├── MainLayout.tsx      # Authenticated application shell
│   ├── ProtectedLayout.tsx # Protected route boundary
│   ├── index.css           # Global styles
│   └── main.tsx            # Browser entry point
├── index.html              # Vite HTML entry point
├── vite.config.ts          # Vite plugins, build settings, and API proxy
├── tailwind.config.js      # Tailwind content paths and theme extensions
├── eslint.config.js        # ESLint configuration
└── package.json            # Scripts and dependencies
```

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Run TypeScript project builds and create a production Vite bundle in `dist/` |
| `npm run lint` | Run ESLint across the repository |
| `npm run preview` | Serve the built `dist/` directory locally |

There is currently no automated test script in `package.json`. Add focused component, integration, or browser tests as the corresponding product areas mature.

## Production build and deployment

Create the production bundle with:

```bash
npm run build
```

The generated `dist/` directory can be served by a static hosting platform such as Azure Static Web Apps, Vercel, Netlify, or an object-storage static website. Configure the production host to fall back to `index.html` for client-side routes such as `/dashboard` and `/settings`.

Before deployment:

- Replace the local API URL with the production backend URL.
- Configure CORS and cookie policies on the backend for the production frontend origin.
- Use HTTPS for both frontend and backend.
- Move external-provider secrets out of the browser bundle.
- Verify that the hosting platform supports SPA fallback and cache behavior appropriate for `index.html`.
- Run `npm run lint` and `npm run build` in CI.

## Troubleshooting

### The app shows a connection error during startup

Make sure the backend is running at `https://localhost:7085/` and that the browser trusts its development certificate. Inspect the browser Network panel for `api/Auth/checkauth`.

### Login succeeds but protected pages redirect to `/login`

Check that the backend returns a valid token, that `localStorage` contains `token`, and that the backend accepts the frontend origin and credentials. Clear stale browser storage and retry if the token has expired.

### A feature is visible but inaccessible

Inspect the subscription responses from `api/subscription/my-features` and `api/subscription/current`. The feature key used by `FeatureRoute` must match the key returned by the backend plan configuration.

### Direct navigation to a nested route returns a 404 in production

Configure SPA fallback so unknown paths are served by `index.html`; the frontend router must receive the path before it can render the page.

### Charts or news do not render

Check the relevant API response, browser console, CORS configuration, and external-provider availability. External provider credentials and rate limits are separate from the application backend.

## Development guidelines

- Keep route-level screens in the appropriate `src/pages/` product area.
- Prefer existing context, feature-gate, layout, chart, and toast patterns before introducing new global abstractions.
- Keep backend endpoint definitions centralized in `src/config/apiconfig.ts`.
- Handle loading, empty, error, and unauthorized states for API-backed views.
- Do not treat client-side route or feature hiding as authorization.
- Avoid committing secrets or provider credentials.
- Run both `npm run lint` and `npm run build` before opening a pull request.

## License

No license file is currently included. Confirm the intended license with the project owner before distributing this application.

