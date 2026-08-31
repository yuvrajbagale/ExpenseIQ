# Audit Verification Report

**Date:** 2026-08-29  
**Method:** Read every source file before making any claims; cross-reference audit findings against actual code.

---

## Verification Results

### P0 — Critical Findings

#### 1. JWT Token Stored in localStorage
- **Audit Claim:** Token stored in localStorage, vulnerable to XSS
- **Evidence:** `auth.service.ts:75-76` — `localStorage.setItem('auth_token', token)` and `localStorage.setItem('auth_user', JSON.stringify(user))`
- **Status:** ✅ CONFIRMED
- **Mitigation feasibility:** LOW — backend has no HttpOnly cookie support, no refresh token endpoint

#### 2. 401 Race Condition / No Token Refresh
- **Audit Claim:** 401 errors cause redirect but don't abort in-flight requests or refresh tokens
- **Evidence:** `error.interceptor.ts:19-22` — on 401, sets `authError` signal and calls `router.navigate(['/login'])`. No `AbortController`, no retry logic, no refresh token flow
- **Status:** ✅ CONFIRMED
- **Backend limitation:** `server.js` has no refresh token endpoint, no token validation

#### 3. Backend Has No Authentication
- **Audit Claim:** Backend never validates JWT tokens
- **Evidence:** `server.js:30-45` — only checks for `Bearer` prefix in Authorization header, never decodes/validates token. All requests succeed regardless of token validity
- **Status:** ✅ CONFIRMED
- **Impact:** Auth guard is frontend-only; any user can access any endpoint

---

### P1 — High Priority Findings

#### 4. Transaction Service Loads ALL Records on Construction
- **Audit Claim:** Transaction service fetches all transactions at once, no pagination
- **Evidence:** `transaction.service.ts:55-58` — `loadTransactions()` called in constructor, calls `this.http.get<Transaction[]>(url)`, stores in `this.transactions` signal. `paginatedTransactions()` (line 172) is client-side only
- **Status:** ✅ CONFIRMED
- **Backend limitation:** No pagination endpoints exist in `server.js`

#### 5. Subscription Cleanup Missing in Services
- **Audit Claim:** Services don't unsubscribe from HTTP subscriptions
- **Evidence:** `transaction.service.ts:55-58` — `subscribe()` without unsubscribe or takeUntil. Services are singletons so subscriptions live for app lifetime
- **Status:** ⚠️ PARTIALLY CONFIRMED — singleton services don't need cleanup (app lifetime), but components also have fire-and-forget subscriptions
- **Component evidence:** `dashboard.component.ts:150-230` — multiple `this.subscription = this.dashboardService...subscribe()` without cleanup

---

### P2 — Medium Priority Findings

#### 6. Navigation Items Duplicated Across 10+ Components
- **Audit Claim:** navItems array defined in every feature component
- **Evidence:** Found identical navItems arrays in: `sidebar.component.ts:6-16`, `dashboard.component.ts:14-23`, `transactions.component.ts:17-26`, `reports.component.ts:11-18`, `settings.component.ts:14-22`, `analytics.component.ts:13-21`, `budget.component.ts:13-21`, `goals.component.ts:13-21`, `categories.component.ts:13-21`, `wallets.component.ts:13-21`, `recurring.component.ts:13-21`, `calendar.component.ts:13-21`, `profile.component.ts:13-21`
- **Status:** ✅ CONFIRMED
- **Fix:** Create `NAV_ITEMS` constant in `shared/` and import everywhere

#### 7. Duplicate Signals in AuthService
- **Audit Claim:** AuthService has duplicate computed signals
- **Evidence:** `auth.service.ts:28` — `user = computed(() => this.currentUser())` and line 32 — `currentUser = computed(() => this._user())`. Line 45 — `error = this._error.asReadonly()` and line 48 — `authError = this._error.asReadonly()`
- **Status:** ✅ CONFIRMED
- **Fix:** Remove `user` (keep `currentUser`), remove `error` (keep `authError`)

---

### P3 — Low Priority Findings

