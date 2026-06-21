import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
  },
  {
    path: 'add-transaction',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/add-transaction/add-transaction.component').then(m => m.AddTransactionComponent),
  },
  {
    path: 'transactions/add',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/add-transaction/add-transaction.component').then(m => m.AddTransactionComponent),
  },
  {
    path: 'analytics',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
  },
  {
    path: 'budget',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/budget/budget.component').then(m => m.BudgetComponent),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then(m => m.SettingsComponent),
  },
  { path: '**', redirectTo: 'dashboard' },
];
