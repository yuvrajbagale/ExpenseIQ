# ExpenseIQ Local Backend

This is a small Node.js backend for local development. It does not need MongoDB,
MySQL, Firebase, or any extra npm package.

## Run

```bash
npm run api
```

API base URL:

```text
http://localhost:5000/api
```

## Endpoints

```text
GET    /api/health
POST   /api/auth/login
GET    /api/transactions
POST   /api/transactions
DELETE /api/transactions/:id
```

Data is saved in `backend/data.json`. If the file does not exist, the server
creates it with demo transactions.
