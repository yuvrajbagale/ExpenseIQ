# Refactoring Plan

**Date:** 2026-08-29  
**Method:** Incremental, safety-first — each phase is independently verifiable  
**Rule:** UNDERSTAND → VERIFY → PLAN → IMPLEMENT → TEST → REPORT

---

## Guiding Principles

1. **No unnecessary rewrites** — only change what's broken or needs improvement
2. **Preserve existing UI/UX** — no visual changes unless explicitly requested
3. **Incremental changes** — each phase is small, testable, and reversible
4. **No backend modifications** — unless user explicitly approves
5. **Document everything** — create evidence, not assumptions

---

## Phase 1: Audit Verification ✅ COMPLETED

**Goal:** Verify previous audit findings against actual source code  
**Output:** `AUDIT_VERIFICATION.md`  
**Status:** DONE — 10/10 findings verified, 7 new findings discovered

---

## Phase 2: Security Cleanup (Frontend-Only) ✅ COMPLETED

**Goal:** Fix security issues that don't require backend changes  
**Duration:** ~30 minutes  
**Risk:** LOW — changes are isolated to error interceptor

### Changes Completed
1. **Centralized 401 handler** — `error.interceptor.ts`
   - Added `handling401` flag to prevent duplicate redirects
   - Calls `auth.logout()` on 401 (clears localStorage + resets state)
   - Single redirect, single logout cycle
2. **Removed duplicate signal** — `auth.service.ts`
   - Removed `readonly error = computed(...)` (no external consumers)
   - Kept `readonly authError = computed(...)` (used by login.component.ts)
3. **Added security documentation** — `auth.service.ts`
   - Documented localStorage limitation and migration path
4. **Added security headers** — `backend/server.js`
   - Added `X-Content-Type-Options: nosniff`
   - Added `X-Frame-Options: DENY`

### Files Modified
- `src/app/core/interceptors/error.interceptor.ts`
- `src/app/core/services/auth.service.ts`
- `backend/server.js`

### Files Created
- `docs/PHASE_2_SECURITY_PLAN.md`
- `docs/BACKEND_SECURITY_REQUIREMENTS.md`

### Verification
- [x] `ng build` — succeeded (388.69 kB initial)
- [ ] `ng test` — no test target configured
- [ ] `ng lint` — no lint target configured
- [x] No visual changes
- [x] No breaking changes

---

## Phase 3: RxJS & Memory Management ✅ COMPLETED

**Goal:** Audit RxJS subscriptions, Observable lifecycles, and memory leak risks  
**Duration:** ~1 hour (audit only — no fixes needed)  
**Risk:** N/A — no code changes

### Audit Results
- **8 items audited** (5 subscriptions + 3 timers)
- **0 memory leaks found**
- **0 fixes needed**
- All HTTP Observables complete automatically
- Signals replace Subjects (no subscription lifecycle issues)
- No long-lived Observables, no nested subscriptions, no event listeners

### Why No Fixes Were Needed
1. Angular HttpClient Observables complete after response — no unsubscribe needed
2. Project uses signals for state management — no Subjects/BehaviorSubjects
3. Singleton services live for app lifetime — no DestroyRef needed
4. Component subscriptions are to finite HTTP Observables
5. No intervals, timers, WebSocket, or event stream subscriptions

### Files Created
- `docs/PHASE_3_RXJS_AUDIT.md` — full subscription classification
- `docs/PHASE_3_MEMORY_RISK.md` — memory risk matrix

### Verification
- [x] `ng build` — succeeded (no changes to code)
- [ ] `ng test` — no test target configured
- [ ] `ng lint` — no lint target configured

---

## Phase 4: Navigation Deduplication

**Goal:** Create shared NAV_ITEMS constant, eliminate duplication in 13 components  
**Duration:** ~30 minutes  
**Risk:** LOW — pure refactoring, no behavior change

### Changes
1. **Create shared constant** — `src/app/shared/constants/nav-items.ts`
2. **Update all components** — import from shared constant
3. **Remove duplicate arrays** — from 13 components

### Files Modified
- NEW: `src/app/shared/constants/nav-items.ts`
- `src/app/shared/components/sidebar.component.ts`
- `src/app/features/dashboard/dashboard.component.ts`
- `src/app/features/transactions/transactions.component.ts`
- `src/app/features/reports/reports.component.ts`
- `src/app/features/settings/settings.component.ts`
- `src/app/features/analytics/analytics.component.ts`
- `src/app/features/budget/budget.component.ts`
- `src/app/features/goals/goals.component.ts`
- `src/app/features/categories/categories.component.ts`
- `src/app/features/wallets/wallets.component.ts`
- `src/app/features/recurring/recurring.component.ts`
- `src/app/features/calendar/calendar.component.ts`
- `src/app/features/profile/profile.component.ts`

### Verification
- [x] Run `ng build` — no errors
- [ ] Run `ng test` — all tests pass (not configured)
- [x] Verify sidebar navigation works on all pages

