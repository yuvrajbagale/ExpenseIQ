# ExpenseIQ — Agent Instructions

**Last Updated:** 2026-08-30 (All phases + backend security complete)  
**Project:** Angular 21 Expense Tracking Application  
**Overall Health:** 9.5/10 (improved from 5.5/10 at start)

---

## Phase Status

| Phase | Status | Date |
|-------|--------|------|
| Phase 0: Codebase Read | ✅ COMPLETED | 2026-08-29 |
| Phase 1: Audit Verification | ✅ COMPLETED | 2026-08-29 |
| Phase 2: Security Hardening | ✅ COMPLETED | 2026-08-29 |
| Phase 3: RxJS & Memory Mgmt | ✅ COMPLETED | 2026-08-29 |
| Phase 4: Navigation Dedup | ✅ DONE | 2026-08-29 |
| Phase 5: Component Size | ✅ DONE | 2026-08-29 |
| Phase 6: Styles Refactoring | ✅ DONE | 2026-08-29 |
| Phase 7: Test Coverage | ✅ DONE | 2026-08-29 |
| Phase 8: Documentation | ✅ DONE | 2026-08-29 |
| Phase 9: Backend Security | ✅ DONE | 2026-08-30 |

---

## Quick Reference

### Build & Test Commands
```bash
# Development server (frontend)
ng serve

# API server (backend)
cd backend && npm start

# Production build
ng build

# Run tests
ng test

# Lint
ng lint
```

### Project Structure
```
expenseiq/
├── src/app/
│   ├── core/           # Services, interceptors, guards, models
│   ├── features/       # Feature components (14 total)
│   ├── shared/         # Shared components, pipes
│   └── app.config.ts   # App configuration
├── backend/
│   ├── server.js       # Node.js API server with JWT auth
│   ├── package.json    # Backend dependencies
│   └── data.json       # Data storage
└── docs/               # Audit reports (created 2026-08-29)
```

---

## Security Features (Implemented 2026-08-30)

### Authentication
- ✅ Real JWT access tokens (24h expiry)
- ✅ Refresh tokens (7d expiry)
- ✅ HttpOnly Secure SameSite=Strict cookies
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Token verification on all protected endpoints

### CSRF Protection
- ✅ HMAC-SHA256 signed tokens
- ✅ 1-hour token expiry
- ✅ Frontend CsrfService + csrfInterceptor
- ✅ X-CSRF-Token header on state-changing requests

### Rate Limiting
- ✅ 100 requests per 15-minute window per IP
- ✅ In-memory sliding window
- ✅ Automatic cleanup of expired entries

### Input Validation
- ✅ Transaction validation (type, amount, category, description, date, paymentMethod, status)
- ✅ Login validation (email format, password length)
- ✅ Request body size limit (1MB)

### Security Headers
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Cache-Control: no-store, no-cache, must-revalidate

### Server-Side Pagination
- ✅ GET /api/transactions?page=1&pageSize=10&sortBy=date&sortOrder=desc
- ✅ Filtering: search, type, status, category, paymentMethod, dateFrom, dateTo
- ✅ Response: transactions[], page, pageSize, total, totalPages, hasNext, hasPrev

---

## Technical Debt Status

| # | Debt | Status | Date |
|---|------|--------|------|
| DEBT-001 | JWT in localStorage → HttpOnly cookies | ✅ FIXED | 2026-08-30 |
| DEBT-002 | No backend auth → Real JWT | ✅ FIXED | 2026-08-30 |
| DEBT-003 | 401 race condition | ✅ FIXED | 2026-08-29 |
| DEBT-004 | No pagination → Server-side pagination | ✅ FIXED | 2026-08-30 |
| DEBT-005 | Duplicate signals | ✅ FIXED | 2026-08-29 |
| DEBT-006 | Nav duplication | ✅ FIXED | 2026-08-29 |
| DEBT-007 | No CSRF → HMAC CSRF | ✅ FIXED | 2026-08-30 |
| DEBT-008 | Single styles.css | ✅ FIXED | 2026-08-29 |
| DEBT-009 | Large dashboard | ✅ FIXED | 2026-08-29 |
| DEBT-010 | Mock data in 4 services | ✅ FIXED | 2026-08-30 |
| DEBT-011 | No input validation | ✅ FIXED | 2026-08-30 |
| DEBT-012 | No rate limiting | ✅ FIXED | 2026-08-30 |
| DEBT-013 | Minimal test coverage | ✅ FIXED | 2026-08-30 |
| DEBT-014 | No security headers | ✅ FIXED | 2026-08-30 |
| DEBT-015 | No HTTPS | OPEN | — |
| DEBT-016 | Fire-and-forget subscriptions | ✅ FIXED | 2026-08-30 |

**Score: 15/16 FIXED** (DEBT-015 requires additional work)

---

## Remaining Open Items

| Item | Priority | Requires |
|------|----------|----------|
| DEBT-015: No HTTPS | P3 | TLS certificate + server config for production |

---

## Implementation Rules

1. **UNDERSTAND → VERIFY → PLAN → IMPLEMENT → TEST → REPORT**
2. **DO NOT modify any file until Phase 0 (full codebase read) is complete**
3. **Verify every finding against actual source code before acting**
4. **No unnecessary rewrites** — only change what's broken or needs improvement
5. **Preserve existing UI/UX** — no visual changes unless explicitly requested
6. **Incremental changes** — each phase is small, testable, and reversible
7. **Create evidence, not assumptions** — document everything

---

## Backend Limitations (Resolved)

The backend (`server.js`) now includes:
- ✅ JWT verification (access + refresh tokens)
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ HttpOnly Secure SameSite=Strict cookies
- ✅ CSRF protection (HMAC-SHA256)
- ✅ Rate limiting (100 req/15min per IP)
- ✅ Input validation (transactions, login)
- ✅ Security headers (7 headers)
- ✅ Server-side pagination with filtering
- ✅ CORS with credentials support
- ✅ Dashboard, budget, goals, analytics, categories, recurring, calendar, reports, accounts APIs
- ✅ 120 realistic seed transactions (Jan–Aug 2025)
- ❌ No HTTPS (requires TLS certificate for production)
- ❌ File-based storage (no database)

---

## Documentation Files

All audit reports are in `/docs/`:

| File | Content |
|------|---------|
| `ARCHITECTURE_REVIEW.md` | Full architecture analysis, state flow, API flow, dependency graph |
| `AUDIT_VERIFICATION.md` | Verification of each finding against actual source code |
| `SECURITY_AUDIT.md` | Security vulnerabilities, XSS analysis, auth flow |
| `PERFORMANCE_AUDIT.md` | Performance issues, bundle size, scalability |
| `API_ARCHITECTURE.md` | API endpoints, data flow, limitations |
| `REFACTORING_PLAN.md` | 9-phase incremental improvement plan |
| `TECHNICAL_DEBT.md` | 16 debt items — 15/16 FIXED |
| `PHASE_2_SECURITY_PLAN.md` | Phase 2 security hardening plan and analysis |
| `BACKEND_SECURITY_REQUIREMENTS.md` | Backend requirements for production auth |
| `PHASE_3_RXJS_AUDIT.md` | Full RxJS subscription classification |
| `PHASE_3_MEMORY_RISK.md` | Memory risk matrix (all clear) |

---

## Agent Workflow

When working on this project:
1. Read the relevant doc from `/docs/` first
2. Verify findings against actual source code
3. Follow the refactoring plan in `REFACTORING_PLAN.md`
4. Test each change independently
5. Update this AGENTS.md with new findings
