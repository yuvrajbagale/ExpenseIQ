# Security Audit Report

**Date:** 2026-08-29  
**Last Updated:** 2026-08-29 (Phase 2 Security Hardening completed)  
**Scope:** Full frontend + backend security analysis  
**Severity Scale:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

---

## Phase 2 Update (2026-08-29)

### Fixes Applied
| ID | Fix | Status | File |
|----|-----|--------|------|
| FIX-001 | Centralized 401 handler — prevents duplicate redirects, clears auth state | ✅ FIXED | `error.interceptor.ts` |
| FIX-002 | Removed duplicate `error` signal (kept `authError`) | ✅ FIXED | `auth.service.ts` |
| FIX-003 | Documented localStorage limitation and migration path | ✅ FIXED | `auth.service.ts` |
| FIX-004 | Added X-Content-Type-Options and X-Frame-Options headers | ✅ FIXED | `server.js` |

### Updated Findings
| Original ID | Finding | Updated Status |
|-------------|---------|---------------|
| SEC-004 | 401 Interceptor doesn't clear auth state | ✅ FIXED — now calls logout() |
| SEC-005 | Duplicate redirects on concurrent 401s | ✅ FIXED — centralized handler with flag |

### Remaining Issues (Require Backend)
| ID | Finding | Why Unfixed |
|----|---------|-------------|
| SEC-001 | JWT in localStorage | Backend has no HttpOnly cookie support |
| SEC-002 | Backend never validates tokens | Requires JWT verification middleware |
| SEC-003 | No CSRF protection | Not needed for Bearer token architecture |
| SEC-005 | No rate limiting | Requires server middleware |
| SEC-006 | Backend uses plain HTTP | Requires TLS certificate |
| SEC-007 | No input validation on server | Requires validation middleware |

### XSS Audit Complete
- **5 innerHTML bindings found** — all render hardcoded static SVG icons
- **1 bypassSecurityTrustHtml found** — used for static SVG icons only
- **1 ElementRef + Renderer2 found** — used for CSS class toggling only
- **Conclusion:** No XSS vectors found. All innerHTML sources are compile-time constants.

---

## Executive Summary

The application has **3 critical** and **4 high** security vulnerabilities. The most significant issue is that the backend has **no authentication verification** — any token is accepted. Combined with frontend-only auth guards, this means security is purely cosmetic.

---

## P0 — Critical Vulnerabilities

### SEC-001: JWT Token Stored in localStorage (XSS Vulnerable)
- **Location:** `auth.service.ts:75-76`
- **Code:**
  ```typescript
  localStorage.setItem('auth_token', token);
  localStorage.setItem('auth_user', JSON.stringify(user));
  ```
- **Risk:** Any XSS attack can read `localStorage` and exfiltrate tokens. localStorage is accessible to all JavaScript on the same origin.
- **Impact:** Full account takeover via token theft
- **Mitigation:** Use HttpOnly secure cookies (requires backend changes)
- **Backend constraint:** `server.js` has no cookie-based auth support
- **Severity:** P0

### SEC-002: Backend Never Validates Tokens
- **Location:** `server.js:30-45`
- **Code:**
  ```javascript
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Proceed — token is never decoded or validated
  }
  ```
- **Risk:** Any string passed as Bearer token is accepted. Users can forge tokens.
- **Impact:** Complete bypass of authentication
- **Mitigation:** Implement JWT verification in server.js (using `jsonwebtoken` library)
- **Severity:** P0

### SEC-003: No CSRF Protection
- **Location:** `server.js` (entire file)
- **Risk:** Cross-site request forgery attacks can modify user data
- **Impact:** Unauthorized data modification
- **Mitigation:** Add CSRF token validation (requires backend changes)
- **Severity:** P0

---

## P1 — High Vulnerabilities

### SEC-004: 401 Interceptor Doesn't Clear Auth State
- **Location:** `error.interceptor.ts:19-22`
- **Code:**
  ```typescript
  if (error.status === 401) {
    this.authService.setAuthError('Session expired');
    this.router.navigate(['/login']);
  }
  ```
