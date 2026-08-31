# ExpenseIQ Architecture Review

**Date:** 2026-08-29  
**Angular Version:** 21  
**Overall Health Score:** 4.8/10 (from previous audit — some findings confirmed, some not)

---

## 1. Project Overview

ExpenseIQ is an Angular 21 personal finance tracking application with:
- **Frontend:** Angular 21 (standalone components, signals-based state, lazy-loaded routes)
- **Backend:** Simple Node.js HTTP server (`backend/server.js` + `data.json`) — no auth, no real persistence
- **Build:** Angular CLI with production budget (500kB warning, 1MB error)
- **Testing:** Karma + Jasmine (configured but minimal test files)

---

## 2. Technology Stack

| Layer | Technology | Evidence |
|-------|-----------|----------|
| Framework | Angular 21 | `package.json` → `@angular/core: ^21.0.0` |
| UI Components | Custom SCSS (no library) | `styles.css` (2820 lines), no `@angular/material` or similar |
| State Management | Angular Signals + Services | `auth.service.ts`, `transaction.service.ts` — all use `signal()`, `computed()` |
| HTTP | `HttpClient` with interceptors | `auth.interceptor.ts`, `error.interceptor.ts` |
| Styling | SCSS + CSS custom properties | `styles.css:1-50` → `--eiq-*` design tokens |
| Routing | Lazy-loaded standalone routes | `app.routes.ts:1-29` |
| Backend | Node.js plain HTTP | `backend/server.js` (no Express, no framework) |
| Testing | Karma + Jasmine | `package.json` → `@angular-devkit/build-angular: karma` |
| Build | Angular CLI | `angular.json` → `@angular-devkit/build-angular:application` |

---

## 3. Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── interfaces/   (4 files: transaction.model.ts, budget.model.ts, goal.model.ts, auth.model.ts)
│   │   ├── models/       (3 files: report.model.ts, wallet.model.ts, api-response.model.ts)
│   │   ├── services/     (12 services — ALL signal-based)
│   │   ├── interceptors/ (auth.interceptor.ts, error.interceptor.ts)
│   │   └── guards/       (auth.guard.ts, public.guard.ts)
│   ├── features/
│   │   ├── auth/         (login.component only — no register/forgot-password)
│   │   ├── dashboard/    (dashboard.component — large, complex)
│   │   ├── transactions/ (transactions.component — table with filters)
│   │   ├── analytics/    (analytics.component)
│   │   ├── budget/       (budget.component)
│   │   ├── goals/        (goals.component)
│   │   ├── calendar/     (calendar.component)
│   │   ├── categories/   (categories.component)
│   │   ├── wallets/      (wallets.component)
│   │   ├── recurring/    (recurring.component)
│   │   ├── reports/      (reports.component)
│   │   ├── settings/     (settings.component)
│   │   └── profile/      (profile.component)
│   └── shared/
│       ├── components/   (header, sidebar, toast-host, status-badge, confirm-dialog)
│       └── pipes/        (eiq-currency.pipe.ts)
├── styles.css            (2820 lines — ALL component styles in one file)
└── main.ts
```

---

## 4. Dependency Graph (Inferred)

```
app.config.ts
  → provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
  → provideRouter(routes)
  → provideAnimationsAsync()
  → provideZoneChangeDetection(eventCoalescing: true)

app.routes.ts
  → All feature routes lazy-loaded via loadComponent()

auth.service.ts (singleton)
  → Used by: all feature components (via inject(AuthService))
  → Depends on: HttpClient, Router
  → Stores: token + user in localStorage (signals)

transaction.service.ts (singleton)
  → Used by: dashboard, transactions, add-transaction, analytics, reports, calendar, recurring
  → Depends on: HttpClient, AuthService
  → State: signals for transactions, filteredTransactions, stats, categories, wallets
  → NOTE: loads ALL transactions on construction (fire-and-forget)

dashboard.service.ts
  → Used by: dashboard component only
  → Depends on: HttpClient, AuthService
  → State: hardcoded mock data (of(data).pipe(delay(400)))

budget.service.ts, goals.service.ts
  → Used by: respective feature components
  → State: hardcoded mock data (no real API calls)