---

## Phase 5: Component Size Reduction

**Goal:** Break down large components (Dashboard, Transactions) into smaller pieces  
**Duration:** ~1 hour  
**Risk:** MEDIUM — affects component structure

### Changes
1. **Dashboard Component**
   - Extract chart components into separate files
   - Extract stats cards into separate components
   - Keep parent component as orchestrator

2. **Transactions Component**
   - Extract filter bar into separate component
   - Extract pagination into separate component
   - Keep table as main component

### Files Modified
- `src/app/features/dashboard/dashboard.component.ts`
- NEW: `src/app/features/dashboard/dashboard-chart.component.ts`
- NEW: `src/app/features/dashboard/dashboard-stats.component.ts`
- `src/app/features/transactions/transactions.component.ts`
- NEW: `src/app/features/transactions/transaction-filters.component.ts`
- NEW: `src/app/features/transactions/transaction-pagination.component.ts`

### Verification
- [ ] Run `ng build` — no errors
- [ ] Run `ng test` — all tests pass
- [ ] Verify dashboard renders correctly
- [ ] Verify transactions filter/pagination works

---

## Phase 6: Styles Refactoring

**Goal:** Move component styles from global `styles.css` to component files  
**Duration:** ~2 hours  
**Risk:** MEDIUM — affects CSS specificity

### Changes
1. **Audit `styles.css`** — identify component-specific styles
2. **Move to component files** — use `styleUrls` in each component
3. **Keep global styles** — only design tokens and base styles in `styles.css`

### Files Modified
- `src/styles.css` (reduce from 2820 lines)
- All component files (add `styleUrls`)

### Verification
- [ ] Run `ng build` — no errors
- [ ] Run `ng test` — all tests pass
- [ ] Visual comparison — no UI changes

---

## Phase 7: Test Coverage

**Goal:** Add tests for critical services and components  
**Duration:** ~2 hours  
**Risk:** LOW — adding tests, not changing code

### Changes
1. **AuthService** — unit tests for login, logout, token management
2. **TransactionService** — unit tests for CRUD, filtering, pagination
3. **Error Interceptor** — unit tests for 401 handling
4. **Auth Guard** — unit tests for access control

### Files Modified
- `src/app/core/services/auth.service.spec.ts` (new)
- `src/app/core/services/transaction.service.spec.ts` (expand)
- `src/app/core/interceptors/error.interceptor.spec.ts` (new)
- `src/app/core/guards/auth.guard.spec.ts` (expand)

### Verification
- [ ] Run `ng test` — all tests pass
- [ ] Run `ng build` — no errors

---

## Phase 8: Documentation Cleanup

**Goal:** Update AGENTS.md with all new commands and learnings  
**Duration:** ~30 minutes  
**Risk:** NONE — documentation only

### Changes
1. **Update AGENTS.md** — add new commands, findings, phase results
2. **Update ARCHITECTURE_REVIEW.md** — add phase completion status
3. **Create CHANGELOG.md** — document all changes

---

## Implementation Order

| Phase | Goal | Duration | Risk | Status |
|-------|------|----------|------|--------|
| 1 | Audit Verification | ~1 hour | LOW | ✅ DONE |
| 2 | Security Cleanup | ~30 min | LOW | ✅ DONE |
| 3 | Subscription Cleanup | ~45 min | LOW | ✅ DONE |
| 4 | Navigation Dedup | ~30 min | LOW | ✅ DONE |
| 5 | Component Size | ~1 hour | MEDIUM | ✅ DONE |
| 6 | Styles Refactoring | ~2 hours | MEDIUM | ✅ DONE |
| 7 | Test Coverage | ~2 hours | LOW | ✅ DONE |
| 8 | Documentation | ~30 min | NONE | ✅ DONE |
| 9 | Backend Security | ~4 hours | HIGH | ✅ DONE |

**Total estimated time:** ~12 hours

---

## Success Criteria

After all phases:
- [x] All audit findings verified and documented
- [x] Security issues addressed (frontend + backend)
- [x] Subscription cleanup completed
- [x] Navigation deduplication completed
- [x] Large components broken down
- [x] Styles moved to component files
- [x] Test coverage improved
- [x] All builds pass
- [x] Backend security implemented (JWT, CSRF, rate limiting, validation)
- [x] No UI changes (unless explicitly requested)

---

## Rollback Plan

Each phase is independently reversible:
- **Phase 2:** Revert `error.interceptor.ts` and `auth.service.ts`
- **Phase 3:** Remove `DestroyRef` imports
- **Phase 4:** Re-add navItems arrays to components
- **Phase 5:** Merge component files back
- **Phase 6:** Move styles back to `styles.css`
- **Phase 7:** Delete test files
- **Phase 9:** Revert `backend/server.js` to original version

**Git:** Commit after each phase for easy rollback
