import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CalendarService } from '../../core/services/calendar.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                <span class="eiq-breadcrumb__active">Calendar</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button class="eiq-month-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span class="eiq-month-label">{{ cal.monthLabel() }}</span>
              <button class="eiq-month-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
              <button class="eiq-range-btn" [class.eiq-range-btn--active]="cal.view() === 'month'" (click)="cal.setView('month')">Month</button>
              <button class="eiq-range-btn" [class.eiq-range-btn--active]="cal.view() === 'week'" (click)="cal.setView('week')">Week</button>
            </div>
          </div>

          <div class="cal-layout">
            <div class="eiq-card cal-card">
              <div class="cal-grid cal-grid--head">
                @for (d of cal.weekdays(); track d) { <span class="cal-weekday">{{ d }}</span> }
              </div>
              <div class="cal-grid">
                @for (day of cal.days(); track day.date + (day.inMonth ? 'm' : 'o')) {
                  <button class="cal-day" [class.cal-day--out]="!day.inMonth" [class.cal-day--today]="day.isToday"
                          [class.cal-day--selected]="cal.selectedDay() === day.date && day.inMonth" (click)="day.inMonth && cal.selectDay(day.date)">
                    <span class="cal-day__num">{{ day.date }}</span>
                    @for (entry of day.entries.slice(0, 2); track entry.label) {
                      <span class="cal-day__entry" [class]="'cal-day__entry--' + entry.type">
                        {{ entry.label }}@if (entry.amount) {<br/>{{ entry.amount > 0 ? '+' : '' }}{{ entry.amount }}}
                      </span>
                    }
                  </button>
                }
              </div>
            </div>

            <div class="cal-sidebar">
              <div class="eiq-card">
                <h3 class="cal-sidebar__title">{{ cal.monthLabel() }} Summary</h3>
                <div class="cal-summary-row">
                  <div>
                    <p class="cal-summary-row__label">Total Income</p>
                    <p class="cal-summary-row__value eiq-amount--pos">\${{ cal.monthSummary().totalIncome.toLocaleString() }}</p>
                  </div>
                  <div class="cal-summary-row__icon eiq-kpi-card__icon--green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6L13.5 15.5L8.5 10.5L1 18"/></svg>
                  </div>
                </div>
                <div class="cal-summary-row">
                  <div>
                    <p class="cal-summary-row__label">Total Expenses</p>
                    <p class="cal-summary-row__value eiq-amount--neg">\${{ cal.monthSummary().totalExpenses.toLocaleString() }}</p>
                  </div>
                  <div class="cal-summary-row__icon eiq-kpi-card__icon--red">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18L13.5 8.5L8.5 13.5L1 6"/></svg>
                  </div>
                </div>
                <div class="cal-summary-row">
                  <div>
                    <p class="cal-summary-row__label">Net Balance</p>
                    <p class="cal-summary-row__value">\${{ cal.monthSummary().netBalance.toLocaleString() }}</p>
                  </div>
                  <div class="cal-summary-row__icon eiq-kpi-card__icon--blue">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/></svg>
                  </div>
                </div>
              </div>

              <div class="eiq-card">
                <h3 class="cal-sidebar__title">Selected Day Detail</h3>
                <p class="cal-sidebar__date">June {{ cal.selectedDay() }}, {{ currentYear }}</p>
                <div class="cal-day-detail-list">
                  @for (txn of cal.selectedDayTransactions(); track txn.title) {
                    <div class="cal-day-detail">
                      <div class="cal-day-detail__icon" [class]="'cal-day-detail__icon--' + txn.type">
                        @if (txn.type === 'income') {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 6L13.5 15.5L8.5 10.5L1 18"/></svg>
                        } @else if (txn.type === 'expense') {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 18L13.5 8.5L8.5 13.5L1 6"/></svg>
                        } @else {
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        }
                      </div>
                      <div class="cal-day-detail__body">
                        <p class="cal-day-detail__title">{{ txn.title }}</p>
                        <p class="cal-day-detail__method">{{ txn.method }}</p>
                      </div>
                      @if (txn.amount) {
                        <span class="cal-day-detail__amount" [class.eiq-amount--pos]="txn.amount > 0" [class.eiq-amount--neg]="txn.amount < 0">
                          {{ txn.amount > 0 ? '+' : '' }}\${{ Math.abs(txn.amount) }}
                        </span>
                      } @else {
                        <span class="eiq-badge eiq-badge--warning">Due</span>
                      }
                    </div>
                  }
                </div>
                <button class="eiq-btn eiq-btn--primary cal-add-btn">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Transaction
                </button>
              </div>

              <div class="eiq-card">
                <h3 class="cal-sidebar__title">Upcoming Bills</h3>
                <div class="cal-bills-list">
                  @for (bill of cal.upcomingBills(); track bill.name) {
                    <div class="cal-bill-row">
                      <span class="cal-bill-row__name">{{ bill.name }}</span>
                      <span class="cal-bill-row__due">{{ bill.dueDate }}</span>
                      <span class="cal-bill-row__amount">\${{ bill.amount }}</span>
                    </div>
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
    .cal-layout { display: grid; grid-template-columns: 1fr 300px; gap: 1rem; align-items: start; }
    .cal-card { padding: 0.75rem; }
    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .cal-grid--head { margin-bottom: 4px; }
    .cal-weekday { font-size: 0.6875rem; font-weight: 700; color: var(--eiq-muted); text-align: center; padding: 4px 0; }
    .cal-day {
      min-height: 80px; border: 1px solid var(--eiq-border); border-radius: 0.5rem; background: var(--eiq-surface);
      display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 6px;
      cursor: pointer; text-align: left; transition: background 150ms ease, border-color 150ms ease;
      &:hover { border-color: var(--eiq-primary-40); background: var(--eiq-hover); }
    }
    .cal-day--out { opacity: 0.4; }
    .cal-day--today { background: var(--eiq-primary); border-color: var(--eiq-primary); color: #fff; }
    .cal-day--today .cal-day__num { color: #fff; }
    .cal-day--selected { box-shadow: 0 0 0 2px var(--eiq-primary); border-color: var(--eiq-primary); }
    .cal-day__num { font-size: 0.75rem; font-weight: 600; color: var(--eiq-foreground); }
    .cal-day__entry { font-size: 0.625rem; line-height: 1.2; border-radius: 4px; padding: 1px 4px; width: 100%; overflow: hidden; text-overflow: ellipsis; }
    .cal-day__entry--income  { background: var(--eiq-green-12); color: var(--eiq-green); }
    .cal-day__entry--expense { background: var(--eiq-red-10);   color: var(--eiq-red); }
    .cal-day__entry--due     { background: var(--eiq-amber-15); color: var(--eiq-amber); }
    .cal-sidebar { display: flex; flex-direction: column; gap: 1rem; }
    .cal-sidebar__title { font-size: 0.875rem; font-weight: 700; color: var(--eiq-foreground); margin: 0 0 0.75rem; }
    .cal-sidebar__date { font-size: 0.75rem; color: var(--eiq-muted); margin: -0.5rem 0 0.75rem; }
    .cal-summary-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
    .cal-summary-row__label { font-size: 0.6875rem; color: var(--eiq-muted); margin: 0; }
    .cal-summary-row__value { font-size: 1.125rem; font-weight: 700; color: var(--eiq-foreground); margin: 0; }
    .cal-summary-row__icon { width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; }
    .cal-day-detail-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .cal-day-detail { display: flex; align-items: center; gap: 0.5rem; }
    .cal-day-detail__icon { width: 1.75rem; height: 1.75rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .cal-day-detail__icon--income  { background: var(--eiq-green-12); color: var(--eiq-green); }
    .cal-day-detail__icon--expense { background: var(--eiq-red-10);   color: var(--eiq-red); }
    .cal-day-detail__icon--due     { background: var(--eiq-amber-15); color: var(--eiq-amber); }
    .cal-day-detail__body { flex: 1; min-width: 0; }
    .cal-day-detail__title { font-size: 0.75rem; font-weight: 600; color: var(--eiq-foreground); margin: 0; }
    .cal-day-detail__method { font-size: 0.6875rem; color: var(--eiq-muted); margin: 0; }
    .cal-day-detail__amount { font-size: 0.75rem; font-weight: 700; white-space: nowrap; }
    .cal-add-btn { width: 100%; justify-content: center; margin-top: 1rem; }
    .cal-bills-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .cal-bill-row { display: grid; grid-template-columns: 1fr auto auto; gap: 0.5rem; align-items: center; font-size: 0.75rem; padding: 0.375rem 0; }
    .cal-bill-row__name { color: var(--eiq-foreground); font-weight: 500; }
    .cal-bill-row__due { color: var(--eiq-muted); }
    .cal-bill-row__amount { color: var(--eiq-foreground); font-weight: 700; text-align: right; }
  `]
})
export class CalendarComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly cal = inject(CalendarService);
  protected readonly Math = Math;
  protected readonly currentYear = new Date().getFullYear();
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.cal.loadCalendar().subscribe();
  }

  goTo(path: string): void { this.router.navigate([path]); }
}
