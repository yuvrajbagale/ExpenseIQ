import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { BudgetService, BudgetStatus } from '../../core/services/budget.service';
import { ToastService } from '../../core/services/toast.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { NAV_ITEMS } from '../../shared/constants/nav-items';
import { HeaderComponent } from '../../shared/components/header.component';
import { IconComponent } from '../../shared/components/icon.component';
import { EiqCurrencyPipe } from '../../shared/pipes/eiq-currency.pipe';
import { BudgetEditorComponent } from './budget-editor.component';

const STATUS_LABEL: Record<BudgetStatus, string> = {
  'on-track': 'On track',
  warning: 'Warning',
  overspent: 'Overspent',
  untracked: 'No limit',
};

const STATUS_BADGE: Record<BudgetStatus, string> = {
  'on-track': 'eiq-badge--success',
  warning: 'eiq-badge--warning',
  overspent: 'eiq-badge--danger',
  untracked: 'eiq-badge--neutral',
};

const STATUS_COLOR: Record<BudgetStatus, string> = {
  'on-track': 'var(--eiq-green)',
  warning: 'var(--eiq-amber)',
  overspent: 'var(--eiq-red)',
  untracked: 'var(--eiq-faint)',
};

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent, IconComponent, EiqCurrencyPipe, BudgetEditorComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="onLogout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Budget</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <eiq-icon name="lucideChevronRight" [size]="12" [strokeWidth]="2" anim="slide" />
                <span class="eiq-breadcrumb__active">Budget</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions bd-nav">
              <div class="bd-nav__stepper">
                <button type="button" class="eiq-month-btn" aria-label="Previous month"
                        [disabled]="!budget.canGoPrev()" (click)="budget.prevMonth()">
                  <eiq-icon name="lucideChevronLeft" [size]="15" [strokeWidth]="2.2" anim="pop" />
                </button>
                <span class="eiq-month-label">{{ budget.monthLabel() }}</span>
                <button type="button" class="eiq-month-btn" aria-label="Next month"
                        [disabled]="!budget.canGoNext()" (click)="budget.nextMonth()">
                  <eiq-icon name="lucideChevronRight" [size]="15" [strokeWidth]="2.2" anim="pop" />
                </button>
              </div>
              <button type="button" class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="openEditor()">
                <eiq-icon name="lucidePlus" [size]="14" [strokeWidth]="2" anim="draw" />
                Set budget
              </button>
            </div>
          </div>

          @if (budget.loadError()) {
            <div class="eiq-empty-state">
              <eiq-icon name="lucideCircleAlert" [size]="40" [strokeWidth]="1.4" />
              <p class="eiq-empty-state__title">Couldn't load your budget</p>
              <p class="eiq-empty-state__desc">Check that the API is running, then try again.</p>
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm" style="margin-top:12px" (click)="reload()">Try again</button>
            </div>
          } @else {
            <!-- ── Totals ── -->
            <div class="eiq-kpi-grid eiq-kpi-grid--3">
              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <p class="eiq-kpi-card__label eiq-kpi-card__label--upper">Total budget</p>
                  <span class="eiq-kpi-card__trend"
                        [class.eiq-kpi-card__trend--up]="budget.totals().percentUsed < warningAt"
                        [class.eiq-kpi-card__trend--down]="budget.totals().percentUsed >= warningAt">
                    {{ budget.totals().percentUsed }}% used
                  </span>
                </div>
                <p class="eiq-kpi-card__value">{{ budget.totals().totalBudget | eiqCurrency: false }}</p>
                <p class="eiq-kpi-card__caption">
                  {{ budget.totals().categoriesTracked }} of {{ budget.categories().length }} categories
                  @if (budget.totals().rollover > 0) {
                    <span class="bd-rollover">· {{ budget.totals().rollover | eiqCurrency: false }} rolled over</span>
                  }
                </p>
                <div class="eiq-progress-bar eiq-progress-bar--thin">
                  <div class="eiq-progress-bar__fill"
                       [style.background]="overallColor()"
                       [style.width.%]="barWidth()"></div>
                </div>
                <p class="eiq-kpi-card__footnote">
                  {{ budget.totals().totalSpent | eiqCurrency: false }} spent of
                  {{ budget.totals().totalBudget | eiqCurrency: false }}
                </p>
              </div>

              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <p class="eiq-kpi-card__label eiq-kpi-card__label--upper">Spent this month</p>
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--red">
                    <eiq-icon name="lucideTrendingDown" [size]="16" [strokeWidth]="2" anim="pop" />
                  </div>
                </div>
                <p class="eiq-kpi-card__value eiq-kpi-card__value--danger">
                  {{ budget.totals().totalSpent | eiqCurrency: false }}
                </p>
                <p class="eiq-kpi-card__caption">{{ budget.monthLabel() }}</p>
                @if (budget.totals().unbudgetedSpend > 0) {
                  <p class="eiq-kpi-card__footnote">
                    Includes {{ budget.totals().unbudgetedSpend | eiqCurrency: false }} in categories with no limit
                  </p>
                }
              </div>

              <div class="eiq-kpi-card">
                <div class="eiq-kpi-card__header">
                  <p class="eiq-kpi-card__label eiq-kpi-card__label--upper">Left to spend</p>
                  <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                    <eiq-icon name="lucideWallet" [size]="16" [strokeWidth]="2" anim="pop" />
                  </div>
                </div>
                <p class="eiq-kpi-card__value eiq-kpi-card__value--success">
                  {{ budget.totals().remainingBudget | eiqCurrency: false }}
                </p>
                <p class="eiq-kpi-card__caption">Before you go over</p>
                @if (budget.totals().isLowBudget) {
                  <span class="eiq-badge eiq-badge--warning">⚠ Over 75% used</span>
                }
              </div>
            </div>

            @if (!budget.hasLimits()) {
              <div class="eiq-card bd-cta">
                <div class="bd-cta__icon">
                  <eiq-icon name="lucideTarget" [size]="22" [strokeWidth]="2" anim="pop" />
                </div>
                <div class="bd-cta__body">
                  <p class="bd-cta__title">No budgets set for {{ budget.monthLabel() }}</p>
                  <p class="bd-cta__copy">
                    Set a monthly limit per category. We'll track your spending against it and flag anything
                    that runs hot — and roll unspent budget into next month.
                  </p>
                </div>
                <button type="button" class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="openEditor()">
                  Set budgets
                </button>
              </div>
            }

            <!-- ── Category table ── -->
            <div class="eiq-card">
              <div class="eiq-card__header">
                <div>
                  <h3 class="eiq-card__title">Category budgets</h3>
                  <p class="eiq-card__subtitle">
                    Spending against each limit for {{ budget.monthLabel() }}.
                    Warning at {{ warningAt }}% used.
                  </p>
                </div>
                <div class="eiq-status-legend">
                  <span class="eiq-status-legend__item">
                    <span class="eiq-status-legend__dot" style="background:var(--eiq-green)"></span>On track
                  </span>
                  <span class="eiq-status-legend__item">
                    <span class="eiq-status-legend__dot" style="background:var(--eiq-amber)"></span>Warning
                  </span>
                  <span class="eiq-status-legend__item">
                    <span class="eiq-status-legend__dot" style="background:var(--eiq-red)"></span>Overspent
                  </span>
                </div>
              </div>

              @if (budget.isLoading()) {
                <div class="bd-skeletons" aria-hidden="true">
                  @for (i of skeletonRows; track i) { <div class="bd-skeleton"></div> }
                </div>
              } @else {
                <div class="eiq-txn-table-wrap">
                  <table class="eiq-txn-table">
                    <thead>
                      <tr>
                        <th class="eiq-txn-th">Category</th>
                        <th class="eiq-txn-th eiq-txn-th--right">Limit</th>
                        <th class="eiq-txn-th eiq-txn-th--right">Spent</th>
                        <th class="eiq-txn-th">Progress</th>
                        <th class="eiq-txn-th eiq-txn-th--right">Remaining</th>
                        <th class="eiq-txn-th">Status</th>
                        <th class="eiq-txn-th eiq-txn-th--right">
                          <span class="eiq-sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (cat of budget.categories(); track cat.category; let i = $index) {
                        <tr class="eiq-txn-row" [class.eiq-txn-row--alt]="i % 2 === 0"
                            [class.eiq-txn-row--danger]="cat.status === 'overspent'">
                          <td class="eiq-txn-td">
                            <div class="eiq-cat-cell">
                              <span class="bd-cat-dot" [style.background]="cat.color"></span>
                              <span class="eiq-cat-name">{{ cat.category }}</span>
                            </div>
                          </td>
                          <td class="eiq-txn-td eiq-txn-td--right">
                            @if (cat.isSet) {
                              {{ cat.limit | eiqCurrency: false }}
                              @if (cat.carryIn > 0) {
                                <span class="bd-carry" title="Rolled over from last month">
                                  +{{ cat.carryIn | eiqCurrency: false }}
                                </span>
                              }
                            } @else {
                              <span class="bd-muted">—</span>
                            }
                          </td>
                          <td class="eiq-txn-td eiq-txn-td--right">{{ cat.spent | eiqCurrency: false }}</td>
                          <td class="eiq-txn-td">
                            <div class="bd-progress">
                              <div class="eiq-progress-bar">
                                <div class="eiq-progress-bar__fill"
                                     [style.width.%]="min(cat.progress, 100)"
                                     [style.background]="statusColor(cat.status)"></div>
                              </div>
                              <span class="eiq-progress-bar__pct">
                                {{ cat.status === 'untracked' ? '—' : cat.progress + '%' }}
                              </span>
                            </div>
                          </td>
                          <td class="eiq-txn-td eiq-txn-td--right"
                              [class.eiq-amount--neg]="cat.remaining < 0"
                              [class.eiq-amount--pos]="cat.remaining >= 0 && cat.isSet">
                            @if (cat.isSet) {
                              {{ cat.remaining | eiqCurrency: true }}
                            } @else {
                              <span class="bd-muted">—</span>
                            }
                          </td>
                          <td class="eiq-txn-td">
                            <span class="eiq-badge" [class]="statusBadge(cat.status)">
                              {{ statusLabel(cat.status) }}
                            </span>
                          </td>
                          <td class="eiq-txn-td eiq-txn-td--right">
                            <button type="button" class="eiq-icon-btn" title="Edit limit"
                                    [attr.aria-label]="'Edit ' + cat.category + ' budget'"
                                    (click)="openEditor()">
                              <eiq-icon name="lucidePencil" [size]="15" anim="pop" />
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="7" class="bd-empty">No categories available.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>

            <!-- ── Derived insights ── -->
            <div class="eiq-bottom-grid">
              <div class="eiq-card">
                <div class="eiq-card__header">
                  <div>
                    <h3 class="eiq-card__title">Where you stand</h3>
                    <p class="eiq-card__subtitle">Derived from your limits and this month's transactions</p>
                  </div>
                </div>
                <div class="eiq-insights-list">
                  @for (insight of budget.insights(); track insight.title) {
                    <div class="eiq-insight" [class]="'eiq-insight--' + insight.type">
                      <span class="eiq-insight__icon">
                        <eiq-icon [name]="insight.icon" [size]="16" [strokeWidth]="2" anim="pop" />
                      </span>
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
                    <h3 class="eiq-card__title">Suggested limits</h3>
                    <p class="eiq-card__subtitle">Three-month average spend, where there's history</p>
                  </div>
                </div>
                <div class="bd-suggest-list">
                  @for (cat of withSuggestions(); track cat.category) {
                    <div class="bd-suggest-row">
                      <span class="bd-cat-dot" [style.background]="cat.color"></span>
                      <span class="bd-suggest-row__name">{{ cat.category }}</span>
                      <span class="bd-suggest-row__spent">{{ cat.spent | eiqCurrency: false }} spent</span>
                      <span class="bd-suggest-row__avg">{{ cat.suggestion ?? 0 | eiqCurrency: false }} avg</span>
                    </div>
                  } @empty {
                    <p class="bd-empty">Not enough history yet for a suggestion.</p>
                  }
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </div>

    @if (editorOpen()) {
      <app-budget-editor (cancel)="editorOpen.set(false)" (saved)="saveLimits($event)" />
    }
  `,
  styles: [`
    .bd-nav { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .bd-nav__stepper {
      display: flex; align-items: center; gap: 2px;
      background: var(--eiq-surface); border: 1px solid var(--eiq-border);
      border-radius: var(--eiq-radius-sm); padding: 2px;
    }
    .eiq-month-btn {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border: none; border-radius: var(--eiq-radius-xs); background: transparent;
      color: var(--eiq-muted); cursor: pointer; transition: background 150ms ease, color 150ms ease;
      &:hover:not(:disabled) { background: var(--eiq-hover); color: var(--eiq-foreground); }
      &:disabled { opacity: 0.35; cursor: not-allowed; }
    }
    .eiq-month-label {
      min-width: 128px; text-align: center;
      font-size: 0.8125rem; font-weight: 700; color: var(--eiq-foreground);
      letter-spacing: -0.01em;
    }
    .bd-rollover { color: var(--eiq-green); font-weight: 600; }

    /* Empty-state call to action */
    .bd-cta { display: flex; align-items: center; gap: 14px; margin-bottom: 1rem; flex-wrap: wrap; }
    .bd-cta__icon {
      width: 44px; height: 44px; border-radius: var(--eiq-radius); flex-shrink: 0;
      background: var(--eiq-primary-soft); color: var(--eiq-primary);
      display: flex; align-items: center; justify-content: center;
    }
    .bd-cta__body { flex: 1; min-width: 220px; }
    .bd-cta__title { font-size: 0.875rem; font-weight: 700; color: var(--eiq-foreground); margin: 0; }
    .bd-cta__copy { font-size: 0.8125rem; color: var(--eiq-muted); margin: 2px 0 0; line-height: 1.45; }

    /* Table */
    .bd-cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .bd-muted { color: var(--eiq-faint); }
    .bd-carry {
      display: inline-block; margin-left: 4px; padding: 0 5px;
      font-size: 0.625rem; font-weight: 700;
      background: var(--eiq-green-12); color: var(--eiq-green); border-radius: 999px;
    }
    .bd-progress { display: flex; align-items: center; gap: 8px; min-width: 140px; }
    .bd-empty { padding: 1.5rem; text-align: center; font-size: 0.8125rem; color: var(--eiq-faint); }
    .bd-skeletons { display: flex; flex-direction: column; gap: 8px; }
    .bd-skeleton { height: 34px; border-radius: var(--eiq-radius-xs); background: var(--eiq-skeleton); }

    /* Suggestions */
    .bd-suggest-list { display: flex; flex-direction: column; }
    .bd-suggest-row {
      display: grid; grid-template-columns: 10px minmax(0, 1fr) auto auto;
      gap: 10px; align-items: center;
      padding: 0.5rem 0; border-bottom: 1px solid var(--eiq-border-subtle);
      font-size: 0.75rem;
      &:last-child { border-bottom: none; }
    }
    .bd-suggest-row__name { font-weight: 600; color: var(--eiq-foreground); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bd-suggest-row__spent { color: var(--eiq-muted); white-space: nowrap; }
    .bd-suggest-row__avg { font-weight: 700; color: var(--eiq-primary); white-space: nowrap; }

    @media (max-width: 640px) {
      .eiq-month-label { min-width: 96px; font-size: 0.75rem; }
    }
  `]
})
export class BudgetComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly budget = inject(BudgetService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly navItems = NAV_ITEMS;
  protected readonly warningAt = 80;
  protected readonly skeletonRows = Array.from({ length: 6 }, (_, i) => i);

  protected readonly editorOpen = signal(false);

  protected readonly overallColor = computed(() => {
    const { percentUsed, totalBudget } = this.budget.totals();
    if (!totalBudget) return 'var(--eiq-faint)';
    if (percentUsed >= 100) return 'var(--eiq-red)';
    if (percentUsed >= this.warningAt) return 'var(--eiq-amber)';
    return 'var(--eiq-primary)';
  });

  protected readonly barWidth = computed(() => Math.min(this.budget.totals().percentUsed, 100));

  protected readonly withSuggestions = computed(() =>
    this.budget.categories().filter((c) => c.suggestion !== null)
  );

  ngOnInit(): void {
    this.budget.load().subscribe();
  }

  protected reload(): void {
    this.budget.load().subscribe();
  }

  protected openEditor(): void {
    this.editorOpen.set(true);
  }

  protected saveLimits(limits: Record<string, number>): void {
    const count = Object.keys(limits).length;
    this.budget.saveLimits(limits);
    this.editorOpen.set(false);
    this.toast.success(
      count ? `Saved ${count} budget${count === 1 ? '' : 's'} for ${this.budget.monthLabel()}.` : 'Cleared all budget limits.'
    );
  }

  protected statusLabel(status: BudgetStatus): string {
    return STATUS_LABEL[status];
  }

  protected statusBadge(status: BudgetStatus): string {
    return STATUS_BADGE[status];
  }

  protected statusColor(status: BudgetStatus): string {
    return STATUS_COLOR[status];
  }

  protected min(value: number, max: number): number {
    return Math.min(value, max);
  }

  protected goTo(path: string): void {
    this.router.navigate([path]);
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}