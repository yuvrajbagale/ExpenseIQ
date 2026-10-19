import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { RecurringService, RecurringFrequency, RecurringStatus } from '../../core/services/recurring.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-recurring',
  standalone: true,
  imports: [TitleCasePipe, SidebarComponent, HeaderComponent, IconComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" searchPlaceholder="Search transactions, categoriesâ€¦" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Recurring Expenses</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <eiq-icon name="lucideChevronRight" [size]="12" [strokeWidth]="2" anim="slide" />
                <span class="eiq-breadcrumb__active">Recurring Expenses</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-btn eiq-btn--primary eiq-btn--sm">
                <eiq-icon name="lucidePlus" [size]="14" [strokeWidth]="2" anim="draw" />
                Add Recurring
              </button>
            </div>
          </div>

          <div class="eiq-kpi-grid eiq-kpi-grid--3">
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label">Total Recurring / Month</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--blue">
                  <eiq-icon name="lucideRefreshCw" [size]="16" [strokeWidth]="2" anim="pop" />
                </div>
              </div>
              <p class="eiq-kpi-card__value">\${{ recurring.totals().totalMonthly.toLocaleString() }}</p>
              <p class="eiq-kpi-card__caption">{{ recurring.totals().activeCount }} active subscriptions</p>
            </div>
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label">Active Subscriptions</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--green">
                  <eiq-icon name="lucideCheck" [size]="16" [strokeWidth]="2" anim="pop" />
                </div>
              </div>
              <p class="eiq-kpi-card__value">{{ recurring.totals().activeCount }}</p>
              <p class="eiq-kpi-card__caption">All running smoothly</p>
            </div>
            <div class="eiq-kpi-card">
              <div class="eiq-kpi-card__header">
                <p class="eiq-kpi-card__label">Next Due This Week</p>
                <div class="eiq-kpi-card__icon eiq-kpi-card__icon--amber">
                  <eiq-icon name="lucideClock" [size]="16" [strokeWidth]="2" anim="pop" />
                </div>
              </div>
              <p class="eiq-kpi-card__value">{{ recurring.totals().dueThisWeek }}</p>
              <p class="eiq-kpi-card__caption">Renewals upcoming</p>
            </div>
          </div>

          <div class="eiq-card eiq-filter-bar">
            <div class="eiq-filter-bar__search">
              <eiq-icon name="lucideSearch" [size]="16" [strokeWidth]="2" anim="none" />
              <input class="eiq-filter-bar__input" type="text" placeholder="Search recurring expensesâ€¦" (input)="onSearch($event)" />
            </div>
            <div class="eiq-filter-bar__filters">
              <select class="eiq-select" (change)="onFrequencyChange($event)">
                <option value="all">All Frequencies</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
              </select>
              <select class="eiq-select" (change)="onCategoryChange($event)">
                <option value="all">All Categories</option>
                @for (c of categoryOptions(); track c) { <option [value]="c">{{ c }}</option> }
              </select>
              <select class="eiq-select" (change)="onStatusChange($event)">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
              <button class="eiq-btn eiq-btn--ghost eiq-btn--sm" (click)="recurring.resetFilters()">
                <eiq-icon name="lucideX" [size]="14" [strokeWidth]="2" anim="pop" />
                Reset Filters
              </button>
            </div>
          </div>

          <div class="eiq-card">
            <div class="eiq-card__header">
              <div>
                <h3 class="eiq-card__title">Recurring Expenses List</h3>
              </div>
            </div>
            <div class="eiq-txn-table-wrap">
              <table class="eiq-txn-table">
                <thead>
                  <tr>
                    <th class="eiq-txn-th">Name</th>
                    <th class="eiq-txn-th">Category</th>
                    <th class="eiq-txn-th eiq-txn-th--right">Amount</th>
                    <th class="eiq-txn-th">Frequency</th>
                    <th class="eiq-txn-th">Next Due</th>
                    <th class="eiq-txn-th">Payment</th>
                    <th class="eiq-txn-th">Status</th>
                    <th class="eiq-txn-th eiq-txn-th--center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of recurring.filteredItems(); track item.id; let i = $index) {
                    <tr class="eiq-txn-row" [class.eiq-txn-row--alt]="i % 2 === 0">
                      <td class="eiq-txn-td">
                        <div class="eiq-cat-cell">
                          <span class="eiq-budget-icon" [style.background]="item.iconBg" [style.color]="item.iconColor">{{ item.icon }}</span>
                          <span class="eiq-cat-name">{{ item.name }}</span>
                        </div>
                      </td>
                      <td class="eiq-txn-td"><span class="eiq-badge eiq-badge--neutral">{{ item.category }}</span></td>
                      <td class="eiq-txn-td eiq-txn-td--right eiq-amount--neg">-\${{ item.amount.toFixed(2) }}</td>
                      <td class="eiq-txn-td eiq-txn-td--muted">{{ item.frequency | titlecase }}</td>
                      <td class="eiq-txn-td">
                        {{ item.nextDue }}
                        @if (item.dueSoon) { <span class="eiq-badge eiq-badge--warning">Due Soon</span> }
                      </td>
                      <td class="eiq-txn-td eiq-txn-td--muted">{{ item.payment }}</td>
                      <td class="eiq-txn-td"><span class="eiq-badge" [class]="item.status === 'active' ? 'eiq-badge--success' : 'eiq-badge--neutral'">{{ item.status | titlecase }}</span></td>
                      <td class="eiq-txn-td eiq-txn-td--center">
                        <div class="eiq-txn-actions">
                          <button class="eiq-icon-btn" title="Edit">
                            <eiq-icon name="lucidePencil" [size]="14" [strokeWidth]="2" anim="pop" />
                          </button>
                          <button class="eiq-icon-btn" title="Toggle status" (click)="recurring.toggleStatus(item.id)">
                            <eiq-icon name="lucideRefreshCw" [size]="14" [strokeWidth]="2" anim="pop" />
                          </button>
                          <button class="eiq-icon-btn eiq-icon-btn--danger" title="Delete" (click)="recurring.remove(item.id)">
                            <eiq-icon name="lucideTrash2" [size]="14" [strokeWidth]="2" anim="pop" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="8" class="eiq-txn-empty"><p>No recurring expenses found</p></td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <div class="eiq-bottom-grid">
            <div class="eiq-card">
              <h3 class="eiq-card__title">Upcoming Renewals</h3>
              <p class="eiq-card__subtitle">Next 5 scheduled renewals</p>
              <div class="renewals-list">
                @for (r of recurring.upcomingRenewals(); track r.name) {
                  <div class="renewal-row">
                    <span class="renewal-row__dot" [class.renewal-row__dot--soon]="r.dueSoon"></span>
                    <span class="renewal-row__name">{{ r.name }}</span>
                    <span class="renewal-row__due">{{ r.dueDate }} @if (r.dueSoon) {<span class="eiq-badge eiq-badge--warning">Due Soon</span>}</span>
                    <span class="renewal-row__amount eiq-amount--neg">-\${{ r.amount.toFixed(2) }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="eiq-card">
              <h3 class="eiq-card__title">Monthly Recurring Summary</h3>
              <p class="eiq-card__subtitle">Breakdown by category</p>
              <div class="eiq-donut-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  @for (seg of donutSegments(); track seg.category) {
                    <circle cx="70" cy="70" r="52" fill="none" [attr.stroke]="seg.color" stroke-width="18"
                            [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset" transform="rotate(-90 70 70)" />
                  }
                </svg>
                <ul class="eiq-donut-legend">
                  @for (seg of recurring.categorySlices(); track seg.category) {
                    <li class="eiq-donut-legend__item">
                      <span class="eiq-donut-legend__dot" [style.background]="seg.color"></span>
                      <span class="eiq-donut-legend__name">{{ seg.category }}</span>
                      <span class="eiq-donut-legend__pct">\${{ seg.amount }}</span>
                    </li>
                  }
                  <li class="eiq-donut-legend__item renewals-total">
                    <span class="eiq-donut-legend__name">Total / Month</span>
                    <span class="eiq-donut-legend__pct">\${{ recurring.totals().totalMonthly.toLocaleString() }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .renewals-list { display: flex; flex-direction: column; gap: 0.625rem; margin-top: 0.75rem; }
    .renewal-row { display: grid; grid-template-columns: 8px 1fr auto auto; gap: 0.5rem; align-items: center; font-size: 0.75rem; }
    :host .eiq-txn-row { transition: background-color 200ms ease; }
    :host .eiq-txn-row:hover { background-color: var(--eiq-muted-bg, rgba(0, 0, 0, 0.03)); }
    .renewal-row__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--eiq-border); }
    .renewal-row__dot--soon { background: var(--eiq-amber); }
    .renewal-row__name { color: var(--eiq-foreground); font-weight: 500; }
    .renewal-row__due { color: var(--eiq-muted); display: flex; align-items: center; gap: 4px; white-space: nowrap; }
    .renewal-row__amount { font-weight: 700; white-space: nowrap; }
    .renewals-total { border-top: 1px solid var(--eiq-border); padding-top: 0.5rem; margin-top: 0.25rem; font-weight: 700; }
  `]
})
export class RecurringComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly recurring = inject(RecurringService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.recurring.loadRecurring().subscribe();
  }

  categoryOptions = computed(() => Array.from(new Set(this.recurring.filteredItems().map(i => i.category))));

  donutSegments = computed(() => {
    const slices = this.recurring.categorySlices();
    const total = slices.reduce((a, s) => a + s.amount, 0);
    const circumference = 2 * Math.PI * 52;
    let cumulative = 0;
    return slices.map(s => {
      const pct = s.amount / total;
      const dash = pct * circumference;
      const offset = circumference - (cumulative / total) * circumference;
      cumulative += s.amount;
      return { ...s, dash: `${dash} ${circumference - dash}`, offset };
    });
  });

  onSearch(e: Event): void { this.recurring.setSearch((e.target as HTMLInputElement).value); }
  onFrequencyChange(e: Event): void { this.recurring.setFrequencyFilter((e.target as HTMLSelectElement).value as 'all' | RecurringFrequency); }
  onCategoryChange(e: Event): void { this.recurring.setCategoryFilter((e.target as HTMLSelectElement).value); }
  onStatusChange(e: Event): void { this.recurring.setStatusFilter((e.target as HTMLSelectElement).value as 'all' | RecurringStatus); }

  goTo(path: string): void { this.router.navigate([path]); }
}
