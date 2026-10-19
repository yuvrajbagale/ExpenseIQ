import { Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CalendarDay, CalendarService } from '../../core/services/calendar.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';
import { IconComponent } from '../../shared/components/icon.component';
import { EiqCurrencyPipe } from '../../shared/pipes/eiq-currency.pipe';

const TYPE_ICON: Record<string, string> = {
  income: 'lucideTrendingUp',
  expense: 'lucideTrendingDown',
  due: 'lucideClock',
};

/** One skeleton per grid cell. */
const GRID_CELLS = Array.from({ length: 42 }, (_, i) => i);

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [RouterLink, SidebarComponent, HeaderComponent, IconComponent, EiqCurrencyPipe],
  template: `
    <div class="eiq-app">
      <eiq-sidebar (logoutClicked)="authService.logout()" />
      <div class="eiq-main">
        <eiq-header [currentUser]="authService.currentUser()" [notificationCount]="3" searchPlaceholder="Search transactions, categories…" />
        <main class="eiq-content">

          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Calendar</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <eiq-icon name="lucideChevronRight" [size]="12" [strokeWidth]="2" anim="slide" />
                <span class="eiq-breadcrumb__active">Calendar</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions cal-nav">
              <div class="cal-nav__stepper">
                <button type="button" class="eiq-month-btn" aria-label="Previous month"
                        [disabled]="!cal.canGoPrev()" (click)="cal.prevMonth()">
                  <eiq-icon name="lucideChevronLeft" [size]="15" [strokeWidth]="2.2" anim="pop" />
                </button>
                <span class="eiq-month-label">{{ cal.monthLabel() }}</span>
                <button type="button" class="eiq-month-btn" aria-label="Next month"
                        [disabled]="!cal.canGoNext()" (click)="cal.nextMonth()">
                  <eiq-icon name="lucideChevronRight" [size]="15" [strokeWidth]="2.2" anim="pop" />
                </button>
              </div>

              <div class="cal-segment" role="group" aria-label="Calendar view">
                <button type="button" class="cal-segment__btn"
                        [class.cal-segment__btn--active]="cal.view() === 'month'"
                        [attr.aria-pressed]="cal.view() === 'month'"
                        (click)="cal.setView('month')">Month</button>
                <button type="button" class="cal-segment__btn"
                        [class.cal-segment__btn--active]="cal.view() === 'week'"
                        [attr.aria-pressed]="cal.view() === 'week'"
                        (click)="cal.setView('week')">Week</button>
              </div>
            </div>
          </div>

          <div class="cal-layout">
            <div class="eiq-card cal-card">
              <div class="cal-card__head">
                <div>
                  <h2 class="eiq-card__title">{{ cal.monthLabel() }}</h2>
                  <p class="eiq-card__subtitle">{{ cal.days().length / 7 }} weeks · {{ entryCount() }} entries</p>
                </div>
                <button type="button" class="cal-today-btn" (click)="cal.goToLatest()">Latest</button>
              </div>

              <div class="cal-grid cal-grid--head" aria-hidden="true">
                @for (d of cal.weekdays(); track d) { <span class="cal-weekday">{{ d }}</span> }
              </div>

              @if (cal.isLoading()) {
                <div class="cal-grid" aria-hidden="true">
                  @for (i of skeletonCells; track i) {
                    <div class="cal-skeleton"></div>
                  }
                </div>
              } @else if (cal.view() === 'week') {
                <div class="cal-week">
                  @for (day of cal.weekDays(); track day.iso) {
                    <button type="button" class="cal-week__day"
                            [class.cal-week__day--selected]="day.isSelected"
                            [attr.aria-pressed]="day.isSelected"
                            [attr.aria-label]="day.longLabel"
                            [disabled]="!day.inMonth"
                            (click)="cal.selectDay(day.date)">
                      <span class="cal-week__label">{{ day.weekdayShort }}</span>
                      <span class="cal-week__num" [class.cal-week__num--today]="day.isToday">{{ day.date }}</span>
                      <span class="cal-week__amount">
                        @if (day.spent) { {{ day.spent | eiqCurrency: false }} }
                      </span>
                    </button>
                  }
                </div>
              } @else {
                <div class="cal-grid">
                  @for (day of cal.days(); track day.iso) {
                    <button type="button" class="cal-day"
                            [class.cal-day--out]="!day.inMonth"
                            [class.cal-day--today]="day.isToday"
                            [class.cal-day--selected]="day.isSelected"
                            [class.cal-day--empty]="!day.entries.length"
                            [disabled]="!day.inMonth"
                            [attr.aria-pressed]="day.isSelected"
                            [attr.aria-label]="dayLabel(day)"
                            (click)="cal.selectDay(day.date)">
                      <span class="cal-day__num">{{ day.date }}</span>
                      <span class="cal-day__entries">
                        @for (entry of day.entries.slice(0, 2); track entry.label + entry.amount) {
                          <span class="cal-day__entry" [class]="'cal-day__entry--' + entry.type">
                            {{ entry.label }}
                          </span>
                        }
                        @if (day.entries.length > 2) {
                          <span class="cal-day__more">+{{ day.entries.length - 2 }} more</span>
                        }
                      </span>
                      @if (day.spent) {
                        <span class="cal-day__spent">{{ day.spent | eiqCurrency: false }}</span>
                      }
                    </button>
                  }
                </div>

                @if (!cal.hasEntries()) {
                  <div class="cal-empty">
                    <eiq-icon name="lucideCalendarDays" [size]="36" [strokeWidth]="1.3" />
                    <p class="eiq-empty-state__title">No activity this month</p>
                    <p class="eiq-empty-state__desc">
                      Nothing was recorded for {{ cal.monthLabel() }}. Try another month, or add a transaction.
                    </p>
                    <a class="eiq-btn eiq-btn--primary eiq-btn--sm" style="margin-top:12px"
                       routerLink="/transactions/add">Add transaction</a>
                  </div>
                }
              }
            </div>

            <div class="cal-sidebar">
              <div class="eiq-card">
                <h3 class="cal-sidebar__title">{{ cal.monthLabel() }} summary</h3>
                <div class="cal-summary-row">
                  <div>
                    <p class="cal-summary-row__label">Total income</p>
                    <p class="cal-summary-row__value eiq-amount--pos">
                      {{ cal.monthSummary().totalIncome | eiqCurrency: false }}
                    </p>
                  </div>
                  <div class="cal-summary-row__icon cal-summary-row__icon--in">
                    <eiq-icon name="lucideTrendingUp" [size]="16" [strokeWidth]="2" anim="pop" />
                  </div>
                </div>
                <div class="cal-summary-row">
                  <div>
                    <p class="cal-summary-row__label">Total expenses</p>
                    <p class="cal-summary-row__value eiq-amount--neg">
                      {{ cal.monthSummary().totalExpenses | eiqCurrency: false }}
                    </p>
                  </div>
                  <div class="cal-summary-row__icon cal-summary-row__icon--out">
                    <eiq-icon name="lucideTrendingDown" [size]="16" [strokeWidth]="2" anim="pop" />
                  </div>
                </div>
                <div class="cal-summary-row cal-summary-row--net">
                  <div>
                    <p class="cal-summary-row__label">Net balance</p>
                    <p class="cal-summary-row__value">{{ cal.monthSummary().netBalance | eiqCurrency: false }}</p>
                  </div>
                  <div class="cal-summary-row__icon cal-summary-row__icon--net">
                    <eiq-icon name="lucideWallet" [size]="16" [strokeWidth]="2" anim="pop" />
                  </div>
                </div>
              </div>

              <div class="eiq-card">
                <h3 class="cal-sidebar__title">Day detail</h3>
                <p class="cal-sidebar__date">{{ cal.selectedDayLabel() }}</p>

                <div class="cal-day-detail-list">
                  @for (txn of cal.selectedDayTransactions(); track txn.key) {
                    <div class="cal-day-detail">
                      <div class="cal-day-detail__icon" [class]="'cal-day-detail__icon--' + txn.type">
                        <eiq-icon [name]="typeIcon(txn.type)" [size]="14" [strokeWidth]="2" anim="pop" />
                      </div>
                      <div class="cal-day-detail__body">
                        <p class="cal-day-detail__title">{{ txn.title }}</p>
                        <p class="cal-day-detail__method">{{ txn.type }}</p>
                      </div>
                      <span class="cal-day-detail__amount"
                            [class.eiq-amount--pos]="txn.amount > 0"
                            [class.eiq-amount--neg]="txn.amount < 0">
                        {{ txn.amount | eiqCurrency }}
                      </span>
                    </div>
                  } @empty {
                    <div class="cal-inline-empty">
                      <p>Select a day to see what was recorded.</p>
                    </div>
                  }
                </div>

                <a class="eiq-btn eiq-btn--primary cal-add-btn" routerLink="/transactions/add">
                  <eiq-icon name="lucidePlus" [size]="14" [strokeWidth]="2" anim="draw" />
                  Add transaction
                </a>
              </div>

              <div class="eiq-card">
                <h3 class="cal-sidebar__title">Biggest spends</h3>
                <div class="cal-bills-list">
                  @for (bill of cal.topExpenses(); track bill.label + bill.day) {
                    <div class="cal-bill-row">
                      <span class="cal-bill-row__name">{{ bill.label }}</span>
                      <span class="cal-bill-row__due">{{ monthShort() }} {{ bill.day }}</span>
                      <span class="cal-bill-row__amount">{{ bill.amount | eiqCurrency: false }}</span>
                    </div>
                  } @empty {
                    <p class="cal-inline-empty">No expenses recorded this month.</p>
                  }
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    .cal-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 1rem; align-items: start; }
    .cal-card { padding: 0.875rem; }
    .cal-card__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 0.75rem; }

    /* ── Header controls ── */
    .cal-nav { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .cal-nav__stepper {
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
      letter-spacing: -0.01em; text-transform: capitalize;
    }
    .cal-segment {
      display: flex; gap: 2px; padding: 2px;
      background: var(--eiq-surface); border: 1px solid var(--eiq-border);
      border-radius: var(--eiq-radius-sm);
    }
    .cal-segment__btn {
      padding: 5px 12px; border: none; border-radius: var(--eiq-radius-xs);
      background: transparent; color: var(--eiq-muted);
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
      &:hover { color: var(--eiq-foreground); }
    }
    .cal-segment__btn--active { background: var(--eiq-primary); color: #fff; &:hover { color: #fff; } }
    .cal-today-btn {
      padding: 4px 10px; border-radius: 999px;
      border: 1px solid var(--eiq-border-strong); background: transparent;
      color: var(--eiq-muted); font-size: 0.6875rem; font-weight: 700;
      cursor: pointer; transition: background 150ms ease, color 150ms ease;
      &:hover { background: var(--eiq-hover); color: var(--eiq-foreground); }
    }

    /* ── Grid ── */
    .cal-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
    .cal-grid--head { margin-bottom: 6px; }
    .cal-weekday {
      font-size: 0.625rem; font-weight: 700; color: var(--eiq-faint);
      text-align: center; letter-spacing: 0.06em; padding: 2px 0;
    }
    .cal-day {
      min-height: 92px; padding: 6px 6px 5px;
      border: 1px solid var(--eiq-border-subtle); border-radius: var(--eiq-radius-sm);
      background: var(--eiq-surface);
      display: flex; flex-direction: column; align-items: stretch; gap: 3px;
      cursor: pointer; text-align: left;
      transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
      &:hover:not(:disabled) { border-color: var(--eiq-primary-40); background: var(--eiq-hover); }
      &:disabled { cursor: default; }
    }
    .cal-day--out { opacity: 0.35; border-color: transparent; background: transparent; }
    .cal-day--empty { background: color-mix(in srgb, var(--eiq-surface) 60%, transparent); }
    .cal-day--today { border-color: var(--eiq-primary); }
    .cal-day__num {
      font-size: 0.6875rem; font-weight: 700; color: var(--eiq-muted);
      width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
      border-radius: 50%; flex-shrink: 0;
    }
    .cal-day--today .cal-day__num { background: var(--eiq-primary); color: #fff; }
    .cal-day--selected {
      box-shadow: 0 0 0 2px var(--eiq-primary-ring); border-color: var(--eiq-primary);
      background: var(--eiq-primary-softer);
    }
    .cal-day__entries { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .cal-day__entry {
      font-size: 0.625rem; line-height: 1.35; font-weight: 600;
      padding: 2px 4px; border-radius: 4px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .cal-day__entry--income  { background: var(--eiq-green-12); color: var(--eiq-green); }
    .cal-day__entry--expense { background: var(--eiq-red-10);   color: var(--eiq-red); }
    .cal-day__entry--due     { background: var(--eiq-amber-15); color: var(--eiq-amber); }
    .cal-day__more { font-size: 0.625rem; font-weight: 700; color: var(--eiq-faint); padding-left: 2px; }
    .cal-day__spent {
      margin-top: auto; font-size: 0.625rem; font-weight: 700;
      color: var(--eiq-faint); text-align: right;
    }
    .cal-skeleton { min-height: 92px; border-radius: var(--eiq-radius-sm); background: var(--eiq-skeleton); }
    .cal-empty { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.5rem 1rem 0.5rem; color: var(--eiq-faint); }

    /* ── Week strip ── */
    .cal-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; padding: 0.75rem 0; }
    .cal-week__day {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 0.75rem 4px; border-radius: var(--eiq-radius-sm);
      border: 1px solid var(--eiq-border-subtle); background: var(--eiq-surface);
      cursor: pointer; transition: background 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
      &:hover { border-color: var(--eiq-primary-40); background: var(--eiq-hover); }
    }
    .cal-week__day--selected { border-color: var(--eiq-primary); box-shadow: 0 0 0 2px var(--eiq-primary-ring); background: var(--eiq-primary-softer); }
    .cal-week__label { font-size: 0.625rem; font-weight: 700; letter-spacing: 0.06em; color: var(--eiq-faint); }
    .cal-week__num {
      font-size: 1.0625rem; font-weight: 700; color: var(--eiq-foreground);
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%;
    }
    .cal-week__num--today { background: var(--eiq-primary); color: #fff; }
    .cal-week__amount { font-size: 0.6875rem; font-weight: 600; color: var(--eiq-muted); min-height: 1rem; }

    /* ── Sidebar ── */
    .cal-sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .cal-sidebar__title { font-size: 0.875rem; font-weight: 700; color: var(--eiq-foreground); margin: 0 0 0.75rem; text-transform: capitalize; }
    .cal-sidebar__date { font-size: 0.75rem; color: var(--eiq-muted); margin: -0.5rem 0 0.75rem; }
    .cal-summary-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 0.5rem 0; }
    .cal-summary-row--net { border-top: 1px solid var(--eiq-border-subtle); margin-top: 0.25rem; padding-top: 0.75rem; }
    .cal-summary-row__label { font-size: 0.6875rem; color: var(--eiq-muted); margin: 0; }
    .cal-summary-row__value { font-size: 1.125rem; font-weight: 700; color: var(--eiq-foreground); margin: 0; letter-spacing: -0.02em; }
    .cal-summary-row__icon { width: 2rem; height: 2rem; border-radius: var(--eiq-radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cal-summary-row__icon--in  { background: var(--eiq-green-12); color: var(--eiq-green); }
    .cal-summary-row__icon--out { background: var(--eiq-red-10);   color: var(--eiq-red); }
    .cal-summary-row__icon--net { background: var(--eiq-primary-soft); color: var(--eiq-primary); }
    .cal-day-detail-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .cal-day-detail { display: flex; align-items: center; gap: 0.5rem; }
    .cal-day-detail__icon { width: 1.75rem; height: 1.75rem; border-radius: var(--eiq-radius-sm); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cal-day-detail__icon--income  { background: var(--eiq-green-12); color: var(--eiq-green); }
    .cal-day-detail__icon--expense { background: var(--eiq-red-10);   color: var(--eiq-red); }
    .cal-day-detail__icon--due     { background: var(--eiq-amber-15); color: var(--eiq-amber); }
    .cal-day-detail__body { flex: 1; min-width: 0; }
    .cal-day-detail__title {
      font-size: 0.75rem; font-weight: 600; color: var(--eiq-foreground); margin: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .cal-day-detail__method { font-size: 0.6875rem; color: var(--eiq-muted); margin: 0; text-transform: capitalize; }
    .cal-day-detail__amount { font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .cal-inline-empty { font-size: 0.75rem; color: var(--eiq-faint); text-align: center; padding: 0.5rem 0; margin: 0; }
    .cal-add-btn { width: 100%; justify-content: center; margin-top: 1rem; }
    .cal-bills-list { display: flex; flex-direction: column; }
    .cal-bill-row {
      display: grid; grid-template-columns: minmax(0, 1fr) auto auto; gap: 0.5rem; align-items: center;
      font-size: 0.75rem; padding: 0.4375rem 0; border-bottom: 1px solid var(--eiq-border-subtle);
      &:last-child { border-bottom: none; }
    }
    .cal-bill-row__name { color: var(--eiq-foreground); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cal-bill-row__due { color: var(--eiq-muted); white-space: nowrap; }
    .cal-bill-row__amount { color: var(--eiq-foreground); font-weight: 700; text-align: right; }

    @media (max-width: 900px) {
      .cal-layout { grid-template-columns: minmax(0, 1fr); }
      .cal-day { min-height: 64px; }
      .cal-day__spent { display: none; }
    }
    @media (max-width: 640px) {
      .cal-card { padding: 0.625rem; }
      .eiq-month-label { min-width: 96px; font-size: 0.75rem; }
      .cal-day { min-height: 52px; padding: 4px; }
      .cal-day__entries { display: none; }
    }
  `]
})
export class CalendarComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly cal = inject(CalendarService);
  private readonly router = inject(Router);

  protected readonly skeletonCells = GRID_CELLS;
  protected readonly typeIcon = (type: string): string => TYPE_ICON[type] ?? TYPE_ICON['due'];

  /** Total entries in the month, shown under the card heading. */
  protected readonly entryCount = computed(() =>
    this.cal.days().reduce((sum, day) => sum + day.entries.length, 0)
  );

  protected readonly monthShort = computed(() =>
    new Date(this.cal.year(), this.cal.month(), 1).toLocaleDateString('en-US', { month: 'short' })
  );

  ngOnInit(): void {
    this.cal.loadCalendar().subscribe();
  }

  /** `Friday, 14 August 2025 — 3 entries`, announced instead of the bare number. */
  protected dayLabel(day: CalendarDay): string {
    return `${day.longLabel} — ${day.entries.length} ${day.entries.length === 1 ? 'entry' : 'entries'}`;
  }

  protected goTo(path: string): void {
    this.router.navigate([path]);
  }
}