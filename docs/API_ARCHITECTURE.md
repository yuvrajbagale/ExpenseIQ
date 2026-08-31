# API Architecture Report

**Date:** 2026-08-29  
**Scope:** Frontend-backend API contract, data flow, limitations  
**Backend:** `backend/server.js` + `data.json`

---

## Executive Summary

The backend is a **simple Node.js HTTP server** with no authentication, no validation, and no pagination. It serves hardcoded mock data from a JSON file. The frontend is designed for a more capable backend but currently works with this minimal implementation.

---

## Backend Architecture

### Server Implementation
- **File:** `backend/server.js` (256 lines)
- **Framework:** None (plain `http.createServer()`)
- **Storage:** `data.json` file (read/written on each request)
- **Authentication:** NONE (accepts any `Bearer` token)
- **Validation:** NONE (accepts any JSON body)
- **Rate Limiting:** NONE
- **CORS:** Basic (allows all origins)

### Data Storage
- **File:** `data.json`
- **Structure:**
  ```json
  {
    "users": [...],
    "transactions": [...],
    "budgets": [...],
    "goals": [...],
    "wallets": [...],
    "categories": [...],
    "recurring": [...]
  }
  ```
- **Persistence:** File-based (no database)
- **Concurrency:** NONE (file read/write on each request, race conditions possible)

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| POST | `/auth/login` | NO | `{ email, password }` | `{ token, user }` |
| POST | `/auth/register` | NO | `{ name, email, password }` | `{ token, user }` |

**Note:** Token is never validated on subsequent requests.

### Transactions
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/transactions` | NO | — | `Transaction[]` (ALL) |
| GET | `/transactions/:id` | NO | — | `Transaction` |
| POST | `/transactions` | NO | `Transaction` | `Transaction` |
| PUT | `/transactions/:id` | NO | `Transaction` | `Transaction` |
| DELETE | `/transactions/:id` | NO | — | `{ success: true }` |

**Note:** No pagination, no filtering, no search parameters.

### Budgets
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/budgets` | NO | — | `Budget[]` |
| POST | `/budgets` | NO | `Budget` | `Budget` |
| PUT | `/budgets/:id` | NO | `Budget` | `Budget` |
| DELETE | `/budgets/:id` | NO | — | `{ success: true }` |

### Goals
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/goals` | NO | — | `Goal[]` |
| POST | `/goals` | NO | `Goal` | `Goal` |
| PUT | `/goals/:id` | NO | `Goal` | `Goal` |
| DELETE | `/goals/:id` | NO | — | `{ success: true }` |

### Wallets
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/wallets` | NO | — | `Wallet[]` |
| POST | `/wallets` | NO | `Wallet` | `Wallet` |
| PUT | `/wallets/:id` | NO | `Wallet` | `Wallet` |
| DELETE | `/wallets/:id` | NO | — | `{ success: true }` |

### Categories
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/categories` | NO | — | `Category[]` |
| POST | `/categories` | NO | `Category` | `Category` |
| PUT | `/categories/:id` | NO | `Category` | `Category` |
| DELETE | `/categories/:id` | NO | — | `{ success: true }` |

### Recurring
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/recurring` | NO | — | `Recurring[]` |
| POST | `/recurring` | NO | `Recurring` | `Recurring` |
| PUT | `/recurring/:id` | NO | `Recurring` | `Recurring` |
| DELETE | `/recurring/:id` | NO | — | `{ success: true }` |

### Reports & Analytics
| Method | Endpoint | Auth Required | Request | Response |
|--------|----------|---------------|---------|----------|
| GET | `/reports/summary` | NO | — | `ReportSummary` |
| GET | `/analytics/summary` | NO | — | `AnalyticsSummary` |

---

## Frontend API Usage

### Services Making Real API Calls
| Service | Endpoints Used | Notes |
|---------|---------------|-------|
| `AuthService` | POST `/auth/login`, POST `/auth/register` | Stores token in localStorage |
| `TransactionService` | GET/POST/PUT/DELETE `/transactions` | Loads ALL on construction |
| `CategoryService` | GET/POST/PUT/DELETE `/categories` | Full CRUD |
| `WalletService` | GET/POST/PUT/DELETE `/wallets` | Full CRUD |
| `RecurringService` | GET/POST/PUT/DELETE `/recurring` | Full CRUD |

### Services Using Mock Data
| Service | Mock Data | Notes |
|---------|-----------|-------|
| `DashboardService` | Dashboard stats, recent transactions | Hardcoded, 400ms delay |
| `BudgetService` | Budget data | Hardcoded, 400ms delay |
| `GoalsService` | Goals data | Hardcoded, 400ms delay |
| `AnalyticsService` | Analytics data | Hardcoded, 400ms delay |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Angular 21)                                        │
│                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐ │
│  │ AuthService  │     │ Transaction  │     │ Other        │ │
│  │ (signals)    │     │ Service      │     │ Services     │ │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘ │
│         │                    │                    │          │
│         ▼                    ▼                    ▼          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ HttpClient + Interceptors                            │   │
│  │   Auth Interceptor: attaches Bearer token            │   │
│  │   Error Interceptor: handles 401, redirects          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP requests
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Node.js)                                           │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ server.js (plain HTTP, no auth, no validation)       │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ data.json (file-based storage, no concurrency)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Limitations & Gaps

### Missing Features (Required by Frontend)
1. **Pagination** — Frontend expects paginated results; backend returns full array
2. **Filtering** — Frontend does client-side filtering; server has no filter endpoints
3. **Search** — Frontend does client-side search; server has no search endpoint
4. **JWT Validation** — Frontend sends Bearer token; server never validates it
5. **Refresh Tokens** — Frontend has no refresh flow; server has no refresh endpoint
6. **CSRF Protection** — Server has no CSRF middleware
7. **Rate Limiting** — Server has no rate limiting
8. **Input Validation** — Server accepts any JSON body

### Security Gaps
1. No HTTPS — tokens transmitted in plaintext
2. No CORS restrictions — allows all origins
3. No security headers (CSP, X-Frame-Options, etc.)
4. No request size limits — vulnerable to large payload attacks

### Scalability Gaps
1. File-based storage — no database
2. No caching — reads file on every request
3. No connection pooling — new request = new file read
4. No pagination — returns all data

---

## Recommendations

### Frontend-Only Changes (No Backend)
1. Clear auth state on 401 (error interceptor)
2. Add `takeUntilDestroyed()` to subscriptions
3. Use signals for better performance
4. Add optimistic updates for mutations

### Backend Changes Required
1. Add JWT verification middleware
2. Add pagination endpoints (`?page=1&limit=20`)
3. Add filtering endpoints (`?category=food&dateFrom=...&dateTo=...`)
4. Add search endpoint (`?q=grocery`)
5. Add CSRF protection
6. Add rate limiting
7. Add input validation
8. Switch to HTTPS
9. Add security headers (helmet)
10. Add database (PostgreSQL/MongoDB)

### Priority Order
1. **P0:** Add JWT verification (security)
2. **P0:** Add HTTPS (security)
3. **P1:** Add pagination (scalability)
4. **P1:** Add filtering (performance)
5. **P2:** Add input validation (data integrity)
6. **P2:** Add rate limiting (security)
