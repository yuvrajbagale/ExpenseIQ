import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService, AnalyticsRange } from '../../core/services/analytics.service';
import { SidebarComponent, NavItem } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-analytics',
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
              <h1 class="eiq-page-header__title">Analytics</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Analytics</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              @for (r of ranges; track r.value) {
                <button class="eiq-range-btn" [class.eiq-range-btn--active]="analytics.range() === r.value" (click)="analytics.setRange(r.value)">
                  {{ r.label }}
                </button>
              }
            </div>
          </div>

          <div class="eiq-kpi-grid">
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--red">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18L13.5 8.5L8.5 13.5L1 6"/><path d="M17 18H23V12"/></svg>
                </div>
                <span class="eiq-kpi-card__trend eiq-kpi-card__trend--down">{{ analytics.kpis().totalSpentTrend }}% vs last period</span>
              </div>
              <p class="eiq-kpi-card__label">Total Spent</p>
              <p class="eiq-kpi-card__value">\${{ analytics.kpis().totalSpent.toFixed(2) }}</p>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6L13.5 15.5L8.5 10.5L1 18"/><path d="M17 6H23V12"/></svg>
                </div>
                <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">+{{ analytics.kpis().totalIncomeTrend }}% vs last period</span>
              </div>
              <p class="eiq-kpi-card__label">Total Income</p>
              <p class="eiq-kpi-card__value">\${{ analytics.kpis().totalIncome.toFixed(2) }}</p>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                </div>
                <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">+{{ analytics.kpis().netSavingsTrend }}% vs last period</span>
              </div>
              <p class="eiq-kpi-card__label">Net Savings</p>
              <p class="eiq-kpi-card__value">\${{ analytics.kpis().netSavings.toFixed(2) }}</p>
            </div>

            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--amber">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                <span class="eiq-kpi-card__trend eiq-kpi-card__trend--down">{{ analytics.kpis().avgDailySpendTrend }}% vs last period</span>
              </div>
              <p class="eiq-kpi-card__label">Avg Daily Spend</p>
              <p class="eiq-kpi-card__value">\${{ analytics.kpis().avgDailySpend.toFixed(2) }}</p>
            </div>
          </div>

          <div class="eiq-charts-grid">
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Income vs Expense</h3>
                  <p class="eiq-card__subtitle">Monthly Comparison</p>
                </div>
                <div class="eiq-chart-legend">
                  <span class="eiq-chart-legend__item"><span class="eiq-chart-legend__dot eiq-chart-legend__dot--blue"></span>Income</span>
                  <span class="eiq-chart-legend__item"><span class="eiq-chart-legend__dot" style="background:#ef4444"></span>Expense</span>
                  <span class="eiq-chart-legend__item"><span class="eiq-chart-legend__dot eiq-chart-legend__dot--teal"></span>Savings</span>
                </div>
              </div>
              <div class="eiq-bar-chart eiq-bar-chart--tall">
                @for (d of analytics.monthlyComparison(); track d.month) {
                  <div class="eiq-bar-chart__group">
                    <div class="eiq-bar-chart__bars">
                      <div class="eiq-bar-chart__bar eiq-bar-chart__bar--income" [style.height.%]="(d.income / 6000) * 100" [title]="'Income: $' + d.income"></div>
                      <div class="eiq-bar-chart__bar" style="background:#ef4444" [style.height.%]="(d.expense / 6000) * 100" [title]="'Expense: $' + d.expense"></div>
                    </div>
                    <span class="eiq-bar-chart__label">{{ d.month }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Spending by Category</h3>
                  <p class="eiq-card__subtitle">Distribution this period</p>
                </div>
              </div>
              <div class="eiq-donut-wrap">
                <svg width="160" height="160" viewBox="0 0 160 160">
                  @for (seg of donutSegments(); track seg.category) {
                    <circle cx="80" cy="80" r="60" fill="none" [attr.stroke]="seg.color" stroke-width="20"
                            [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset"
                            transform="rotate(-90 80 80)" />
                  }
                </svg>
                <ul class="eiq-donut-legend">
                  @for (seg of analytics.categoryShare(); track seg.category) {
                    <li class="eiq-donut-legend__item">
                      <span class="eiq-donut-legend__dot" [style.background]="seg.color"></span>
                      <span class="eiq-donut-legend__name">{{ seg.category }}</span>
                      <span class="eiq-donut-legend__pct">{{ seg.percentage }}%</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>

          <div class="eiq-charts-grid">
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Cash Flow</h3>
                  <p class="eiq-card__subtitle">Income &amp; Expense over 30 days</p>
                </div>
              </div>
              <div class="eiq-area-chart">
                <svg width="100%" height="100%" viewBox="0 0 420 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cfIncomeGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#2b7fff" stop-opacity="0.25"/>
                      <stop offset="100%" stop-color="#2b7fff" stop-opacity="0"/>
                    </linearGradient>
                    <linearGradient id="cfExpenseGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.2"/>
                      <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path [attr.d]="cashFlowAreaPath('income')" fill="url(#cfIncomeGrad)"/>
                  <path [attr.d]="cashFlowLinePath('income')" fill="none" stroke="#2b7fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path [attr.d]="cashFlowAreaPath('expense')" fill="url(#cfExpenseGrad)"/>
                  <path [attr.d]="cashFlowLinePath('expense')" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div class="eiq-area-chart__labels">
                  @for (d of cashFlowTicks(); track d) { <span>{{ d }}</span> }
                </div>
              </div>
            </div>

            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Expense Heatmap</h3>
                  <p class="eiq-card__subtitle">Daily spend intensity — this month</p>
                </div>
              </div>
              <div class="eiq-heatmap">
                <div class="eiq-heatmap__head">
                  <span class="eiq-heatmap__corner"></span>
                  @for (d of analytics.heatmapDays(); track d) { <span class="eiq-heatmap__day">{{ d }}</span> }
                </div>
                @for (w of weeks(); track w) {
                  <div class="eiq-heatmap__row">
                    <span class="eiq-heatmap__week">Wk {{ w }}</span>
                    @for (cell of cellsForWeek(w); track cell.day) {
                      <span class="eiq-heatmap__cell" [style.background]="heatColor(cell.amount)" [title]="cell.day + ': $' + cell.amount">
                        \${{ cell.amount }}
                      </span>
                    }
                  </div>
                }
                <div class="eiq-heatmap__scale">
                  <span>Low</span>
                  <span class="eiq-heatmap__scale-bar"></span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>

          <div class="eiq-card">
            <div class="eiq-card__header">
              <div>
                <h3 class="eiq-card__title">Financial Summary</h3>
                <p class="eiq-card__subtitle">Last 6 months overview</p>
              </div>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export
              </button>
            </div>
            <div class="eiq-txn-table-wrap">
              <table class="eiq-txn-table">
                <thead>
                  <tr>
                    <th class="eiq-txn-th">Month</th>
                    <th class="eiq-txn-th">Income</th>
                    <th class="eiq-txn-th">Expense</th>
                    <th class="eiq-txn-th">Savings</th>
                    <th class="eiq-txn-th">Savings Rate</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of analytics.financialSummary(); track row.month; let i = $index) {
                    <tr class="eiq-txn-row" [class.eiq-txn-row--alt]="i % 2 === 0">
                      <td class="eiq-txn-td">{{ row.month }}</td>
                      <td class="eiq-txn-td eiq-amount eiq-amount--pos">\${{ row.income.toLocaleString() }}</td>
                      <td class="eiq-txn-td eiq-amount eiq-amount--neg">\${{ row.expense.toLocaleString() }}</td>
                      <td class="eiq-txn-td">\${{ row.savings.toLocaleString() }}</td>
                      <td class="eiq-txn-td"><span class="eiq-badge eiq-badge--success">{{ row.savingsRate }}%</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
})
export class AnalyticsComponent {
  protected readonly authService = inject(AuthService);
  protected readonly analytics   = inject(AnalyticsService);
  private   readonly router      = inject(Router);

  ranges: { label: string; value: AnalyticsRange }[] = [
    { label: 'This Week',  value: 'week'   },
    { label: 'This Month', value: 'month'  },
    { label: 'This Year',  value: 'year'   },
    { label: 'Custom',     value: 'custom' },
  ];

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

  donutSegments = computed(() => {
    const circumference = 2 * Math.PI * 60;
    let cumulative = 0;
    return this.analytics.categoryShare().map(seg => {
      const dash = (seg.percentage / 100) * circumference;
      const offset = circumference - (cumulative / 100) * circumference;
      cumulative += seg.percentage;
      return { ...seg, dash: `${dash} ${circumference - dash}`, offset };
    });
  });

  cashFlowTicks = computed(() => {
    const data = this.analytics.cashFlow();
    return data.filter((_, i) => i % 2 === 0).map(d => d.day);
  });

  weeks = computed(() => {
    const w = new Set(this.analytics.heatmap().map(c => c.week));
    return Array.from(w).sort((a, b) => a - b);
  });

  cellsForWeek(week: number) {
    return this.analytics.heatmap().filter(c => c.week === week);
  }

  heatColor(amount: number): string {
    const max = Math.max(...this.analytics.heatmap().map(c => c.amount));
    const t = amount / max;
    if (t > 0.8) return '#1d4ed8';
    if (t > 0.6) return '#3b82f6';
    if (t > 0.4) return '#60a5fa';
    if (t > 0.2) return '#93c5fd';
    return '#dbeafe';
  }

  private seriesPath(key: 'income' | 'expense', close: boolean): string {
    const data = this.analytics.cashFlow();
    const max = Math.max(...data.map(d => Math.max(d.income, d.expense)));
    const w = 420, h = 180, pad = 10;
    const pts = data.map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((d[key] / max) * (h - pad * 2));
      return `${x},${y}`;
    });
    if (!close) return `M ${pts.join(' L ')}`;
    return `M ${pad},${h} L ${pts.join(' L ')} L ${w - pad},${h} Z`;
  }

  cashFlowLinePath(key: 'income' | 'expense'): string { return this.seriesPath(key, false); }
  cashFlowAreaPath(key: 'income' | 'expense'): string { return this.seriesPath(key, true); }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
