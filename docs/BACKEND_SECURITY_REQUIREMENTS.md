# Backend Security Requirements

**Date:** 2026-08-29  
**Status:** DOCUMENTATION ONLY — No backend code changes in Phase 2  
**Purpose:** Define what the backend would need for production-grade authentication

---

## 1. Current State

The backend (`backend/server.js`) is a simple Node.js HTTP server:
- No authentication verification
- No user data isolation
- No password storage
- No session management
- No security headers
- No rate limiting
- No input validation
- File-based storage (data.json)

---

## 2. Authentication Requirements

### 2.1 Login Endpoint
```
POST /api/auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }
```

**Required:**
- Verify email exists in database
- Compare password hash (bcrypt)
- Generate JWT access token (short expiry: 15min)
- Generate refresh token (long expiry: 7d)
- Store refresh token in HttpOnly secure cookie

### 2.2 Register Endpoint
```
POST /api/auth/register
Body: { name, email, password }
Response: { user, accessToken, refreshToken }
```

**Required:**
- Validate email format
- Check email uniqueness
- Hash password (bcrypt, 12 rounds)
- Create user in database
- Return tokens

### 2.3 Token Refresh
```
POST /api/auth/refresh
Cookie: refreshToken
Response: { accessToken, refreshToken }
```

**Required:**
- Validate refresh token from HttpOnly cookie
- Verify token exists in database and not revoked
- Generate new access token
- Rotate refresh token
- Set new HttpOnly cookie

### 2.4 Logout
```
POST /api/auth/logout
Cookie: refreshToken
Response: { success: true }
```

**Required:**
- Revoke refresh token from database
- Clear HttpOnly cookie
- Invalidate access token (optional: token blacklist)

---

## 3. Token Strategy

### Access Token (JWT)
- **Expiry:** 15 minutes
- **Payload:** `{ userId, email, iat, exp }`
- **Storage:** Memory only (not localStorage)
- **Transmission:** Authorization: Bearer header

### Refresh Token
- **Expiry:** 7 days
- **Storage:** HttpOnly, Secure, SameSite=Strict cookie
- **Rotation:** New refresh token on each use
- **Revocation:** Database-backed revocation list

### Why NOT localStorage
- XSS can read localStorage
- HttpOnly cookies are inaccessible to JavaScript
- Secure flag ensures HTTPS-only transmission
- SameSite prevents CSRF

---

## 4. Authorization Requirements

### 4.1 User Data Isolation
Every data endpoint must:
1. Extract user ID from JWT payload
2. Filter data by user ID
3. Return only that user's data

```
GET /api/transactions
→ Verify JWT
→ Extract userId from token
→ SELECT * FROM transactions WHERE userId = ?
→ Return filtered results
```

### 4.2 Ownership Checks
```
PUT /api/transactions/:id
→ Verify JWT
→ Extract userId from token
→ SELECT * FROM transactions WHERE id = ? AND userId = ?
→ If not found: 403 Forbidden
→ Update only if ownership matches
```

### 4.3 Protected Resources
| Endpoint | Auth Required | Ownership Check |
|----------|--------------|-----------------|
| `GET /api/transactions` | YES | Filter by userId |
| `POST /api/transactions` | YES | Assign userId |
| `PUT /api/transactions/:id` | YES | Verify userId |
| `DELETE /api/transactions/:id` | YES | Verify userId |
| `GET /api/budgets` | YES | Filter by userId |
| `GET /api/goals` | YES | Filter by userId |
| `GET /api/wallets` | YES | Filter by userId |

---

## 5. Security Middleware

### 5.1 Rate Limiting
```javascript
// Login: 5 attempts per minute
// Register: 3 attempts per hour
// API: 100 requests per minute
```

### 5.2 Input Validation
```javascript
// Login: email format, password min 6 chars
// Transaction: amount > 0, category required, date valid
// Budget: amount > 0, period valid
// Goals: targetAmount > 0, name required
```

### 5.3 Request Size Limits
```javascript
// Body: 1MB max (already implemented in server.js)
// URL: 2KB max
```

### 5.4 Security Headers
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains (production only)
```

### 5.5 CORS Policy
```javascript
// Production: specific origin only
// Development: localhost:4200
Access-Control-Allow-Origin: https://expenseiq.example.com
Access-Control-Allow-Methods: GET,POST,PUT,DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## 6. Password Security

### Hashing
- Algorithm: bcrypt
- Rounds: 12
- Salt: automatic (bcrypt handles)

### Validation
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 number
- Check against breached password lists (optional)

### Storage
- Only hash stored in database
- Never log plaintext passwords
- Never return password in API responses

---

## 7. Session Management

### Server-Side
- Store active refresh tokens in database
- Track device info (User-Agent, IP)
- Allow session revocation
- Limit concurrent sessions (optional)

### Client-Side
- Access token in memory only
- Refresh token in HttpOnly cookie
- Clear state on logout
- Handle token expiry gracefully

---

## 8. Database Schema (Recommended)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(10) NOT NULL,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date TIMESTAMP NOT NULL,
  -- ... other fields
);
```

---

## 9. Migration Path

### Phase 1: Add bcrypt + JWT (8 hours)
- Install `bcrypt`, `jsonwebtoken`
- Add password hashing to register/login
- Add JWT verification middleware
- Keep existing endpoints working

### Phase 2: Add HttpOnly cookies (4 hours)
- Set refresh token as HttpOnly cookie
- Remove localStorage token storage
- Update auth interceptor to use credentials
- Add CSRF protection

### Phase 3: Add data isolation (8 hours)
- Add user_id to all data tables
- Filter all queries by user_id
- Add ownership checks to mutations
- Migrate existing data

### Phase 4: Add security middleware (4 hours)
- Rate limiting
- Input validation
- Security headers
- CORS policy

### Phase 5: Production hardening (4 hours)
- HTTPS
- Logging
- Monitoring
- Backup strategy

**Total estimated effort:** 28 hours

---

## 10. Frontend Migration

Once backend supports HttpOnly cookies:

1. **Remove localStorage token storage** from AuthService
2. **Update auth interceptor** to use `withCredentials: true`
3. **Remove token from signals** (stored in HttpOnly cookie, not accessible)
4. **Add CSRF token header** to mutating requests
5. **Handle 401 → refresh → retry** flow
6. **Add token expiry checks** (UX only, backend enforces)

**Do NOT** implement any of these until backend actually supports cookie-based auth.
