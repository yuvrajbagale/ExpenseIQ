import { Component, OnInit, inject, signal, computed } from "@angular/core";
import { RouterLink } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";
import {
  DashboardService,
  MONTHLY_CHART,
  WEEKLY_SPENDING,
  CATEGORY_BREAKDOWN,
} from "../../core/services/dashboard.service";
import { TransactionService } from "../../core/services/transaction.service";
import {
  SidebarComponent,
  NavItem,
} from "../../shared/components/sidebar.component";
import { HeaderComponent } from "../../shared/components/header.component";
import { StatusBadgeComponent } from "../../shared/components/status-badge.component";
import { EiqCurrencyPipe } from "../../shared/pipes/eiq-currency.pipe";
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
                Good Morning, {{ firstName() }} 👋
              </h1>
              <p class="eiq-page-header__subtitle">Wednesday, June 11, 2025</p>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm">
                <span class="material-symbols-outlined" style="font-size:14px"
                  >add</span
                >
                Add
              </button>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm">
                <span class="material-symbols-outlined" style="font-size:14px"
                  >swap_horiz</span
                >
                Transfer
              </button>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm">
                <span class="material-symbols-outlined" style="font-size:14px"
                  >download</span
                >
                Export
              </button>
            </div>
          </div>

          @if (isLoading()) {
            <div class="eiq-loading">
              <div class="eiq-loading__spinner"></div>
              <span>Loading dashboard…</span>
            </div>
          } @else if (dashboardData()) {
            <!-- KPI Cards -->
            <div class="eiq-kpi-grid">
              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--blue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                      <path
                        d="M16 3H8L6 7H18L16 3Z"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 6L13.5 15.5L8.5 10.5L1 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    +{{ dashboardData()!.summary.balanceChangePercent }}%
                  </span>
                </div>
                <p class="eiq-kpi-card__label">Current Balance</p>
                <p class="eiq-kpi-card__value">
                  {{
                    dashboardData()!.summary.totalBalance | eiqCurrency: false
                  }}
                </p>
              </div>

              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 6L13.5 15.5L8.5 10.5L1 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M17 6H23V12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 6L13.5 15.5L8.5 10.5L1 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    +{{ dashboardData()!.summary.incomeChangePercent }}%
                  </span>
                </div>
                <p class="eiq-kpi-card__label">Monthly Income</p>
                <p class="eiq-kpi-card__value">
                  {{
                    dashboardData()!.summary.monthlyIncome | eiqCurrency: false
                  }}
                </p>
              </div>

              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--red">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 18L13.5 8.5L8.5 13.5L1 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M17 18H23V12"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <span class="eiq-kpi-card__trend eiq-kpi-card__trend--down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 6L13.5 15.5L8.5 10.5L1 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    +{{ dashboardData()!.summary.expenseChangePercent }}%
                  </span>
                </div>
                <p class="eiq-kpi-card__label">Monthly Expense</p>
                <p class="eiq-kpi-card__value">
                  {{
                    dashboardData()!.summary.monthlyExpense | eiqCurrency: false
                  }}
                </p>
              </div>

              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--purple">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M19 5c-1.5 0-2.8 1.4-3 2-3.5 1.4-4 3.3-4 4.8V14a1 1 0 001 1h4a1 1 0 001-1v-3c0-1.1.9-2 2-2h1a2 2 0 002 2v4a2 2 0 01-2 2h-1v1a2 2 0 01-2 2h-1a2 2 0 01-2-2v-1h-4a2 2 0 01-2-2v-1H6a2 2 0 01-2-2V7a2 2 0 012-2h1a2 2 0 012 2V6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <span class="eiq-kpi-card__trend eiq-kpi-card__trend--up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 6L13.5 15.5L8.5 10.5L1 18"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    +{{ dashboardData()!.summary.savingsChangePercent }}%
                  </span>
                </div>
                <p class="eiq-kpi-card__label">Savings</p>
                <p class="eiq-kpi-card__value">
                  {{ dashboardData()!.summary.savings | eiqCurrency: false }}
                </p>
              </div>

              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--amber">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="2"
                      />
                      <path
                        d="M12 6v6l4 2"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                      />
                    </svg>
                  </div>
                  <span class="eiq-kpi-card__trend eiq-kpi-card__trend--down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M23 18L13.5 8.5L8.5 13.5L1 6"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    {{ dashboardData()!.summary.budgetChangePercent }}%
                  </span>
                </div>
                <p class="eiq-kpi-card__label">Budget Remaining</p>
                <p class="eiq-kpi-card__value">
                  {{
                    dashboardData()!.summary.budgetRemaining
                      | eiqCurrency: false
                  }}
                </p>
              </div>
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
                  @for (d of monthlyChart; track d.month) {
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
                    @for (d of weeklySpending; track d.day) {
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
                  @for (cat of categoryBreakdown; track cat.category) {
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
                          [class.eiq-list-row__amount--positive]="txn.amount > 0"
                          [class.eiq-list-row__amount--negative]="txn.amount < 0"
                        >
                          {{ txn.amount | eiqCurrency }}
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

  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal(true);
  firstName = computed(() => this.authService.currentUser()?.name?.split(' ')[0] ?? '');

  readonly navItems: NavItem[] = [
    { label: "Dashboard", route: "/dashboard", icon: "dashboard" },
    { label: "Transactions", route: "/transactions", icon: "swap_horiz" },
    {
      label: "Add Transaction",
      route: "/transactions/add",
      icon: "add_circle",
    },
    { label: "Categories", route: "/categories", icon: "label" },
    { label: "Budget", route: "/budget", icon: "pie_chart" },
    { label: "Analytics", route: "/analytics", icon: "trending_up" },
    { label: "Reports", route: "/reports", icon: "description" },
    { label: "Goals", route: "/goals", icon: "flag" },
    { label: "Calendar", route: "/calendar", icon: "calendar_month" },
    {
      label: "Wallet Accounts",
      route: "/accounts",
      icon: "account_balance_wallet",
    },
    { label: "Recurring", route: "/recurring", icon: "autorenew" },
  ];

  readonly monthlyChart = MONTHLY_CHART;
  readonly weeklySpending = WEEKLY_SPENDING;
  readonly categoryBreakdown = CATEGORY_BREAKDOWN;

  // Computed SVG paths for weekly area chart
  get weeklyLinePath(): string {
    const data = this.weeklySpending;
    const max = Math.max(...data.map((d) => d.spending));
    const w = 420,
      h = 160,
      pad = 10;
    const pts = data.map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - (d.spending / max) * (h - pad * 2);
      return `${x},${y}`;
    });
    return `M ${pts.join(" L ")}`;
  }

  get weeklyAreaPath(): string {
    const data = this.weeklySpending;
    const max = Math.max(...data.map((d) => d.spending));
    const w = 420,
      h = 160,
      pad = 10;
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
    this.dashboardService.loadDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