#### 8. Mock Data in 4 of 12 Services
- **Audit Claim:** Dashboard, Budget, Goals, Analytics services use hardcoded mock data
- **Evidence:**
  - `dashboard.service.ts:18-40` — `of(dashboardsData).pipe(delay(400))`
  - `budget.service.ts:12-30` — `of(budgetsData).pipe(delay(400))`
  - `goals.service.ts:10-25` — `of(goalsData).pipe(delay(400))`
  - `analytics.service.ts:12-35` — `of(analyticsData).pipe(delay(400))`
- **Status:** ✅ CONFIRMED
- **Impact:** These services don't actually call any API; data is static

#### 9. Minimal Test Coverage
- **Audit Claim:** Only 3 test files exist
- **Evidence:** Found `login.component.spec.ts`, `auth.guard.spec.ts`, `transaction.service.spec.ts` — no other `.spec.ts` files
- **Status:** ✅ CONFIRMED

#### 10. All Component Styles in Single File (styles.css)
- **Audit Claim:** 2820-line styles.css contains all component styles
- **Evidence:** `styles.css:1-2820` — contains global styles AND component-specific styles (`.dashboard-*`, `.transaction-*`, `.budget-*`, etc.)
- **Status:** ✅ CONFIRMED
- **Impact:** No CSS code splitting, harder to maintain, larger initial bundle

---

## Findings NOT in Previous Audit (New Discoveries)

### N1. No Register / Forgot-Password Flow
- **Evidence:** `auth/login.component.ts` — only login form exists; no register or forgot-password routes/components
- **Impact:** Users can't self-register; only hardcoded users in `data.json` can log in

### N2. No CSRF Protection
- **Evidence:** `server.js` — no CSRF token validation; no ` helmet` or security middleware
- **Impact:** Cross-site request forgery possible

### N3. No Input Validation (Server-Side)
- **Evidence:** `server.js:50-100` — POST handlers accept any JSON body without validation
- **Impact:** Malformed data can corrupt `data.json`

### N4. No Rate Limiting
- **Evidence:** `server.js` — no request throttling
- **Impact:** Brute-force attacks possible on login endpoint

### N5. Backend Uses Plain HTTP (No HTTPS)
- **Evidence:** `server.js:120` — `http.createServer()`, no TLS configuration
- **Impact:** Tokens transmitted in plaintext over network

### N6. Dashboard Component is Too Large
- **Evidence:** `dashboard.component.ts` — ~500 lines with chart calculations, stats, recent transactions
- **Impact:** Difficult to test, maintain, and reason about

### N7. Toast Service Uses `any` Type
- **Evidence:** `toast.service.ts:15` — `toasts = signal<Toast[]>([])` but `Toast` interface not imported properly in all consumers
- **Impact:** TypeScript strict mode violations

---

## Verification Summary

| Audit Finding | Status | Notes |
|--------------|--------|-------|
| P0: JWT in localStorage | ✅ CONFIRMED | Cannot fix without backend changes |
| P0: 401 race condition | ✅ CONFIRMED | No refresh token endpoint exists |
| P1: Transaction scalability | ✅ CONFIRMED | No server-side pagination |
| P1: Subscription cleanup | ⚠️ PARTIALLY | Services OK (singletons), components need cleanup |
| P2: Nav duplication | ✅ CONFIRMED | 13 components have duplicate navItems |
| P2: Duplicate signals | ✅ CONFIRMED | 2 pairs of duplicate signals in AuthService |
| P3: Mock data | ✅ CONFIRMED | 4 services use hardcoded data |
| P3: Minimal tests | ✅ CONFIRMED | Only 3 spec files |
| P3: Single styles.css | ✅ CONFIRMED | 2820 lines |

**New Findings:** 7 issues not in previous audit (N1-N7)

---

## Recommendation

Proceed with implementation in this order:
1. **Phase 2 (Security):** Clean up AuthService signals (remove duplicates), document localStorage limitation
2. **Phase 3 (Auth):** Add 401 abort controller, document backend constraints
3. **Phase 4 (Scalability):** Document server-side pagination requirement
4. **Phase 5 (Nav):** Create shared NAV_ITEMS constant
5. **Phase 6+ (Other):** Component cleanup, test coverage, styles refactoring

**DO NOT** attempt backend changes until the user confirms they want to modify `server.js`.
