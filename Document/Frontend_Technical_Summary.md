# Financial Management Application — Frontend Technical Summary

> **Project Name:** Financial Management Frontend  
> **Tech Stack:** React 19 · TypeScript · Vite 8 · Tailwind CSS 4 · Chart.js · React Router 7  
> **Last Updated:** 07 July 2026

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Root-Level Configuration Files](#2-root-level-configuration-files)
3. [Complete Folder Structure Tree](#3-complete-folder-structure-tree)
4. [Application Bootstrap & Provider Hierarchy](#4-application-bootstrap--provider-hierarchy)
5. [Routing Architecture](#5-routing-architecture)
6. [Module-by-Module Deep Dive](#6-module-by-module-deep-dive)
   - 6.1  [Entry Points (`main.tsx`, `App.tsx`)](#61-entry-points)
   - 6.2  [Layouts (`MainLayout.tsx`, `ProtectedLayout.tsx`)](#62-layouts)
   - 6.3  [Context Providers (`context/`, `Component/utils/ThemeContext.tsx`)](#63-context-providers)
   - 6.4  [Configuration (`config/`)](#64-configuration)
   - 6.5  [Pages (`pages/`)](#65-pages)
   - 6.6  [Components (`Component/`)](#66-components)
   - 6.7  [Charts (`Component/charts/`)](#67-charts)
   - 6.8  [Dashboard Cards (`Component/partials/dashboard/`)](#68-dashboard-cards)
   - 6.9  [Dashboard UI Components (`Component/dashboard/components/`)](#69-dashboard-ui-components)
   - 6.10 [News Module (`Component/News/`, `pages/News/`)](#610-news-module)
   - 6.11 [Guided Tour System (`tours/`)](#611-guided-tour-system)
   - 6.12 [Library Utilities (`lib/`)](#612-library-utilities)
   - 6.13 [Styling (`css/`, `index.css`, CSS Modules)](#613-styling)
   - 6.14 [Static Assets (`assets/`, `public/`)](#614-static-assets)
7. [API Integration Map](#7-api-integration-map)
8. [Authentication Flow](#8-authentication-flow)
9. [Theme System (Dark/Light Mode)](#9-theme-system-darklight-mode)
10. [Data Flow Diagram](#10-data-flow-diagram)
11. [Key Design Patterns](#11-key-design-patterns)

---

## 1. High-Level Architecture

The application is a **Single Page Application (SPA)** built as a **financial management dashboard** with the following architectural layers:

```
┌─────────────────────────────────────────────────────────┐
│                       Browser                           │
├─────────────────────────────────────────────────────────┤
│  index.html  →  main.tsx (React root)                   │
│    ├── BrowserRouter        (client-side routing)        │
│    ├── ThemeProvider        (dark/light mode)            │
│    ├── AuthProvider         (JWT auth state)             │
│    ├── TourProvider         (guided onboarding tours)    │
│    └── <App />              (route definitions)          │
│         ├── Public Routes   (Login / Signup)             │
│         └── Protected Routes                            │
│              └── MainLayout (Sidebar + Header + Outlet) │
│                   ├── Dashboard                         │
│                   ├── News                              │
│                   ├── Finance (Cards, Transactions)     │
│                   ├── Manage Accounts                   │
│                   ├── Settings                          │
│                   └── Onboarding                        │
├─────────────────────────────────────────────────────────┤
│  Backend API  →  ASP.NET Core (https://localhost:7085)  │
│  External APIs → Alpha Vantage, FinanceLayer            │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Root-Level Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, npm scripts (`dev`, `build`, `lint`, `preview`), and all dependency declarations |
| `vite.config.ts` | Vite dev server config with React plugin, CommonJS mixed-module transform, and API proxy to `https://localhost:7085` |
| `tsconfig.json` | Root TypeScript config that references `tsconfig.app.json` and `tsconfig.node.json` |
| `tsconfig.app.json` | App-level TypeScript settings (target ES2020, JSX preserve, strict mode) |
| `tsconfig.node.json` | Node-side TypeScript config for build tools |
| `tailwind.config.js` | Tailwind CSS 4 configuration with custom color palette (slate, sky, amber, emerald, red) and font sizes |
| `postcss.config.cjs` | PostCSS integration pointing to `@tailwindcss/postcss` |
| `eslint.config.js` | ESLint flat config with TypeScript and React hooks plugins |
| `index.html` | HTML shell with `<div id="root">` mount point; loads `src/main.tsx` as ES module |

### Vite Proxy Configuration

The dev server proxies all `/api` requests to the backend:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://localhost:7085',
      changeOrigin: true,
      secure: false,    // accepts self-signed certs
    },
  },
},
```

---

## 3. Complete Folder Structure Tree

```
Frontend/
├── public/                          # Static assets served at root
│   ├── favicon.png
│   ├── favicon.svg
│   └── icons.svg
├── scripts/                         # (Empty — reserved for build scripts)
├── src/
│   ├── main.tsx                     # React DOM entry point
│   ├── App.tsx                      # Route definitions
│   ├── MainLayout.tsx               # Authenticated page shell (Sidebar + Header)
│   ├── ProtectedLayout.tsx          # Auth guard wrapper
│   ├── index.css                    # Global CSS imports
│   ├── App.css                      # (Empty — app-level overrides)
│   ├── vite-env.d.ts                # Vite + image module type declarations
│   │
│   ├── config/
│   │   └── apiconfig.ts             # API base URLs, external API configs, pagination helpers
│   │
│   ├── context/
│   │   └── AuthContext.tsx           # Auth state management (login, logout, checkAuth)
│   │
│   ├── Component/
│   │   ├── Logout.tsx               # Logout effect component
│   │   ├── TourButton.tsx           # Guided tour trigger button (3 variants)
│   │   │
│   │   ├── partials/                # Layout-level components
│   │   │   ├── Header.jsx           # Top navigation bar
│   │   │   ├── Sidebar.jsx          # Collapsible sidebar navigation (~842 lines)
│   │   │   ├── SidebarLinkGroup.jsx # Expandable sidebar section wrapper
│   │   │   ├── Banner.jsx           # Promotional banner (template link)
│   │   │   └── dashboard/           # Dashboard widget cards
│   │   │       ├── DashboardCard01.jsx  # Acme Plus — Line chart (sales)
│   │   │       ├── DashboardCard02.jsx  # Acme Advanced — Line chart
│   │   │       ├── DashboardCard03.jsx  # Acme Professional — Line chart
│   │   │       ├── DashboardCard04.jsx  # Direct vs Indirect — Bar chart
│   │   │       ├── DashboardCard05.jsx  # Real-time value — Line chart
│   │   │       ├── DashboardCard06.jsx  # Doughnut chart
│   │   │       ├── DashboardCard07.jsx  # Top channels table
│   │   │       ├── DashboardCard08.jsx  # Sales over time — Bar chart
│   │   │       ├── DashboardCard09.jsx  # Stacked bar chart
│   │   │       ├── DashboardCard10.jsx  # Top customers table
│   │   │       ├── DashboardCard11.jsx  # Reasons for refunds
│   │   │       ├── DashboardCard12.jsx  # Recent activity feed
│   │   │       └── DashboardCard13.jsx  # Income/expenses summary
│   │   │
│   │   ├── charts/                  # Chart.js wrappers
│   │   │   ├── ChartjsConfig.jsx    # Global Chart.js defaults and gradient helper
│   │   │   ├── LineChart01.jsx      # Simple line chart
│   │   │   ├── LineChart02.jsx      # Multi-dataset line chart
│   │   │   ├── BarChart01.jsx       # Vertical bar chart
│   │   │   ├── BarChart02.jsx       # Horizontal bar chart
│   │   │   ├── BarChart03.jsx       # Stacked bar chart
│   │   │   ├── DoughnutChart.jsx    # Doughnut/pie chart
│   │   │   └── RealtimeChart.jsx    # Live-updating line chart
│   │   │
│   │   ├── dashboard/components/    # Reusable header/toolbar widgets
│   │   │   ├── DateSelect.jsx       # Date range selector
│   │   │   ├── Datepicker.jsx       # Calendar date picker (react-day-picker)
│   │   │   ├── DropdownEditMenu.jsx # Three-dot context menu
│   │   │   ├── DropdownFilter.jsx   # Multi-select filter dropdown
│   │   │   ├── DropdownHelp.jsx     # Help & support dropdown
│   │   │   ├── DropdownNotifications.jsx # Notifications dropdown
│   │   │   ├── DropdownProfile.jsx  # User profile dropdown (sign out, settings)
│   │   │   ├── ModalSearch.jsx      # Full-screen search modal
│   │   │   ├── ThemeToggle.jsx      # Dark/light mode toggle switch
│   │   │   ├── Tooltip.jsx          # Reusable tooltip component
│   │   │   └── ui/
│   │   │       ├── calendar.jsx     # Calendar UI primitive (Radix/DayPicker)
│   │   │       └── popover.jsx      # Popover UI primitive (Radix)
│   │   │
│   │   ├── News/                    # News-specific components
│   │   │   ├── NewsComponent.tsx    # Individual news article card
│   │   │   └── BlogBanners.tsx      # Blog URL banner scraper UI
│   │   │
│   │   └── utils/                   # Shared utility components
│   │       ├── ThemeContext.tsx      # Theme context provider + hook
│   │       ├── Transition.jsx       # CSS transition wrapper (enter/leave)
│   │       ├── Info.jsx             # Hover info tooltip widget
│   │       └── Utils.js             # Color/format helpers (currency, hex→rgba, oklch)
│   │
│   ├── pages/                       # Route-level page components
│   │   ├── Auth/
│   │   │   ├── Login.tsx            # Login page with email/password form
│   │   │   ├── Login.module.css     # Scoped CSS for Login
│   │   │   ├── Signup.tsx           # Registration page
│   │   │   └── Signup.module.css    # Scoped CSS for Signup
│   │   │
│   │   ├── Dashboard/
│   │   │   ├── dashboard.tsx        # Main dashboard with 12 card widgets
│   │   │   ├── main.tsx             # "Main" sub-page (placeholder)
│   │   │   ├── analytics.tsx        # "Analytics" sub-page (placeholder)
│   │   │   ├── ManageAccounts.tsx   # "Manage Accounts" sub-page (placeholder)
│   │   │   └── Report.tsx           # Report generation (placeholder)
│   │   │
│   │   ├── News/
│   │   │   └── News.tsx             # Tabbed news page (MoneyControl iframe, Finance News, Today News)
│   │   │
│   │   ├── Onboarding/
│   │   │   └── Onboarding.tsx       # 4-step onboarding guide with tour launcher
│   │   │
│   │   ├── finance/                 # Financial management pages
│   │   │   ├── Cards.tsx            # Financial cards (placeholder)
│   │   │   ├── Profile.tsx          # Financial profile (placeholder)
│   │   │   ├── Transaction.tsx      # Transactions view (placeholder)
│   │   │   └── Transactiondetail.tsx# Transaction details (placeholder)
│   │   │
│   │   ├── manageaccounts/          # Account management pages
│   │   │   ├── Usermanagement.tsx   # User management (placeholder)
│   │   │   ├── Transactions.tsx     # Transactions oversight (placeholder)
│   │   │   ├── Investment.tsx       # Investment monitoring (placeholder)
│   │   │   ├── Report.tsx           # Reports & analytics (placeholder)
│   │   │   └── Security.tsx         # Security & audit (placeholder)
│   │   │
│   │   └── settings/                # User settings pages
│   │       ├── myaccount.tsx        # My account (placeholder)
│   │       ├── resetpassword.tsx    # Reset password (placeholder)
│   │       ├── notifications.tsx    # Notification preferences (placeholder)
│   │       ├── billing.tsx          # Billing & invoices (placeholder)
│   │       ├── plans.tsx            # Subscription plans (placeholder)
│   │       └── feedback.tsx         # Give feedback (placeholder)
│   │
│   ├── tours/                       # Guided tour system
│   │   ├── TourProvider.tsx         # Joyride provider with route-aware step logic
│   │   ├── tourSteps.ts            # Step definitions (targets, routes, callbacks)
│   │   └── appTour.ts              # Tour manager hook + re-exports
│   │
│   ├── lib/                         # Shared library utilities
│   │   ├── blogBannerApi.ts        # API client for blog banner scraping endpoint
│   │   └── utils.js                # `cn()` — clsx + tailwind-merge class merger
│   │
│   ├── css/
│   │   ├── style.css               # Base styles, custom scrollbar, utility classes
│   │   └── additional-styles/
│   │       └── utility-patterns.css # Reusable CSS utility patterns
│   │
│   ├── assets/                      # Bundled static assets
│   │   ├── Financial.jpeg           # Login hero image
│   │   ├── Registerlogo.jpeg        # Signup hero image
│   │   ├── hero.png                 # Hero illustration
│   │   ├── image.png                # Generic image
│   │   ├── Demo.mp4                 # Demo video (~116 MB)
│   │   ├── react.svg                # React logo
│   │   └── vite.svg                 # Vite logo
│   │
│   └── layouts/                     # (Empty — reserved for future layout variants)
│
├── dist/                            # Production build output
├── node_modules/                    # npm dependencies
└── [config files]                   # See Section 2
```

---

## 4. Application Bootstrap & Provider Hierarchy

The app bootstraps in `src/main.tsx` with a strict provider nesting order:

```
StrictMode
 └── BrowserRouter           ← Enables <Route>, <NavLink>, useNavigate
      └── ThemeProvider       ← Provides dark/light theme state + toggles
           └── AuthProvider   ← Provides auth state, login(), logout()
                └── TourProvider  ← Provides guided tour step management
                     └── <App />  ← Route definitions
```

**Why this order matters:**
- `BrowserRouter` must wrap everything that uses routing hooks.
- `ThemeProvider` is above `AuthProvider` because theme should persist even when logged out.
- `AuthProvider` is above `TourProvider` because tours may need auth state to determine which steps to show.

---

## 5. Routing Architecture

### Public Routes (no auth required)

| Path | Component | Behavior |
|------|-----------|----------|
| `/` | `Login` | If already authenticated → redirects to `/dashboard` |
| `/login` | `Login` | Same as above |
| `*` (catch-all) | `Navigate` | Redirects to `/dashboard` (if auth'd) or `/` (if not) |

### Protected Routes (auth required, wrapped in `MainLayout`)

All protected routes render inside a layout shell that includes the **Sidebar** and **Header**.

| Path | Component | Module | Status |
|------|-----------|--------|--------|
| `/dashboard` | `Dashboard` | Dashboard | ✅ Fully implemented |
| `/main` | `Main` | Dashboard | 🔲 Placeholder |
| `/analytics` | `Analytics` | Dashboard | 🔲 Placeholder |
| `/manage-accounts` | `ManageAccounts` | Dashboard | 🔲 Placeholder |
| `/news` | `News` | News | ✅ Fully implemented |
| `/onboarding` | `Onboarding` | Onboarding | ✅ Fully implemented |
| `/report-generation` | `Report` | Dashboard | 🔲 Placeholder |
| `/user-management` | `UserManagement` | Manage Accounts | 🔲 Placeholder |
| `/transactions` | `Transactions` | Manage Accounts | 🔲 Placeholder |
| `/investment-monitoring` | `Investment` | Manage Accounts | 🔲 Placeholder |
| `/reports-analytics` | `Report` | Manage Accounts | 🔲 Placeholder |
| `/security` | `Security` | Manage Accounts | 🔲 Placeholder |
| `/profile` | `Profile` | Finance | 🔲 Placeholder |
| `/cards` | `Cards` | Finance | 🔲 Placeholder |
| `/transaction` | `Transaction` | Finance | 🔲 Placeholder |
| `/transaction-details` | `TransactionDetails` | Finance | 🔲 Placeholder |
| `/myaccount` | `MyAccount` | Settings | 🔲 Placeholder |
| `/reset-password` | `ResetPassword` | Settings | 🔲 Placeholder |
| `/notifications` | `Notifications` | Settings | 🔲 Placeholder |
| `/billing` | `Billing` | Settings | 🔲 Placeholder |
| `/plans` | `Plans` | Settings | 🔲 Placeholder |
| `/feedback` | `Feedback` | Settings | 🔲 Placeholder |

### Route Guard: `ProtectedLayout.tsx`

```typescript
function ProtectedRoute() {
  const { authState } = useAuth();
  return authState.isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}
```

Unauthenticated users are immediately redirected to the login page.

---

## 6. Module-by-Module Deep Dive

### 6.1 Entry Points

#### `src/main.tsx`
- Creates the React root via `createRoot(document.getElementById('root'))`.
- Wraps `<App />` in the provider hierarchy: `StrictMode → BrowserRouter → ThemeProvider → AuthProvider → TourProvider`.
- Imports global `index.css`.

#### `src/App.tsx`
- Defines all application routes using React Router v7's `<Routes>` and `<Route>`.
- Integrates `react-hot-toast` `<Toaster>` for global notifications positioned at `top-center`.
- Reads `authState` to conditionally render public vs. protected routes.
- Uses **nested routes**: `ProtectedRoute → MainLayout → [page components]`.

---

### 6.2 Layouts

#### `MainLayout.tsx` — Authenticated Page Shell

Provides the standard page structure for all authenticated views:

```
┌──────────────────────────────────────────┐
│  Sidebar  │        Header                │
│  (left)   │────────────────────────────── │
│           │                              │
│           │        <Outlet />            │
│           │     (page content)           │
│           │                              │
└──────────────────────────────────────────┘
```

- Manages `sidebarOpen` state (boolean) for mobile toggle.
- The main content area has `overflow-y-auto` and a custom `no-scrollbar` class.
- Supports both light (`bg-gray-100`) and dark (`bg-slate-900`) backgrounds.

#### `ProtectedLayout.tsx` — Auth Guard

A simple route guard component that checks `authState.isAuthenticated`:
- **Authenticated** → renders `<Outlet />` (child routes).
- **Unauthenticated** → redirects to `/` via `<Navigate>`.

---

### 6.3 Context Providers

#### `context/AuthContext.tsx` — Authentication State Manager

**State shape (`AuthState`):**
```typescript
interface AuthState {
  user: string | null;      // Display name
  role: string | null;      // "Admin" | "User"
  userId: string | null;    // Unique user ID
  isAuthenticated: boolean;
  loading: boolean;
}
```

**Methods provided:**
| Method | Description |
|--------|-------------|
| `login(email, password)` | POSTs to `/api/Auth/login`, stores JWT + refresh token in `localStorage`, then calls `checkAuth()` |
| `logout()` | POSTs to `/api/Auth/logout` with refresh token, clears `localStorage` (token + theme), resets state |
| `checkAuth()` | GETs `/api/Auth/checkauth` with Bearer token, hydrates auth state from response |

**Token storage strategy:**
- `localStorage.token` — JWT access token
- `localStorage.refreshtoken` — Refresh token
- Both sent via `Authorization: Bearer <token>` header AND `credentials: "include"` (cookies).

**Auto-check on mount:** `useEffect(() => checkAuth(), [])` runs on every app load to restore session.

#### `Component/utils/ThemeContext.tsx` — Theme Provider

- Initializes from `localStorage.theme` or falls back to browser's `prefers-color-scheme`.
- Toggles `dark` class on `<html>` element for Tailwind dark mode.
- Sets `document.documentElement.style.colorScheme` for native browser theming.
- Briefly adds `**:transition-none!` class during switch to prevent flash-of-theme-change.
- Exposes `currentTheme` (string) and `changeCurrentTheme(newTheme)` via context.

---

### 6.4 Configuration

#### `config/apiconfig.ts`

Centralizes all API endpoint configuration:

| Export | Type | Description |
|--------|------|-------------|
| `Api_Base_Url` | `string` | Backend base URL: `https://localhost:7085/` |
| `ApiConfig` | `object` | Wraps `Api_Base_Url` for convenient import |
| `NewsApiConfig` | `object` | Alpha Vantage news sentiment API (AAPL ticker) |
| `NewApiConfig` | `PaginatedApiConfig` | FinanceLayer paginated news (stocks, desc sort) |
| `NewsApiConfig2` | `PaginatedApiConfig` | FinanceLayer paginated news (no fallback) |
| `DatabaseFinanceNewsConfig` | `object` | Backend endpoint: `/api/FinanceNews` |
| `DatabaseTodayNewsConfig` | `object` | Backend endpoint: `/api/TodayNews` |

**Pagination helper:**
```typescript
function buildPaginatedUrl(config: PaginatedApiConfig, offset: number): string
```
Appends `?offset=N` or `&offset=N` depending on existing query params.

---

### 6.5 Pages

#### `pages/Auth/Login.tsx` — Login Page

- **Layout:** Split-panel design — form on the left, hero image on the right.
- **Styling:** CSS Modules (`Login.module.css`) for scoped, collision-free styles.
- **Features:**
  - Email & password fields with `useRef` for uncontrolled inputs.
  - Eye/EyeOff toggle for password visibility (via `lucide-react` icons).
  - Client-side validation: empty fields, email format, minimum 6-char password.
  - Toast notifications for all success/error states.
  - Tabbed UI with "Sign In" / "Sign Up" toggle (switches to `Signup` component).
  - Post-login redirect to `/dashboard` with 1.5s delay.

#### `pages/Auth/Signup.tsx` — Registration Page

- **Layout:** Similar split-panel with hero image from `Registerlogo.jpeg`.
- **Styling:** CSS Modules (`Signup.module.css`).
- **Features:**
  - Username + email + password fields.
  - Validation: email format, password ≥ 6 chars, username ≥ 3 chars.
  - POSTs to `/api/Auth/register` via `axios`.
  - Success → clears form + toast; Error → shows server message.
  - "Have any account? Sign In" link to switch back.

#### `pages/Dashboard/dashboard.tsx` — Main Dashboard

- **Role-based rendering:** Cards 01 & 02 only visible to `Admin` or `User` roles.
- **Toolbar:** Filter dropdown + Date picker + "Add View" button.
- **Grid:** 12-column responsive grid (`grid-cols-12`) with 12 dashboard cards.
- **Loading/Unauthorized states:** Full-screen messages.
- **Data attributes:** `data-tour="dashboard-header"`, `data-tour="dashboard-actions"`, `data-tour="dashboard-cards"` for guided tour targeting.

#### `pages/News/News.tsx` — Financial News Hub

Three-tab interface:

| Tab | Component | Data Source |
|-----|-----------|-------------|
| Money Control | `<iframe>` | Embedded `moneycontrol.com` (700px height) |
| Finance News | `FinanceNewsSection` | Backend `/api/FinanceNews` with server-side pagination |
| Today News | `TodayNewsSection` | Backend `/api/TodayNews` with server-side pagination |

**Pagination logic (shared by both sections):**
- Fetches `{ items: Article[], totalItems: number }` from API.
- Page size: 12 articles per page.
- Shows up to 5 page number buttons with prev/next navigation.
- Smooth scroll-to-top on page change via `document.getElementById("main-content").scrollTo()`.
- Skeleton loading states (8 pulse-animated placeholders).
- Error state with "Retry" button.
- Each article rendered via `<NewsComponent>`.

#### `pages/Onboarding/Onboarding.tsx` — Guided Setup

- 4-step visual guide with icons from `lucide-react`:
  1. Explore the System Dashboard
  2. Set Up Your Financial Profile
  3. Link Financial Accounts
  4. Verify Compliance & Reports
- Prominent "Interactive Guided Tour" CTA card with gradient background.
- Clicking "Take Tour" triggers `restartTour("default")` from the tour system.
- Step cards have hover effects and ring highlights on tour-tagged elements.

#### Placeholder Pages

The following pages are scaffolded as minimal components (return `<div><h1>Title</h1></div>`), ready for future implementation:

| Module | Pages |
|--------|-------|
| Dashboard | `main.tsx`, `analytics.tsx`, `ManageAccounts.tsx`, `Report.tsx` |
| Finance | `Cards.tsx`, `Profile.tsx`, `Transaction.tsx`, `Transactiondetail.tsx` |
| Manage Accounts | `Usermanagement.tsx`, `Transactions.tsx`, `Investment.tsx`, `Report.tsx`, `Security.tsx` |
| Settings | `myaccount.tsx`, `resetpassword.tsx`, `notifications.tsx`, `billing.tsx`, `plans.tsx`, `feedback.tsx` |

---

### 6.6 Components

#### `Component/Logout.tsx`
- **Mount-time side effect:** Immediately calls `logout()` from AuthContext.
- Displays "Logging out..." while the async logout completes.
- On success: toast notification + navigate to `/login` after 500ms.
- On failure: error toast, still navigates away.

#### `Component/TourButton.tsx`
- A flexible guided tour trigger with three visual variants:
  - `"icon"` — Compact circular button with compass icon.
  - `"button"` — Full button with gradient background.
  - `"flat"` — Text-only link style.
- Prevents starting multiple tours simultaneously (`if (run) return`).
- Uses `data-tour="tour-restart"` attribute for tour system targeting.
- Animates compass icon (`animate-spin`) when tour is active.

---

### 6.7 Charts

All chart components wrap **Chart.js 4** using the `react-chartjs-2`-style manual approach (direct `new Chart()` on `<canvas>` ref).

#### `ChartjsConfig.jsx` — Global Configuration
- Sets Chart.js defaults: Inter font, tooltip styling (border, no colors, nearest mode, 8px corner radius).
- `chartAreaGradient(ctx, chartArea, colorStops)` — Creates linear gradient fills for chart backgrounds.
- `chartColors` object — Defines theme-aware color tokens (text, grid, backdrop, tooltip) for light/dark mode.

#### Chart Components

| Component | Type | Description |
|-----------|------|-------------|
| `LineChart01.jsx` | Line | Simple single/dual-line chart with area fill |
| `LineChart02.jsx` | Line | Multi-dataset line chart with more configuration |
| `BarChart01.jsx` | Bar | Vertical grouped bar chart |
| `BarChart02.jsx` | Bar | Horizontal bar chart variant |
| `BarChart03.jsx` | Bar | Stacked bar chart |
| `DoughnutChart.jsx` | Doughnut | Circular proportion chart |
| `RealtimeChart.jsx` | Line | Live-updating chart with streaming data |

All charts:
- Are theme-aware (adapt colors for dark mode via `useThemeProvider`).
- Use CSS variables for colors (`getCssVariable('--color-violet-500')`).
- Register only required Chart.js components to reduce bundle size.

---

### 6.8 Dashboard Cards

13 dashboard card components (`DashboardCard01` through `DashboardCard13`) live in `Component/partials/dashboard/`:

| Card | Title | Chart Type | Data |
|------|-------|------------|------|
| 01 | Acme Plus | Line (dual) | Sales data (monthly, 2022–2025) |
| 02 | Acme Advanced | Line (dual) | Revenue metrics |
| 03 | Acme Professional | Line (dual) | Professional tier data |
| 04 | Direct vs Indirect | Bar (grouped) | Channel comparison |
| 05 | Real-time Value | Line | Live-updating stream |
| 06 | (Doughnut) | Doughnut | Category breakdown |
| 07 | Top Channels | Table | Referral data table |
| 08 | Sales Over Time | Bar | Monthly sales bars |
| 09 | (Stacked) | Stacked Bar | Multi-category stacked |
| 10 | Customers | Table | Top customer data |
| 11 | Reasons for Refunds | List | Refund analytics |
| 12 | Recent Activity | Feed | Activity timeline |
| 13 | Income/Expenses | Summary | Financial summary |

Each card:
- Spans responsive grid columns (`col-span-full`, `sm:col-span-6`, `xl:col-span-4`).
- Uses `bg-white dark:bg-gray-800` with `shadow-xs rounded-xl` styling.
- Includes `EditMenu` (three-dot menu) for card actions.
- Charts use gradient fills and theme-aware colors.

---

### 6.9 Dashboard UI Components

Located in `Component/dashboard/components/`:

| Component | Purpose |
|-----------|---------|
| `DateSelect.jsx` | Custom date range selector with dropdown |
| `Datepicker.jsx` | Calendar-based date picker using `react-day-picker` + Radix Popover |
| `DropdownEditMenu.jsx` | Three-dot context menu with custom action items |
| `DropdownFilter.jsx` | Multi-select checkbox filter dropdown |
| `DropdownHelp.jsx` | Help & support links dropdown |
| `DropdownNotifications.jsx` | Notification bell with unread badge + notification list |
| `DropdownProfile.jsx` | User avatar + role display with Settings/Sign Out links |
| `ModalSearch.jsx` | Full-screen search overlay with recent search history |
| `ThemeToggle.jsx` | Sun/Moon icon toggle for dark/light mode |
| `Tooltip.jsx` | Reusable positioned tooltip component |
| `ui/calendar.jsx` | Calendar UI primitive (react-day-picker wrapper) |
| `ui/popover.jsx` | Popover primitive (Radix UI wrapper) |

All dropdowns share a consistent pattern:
1. Toggle state with `useState`.
2. Close on outside click via `useEffect` + `document.addEventListener('click')`.
3. Close on `Escape` key press.
4. Animated enter/leave transitions via the custom `<Transition>` component.

---

### 6.10 News Module

#### `Component/News/NewsComponent.tsx` — Article Card

A reusable card component for displaying news articles:
- **Image handling:** Lazy loading, loading skeleton, error fallback (SVG placeholder).
- **Metadata:** Author, source name, and relative time ago (via `date-fns` `formatDistanceToNow`).
- **Layout:** 16:9 aspect ratio image, title (3-line clamp), description (2-line clamp), "Read More" button.
- **Interactions:** Scale-on-hover image, color-change on title hover.
- **External links:** All links open in new tab with `rel="noopener noreferrer"`.

#### `Component/News/BlogBanners.tsx` — Banner Scraper

A utility component for fetching blog banner images from URLs:
- Textarea input for batch URL entry (one per line, max 50).
- Calls `fetchBanners()` API function.
- Displays results in a responsive grid with success/error states per URL.
- Loading spinner animation.

---

### 6.11 Guided Tour System

Built on **react-joyride** v3 with a custom provider architecture:

#### `tours/TourProvider.tsx` — Central Tour Engine (~25KB)

A comprehensive provider that:
- Manages Joyride `run`, `stepIndex`, and step array state.
- Supports **route-aware steps** — automatically navigates to the correct page when a step requires it.
- Handles `beforeStepPrepare` callbacks (e.g., expanding sidebar groups before highlighting them).
- Supports `scrollToTop` and `scrollTargetSelector` for pre-step scroll positioning.
- Tracks tour completion state.
- Provides `startTour()`, `stopTour()`, `restartTour(tourName)` methods via context.

#### `tours/tourSteps.ts` — Step Definitions

Extends Joyride's `Step` interface with custom fields:

```typescript
interface TourStep extends Step {
  route?: string;                    // Required page path
  scrollTargetSelector?: string;     // Element to scroll into view
  scrollDelay?: number;              // Wait after scroll animation
  scrollToTop?: boolean;             // Scroll content area to top
  beforeStepPrepare?: () => void | Promise<void>;  // DOM preparation
}
```

**Default tour flow (8 steps):**
1. **Sidebar** → Overview of navigation (on `/dashboard`)
2. **Onboarding Link** → Expands sidebar group programmatically
3. **Dashboard Header** → Welcome to dashboard (scrolls to top)
4. **Dashboard Cards** → Financial metrics grid (scrolls cards into view)
5. **Report Generation** → Sidebar report link
6. **Settings** → Sidebar settings link
7. **News Nav** → Header news button
8. **Theme Toggle** → Dark/light mode switch

#### `tours/appTour.ts` — Public API

Exports a `useTourManager()` hook providing a clean control interface:
```typescript
interface TourManager {
  start: (tourName?) => void;
  stop: () => void;
  restart: (tourName?) => void;
  isActive: boolean;
  currentStepIndex: number;
  isCompleted: boolean;
}
```

Supports a `toursRegistry` dictionary for multiple named tours.

---

### 6.12 Library Utilities

#### `lib/blogBannerApi.ts`

API client for the backend banner scraping endpoint:
```typescript
async function fetchBanners(blogUrls: string[]): Promise<BannerResult[]>
```
- POSTs to `/api/Blog/fetch-banners` with `{ urls: string[] }`.
- Includes JWT auth token from `localStorage`.
- Returns array of `BannerResult` with `url`, `imageUrl`, `title`, `description`, `success`, `error`.

#### `lib/utils.js`

Provides the `cn()` utility function combining `clsx` (conditional class names) with `tailwind-merge` (intelligent Tailwind class deduplication):
```javascript
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

### 6.13 Styling

#### Global Styles (`index.css`)
- Imports Tailwind CSS base via `@import "tailwindcss"`.
- Imports custom styles from `css/style.css` and `css/additional-styles/utility-patterns.css`.

#### `css/style.css`
- Custom scrollbar hiding (`.no-scrollbar`).
- Sidebar expansion utilities (`.sidebar-expanded` body class).
- Button base styles.
- Form element theming.

#### `css/additional-styles/utility-patterns.css`
- Reusable CSS patterns and custom utilities.

#### CSS Modules
- `Login.module.css` (~10KB) — Extensive scoped styles for the login page including glassmorphism, gradients, animations.
- `Signup.module.css` (~8KB) — Similar scoped styles for registration.

#### Tailwind Configuration
- **Framework:** Tailwind CSS 4 with `@tailwindcss/forms` plugin.
- **Custom colors:** Slate (50–900), Sky, Amber, Emerald, Red palettes.
- **Custom font sizes:** xs through 3xl with explicit line heights.
- **Content scan:** All `.js`, `.ts`, `.jsx`, `.tsx` files in `src/`.

---

### 6.14 Static Assets

#### `public/` (served at root URL path)
| File | Purpose |
|------|---------|
| `favicon.png` | Browser tab icon (PNG format) |
| `favicon.svg` | Browser tab icon (SVG format) |
| `icons.svg` | SVG icon sprite sheet |

#### `src/assets/` (bundled by Vite)
| File | Size | Used In |
|------|------|---------|
| `Financial.jpeg` | 136 KB | Login page hero image |
| `Registerlogo.jpeg` | 138 KB | Signup page hero image |
| `hero.png` | 13 KB | General hero illustration |
| `image.png` | 29 KB | General purpose image |
| `Demo.mp4` | ~116 MB | Application demo video |
| `react.svg` | 4 KB | React branding |
| `vite.svg` | 8 KB | Vite branding |

---

## 7. API Integration Map

### Backend API (ASP.NET Core — `https://localhost:7085`)

| Endpoint | Method | Used By | Purpose |
|----------|--------|---------|---------|
| `/api/Auth/login` | POST | `AuthContext.login()` | Authenticate user, return JWT + refresh token |
| `/api/Auth/logout` | POST | `AuthContext.logout()` | Invalidate refresh token on server |
| `/api/Auth/checkauth` | GET | `AuthContext.checkAuth()` | Validate current session / token |
| `/api/Auth/register` | POST | `Signup.tsx` | Create new user account |
| `/api/FinanceNews` | GET | `News.tsx` | Paginated finance news articles |
| `/api/TodayNews` | GET | `News.tsx` | Paginated today's news articles |
| `/api/Blog/fetch-banners` | POST | `blogBannerApi.ts` | Scrape banner images from blog URLs |

### External APIs (configured but not actively used in main flow)

| API | Provider | Purpose |
|-----|----------|---------|
| Alpha Vantage | `alphavantage.co` | News sentiment analysis (AAPL ticker) |
| FinanceLayer | `api.apilayer.com` | Financial news aggregation |

---

## 8. Authentication Flow

```
┌──────────┐     POST /api/Auth/login      ┌──────────┐
│  Login   │ ─────────────────────────────→ │ Backend  │
│  Page    │ ← { token, refreshtoken }───── │  API     │
└──────────┘                                └──────────┘
     │
     │ localStorage.setItem("token", jwt)
     │ localStorage.setItem("refreshtoken", rt)
     │
     ▼
┌──────────┐     GET /api/Auth/checkauth    ┌──────────┐
│  Auth    │ ────────── Bearer <jwt> ─────→ │ Backend  │
│ Context  │ ← { isAuthenticated, user, ─── │  API     │
│          │    role, userId }               └──────────┘
└──────────┘
     │
     │ setAuthState({ user, role, userId, isAuthenticated: true })
     │
     ▼
┌──────────────────────────────────────┐
│  ProtectedRoute checks authState     │
│  → isAuthenticated ? <Outlet /> :    │
│    <Navigate to="/" />               │
└──────────────────────────────────────┘
```

**Session Persistence:** On every app load, `checkAuth()` fires in `useEffect`, sending the stored JWT to validate. If valid, the user stays logged in without re-entering credentials.

**Logout Flow:**
1. POST `/api/Auth/logout` with refresh token in body.
2. Clear `localStorage` (token, refreshtoken, theme).
3. Reset `authState` to unauthenticated defaults.
4. Navigate to `/login`.

---

## 9. Theme System (Dark/Light Mode)

```
┌─────────────────┐
│  ThemeProvider   │
├─────────────────┤
│  Initialization: │
│  1. Check localStorage.theme         │
│  2. Fallback: prefers-color-scheme    │
├─────────────────┤
│  On Toggle:      │
│  1. Update state                      │
│  2. Save to localStorage             │
│  3. Add/remove 'dark' class on <html>│
│  4. Set colorScheme CSS property     │
│  5. Suppress transitions briefly     │
├─────────────────┤
│  Consumers:      │
│  • ThemeToggle (Header sun/moon)     │
│  • All Tailwind 'dark:' classes      │
│  • Chart.js theme-aware colors       │
│  • CSS custom properties             │
└─────────────────┘
```

Tailwind's `dark:` variant activates based on the `dark` class on `<html>`, making every `dark:bg-*`, `dark:text-*`, etc. class responsive to the toggle.

---

## 10. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        React App                              │
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────────┐   │
│  │  AuthContext │    │ ThemeContext  │    │  TourProvider  │   │
│  │  (global)    │    │  (global)    │    │   (global)     │   │
│  └──────┬──────┘    └──────┬───────┘    └───────┬────────┘   │
│         │                  │                     │            │
│         ▼                  ▼                     ▼            │
│  ┌──────────────────────────────────────────────────────┐    │
│  │                     App.tsx                           │    │
│  │              (Route Definitions)                      │    │
│  └────────────────────┬─────────────────────────────────┘    │
│                       │                                       │
│         ┌─────────────┼─────────────┐                        │
│         ▼             ▼             ▼                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │ Dashboard │  │  News    │  │ Settings │  ...              │
│  │  Page    │  │  Page    │  │  Pages   │                   │
│  └────┬─────┘  └────┬─────┘  └──────────┘                   │
│       │              │                                        │
│       ▼              ▼                                        │
│  ┌─────────┐   ┌──────────┐                                  │
│  │Dashboard │   │  fetch() │──→ /api/FinanceNews             │
│  │ Cards   │   │  fetch() │──→ /api/TodayNews               │
│  │(Charts) │   └──────────┘                                  │
│  └─────────┘                                                  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
   Backend API (ASP.NET Core @ localhost:7085)
```

---

## 11. Key Design Patterns

### 1. Provider Pattern (Context API)
Three global providers (`Auth`, `Theme`, `Tour`) use React Context for cross-cutting concerns. Each exports a custom hook (`useAuth`, `useThemeProvider`, `useTour`) for clean consumption.

### 2. Compound Layout Pattern
Protected routes use nested `<Route>` elements:
```
ProtectedRoute → MainLayout → [Page]
```
This ensures consistent sidebar/header rendering for all authenticated pages.

### 3. CSS Modules for Auth Pages
Login and Signup use CSS Modules (`.module.css`) for guaranteed style isolation, while the rest of the app uses Tailwind utility classes.

### 4. Render Props Pattern (Sidebar)
`SidebarLinkGroup` uses the render props pattern (`children(handleClick, open)`) to give parent control over expand/collapse behavior.

### 5. Feature-Based Folder Organization
Pages are grouped by feature domain (`Auth/`, `Dashboard/`, `News/`, `finance/`, `settings/`, `manageaccounts/`), making it easy to locate and modify related files.

### 6. Role-Based Conditional Rendering
Dashboard cards are conditionally rendered based on `authState.role`:
```tsx
{(authState.role === "Admin" || authState.role === "User") && <DashboardCard01 />}
```

### 7. Data-Tour Attribute Pattern
UI elements use `data-tour="identifier"` attributes as stable selectors for the guided tour system, decoupled from CSS class names or DOM structure.

### 8. Theme-Aware Charting
Chart.js components dynamically read CSS custom properties (`getCssVariable()`) and adjust colors based on the active theme, ensuring charts look correct in both light and dark mode.

---

> **Document Location:** `Frontend/Document/Frontend_Technical_Summary.md`  
> **Generated by:** Antigravity IDE Agent  
> **Date:** 07 July 2026
