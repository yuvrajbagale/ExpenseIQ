# ExpenseIQ — Enterprise Angular 21 Application

A complete, production-ready expense tracking application built with **Angular 21**, featuring clean architecture, Signals state management, lazy-loaded routes, and pixel-perfect UI/UX.

---

## 🏗️ Architecture Overview

```
src/
├── app/
│   ├── core/                          # Singleton services, guards, interceptors
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # authGuard + guestGuard/publicGuard
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts    # JWT Bearer token injection
│   │   │   └── error.interceptor.ts   # Global HTTP error handling
│   │   ├── interfaces/                # TypeScript interfaces (contracts)
│   │   │   ├── user.interface.ts      # User, AuthState, LoginCredentials
│   │   │   ├── transaction.interface.ts # Transaction, Filters, Pagination
│   │   │   └── dashboard.interface.ts  # DashboardStats, ChartDataPoints
│   │   ├── models/                    # Domain models (class implementations)
│   │   │   ├── transaction.model.ts   # TransactionModel with computed getters
│   │   │   ├── dashboard.model.ts     # DashboardData, DashboardSummary
│   │   │   └── user.model.ts          # User model and auth token types
│   │   └── services/
│   │       ├── auth.service.ts        # Signals-based auth state management
│   │       ├── transaction.service.ts # Signals-based transaction CRUD
│   │       └── dashboard.service.ts   # Dashboard data aggregation
│   │
│   ├── shared/                        # Reusable components & utilities
│   │   ├── components/
│   │   │   ├── sidebar.component.ts   # Navigation sidebar (accepts @Input navItems)
│   │   │   ├── header.component.ts    # App header (search, notifications, user)
│   │   │   └── status-badge.component.ts # Transaction status indicator
│   │   └── pipes/
│   │       └── eiq-currency.pipe.ts   # Custom currency pipe ($1,234.56)
│   │
│   ├── features/                      # Feature modules (lazy-loaded)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── login.component.ts  # Screen 1: Login page with brand panel
│   │   │   └── auth.routes.ts
│   │   ├── dashboard/
│   │   │   └── dashboard.component.ts  # Screen 2: Dashboard with KPIs & charts
│   │   ├── transactions/
│   │   │   └── transactions.component.ts # Screen 4: Transactions data table
│   │   └── add-transaction/
│   │       └── add-transaction.component.ts # Screen 3: Add transaction form
│   │
│   ├── app.routes.ts                  # Root routes with lazy loading
│   ├── app.config.ts                  # Application providers
│   └── app.component.ts               # Root shell component
│
├── environments/
│   ├── environment.ts                 # Development config
│   └── environment.prod.ts            # Production config
├── styles.css                         # Global design tokens & shared styles
└── index.html
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 20+ and **npm** 10+
- **Angular CLI** 21: `npm install -g @angular/cli@21`

### Installation

```bash
# Install dependencies
npm install

# Start development server
ng serve --open

# Build for production
ng build --configuration production
```

The app will open at **http://localhost:4200**

---

## ✨ Key Features & Patterns

### 🎯 Angular 21 Signals State Management
All state is managed using Angular's native Signals API — no NgRx, no BehaviorSubjects:

```typescript
// auth.service.ts
private readonly _state = signal<AuthState>({ ... });
readonly user          = computed(() => this._state().user);
readonly isAuthenticated = computed(() => this._state().isAuthenticated);
readonly currentUser   = computed(() => this._state().user); // alias
```

### 🔄 Route-Based Lazy Loading
Every feature module is lazy-loaded for optimal bundle splitting:

```typescript
// app.routes.ts
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./features/dashboard/dashboard.component')
    .then(m => m.DashboardComponent),
}
```

### 🛡️ Guards & Interceptors
- **`authGuard`** — Protects authenticated routes; redirects to `/auth/login`
- **`guestGuard`** / **`publicGuard`** — Redirects authenticated users away from auth pages
- **`authInterceptor`** — Injects `Authorization: Bearer <token>` on all HTTP requests
- **`errorInterceptor`** — Handles 401/500 errors globally

### 🧩 Standalone Components
All components are standalone with explicit imports (no NgModule boilerplate):

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, SidebarComponent, HeaderComponent, EiqCurrencyPipe],
  ...
})
```

### 📊 Computed Chart Data
SVG charts are rendered from computed getters — no external chart library needed:

```typescript
get weeklyLinePath(): string {
  const data = this.weeklySpending;
  const max = Math.max(...data.map(d => d.spending));
  // Returns SVG path string: "M 10,140 L 67,90 L ..."
}
```

---

## 🎨 Design System

### CSS Design Tokens (`styles.css`)
```css
:root {
  --eiq-primary:      #2b7fff;      /* Brand blue */
  --eiq-green:       oklch(0.6 0.118 184.704);  /* Income green */
  --eiq-red:         #e7000b;       /* Expense red */
  --eiq-bg:          oklch(0.985 0.001 286.375); /* App background */
  --eiq-sidebar-w:   240px;
  --eiq-font:        'Plus Jakarta Sans', system-ui, sans-serif;
  --eiq-font-mono:   'JetBrains Mono', monospace;
}
```

### Naming Convention (BEM-inspired)
```
.eiq-{block}                 → component root
.eiq-{block}__{element}     → child elements
.eiq-{block}--{modifier}    → state/variant modifiers
```

---

## 📱 Screens

| Route | Component | Description |
|-------|-----------|-------------|
| `/auth/login` | `LoginComponent` | Login page with animated brand panel, balance card, social login |
| `/dashboard` | `DashboardComponent` | KPI cards, bar chart, area chart, recent transactions, category breakdown |
| `/add-transaction` | `AddTransactionComponent` | Full form with type toggle, amount input, category, wallet, receipt upload |
| `/transactions` | `TransactionsComponent` | Data table with search, filters, pagination, bulk select, CRUD actions |

---

## 🔌 API Layer

### Auth Service
```typescript
authService.login(credentials)       // Observable<void> — logs in, navigates to /dashboard
authService.logout()                 // Clears token, navigates to /auth/login
authService.isAuthenticated()        // Signal<boolean>
authService.currentUser()            // Signal<User | null>
```

### Transaction Service
```typescript
txnService.filteredTransactions()    // Computed<Transaction[]> — reactive to filters
txnService.recentTransactions()      // Computed<Transaction[]> — last 5
txnService.updateFilters(partial)    // Updates search/type/status filters
txnService.addTransaction(data)      // Adds new transaction
txnService.deleteTransaction(id)     // Removes transaction by ID
```

---

## 🔧 Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://api.expenseiq.dev/v1',
  appName: 'ExpenseIQ',
  version: '1.0.0',
};
```

---

## 📦 Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 21.x | Framework |
| TypeScript | 5.5 | Type safety |
| Signals | Built-in | State management |
| RxJS | 7.8 | Async operations |
| Angular Router | 21.x | Lazy-loaded routing |
| Plus Jakarta Sans | Google Fonts | UI typography |
| JetBrains Mono | Google Fonts | Mono/numeric data |

---

## 📄 License
MIT © ExpenseIQ 2025