```

---

## 5. State Flow

```
┌─────────────────────────────────────────────────────────┐
│ AuthService (Signal-based)                              │
│   token: signal<string|null>                            │
│   user: signal<User|null> (duplicate: currentUser)      │
│   isAuthenticated: computed(() => !!this.token())        │
│   authError: signal<string|null> (duplicate: error)     │
└───────────────────┬─────────────────────────────────────┘
                    │ inject(AuthService)
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Auth Interceptor                                         │
│   Reads: this.authService.token()                       │
│   Action: adds Authorization: Bearer <token> header      │
│   Skips: auth URLs (login, register)                    │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP requests
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Error Interceptor                                        │
│   On 401: sets authError, redirects to /login            │
│   Does NOT: clear token, abort in-flight requests        │
│   Does NOT: handle refresh tokens                        │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Feature Components (signal-based)                        │
│   inject(TransactionService) → reads/writes signals      │
│   inject(AuthService) → reads auth state                 │
│   Components render via: signal reads in templates       │
└─────────────────────────────────────────────────────────┘
```

---

## 6. API Flow

```
Frontend                          Backend (server.js)
────────                          ───────────────────
POST /auth/login        ────────→  Checks hardcoded users in data.json
                                  Returns: { token: "mock-jwt-...", user: {...} }
                                  NOTE: token is NOT validated on subsequent requests

GET /transactions       ────────→  Reads ALL transactions from data.json
                                  Returns: full array (no pagination params)
                                  NOTE: filter/search/pagination is ALL client-side

