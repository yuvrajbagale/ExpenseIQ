# Phase 2 — Security Hardening Plan

**Date:** 2026-08-29  
**Status:** PLAN COMPLETE — Ready for Implementation  
**Scope:** Frontend-only security improvements; backend changes documented but NOT implemented

---

## 1. Current Authentication Flow

```
 LoginComponent
     │
     ▼
 POST /auth/login { email, password }
     │
     ▼
 Server: finds/creates user in data.json
         returns { user, token: "dev-token-<uuid>" }
     │
     ▼
 AuthService.login()
     ├── writeStorage(TOKEN_KEY, token)      → localStorage 'eq_token'
     ├── writeStorage(USER_KEY, JSON.stringify(user)) → localStorage 'eq_user'
     ├── _state.update({ user, token, isAuthenticated: true })
     └── router.navigate(['/dashboard'])
     │
     ▼
 Subsequent requests:
     Auth Interceptor reads AuthService.token()
     Attaches: Authorization: Bearer <token>
     Server: accepts ANY Bearer token (no validation)
```

---

## 2. Current Token Lifecycle

| Event | Action | Location |
|-------|--------|----------|
| Login success | Token written to localStorage | `auth.service.ts:82` |
| Session restore | Token read from localStorage | `auth.service.ts:47` |
| HTTP request | Token attached as Bearer header | `auth.interceptor.ts:18` |
| 401 received | Error message set, redirect to login | `error.interceptor.ts:21-24` |
| Logout | Token removed from localStorage | `auth.service.ts:107` |
| Page refresh | Token restored from localStorage | `auth.service.ts:45-67` |

**Token format:** `dev-token-<uuid>` — NOT a JWT. No expiration, no payload, no signature.

---

## 3. Current localStorage Usage

### Auth-Related (AuthService only)
| Key | Read | Write | Remove | Location |
|-----|------|-------|--------|----------|
| `eq_token` | `readStorage()` line 187 | `writeStorage()` line 195 | `clearStorage()` line 203 | `auth.service.ts` |
| `eq_user` | `readStorage()` line 48 | `writeStorage()` line 83 | `clearStorage()` line 204 | `auth.service.ts` |

### Non-Auth
| Key | Read | Write | Location |
|-----|------|-------|----------|
| `eiq_theme` | line 25 | line 42 | `theme.service.ts` |

### Findings
- ✅ All auth storage access is centralized in AuthService via private methods
- ✅ No sessionStorage or document.cookie usage
- ✅ No direct localStorage access in components or other services
- ✅ Theme storage is independent and non-sensitive

---

## 4. Current Interceptor Behavior

### Auth Interceptor (`auth.interceptor.ts`)
- Reads: `auth.token()` from signal (NOT direct localStorage)
- Excludes: URLs containing `/auth/` or `/login`
- Attaches: `Authorization: Bearer <token>` header
- Handles empty tokens: ✅ Yes (`if (token && !isAuthRequest)`)

### Error Interceptor (`error.interceptor.ts`)
- On 401: sets `auth.setError('Your session has expired...')`
- On 401: redirects to `/auth/login` (unless already on auth route)
- Does NOT: call `auth.logout()`, clear localStorage, abort in-flight requests
- Does NOT: prevent duplicate redirects for concurrent 401s

---

## 5. Current Guard Behavior

### authGuard (`auth.guard.ts:5-8`)
- Checks: `auth.isAuthenticated()` (computed signal from `_state().isAuthenticated`)
- Returns: `true` if authenticated, `UrlTree(['/auth/login'])` if not
- Does NOT: validate token with backend

### guestGuard / publicGuard (`auth.guard.ts:12-19`)
- Inverse of authGuard
- Redirects authenticated users to `/dashboard`

---

## 6. Backend Authentication Limitations

| Capability | Status | Impact |
|-----------|--------|--------|
| JWT validation | ❌ NONE | Any Bearer token accepted |
| Password hashing | ❌ NONE | Passwords stored in plaintext (if at all) |
| Session management | ❌ NONE | No server-side session state |
| Token expiration | ❌ NONE | Tokens valid forever |
| Refresh tokens | ❌ NONE | No token rotation |
| User isolation | ❌ NONE | All users share same data |
| Rate limiting | ❌ NONE | Brute-force possible |
| CSRF protection | ❌ NONE | Not needed for Bearer token architecture |
| Input validation | ⚠️ MINIMAL | Only amount > 0 check on transactions |

**Critical:** `server.js:95-98` — `isAuthed()` only checks `authHeader.startsWith('Bearer ')`. Any string works.

---

## 7. Frontend-Only Fixes (IMPLEMENTING)

### FIX-001: Centralized 401 Handler (P0)
**File:** `error.interceptor.ts`  
**Problem:** Multiple concurrent 401s cause multiple redirects and error toasts; token not cleared  
**Solution:**
- Add `_handling401` flag to prevent duplicate redirects
- Call `auth.logout()` on 401 (clears localStorage + resets state)
- Single redirect, single error message

### FIX-002: Remove Duplicate `error` Signal (P2)
**File:** `auth.service.ts`  
**Problem:** `error` (line 36) and `authError` (line 39) are identical computed signals  
**Solution:** Remove `error` (no external consumers found), keep `authError`

### FIX-003: Document Token Storage Limitation (P0)
**File:** `auth.service.ts`  
**Problem:** No documentation that localStorage is used because backend lacks HttpOnly cookie support  
**Solution:** Add clear comments explaining the limitation and migration path

### FIX-004: Add Security Headers to Backend (P1)
**File:** `backend/server.js`  
**Problem:** No security headers  
**Solution:** Add `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY` (safe for development)

---

## 8. Backend-Required Fixes (DOCUMENTING ONLY)

