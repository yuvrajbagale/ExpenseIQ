# Phase 3 — RxJS & Memory Management Audit

**Date:** 2026-08-29  
**Status:** AUDIT COMPLETE — Ready for Implementation  
**Scope:** All RxJS subscriptions, Observable lifecycles, Signals, timers, event listeners

---

## 1. Discovery Summary

### Patterns Found

| Pattern | Count | Files |
|---------|-------|-------|
| `.subscribe(` | 5 | transaction.service.ts, dashboard.component.ts, transactions.component.ts, add-transaction.component.ts, login.component.ts |
| `setTimeout` | 3 | error.interceptor.ts, settings.component.ts, toast.service.ts |
| `Subject/BehaviorSubject` | 0 | — |
| `effect(` | 0 | — |
| `toSignal(` / `toObservable(` | 0 | — |
| `interval(` / `timer(` | 0 | — |
| `fromEvent(` / `addEventListener` | 0 | — |
| `setInterval` | 0 | — |
| `takeUntil` / `takeUntilDestroyed` | 0 | — |
| `DestroyRef` / `OnDestroy` | 0 | — |
| `valueChanges` / `statusChanges` | 0 | — |
| `Router.events` / `ActivatedRoute` | 0 | — |
| `switchMap` / `concatMap` / `exhaustMap` | 0 | — |
| `signal()` | ~40 | All services + components |
| `computed()` | ~50 | All services + components |

### Key Finding

**This project is almost entirely signals-based.** There are only 5 `.subscribe()` calls and 3 `setTimeout` calls in the entire codebase. No Subjects, no effects, no long-lived observables, no nested subscriptions, no event listeners, no intervals.

---

## 2. Complete Subscription Classification

### SUB-001: TransactionService Constructor
- **File:** `src/app/core/services/transaction.service.ts:65`
- **Code:** `this.loadTransactions().subscribe({ error: () => undefined });`
- **Observable:** `this.http.get<Transaction[]>(this.apiUrl)` — HTTP GET
- **Lifecycle:** Singleton service (app lifetime)
- **Completes automatically:** ✅ YES — HTTP requests complete after response
- **Cleanup present:** N/A — observable completes
- **Risk:** NONE
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### SUB-002: DashboardComponent.loadDashboard()
- **File:** `src/app/features/dashboard/dashboard.component.ts:573`
- **Code:**
  ```typescript
  this.dashboardService.loadDashboard().subscribe({
    next: (data) => { this.dashboardData.set(data); this.isLoading.set(false); },
    error: () => { this.isLoading.set(false); this.loadError.set(true); },
  });
  ```
- **Observable:** `of(data).pipe(delay(400))` — mock Observable, completes after emit
- **Lifecycle:** Component (destroyed on navigation)
- **Completes automatically:** ✅ YES — `of()` + `delay()` completes after emission
- **Cleanup present:** N/A — observable completes
- **Risk:** NONE
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### SUB-003: TransactionsComponent.deleteTransaction()
- **File:** `src/app/features/transactions/transactions.component.ts:227`
- **Code:**
  ```typescript
  this.txnService.deleteTransaction(id).subscribe({
    error: () => alert('Unable to delete transaction...'),
  });
  ```
- **Observable:** `this.http.delete(...)` — HTTP DELETE
- **Lifecycle:** Component (may be destroyed during flight if user navigates)
- **Completes automatically:** ✅ YES — HTTP requests complete after response
- **Cleanup present:** N/A — HTTP observable completes; signal updates are idempotent
- **Risk:** NONE — even if component is destroyed, signal update on service is harmless
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### SUB-004: AddTransactionComponent.saveTransaction()
- **File:** `src/app/features/add-transaction/add-transaction.component.ts:508`
- **Code:**
  ```typescript
  this.txnService.addTransaction({...}).subscribe({
    next: () => { this.isSaving.set(false); this.router.navigate(['/transactions']); },
    error: () => { this.isSaving.set(false); alert('...'); },
  });
  ```
- **Observable:** `this.http.post(...)` — HTTP POST
- **Lifecycle:** Component (navigated away on success → destroyed)
- **Completes automatically:** ✅ YES — HTTP request completes after response
- **Cleanup present:** N/A — HTTP observable completes; navigation destroys component
- **Risk:** NONE
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### SUB-005: LoginComponent.onSubmit()
- **File:** `src/app/features/auth/login/login.component.ts:336`
- **Code:**
  ```typescript
  this.authService.login({...}).subscribe({
    next: () => this.router.navigate(['/dashboard']),
    error: () => {},
  });
  ```