- **Risk:** Token remains in localStorage after 401; stale auth state persists
- **Impact:** User sees login page but token is still stored; next request may use stale token
- **Mitigation:** Call `authService.logout()` on 401, abort in-flight requests
- **Severity:** P1

### SEC-005: No Rate Limiting on Login
- **Location:** `server.js:60-80` (POST /auth/login handler)
- **Risk:** Brute-force password attacks
- **Impact:** Account compromise via password guessing
- **Mitigation:** Add rate limiting (e.g., 5 attempts per minute)
- **Severity:** P1

### SEC-006: Backend Uses Plain HTTP
- **Location:** `server.js:120` — `http.createServer()`
- **Risk:** Tokens transmitted in plaintext; MITM attacks possible
- **Impact:** Token interception over network
- **Mitigation:** Use HTTPS (TLS) in production
- **Severity:** P1

### SEC-007: No Input Validation on Server
- **Location:** `server.js:50-100` (POST handlers)
- **Risk:** Malformed data can corrupt `data.json`; injection attacks possible
- **Impact:** Data corruption, potential server crashes
- **Mitigation:** Add input validation middleware (e.g., `joi`, `zod`)
- **Severity:** P1

---

## P2 — Medium Vulnerabilities

### SEC-008: Auth Guard is Frontend-Only
- **Location:** `auth.guard.ts:13-15`
- **Code:**
  ```typescript
  const authService = inject(AuthService);
  if (authService.isAuthenticated()) { return true; }
  ```
- **Risk:** Guard only checks if token exists in localStorage, not if it's valid
- **Impact:** Any user with a token (even forged) can access protected routes
- **Mitigation:** Backend must validate tokens; guard should check backend validation
- **Severity:** P2

### SEC-009: Error Messages May Leak Information
- **Location:** `error.interceptor.ts:20` — `this.authService.setAuthError('Session expired')`
- **Risk:** Generic message is fine, but if error details from backend are shown, they may leak server info
- **Impact:** Information disclosure
- **Mitigation:** Always use generic error messages; never show backend error details to users
- **Severity:** P2

---

## P3 — Low Vulnerabilities

### SEC-010: No Security Headers
- **Location:** `server.js`
- **Risk:** Missing `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`
- **Impact:** Clickjacking, MIME-type attacks
- **Mitigation:** Add `helmet` middleware to server.js
- **Severity:** P3

---

## XSS Analysis

### Vectors Checked
- [ ] `innerHTML` usage — **NONE FOUND** ✅
- [ ] `bypassSecurityTrust*` — **NONE FOUND** ✅
- [ ] `[innerHTML]` binding — **NONE FOUND** ✅
- [ ] `document.write()` — **NONE FOUND** ✅
- [ ] `eval()` — **NONE FOUND** ✅
- [ ] Dynamic `import()` with user input — **NONE FOUND** ✅

### Conclusion
Angular's default template sanitization provides adequate XSS protection. No XSS vectors were identified in the current codebase.

---

## Authentication Flow Analysis

```
1. User submits login form
   → POST /auth/login { email, password }

2. Server checks hardcoded users in data.json
   → Returns: { token: "mock-jwt-...", user: { id, name, email } }

3. Frontend stores token + user in localStorage
   → Sets AuthService signals (token, user, isAuthenticated)

4. Subsequent requests include Authorization: Bearer <token>
   → Auth interceptor attaches header
   → Server accepts ANY token (never validates)

5. On 401 error:
   → Error interceptor sets authError signal
   → Redirects to /login
   → Token NOT cleared from localStorage
   → In-flight requests NOT aborted
```

---

## Recommendations

| Priority | Action | Requires Backend |
|----------|--------|-----------------|
| P0 | Move token to HttpOnly cookie | YES |
| P0 | Implement JWT verification in server.js | YES |
| P0 | Add CSRF protection | YES |
| P1 | Clear auth state on 401 | NO |
| P1 | Add rate limiting to login | YES |
| P1 | Use HTTPS in production | YES |
| P1 | Add input validation to server | YES |
| P2 | Abort in-flight requests on 401 | NO |
| P2 | Add security headers (helmet) | YES |

**Note:** 6 of 9 recommended actions require backend changes. The frontend can implement only 3 improvements without modifying `server.js`.