| Fix | Requires | Notes |
|-----|----------|-------|
| HttpOnly cookie auth | Server rewrite | Cannot be faked from frontend |
| JWT validation | `jsonwebtoken` library | Server must verify token signature |
| Password hashing | `bcrypt` library | Currently no password storage |
| Token expiration | JWT payload | Frontend can add UX hints, backend must enforce |
| Refresh tokens | New endpoint | Requires session state |
| User data isolation | Per-user storage | Currently all data is shared |
| Rate limiting | `express-rate-limit` or similar | Currently no protection |
| Input validation | `joi`/`zod` middleware | Currently minimal |
| CSRF protection | CSRF middleware | Only needed for cookie-based auth |
| Security headers | `helmet` middleware | Or manual headers |

---

## 9. Security Risks Remaining After Frontend Changes

### Cannot Be Fixed Without Backend
1. **Token in localStorage** — XSS can steal tokens; requires HttpOnly cookies
2. **No JWT validation** — any token accepted; requires backend verification
3. **No user data isolation** — all users share transactions; requires per-user storage
4. **No password hashing** — plaintext passwords; requires bcrypt
5. **No rate limiting** — brute-force possible; requires server middleware
6. **No HTTPS** — tokens in plaintext; requires TLS certificate

### Can Be Mitigated Frontend-Only
1. ✅ **401 race condition** — centralized handler (FIX-001)
2. ✅ **Duplicate signals** — remove dead code (FIX-002)
3. ✅ **Documentation** — clarify limitations (FIX-003)

---

## 10. XSS Audit Results

### innerHTML Usages Found (5 locations)
| File | Line | Source | Risk |
|------|------|--------|------|
| `sidebar.component.ts` | 66,76,80 | `ICON_MAP` (hardcoded) | NONE — static SVGs |
| `transactions.component.ts` | 99 | `CATEGORY_ICON_MARKUP` (hardcoded) | NONE — static SVGs |
| `settings.component.ts` | 96 | `this.ICONS` (hardcoded) | NONE — static SVGs |
| `add-transaction.component.ts` | 116 | `walletOptions[].icon` (hardcoded) | NONE — static SVGs |

### bypassSecurityTrustHtml (1 location)
| File | Line | Source | Risk |
|------|------|--------|------|
| `transactions.component.ts` | 250 | `CATEGORY_ICON_MARKUP` (hardcoded) | NONE — static SVGs |

### ElementRef / Renderer2 (1 location)
| File | Line | Usage | Risk |
|------|------|-------|------|
| `header.component.ts` | 473-474 | CSS class toggling for mobile nav | NONE — no HTML injection |

### Conclusion
**No XSS vectors found.** All `[innerHTML]` bindings render hardcoded static SVG strings from compile-time constants. No user-controlled or backend-controlled data reaches `innerHTML`.

---

## 11. Token Expiration Analysis

**Token format:** `dev-token-<uuid>` (e.g., `dev-token-550e8400-e29b-41d4-a716-446655440000`)

This is NOT a JWT. It contains:
- No payload
- No expiration claim
- No signature
- No parseable structure

**Assessment:** Client-side token expiration is NOT possible. The backend generates a random string and never validates it.

**Recommendation:** Do NOT add token expiration logic. It would be fake security.

---

## 12. Data Ownership Assessment

### CRITICAL: No User Isolation

**All endpoints return/accept ALL data regardless of authentication:**

| Endpoint | User Isolation | Risk |
|----------|---------------|------|
| `GET /api/transactions` | ❌ Returns ALL transactions | Any user sees all data |
| `POST /api/transactions` | ❌ No ownership assignment | Any user can create |
| `DELETE /api/transactions/:id` | ❌ No ownership check | Any user can delete |
| `GET /api/budgets` | ❌ No budgets endpoint | N/A |
| `GET /api/goals` | ❌ No goals endpoint | N/A |
| `POST /api/auth/login` | ⚠️ Creates user if not exists | No credential verification |

**The auth guard is purely cosmetic.** It prevents unauthenticated UI access but provides zero data protection.

---

## 13. Implementation Plan

### Phase 2A: Error Interceptor Fix (FIX-001)
**Risk:** LOW  
**Files:** `error.interceptor.ts`  
**Changes:**
1. Add `_handling401` module-level flag
2. On 401: check flag → set flag → call `auth.logout()` → navigate → return error
3. Prevents duplicate redirects for concurrent 401s
4. Clears stale token from localStorage

### Phase 2B: Auth Service Cleanup (FIX-002)
**Risk:** LOW  
**Files:** `auth.service.ts`  
**Changes:**
1. Remove `readonly error = computed(...)` (line 36)
2. Keep `readonly authError = computed(...)` (line 39)
3. Verify no consumers of `error` (grep confirmed: 0 consumers)

### Phase 2C: Documentation (FIX-003)
**Risk:** NONE  
**Files:** `auth.service.ts`, `error.interceptor.ts`  
**Changes:**
1. Add comments explaining localStorage limitation
2. Add comments explaining backend constraints
3. Add comments explaining migration path

### Phase 2D: Backend Headers (FIX-004)
**Risk:** LOW  
**Files:** `backend/server.js`  
**Changes:**
1. Add `X-Content-Type-Options: nosniff` to all responses
2. Add `X-Frame-Options: DENY` to all responses
3. Skip HSTS (plain HTTP development)

---

## 14. Testing Checklist

After each fix:
- [ ] `ng build` — no errors
- [ ] `ng test` — all tests pass
- [ ] Manual login → dashboard → navigate → logout
- [ ] Concurrent 401 scenario (if testable)
- [ ] localStorage cleared on logout
- [ ] No visual changes