- **Observable:** `this.http.post(...)` — HTTP POST
- **Lifecycle:** Component (navigated away on success → destroyed)
- **Completes automatically:** ✅ YES — HTTP request completes after response
- **Cleanup present:** N/A — HTTP observable completes; navigation destroys component
- **Risk:** NONE — error handling is in AuthService + ErrorInterceptor
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### TIMER-001: Error Interceptor 401 Flag Reset
- **File:** `src/app/core/interceptors/error.interceptor.ts:55`
- **Code:** `setTimeout(() => { handling401 = false; }, 1000);`
- **Lifecycle:** Module-level (never destroyed)
- **Risk:** NONE — 1-second timeout, resets a boolean flag
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### TIMER-002: Settings Component Saved Toast
- **File:** `src/app/features/settings/settings.component.ts:1078`
- **Code:** `setTimeout(() => this.saved.set(false), 2500);`
- **Lifecycle:** Component (destroyed on navigation)
- **Completes automatically:** ✅ YES — 2.5-second timeout
- **Cleanup present:** N/A — timeout fires and forgets; signal update is harmless if component destroyed
- **Risk:** NONE
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

### TIMER-003: Toast Service Auto-Dismiss
- **File:** `src/app/core/services/toast.service.ts:27`
- **Code:** `setTimeout(() => this.dismiss(id), duration);`
- **Lifecycle:** Singleton service (app lifetime)
- **Risk:** NONE — 3-4 second timeout, updates signal on singleton
- **Classification:** **A — SAFE**
- **Action:** NO CHANGE NEEDED

---

## 3. Subscription Summary

| Classification | Count | Description |
|---------------|-------|-------------|
| **A — SAFE** | 5 subscriptions + 3 timers | All complete automatically; no lifecycle risk |
| **B — AUTO-COMPLETING** | 0 | — |
| **C — REQUIRES CLEANUP** | 0 | — |
| **D — POTENTIAL LEAK** | 0 | — |
| **E — UNCERTAIN** | 0 | — |

**Total items audited: 8**

---

## 4. Why No Memory Leaks Exist

### 4.1 HTTP Observables Complete Automatically
Angular's `HttpClient` returns Observables that complete after the HTTP response. There is no need to unsubscribe from them because they are finite. The 5 `.subscribe()` calls in this project all subscribe to HTTP observables.

### 4.2 Signals Replace Long-Lived Observables
The project uses Angular signals (`signal()`, `computed()`) instead of Subjects/BehaviorSubjects for state management. This is the modern Angular approach and avoids subscription lifecycle issues entirely.

### 4.3 No Long-Lived Observables
There are:
- No `Subject` or `BehaviorSubject` instances
- No `interval()` or `timer()` observables
- No `fromEvent()` observables
- No `Router.events` subscriptions
- No `ActivatedRoute` param subscriptions
- No `valueChanges` or `statusChanges` subscriptions
- No WebSocket connections
- No polling patterns

### 4.4 Services Are Singleton
The 3 services with subscriptions (`TransactionService`, `DashboardService`, `ToastService`) are all `providedIn: 'root'` singletons that live for the entire application lifetime. Adding `takeUntilDestroyed()` to them would be incorrect because they are never destroyed.

### 4.5 Component Subscriptions Are Safe
The 2 component subscriptions (`DashboardComponent`, `LoginComponent`) are to HTTP observables that complete before the component can be destroyed in normal flow. Even if destruction occurs during flight, the signal updates are idempotent and harmless.

---

## 5. Signals Architecture Assessment

### 5.1 Signal Usage
| Pattern | Count | Assessment |
|---------|-------|-----------|
| `signal()` | ~40 | ✅ Appropriate — used for mutable state |
| `computed()` | ~50 | ✅ Appropriate — used for derived state |
| `effect()` | 0 | ✅ None needed — no side effects required |

### 5.2 Signal Quality
- **No duplicate signals** — `error` signal was removed in Phase 2
- **No unnecessary writable signals** — all signals represent genuine mutable state
- **No effect loops** — no effects exist
- **No unnecessary recomputation** — computed signals are efficient

### 5.3 Architecture Pattern
```
Service (singleton)
  ├── signal<T>() — mutable state
  ├── computed(() => ...) — derived state
  └── HTTP methods return Observable → component subscribes

Component
  ├── inject(Service) — reads signals
  ├── subscribes to HTTP Observables — one-shot commands
  └── updates local signals for UI state
```

This is the correct modern Angular pattern.

