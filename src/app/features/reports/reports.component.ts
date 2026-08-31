import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { NAV_ITEMS } from '../../shared/constants/nav-items';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="onLogout()" />
      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="3"
          searchPlaceholder="Search reports…" />
        <main class="eiq-content">
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Reports</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span class="eiq-breadcrumb__active">Reports</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="exportCsv()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          <div class="eiq-card">
            <div class="eiq-card__header">
              <div>
                <h3 class="eiq-card__title">Monthly Financial Report</h3>
                <p class="eiq-card__subtitle">Income, expense and savings by month</p>
              </div>
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
export class ReportsComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly analytics = inject(AnalyticsService);
  private readonly router = inject(Router);

  readonly navItems = NAV_ITEMS;

  ngOnInit(): void {
    this.analytics.loadAnalytics().subscribe();
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
  }

  exportCsv(): void {
    const rows = this.analytics.financialSummary();
    const header = ['Month', 'Income', 'Expense', 'Savings', 'Savings Rate %'];
    const body = rows.map((r) => [r.month, r.income, r.expense, r.savings, r.savingsRate]);
    const csv = [header, ...body]
      .map((line) => line.map((v) => `"${v}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenseiq-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
