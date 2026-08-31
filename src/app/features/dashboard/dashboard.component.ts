import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import { DashboardService } from "../../core/services/dashboard.service";
import { TransactionService } from "../../core/services/transaction.service";
import { ToastService } from "../../core/services/toast.service";
import {
  SidebarComponent,
} from "../../shared/components/sidebar.component";
import { NAV_ITEMS } from "../../shared/constants/nav-items";
import { HeaderComponent } from "../../shared/components/header.component";
import { StatusBadgeComponent } from "../../shared/components/status-badge.component";
import { EiqCurrencyPipe } from "../../shared/pipes/eiq-currency.pipe";
import { KpiCardComponent } from "../../shared/components/kpi-card.component";
import { Transaction } from "../../core/models/transaction.model";
import { DashboardData } from "../../core/models/dashboard.model";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    RouterLink,
    SidebarComponent,
    HeaderComponent,
    StatusBadgeComponent,
    EiqCurrencyPipe,
    KpiCardComponent,
  ],
  template: `
    <div class="eiq-app">
      <!-- Sidebar -->
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="logout()" />

      <!-- Main Content -->
      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="3"
          searchPlaceholder="Search transactions, categories…"
        />

        <main class="eiq-content">
          <!-- Page Header -->
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">
                {{ greeting() }}, {{ firstName() }} 👋
              </h1>
              <p class="eiq-page-header__subtitle">{{ todayLabel() }}</p>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="goToAdd()">
                <span class="material-symbols-outlined" style="font-size:14px">add</span>
                Add
              </button>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="transfer()">
                <span class="material-symbols-outlined" style="font-size:14px">swap_horiz</span>
                Transfer
              </button>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="exportCsv()">
                <span class="material-symbols-outlined" style="font-size:14px">download</span>
                Export
              </button>
            </div>
          </div>

          @if (isLoading()) {
            <div class="eiq-loading">
              <div class="eiq-loading__spinner"></div>
              <span>Loading dashboard…</span>
            </div>
          } @else if (loadError()) {
            <div class="eiq-empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p class="eiq-empty-state__title">Couldn't load your dashboard</p>
              <p class="eiq-empty-state__desc">Something went wrong while fetching your data.</p>
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="reload()">Try again</button>
            </div>
          } @else if (dashboardData()) {
            <!-- KPI Cards -->
            <div class="eiq-kpi-grid">
              <eiq-kpi-card
                label="Current Balance"
                [value]="(dashboardData()!.summary.totalBalance | eiqCurrency: false) ?? ''"
                icon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16 3H8L6 7H18L16 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                color="blue"
                [trendPercent]="dashboardData()!.summary.balanceChangePercent"
                trendDirection="up" />

              <eiq-kpi-card
                label="Monthly Income"
                [value]="(dashboardData()!.summary.monthlyIncome | eiqCurrency: false) ?? ''"
                icon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 6H23V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                color="green"
                [trendPercent]="dashboardData()!.summary.incomeChangePercent"
                trendDirection="up" />

              <eiq-kpi-card
                label="Monthly Expense"
                [value]="(dashboardData()!.summary.monthlyExpense | eiqCurrency: false) ?? ''"
                icon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M23 18L13.5 8.5L8.5 13.5L1 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 18H23V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                color="red"
                [trendPercent]="dashboardData()!.summary.expenseChangePercent"
                trendDirection="down" />

              <eiq-kpi-card
                label="Savings"
                [value]="(dashboardData()!.summary.savings | eiqCurrency: false) ?? ''"
                icon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5 1.4-4 3.3-4 4.8V14a1 1 0 001 1h4a1 1 0 001-1v-3c0-1.1.9-2 2-2h1a2 2 0 002 2v4a2 2 0 01-2 2h-1v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1h-4a2 2 0 01-2-2v-1H6a2 2 0 01-2-2V7a2 2 0 012-2h1a2 2 0 012 2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                color="purple"
                [trendPercent]="dashboardData()!.summary.savingsChangePercent"
                trendDirection="up" />

              <eiq-kpi-card
                label="Budget Remaining"
                [value]="(dashboardData()!.summary.budgetRemaining | eiqCurrency: false) ?? ''"
                icon='<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
                color="amber"
                [trendPercent]="dashboardData()!.summary.budgetChangePercent"
                trendDirection="down" />
            </div>

            <!-- Charts Row -->
            <div class="eiq-charts-grid">
              <!-- Income vs Expense Chart -->
              <div class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h3 class="eiq-card__title">Income vs Expense</h3>
                    <p class="eiq-card__subtitle">Last 6 months overview</p>
                  </div>
                  <div class="eiq-chart-legend">
                    <span class="eiq-chart-legend__item">
                      <span
                        class="eiq-chart-legend__dot eiq-chart-legend__dot--blue"
                      ></span>
                      Income
                    </span>
                    <span class="eiq-chart-legend__item">
                      <span
                        class="eiq-chart-legend__dot eiq-chart-legend__dot--teal"
                      ></span>
                      Expense
                    </span>
                  </div>
                </div>
                <div class="eiq-bar-chart">
                  @for (d of monthlyChart(); track d.month) {
                    <div class="eiq-bar-chart__group">
                      <div class="eiq-bar-chart__bars">
                        <div
                          class="eiq-bar-chart__bar eiq-bar-chart__bar--income"
                          [style.height.%]="(d.income / 6000) * 100"
                          [title]="'Income: $' + d.income"
                        ></div>
                        <div
                          class="eiq-bar-chart__bar eiq-bar-chart__bar--expense"
                          [style.height.%]="(d.expense / 6000) * 100"
                          [title]="'Expense: $' + d.expense"
                        ></div>
                      </div>
                      <span class="eiq-bar-chart__label">{{ d.month }}</span>
                    </div>
                  }
                </div>
              </div>

              <!-- Weekly Spending Chart -->
              <div class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h3 class="eiq-card__title">Weekly Spending Trend</h3>
                    <p class="eiq-card__subtitle">
                      Current week daily spending
                    </p>
                  </div>
                  <span class="eiq-badge eiq-badge--neutral">This Week</span>
                </div>
                <div class="eiq-area-chart">
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 420 180"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="weekGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop
                          offset="0%"
                          stop-color="#2b7fff"
                          stop-opacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stop-color="#2b7fff"
                          stop-opacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path [attr.d]="weeklyAreaPath" fill="url(#weekGrad)" />
                    <path
                      [attr.d]="weeklyLinePath"
                      fill="none"
                      stroke="#2b7fff"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <div class="eiq-area-chart__labels">
                    @for (d of weeklySpending(); track d.day) {
                      <span>{{ d.day }}</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Row -->
            <div class="eiq-bottom-grid">
              <!-- Category Breakdown -->
              <div class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h3 class="eiq-card__title">Category Breakdown</h3>
                    <p class="eiq-card__subtitle">This month's spending</p>
                  </div>
                </div>
                <div class="eiq-categories">
                  @for (cat of categoryBreakdown(); track cat.category) {
                    <div class="eiq-category-row">
                      <div class="eiq-category-row__info">
                        <div
                          class="eiq-category-row__dot"
                          [style.background]="cat.color"
                        ></div>
                        <span class="eiq-category-row__name">{{
                          cat.category
                        }}</span>
                      </div>
                      <div class="eiq-category-row__bar-wrap">
                        <div class="eiq-category-row__bar">
                          <div
                            class="eiq-category-row__bar-fill"
                            [style.width.%]="cat.percentage"
                            [style.background]="cat.color"
                          ></div>
                        </div>
                      </div>
                      <span class="eiq-category-row__amount">{{
                        cat.amount | eiqCurrency: false
                      }}</span>
                      <span class="eiq-category-row__pct"
                        >{{ cat.percentage }}%</span
                      >
                    </div>
                  }
                </div>
              </div>

              <!-- Recent Transactions -->
              <div class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h3 class="eiq-card__title">Recent Transactions</h3>
                    <p class="eiq-card__subtitle">Latest 5 activity</p>
                  </div>
                  <a routerLink="/transactions" class="eiq-link">View all</a>
                </div>
                <div class="eiq-txn-list">
                  @for (
                    txn of dashboardData()!.recentTransactions;
                    track txn.id
                  ) {
                    <div class="eiq-list-row">
                      <div class="eiq-list-row__icon">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="2"
                          />
                        </svg>
                      </div>
                      <div class="eiq-list-row__body">
                        <p class="eiq-list-row__name">{{ txn.category }}</p>
                        <p class="eiq-list-row__desc">{{ txn.description }}</p>
                      </div>
                      <div class="eiq-list-row__right">
                        <p
                          class="eiq-list-row__amount"
                          [class.eiq-list-row__amount--positive]="txn.type === 'income'"
                          [class.eiq-list-row__amount--negative]="txn.type === 'expense'"
                        >
                          {{ signedAmount(txn) | eiqCurrency }}
                        </p>
                        <app-status-badge [status]="txn.status" />
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly txnService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal(true);
  loadError = signal(false);
  firstName = computed(() => this.authService.currentUser()?.name?.split(' ')[0] ?? '');

  /** Time-aware greeting based on the user's local hour. */
  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 18) return 'Good Afternoon';
    return 'Good Evening';
  });

  /** Human-readable current date. */
  todayLabel = computed(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  );

  readonly navItems = NAV_ITEMS;

  readonly monthlyChart = computed(() => this.dashboardData()?.monthlyChart ?? []);
  readonly weeklySpending = computed(() => this.dashboardData()?.weeklySpending ?? []);
  readonly categoryBreakdown = computed(() => this.dashboardData()?.categoryBreakdown ?? []);

  // Computed SVG paths for weekly area chart
  get weeklyLinePath(): string {
    const data = this.weeklySpending();
    if (!data.length) return '';
    const max = Math.max(...data.map((d) => d.spending));
    const w = 420, h = 160, pad = 10;
    const pts = data.map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - (d.spending / max) * (h - pad * 2);
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")}`;
  }

  get weeklyAreaPath(): string {
    const data = this.weeklySpending();
    if (!data.length) return '';
    const max = Math.max(...data.map((d) => d.spending));
    const w = 420, h = 160, pad = 10;
    const pts = data.map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - (d.spending / max) * (h - pad * 2);
      return `${x},${y}`;
    });
    const firstX = pad;
    const lastX = w - pad;
    return `M ${firstX},${h} L ${pts.join(" L ")} L ${lastX},${h} Z`;
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.loadError.set(false);
    this.dashboardService.loadDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set(true);
      },
    });
  }

  reload(): void {
    this.loadDashboard();
  }

  goToAdd(): void {
    this.router.navigate(['/transactions/add']);
  }

  transfer(): void {
    this.router.navigate(['/accounts']);
    this.toast.info('Open Wallet Accounts to transfer between accounts.');
  }

  exportCsv(): void {
    const txns = this.txnService.filteredTransactions();
    if (!txns.length) {
      this.toast.warning('No transactions to export yet.');
      return;
    }
    const header = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Method', 'Status'];
    const body = txns.map((t) => [
      new Date(t.date).toISOString().slice(0, 10),
      t.type,
      t.category,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toString(),
      t.paymentMethod,
      t.status,
    ]);
    const csv = [header, ...body].map((r) => r.join(',')).join('\n');
    this.triggerDownload(csv, 'expenseiq-transactions.csv', 'text/csv');
    this.toast.success('Transactions exported as CSV.');
  }

  private triggerDownload(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  logout(): void {
    this.authService.logout();
  }

  /** Returns a signed magnitude: positive for income, negative for expense. */
  signedAmount(txn: Transaction): number {
    return txn.type === 'expense' ? -Math.abs(txn.amount) : Math.abs(txn.amount);
  }
}