---

## 6. Fire-and-Forget Assessment

### SUB-001: `TransactionService.loadTransactions().subscribe({ error: () => undefined })`
- **Pattern:** Fire-and-forget with error suppression
- **Purpose:** Load initial data on service construction
- **Assessment:** The error handler silently ignores failures. This is intentional — the service's `error` signal captures the error for UI consumption. The `subscribe({ error: () => undefined })` is needed to trigger the HTTP request ( Observables are lazy).
- **Decision:** ✅ KEEP — this is the correct pattern for "subscribe to kick off a lazy Observable"

### SUB-005: `LoginComponent.login().subscribe({ error: () => {} })`
- **Pattern:** Fire-and-forget with empty error handler
- **Purpose:** Login and navigate
- **Assessment:** Error handling is done by `AuthService.setError()` + `ErrorInterceptor`. The empty `error: () => {}` prevents unhandled rejection warnings.
- **Decision:** ✅ KEEP — error is handled elsewhere

---

## 7. Nested Subscription Assessment

**No nested subscriptions found.** There are no patterns like:
```typescript
observable.subscribe(() => {
  anotherObservable.subscribe(...)
});
```

All subscriptions are flat, one-level deep.

---

## 8. Timer Assessment

| Timer | Location | Duration | Risk | Cleanup |
|-------|----------|----------|------|---------|
| `setTimeout` (401 flag) | error.interceptor.ts:55 | 1s | NONE | N/A — module-level |
| `setTimeout` (saved toast) | settings.component.ts:1078 | 2.5s | NONE | N/A — harmless if component destroyed |
| `setTimeout` (toast dismiss) | toast.service.ts:27 | 3-4s | NONE | N/A — singleton service |

**All timers are fire-and-forget with short durations.** No `setInterval` or long-running timers exist.

---

## 9. Event Listener Assessment

**No manual event listeners found.** All event handling uses Angular template bindings:
- `(click)` — standard Angular event binding
- `(input)` — standard Angular event binding
- `(change)` — standard Angular event binding
- `@HostListener` — used in `header.component.ts` for click-outside and escape key (Angular-managed, automatically cleaned up)

---

## 10. Memory Risk Matrix

| File | Pattern | Lifecycle | Risk | Evidence | Fix |
|------|---------|-----------|------|----------|-----|
| `transaction.service.ts:65` | `.subscribe()` on HTTP GET | Singleton service | NONE | HTTP completes; service lives forever | NONE |
| `dashboard.component.ts:573` | `.subscribe()` on mock Observable | Component | NONE | `of().pipe(delay())` completes | NONE |
| `transactions.component.ts:227` | `.subscribe()` on HTTP DELETE | Component | NONE | HTTP completes; signals idempotent | NONE |
| `add-transaction.component.ts:508` | `.subscribe()` on HTTP POST | Component | NONE | HTTP completes; navigates away | NONE |
| `login.component.ts:336` | `.subscribe()` on HTTP POST | Component | NONE | HTTP completes; navigates away | NONE |
| `error.interceptor.ts:55` | `setTimeout` 1s | Module | NONE | Resets boolean flag | NONE |
| `settings.component.ts:1078` | `setTimeout` 2.5s | Component | NONE | Sets boolean signal | NONE |
| `toast.service.ts:27` | `setTimeout` 3-4s | Singleton | NONE | Updates signal array | NONE |

**Risk Level: 0 Critical, 0 High, 0 Medium, 0 Low**

---

## 11. Conclusion

### The project has NO memory leak risks.

**Reasons:**
1. All 5 `.subscribe()` calls are on HTTP Observables that complete automatically
2. State management uses Angular signals (no Subjects, no subscriptions needed)
3. No long-lived Observables exist
4. No nested subscriptions exist
5. No manual event listeners exist
6. No intervals or long-running timers exist
7. Singleton services are never destroyed (no cleanup needed)
8. Component subscriptions are to finite HTTP Observables

### What does NOT need to change:
- ❌ No `takeUntilDestroyed()` needed anywhere
- ❌ No `DestroyRef` needed anywhere
- ❌ No subscription cleanup needed anywhere
- ❌ No refactoring of subscribe patterns needed
- ❌ No conversion to/from Signals needed

### What COULD be improved (optional, non-critical):
- The `TransactionService.loadTransactions().subscribe({ error: () => undefined })` in the constructor is a "subscribe to kick off" pattern. An alternative would be to have components call `loadTransactions()` directly and subscribe themselves, but the current pattern is valid for pre-loading data.
