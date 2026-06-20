import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BudgetService, BudgetStatus } from '../../core/services/budget.service';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="onLogout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Budget Management</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Budget</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-month-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="eiq-month-label">{{ budget.month() }}</span>
              <button class="eiq-month-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Set Budget
              </button>
            </div>
          </div>

          <div class="eiq-kpi-grid eiq-kpi-grid--3">
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label eiq-kpi-card__label--upper">Total Budget</p>
                <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">{{ budget.totals().percentUsed }}% used</span>
              </div>
              <p class="eiq-kpi-card__value">\${{ budget.totals().totalBudget.toLocaleString() }}</p>
              <p class="eiq-kpi-card__caption">{{ budget.month() }}</p>
              <div class="eiq-progress-bar eiq-progress-bar--thin">
                <div class="eiq-progress-bar__fill" style="background:#2b7fff" [style.width.%]="budget.totals().percentUsed"></div>
              </div>
              <p class="eiq-kpi-card__footnote">\${{ budget.totals().totalSpent.toLocaleString() }} spent of \${{ budget.totals().totalBudget.toLocaleString() }}</p>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label eiq-kpi-card__label--upper">Total Spent</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18L13.5 8.5L8.5 13.5L1 6"/><path d="M17 18H23V12"/></svg>
                </div>
              </div>
              <p class="eiq-kpi-card__value eiq-kpi-card__value--danger">\${{ budget.totals().totalSpent.toLocaleString() }}</p>
              <p class="eiq-kpi-card__caption">This month</p>
              <a class="eiq-link" (click)="$event.preventDefault()">View Breakdown →</a>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label eiq-kpi-card__label--upper">Remaining Budget</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
              </div>
              <p class="eiq-kpi-card__value eiq-kpi-card__value--success">\${{ budget.totals().remainingBudget.toLocaleString() }}</p>
              <p class="eiq-kpi-card__caption">Available to spend</p>
              @if (budget.totals().isLowBudget) {
                <span class="eiq-badge eiq-badge--warning">⚠ Low Budget</span>
              }
            </div>
          </div>

          <div class="eiq-card">
            <div class="eiq-card__header">
              <div>
                <h3 class="eiq-card__title">Category Budgets</h3>
                <p class="eiq-card__subtitle">Track spending across all categories for {{ budget.month() }}</p>
              </div>
              <div class="eiq-status-legend">
                <span class="eiq-status-legend__item"><span class="eiq-status-legend__dot" style="background:#16a34a"></span>On Track</span>
                <span class="eiq-status-legend__item"><span class="eiq-status-legend__dot" style="background:#eab308"></span>Warning</span>
                <span class="eiq-status-legend__item"><span class="eiq-status-legend__dot" style="background:#ef4444"></span>Overspent</span>
              </div>
            </div>

            <div class="eiq-txn-table-wrap">
              <table class="eiq-txn-table">
                <thead>
                  <tr>
                    <th class="eiq-txn-th">Category</th>
                    <th class="eiq-txn-th">Budget</th>
                    <th class="eiq-txn-th">Spent</th>
                    <th class="eiq-txn-th">Progress</th>
                    <th class="eiq-txn-th eiq-txn-th--right">Remaining</th>
                    <th class="eiq-txn-th">Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cat of budget.categoryBudgets(); track cat.category; let i = $index) {
                    <tr class="eiq-txn-row" [class.eiq-txn-row--alt]="i % 2 === 0" [class.eiq-txn-row--danger]="cat.status === 'overspent'">
                      <td class="eiq-txn-td">
                        <div class="eiq-cat-cell">
                          <span class="eiq-budget-icon" [style.background]="cat.iconBg">{{ cat.icon }}</span>
                          <span class="eiq-cat-name">{{ cat.category }}</span>
                        </div>
                      </td>
                      <td class="eiq-txn-td">\${{ cat.budget }}</td>
                      <td class="eiq-txn-td" [class.eiq-amount--neg]="cat.status === 'overspent'">\${{ cat.spent }}</td>
                      <td class="eiq-txn-td">
                        <div class="eiq-progress-bar">
                          <div class="eiq-progress-bar__fill" [style.width.%]="Math.min(cat.progress, 100)" [style.background]="progressColor(cat.status)"></div>
                        </div>
                        <span class="eiq-progress-bar__pct">{{ cat.progress }}%</span>
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--right" [class.eiq-amount--neg]="cat.remaining < 0" [class.eiq-amount--pos]="cat.remaining >= 0">
                        {{ cat.remaining < 0 ? '-' : '' }}\${{ Math.abs(cat.remaining) }}
                      </td>
                      <td class="eiq-txn-td"><span class="eiq-badge" [class]="statusBadgeClass(cat.status)">{{ statusLabel(cat.status) }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="eiq-bottom-grid">
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Budget Insights</h3>
                  <p class="eiq-card__subtitle">Key observations for {{ budget.month().split(' ')[0] }}</p>
                </div>
              </div>
              <div class="eiq-insights-list">
                @for (insight of budget.insights(); track insight.title) {
                  <div class="eiq-insight" [class]="'eiq-insight--' + insight.type">
                    <span class="eiq-insight__icon">{{ insight.icon }}</span>
                    <div>
                      <p class="eiq-insight__title">{{ insight.title }}</p>
                      <p class="eiq-insight__detail">{{ insight.detail }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Budget Recommendations</h3>
                  <p class="eiq-card__subtitle">AI-powered suggestions for you</p>
                </div>
              </div>
              <div class="eiq-insights-list">
                @for (rec of budget.recommendations(); track rec.title) {
                  <div class="eiq-insight eiq-insight--neutral">
                    <span class="eiq-insight__icon">{{ rec.icon }}</span>
                    <div>
                      <p class="eiq-insight__title">{{ rec.title }}</p>
                      <p class="eiq-insight__detail">{{ rec.detail }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
})
export class BudgetComponent {
  protected readonly authService = inject(AuthService);
  protected readonly budget      = inject(BudgetService);
  protected readonly Math        = Math;
  private   readonly router      = inject(Router);

  readonly navItems: NavItem[] = [
    { label: 'Dashboard',       route: '/dashboard',        icon: 'dashboard',  exact: true },
    { label: 'Transactions',    route: '/transactions',     icon: 'swap_horiz'               },
    { label: 'Add Transaction', route: '/transactions/add', icon: 'add_circle'                },
    { label: 'Categories',      route: '/categories',       icon: 'label'                     },
    { label: 'Budget',          route: '/budget',           icon: 'pie_chart'                 },
    { label: 'Analytics',       route: '/analytics',        icon: 'trending_up'                },
    { label: 'Reports',         route: '/reports',          icon: 'description'                },
    { label: 'Goals',           route: '/goals',            icon: 'flag'                       },
    { label: 'Calendar',        route: '/calendar',         icon: 'calendar_month'             },
    { label: 'Wallet Accounts', route: '/accounts',         icon: 'account_balance_wallet'     },
    { label: 'Recurring',       route: '/recurring',        icon: 'autorenew'                  },
  ];

  progressColor(status: BudgetStatus): string {
    return { 'on-track': '#16a34a', warning: '#eab308', overspent: '#ef4444' }[status];
  }

  statusLabel(status: BudgetStatus): string {
    return { 'on-track': 'On Track', warning: 'Warning', overspent: 'Overspent' }[status];
  }

  statusBadgeClass(status: BudgetStatus): string {
    return { 'on-track': 'eiq-badge--success', warning: 'eiq-badge--warning', overspent: 'eiq-badge--danger' }[status];
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