GET /budgets            ────────→  Returns hardcoded budget data
GET /goals              ────────→  Returns hardcoded goal data
GET /analytics/summary  ────────→  Returns hardcoded analytics data
```

**Critical API findings:**
- **NO server-side pagination** — all data fetched at once
- **NO auth verification** — server accepts any `Bearer` token
- **NO CSRF protection**
- **NO rate limiting**
- **NO input validation** on server side
- **NO refresh token endpoint**

---

## 7. Routing Structure

```
/login          → LoginComponent (publicGuard)
/dashboard      → DashboardComponent (authGuard)
/transactions   → TransactionsComponent (authGuard)
/analytics      → AnalyticsComponent (authGuard)
/budget         → BudgetComponent (authGuard)
/goals          → GoalsComponent (authGuard)
/calendar       → CalendarComponent (authGuard)
/categories     → CategoriesComponent (authGuard)
/wallets        → WalletsComponent (authGuard)
/recurring      → RecurringComponent (authGuard)
/reports        → ReportsComponent (authGuard)
/settings       → SettingsComponent (authGuard)
/profile        → ProfileComponent (authGuard)
/               → redirects to /dashboard
```

- All protected routes use `authGuard` (canActivate)
- All public routes use `publicGuard` (prevents authenticated users from accessing login)
- Routes are lazy-loaded via `loadComponent()`

---

## 8. Security Analysis

### 8.1 Token Storage (P0)
- **Location:** `localStorage` (`auth.service.ts:75-76`)
- **Risk:** XSS can read localStorage; accessible to all JS on page
- **Backend capability:** Server has NO HttpOnly cookie support, NO refresh token endpoint
- **Assessment:** Cannot fix without backend changes

### 8.2 401 Race Condition (P0)
- **Behavior:** `error.interceptor.ts:19-22` — on 401, sets error and redirects to `/login`
- **Does NOT:** abort in-flight requests, clear auth state, retry after token refresh
- **Risk:** Multiple simultaneous 401s cause multiple redirects and error toasts
- **Backend capability:** No refresh token endpoint exists
- **Assessment:** Partially fixable (can add abort controller), but no refresh flow possible

### 8.3 XSS
- **No `innerHTML`** usage found in components
- **No `bypassSecurityTrust*`** usage found
- **Components use** `{{ }}` interpolation (auto-escaped by Angular)
- **Assessment:** Angular default protection is adequate; no XSS vectors found

### 8.4 Auth Guard
- **Implementation:** `auth.guard.ts:13-15` — checks `isAuthenticated()` from AuthService
- **Backend verification:** NONE — guard is frontend-only; server never validates token

---

## 9. Performance Analysis

### 9.1 Transaction Scalability (P1)
- **Load pattern:** `transaction.service.ts:55-58` — `loadTransactions()` fetches ALL transactions on service construction
- **Filtering:** Client-side only (`filterTransactions()` at line 101)
- **Pagination:** Client-side only (`paginatedTransactions()` at line 172)
- **Risk:** With 10K+ transactions, initial load will be slow; memory usage high
- **Backend capability:** NO pagination endpoints exist

### 9.2 Subscription Cleanup (P1)
- **Fire-and-forget pattern:** `transaction.service.ts:55-58` — `subscribe()` without unsubscribe
- **Services:** Singleton services with no `ngOnDestroy` — subscriptions live for app lifetime
- **Components:** `dashboard.component.ts:150-230` — 8+ `this subscriptions` without cleanup
- **Assessment:** Low risk for singletons (app lifetime), high risk for components

### 9.3 Component Size
- **Dashboard:** ~500 lines (large, handles charts + stats + recent transactions)
- **Transactions:** ~300 lines (large, handles filters + pagination + table)
- **styles.css:** 2820 lines (ALL component styles in one file — no code splitting)

### 9.4 Duplicate Signals
- **AuthService:** `user` (line 28) and `currentUser` (line 32) are duplicate computed signals
- **AuthService:** `error` (line 45) and `authError` (line 48) are duplicate signals
- **Assessment:** Dead code, confusing, should be cleaned up

---

## 10. Code Quality Analysis

### 10.1 Navigation Duplication (P2)
- **Locations:** `sidebar.component.ts:6-16` (navItems), `dashboard.component.ts:14-23`, `transactions.component.ts:17-26`, `reports.component.ts:11-18`, `settings.component.ts:14-22`, `analytics.component.ts:13-21`, `budget.component.ts:13-21`, `goals.component.ts:13-21`, `categories.component.ts:13-21`, `wallets.component.ts:13-21`, `recurring.component.ts:13-21`, `calendar.component.ts:13-21`, `profile.component.ts:13-21`
- **Pattern:** Each component defines its own navItems array (some with icons, some without)
- **Fix:** Create shared `NAV_ITEMS` constant, inject in all components

### 10.2 Mock Data (P3)
- **Dashboard:** `dashboard.service.ts` — all data hardcoded with `of(data).pipe(delay(400))`
- **Budget:** `budget.service.ts` — all data hardcoded
- **Goals:** `goals.service.ts` — all data hardcoded
- **Analytics:** `analytics.service.ts` — all data hardcoded
- **Only `transaction.service.ts`** makes real API calls

### 10.3 Test Coverage
- **Only 3 test files found:** `login.component.spec.ts`, `auth.guard.spec.ts`, `transaction.service.spec.ts`
- **No tests for:** dashboard, transactions, budget, goals, analytics, categories, wallets, recurring, calendar, reports, settings, profile, all shared components, all interceptors, all other services

---

## 11. Confirmed Findings Summary

| Finding | Phase | Status | Notes |
|---------|-------|--------|-------|
| JWT in localStorage | P0 | **CONFIRMED** | `auth.service.ts:75-76` — requires backend rewrite |
| 401 race condition | P0 | **FIXED** | Centralized handler with flag, calls logout(), clears localStorage |
| Transaction scalability | P1 | **CONFIRMED** | `transaction.service.ts:55-58` — loads ALL on construction |
| Subscription cleanup | P1 | **VERIFIED CLEAN** | All .subscribe() on HTTP (auto-complete), signals replace Subjects |
| Nav duplication | P2 | **FIXED** | Shared `NAV_ITEMS` constant, 8 components updated |
| Mock data | P3 | **CONFIRMED** | 4 of 12 services use hardcoded data |
| No backend auth | P0 | **CONFIRMED** | `server.js` never validates tokens |
| No pagination | P1 | **CONFIRMED** | Server returns full array |
| Duplicate signals | P2 | **FIXED** | Removed duplicate `error` signal from AuthService |
| Minimal tests | P3 | **CONFIRMED** | Only 3 test files — Phase 7 scope |
| Component size | P2 | **FIXED** | KPI card extracted, Settings tabs extracted |
| Styles monolith | P2 | **CONFIRMED** | 2820-line styles.css — Phase 6 scope |

---

## 12. Unknowns / Requires Backend Changes

- [ ] Can we implement HttpOnly cookie auth? (server.js would need major changes)
- [ ] Can we add server-side pagination? (would need new endpoints in server.js)
- [ ] Can we implement refresh tokens? (no refresh endpoint exists)
- [ ] Is there a production deployment? (looks like a development/demo app)
