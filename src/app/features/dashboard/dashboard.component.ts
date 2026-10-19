import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { TransactionService } from '../../core/services/transaction.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { NAV_ITEMS } from '../../shared/constants/nav-items';
import { HeaderComponent } from '../../shared/components/header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { EiqCurrencyPipe } from '../../shared/pipes/eiq-currency.pipe';
import { KpiCardComponent } from '../../shared/components/kpi-card.component';
import { IconComponent } from '../../shared/components/icon.component';
import { Transaction } from '../../core/models/transaction.model';
import { DashboardData } from '../../core/models/dashboard.model';

/** Icon names used on the dashboard, resolved from the shared registry. */
const ICON = {
  wallet: 'lucideWallet',
  income: 'lucideTrendingUp',
  expense: 'lucideTrendingDown',
  savings: 'lucidePiggyBank',
  budget: 'lucideChartPie',
  add: 'lucidePlus',
  swap: 'lucideArrowLeftRight',
  download: 'lucideDownload',
  arrowRight: 'lucideArrowRight',
} as const;

const CATEGORY_FALLBACK = 'var(--eiq-primary)';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    SidebarComponent,
    HeaderComponent,
    StatusBadgeComponent,
    EiqCurrencyPipe,
    KpiCardComponent,
    IconComponent,
    CommonModule,
  ],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="logout()" />

      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="3"
          searchPlaceholder="Search transactions, categories…" />

        <main class="eiq-content">
          <!-- ── Page header ── -->
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">{{ greeting() }}, {{ firstName() }}</h1>
              <p class="eiq-page-header__subtitle">{{ todayLabel() }}</p>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="transfer()">
                <eiq-icon [name]="icons.swap" [size]="16" [strokeWidth]="2" anim="draw" />
                Transfer
              </button>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="exportCsv()">
                <eiq-icon [name]="icons.download" [size]="16" [strokeWidth]="2" anim="draw" />
                Export
              </button>
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="goToAdd()">
                <eiq-icon [name]="icons.add" [size]="16" [strokeWidth]="2.2" anim="draw" />
                Add transaction
              </button>
            </div>
          </div>

          <!-- ── Loading skeletons (preserve layout, set expectations) ── -->
          @if (isLoading()) {
            <div class="eiq-kpi-grid" aria-hidden="true">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="eiq-kpi-card">
                  <div class="eiq-kpi-card__header">
                    <div class="eiq-skeleton" style="width:36px;height:36px;border-radius:8px"></div>
                    <div class="eiq-skeleton" style="width:52px;height:20px;border-radius:9999px"></div>
                  </div>
                  <div class="eiq-skeleton" style="width:64px;height:12px;margin-bottom:8px"></div>
                  <div class="eiq-skeleton" style="width:120px;height:26px"></div>
                </div>
              }
            </div>
            <div class="eiq-charts-grid" aria-hidden="true">
              @for (i of [1,2]; track i) {
                <div class="eiq-card">
                  <div class="eiq-skeleton" style="width:140px;height:16px;margin-bottom:24px"></div>
                  <div class="eiq-skeleton" style="width:100%;height:200px"></div>
                </div>
              }
            </div>
          } @else if (loadError()) {
            <div class="eiq-empty-state">
              <eiq-icon name="lucideCircleAlert" [size]="44" [strokeWidth]="1.4" />
              <p class="eiq-empty-state__title">Couldn't load your dashboard</p>
              <p class="eiq-empty-state__desc">Something went wrong while fetching your data. Check that the API is running, then try again.</p>
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm" style="margin-top:12px" (click)="reload()">Try again</button>
            </div>
          } @else if (dashboardData(); as data) {
            <!-- ── KPI row ── -->
            <div class="eiq-kpi-grid">
              <eiq-kpi-card label="Current Balance" [value]="(data.summary.totalBalance | eiqCurrency: false) ?? ''"
                [icon]="icons.wallet" color="blue"
                [trendPercent]="data.summary.balanceChangePercent" trendDirection="up" />
              <eiq-kpi-card label="Monthly Income" [value]="(data.summary.monthlyIncome | eiqCurrency: false) ?? ''"
                [icon]="icons.income" color="green"
                [trendPercent]="data.summary.incomeChangePercent" trendDirection="up" />
              <eiq-kpi-card label="Monthly Expense" [value]="(data.summary.monthlyExpense | eiqCurrency: false) ?? ''"
                [icon]="icons.expense" color="red"
                [trendPercent]="data.summary.expenseChangePercent" trendDirection="down" sentiment="negative" />
              <eiq-kpi-card label="Savings" [value]="(data.summary.savings | eiqCurrency: false) ?? ''"
                [icon]="icons.savings" color="purple"
                [trendPercent]="data.summary.savingsChangePercent" trendDirection="up" sentiment="positive" />
              <eiq-kpi-card label="Budget Remaining" [value]="(data.summary.budgetRemaining | eiqCurrency: false) ?? ''"
                [icon]="icons.budget" color="amber"
                [trendPercent]="data.summary.budgetChangePercent" trendDirection="down" sentiment="negative" />
            </div>

            <!-- ── Charts ── -->
            <div class="eiq-charts-grid">
              <section class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h2 class="eiq-card__title">Income vs expense</h2>
                    <p class="eiq-card__subtitle">Last {{ monthlyChart().length }} months</p>
                  </div>
                  <div class="eiq-chart-legend">
                    <span class="eiq-chart-legend__item">
                      <span class="eiq-chart-legend__dot eiq-chart-legend__dot--blue"></span> Income
                    </span>
                    <span class="eiq-chart-legend__item">
                      <span class="eiq-chart-legend__dot eiq-chart-legend__dot--teal"></span> Expense
                    </span>
                  </div>
                </div>
                <div class="eiq-bar-chart" role="img" [attr.aria-label]="chartSummary()">
                  @for (d of monthlyChart(); track d.month) {
                    <div class="eiq-bar-chart__group">
                      <div class="eiq-bar-chart__bars">
                        <div class="eiq-bar-chart__bar eiq-bar-chart__bar--income"
                             [style.height.%]="scaledPct(d.income)" [title]="d.month + ' income: $' + d.income"></div>
                        <div class="eiq-bar-chart__bar eiq-bar-chart__bar--expense"
                             [style.height.%]="scaledPct(d.expense)" [title]="d.month + ' expense: $' + d.expense"></div>
                      </div>
                      <span class="eiq-bar-chart__label">{{ d.month }}</span>
                    </div>
                  } @empty {
                    <p class="eiq-card__subtitle">No monthly data yet.</p>
                  }
                </div>
              </section>

              <section class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h2 class="eiq-card__title">Daily spending</h2>
                    <p class="eiq-card__subtitle">Current week</p>
                  </div>
                  <span class="eiq-badge eiq-badge--neutral">This week</span>
                </div>
                <div class="eiq-area-chart" role="img" [attr.aria-label]="weeklySummary()">
                  <svg width="100%" height="100%" viewBox="0 0 420 170" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="eiqWeekGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="var(--eiq-primary)" stop-opacity="0.28" />
                        <stop offset="100%" stop-color="var(--eiq-primary)" stop-opacity="0" />
                      </linearGradient>
                    </defs>
                    @for (gy of [30, 65, 100, 135]; track gy) {
                      <line x1="0" [attr.y1]="gy" x2="420" [attr.y2]="gy"
                            stroke="var(--eiq-border)" stroke-width="1" vector-effect="non-scaling-stroke" />
                    }
                    @if (weeklyAreaPath()) {
                      <path [attr.d]="weeklyAreaPath()" fill="url(#eiqWeekGrad)" />
                      <path [attr.d]="weeklyLinePath()" fill="none" stroke="var(--eiq-primary)"
                            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                            vector-effect="non-scaling-stroke" />
                    }
                  </svg>
                  <div class="eiq-area-chart__labels">
                    @for (d of weeklySpending(); track d.day) {
                      <span>{{ d.day }}</span>
                    }
                  </div>
                </div>
              </section>
            </div>

            <!-- ── Breakdown + activity ── -->
            <div class="eiq-bottom-grid">
              <section class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h2 class="eiq-card__title">Category breakdown</h2>
                    <p class="eiq-card__subtitle">This month’s spending</p>
                  </div>
                  <a routerLink="/analytics" class="eiq-link">
                    Details <eiq-icon [name]="icons.arrowRight" [size]="13" [strokeWidth]="2.2" anim="slide" />
                  </a>
                </div>
                <div class="eiq-categories">
                  @for (cat of categoryBreakdown(); track cat.category) {
                    <div class="eiq-category-row">
                      <div class="eiq-category-row__info">
                        <span class="eiq-category-row__dot" [style.background]="cat.color || categoryFallback"></span>
                        <span class="eiq-category-row__name">{{ cat.category }}</span>
                      </div>
                      <div class="eiq-category-row__bar-wrap">
                        <div class="eiq-category-row__bar">
                          <div class="eiq-category-row__bar-fill"
                               [style.width.%]="cat.percentage"
                               [style.background]="cat.color || categoryFallback"></div>
                        </div>
                      </div>
                      <span class="eiq-category-row__amount">{{ cat.amount | eiqCurrency: false }}</span>
                      <span class="eiq-category-row__pct">{{ cat.percentage }}%</span>
                    </div>
                  } @empty {
                    <p class="eiq-card__subtitle">No spending recorded this month.</p>
                  }
                </div>
              </section>

              <section class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h2 class="eiq-card__title">Recent transactions</h2>
                    <p class="eiq-card__subtitle">Latest {{ data.recentTransactions.length }} entries</p>
                  </div>
                  <a routerLink="/transactions" class="eiq-link">
                    View all <eiq-icon [name]="icons.arrowRight" [size]="13" [strokeWidth]="2.2" anim="slide" />
                  </a>
                </div>
                <div class="eiq-txn-list">
                  @for (txn of data.recentTransactions; track txn.id) {
                    <div class="eiq-list-row">
                      <div class="eiq-list-row__icon">
                        <eiq-icon [name]="icons.wallet" [size]="16" anim="draw" />
                      </div>
                      <div class="eiq-list-row__body">
                        <p class="eiq-list-row__name">{{ txn.description || txn.category }}</p>
                        <p class="eiq-list-row__desc">{{ txn.category }} · {{ txn.date | date: 'MMM d' }}</p>
                      </div>
                      <div class="eiq-list-row__right">
                        <p class="eiq-list-row__amount"
                           [class.eiq-list-row__amount--positive]="txn.type === 'income'"
                           [class.eiq-list-row__amount--negative]="txn.type === 'expense'">
                          {{ signedAmount(txn) | eiqCurrency }}
                        </p>
                        <app-status-badge [status]="txn.status" />
                      </div>
                    </div>
                  } @empty {
                    <p class="eiq-card__subtitle">No transactions yet.</p>
                  }
                </div>
              </section>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .eiq-card__header + .eiq-bar-chart { min-height: 200px; }
  `],
})
export class DashboardComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly txnService = inject(TransactionService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly icons = ICON;
  readonly categoryFallback = CATEGORY_FALLBACK;
  readonly navItems = NAV_ITEMS;

  dashboardData = signal<DashboardData | null>(null);
  isLoading = signal(true);
  loadError = signal(false);

  firstName = computed(() => this.authService.currentUser()?.name?.split(' ')[0] ?? '');

  /** Time-aware greeting based on the user's local hour. */
  greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  });

  todayLabel = computed(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  );

  readonly monthlyChart = computed(() => this.dashboardData()?.monthlyChart ?? []);
  readonly weeklySpending = computed(() => this.dashboardData()?.weeklySpending ?? []);
  readonly categoryBreakdown = computed(() => this.dashboardData()?.categoryBreakdown ?? []);

  /** Scale ceiling for the bar chart — derived from the data, never hardcoded. */
  readonly chartMax = computed(() => {
    const values = this.monthlyChart().flatMap((d) => [d.income, d.expense]);
    const max = Math.max(0, ...values);
    return max === 0 ? 100 : max * 1.08;
  });

  readonly chartSummary = computed(() => {
    const rows = this.monthlyChart()
      .map((d) => `${d.month}: income $${d.income}, expense $${d.expense}`)
      .join('. ');
    return rows || 'No monthly data available.';
  });

  readonly weeklySummary = computed(() => {
    const rows = this.weeklySpending().map((d) => `${d.day}: $${d.spending}`).join('. ');
    return rows || 'No daily spending data available.';
  });

  /** Normalises a raw value into a 0–100 bar height. */
  scaledPct(value: number): number {
    const max = this.chartMax();
    if (max <= 0) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  private chartPoints(): string[] {
    const data = this.weeklySpending();
    if (data.length < 2) return [];
    const max = Math.max(1, ...data.map((d) => d.spending));
    const w = 420;
    const h = 150;
    const pad = 12;
    return data.map((d, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - (d.spending / max) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
  }

  readonly weeklyLinePath = computed(() => {
    const pts = this.chartPoints();
    return pts.length ? `M ${pts.join(' L ')}` : '';
  });

  readonly weeklyAreaPath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    const h = 150;
    return `M ${pts[0].split(',')[0]},${h - 12} L ${pts.join(' L ')} L ${pts[pts.length - 1].split(',')[0]},${h - 12} Z`;
  });

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