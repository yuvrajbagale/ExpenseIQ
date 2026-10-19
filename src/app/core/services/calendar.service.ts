import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export interface CalendarEntry {
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'due';
}

/** One cell of the grid, including the padding days borrowed from adjacent months. */
export interface CalendarDay {
  /** Day of the month this cell belongs to (1-based). */
  date: number;
  /** False for the leading/trailing padding days. */
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  entries: CalendarEntry[];
  /** `2025-08-14` — stable tracking key. */
  iso: string;
  /** `FRI` — pre-formatted so templates never parse an ISO string as UTC. */
  weekdayShort: string;
  /** `Friday, 14 August 2025` — announced instead of the bare number. */
  longLabel: string;
  /** Sum of the day's expenses, for the cell footer. */
  spent: number;
}

export interface DayTransaction {
  /** Stable `track` key — labels repeat across days, so the label alone is not unique. */
  key: string;
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'due';
}

/** Largest expense of the viewed month. */
export interface TopExpense {
  label: string;
  amount: number;
  day: number;
}

export type CalendarView = 'month' | 'week';

interface CalendarSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
}

interface CalendarPayload {
  month: string;
  year: number;
  entryMap: Record<string, CalendarEntry[]>;
  summary: CalendarSummary;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

/** Six weeks — the cell count that keeps the month grid rectangular year round. */
const GRID_CELLS = 42;

/** The seed dataset covers January–August 2025, so paging is bounded on both ends. */
const FIRST_MONTH = 0;
const LAST_MONTH = 7;
const LATEST_YEAR = 2025;
const LATEST_MONTH = 7;

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/calendar`;

  private readonly _year = signal(LATEST_YEAR);
  private readonly _month = signal(LATEST_MONTH);
  private readonly _selectedDay = signal<number | null>(null);
  private readonly _view = signal<CalendarView>('month');
  private readonly _entryMap = signal<Record<string, CalendarEntry[]>>({});
  private readonly _summary = signal<CalendarSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0,
  });
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);

  readonly year = computed(() => this._year());
  readonly month = computed(() => this._month());
  readonly view = computed(() => this._view());
  readonly weekdays = computed(() => WEEKDAYS);
  readonly monthSummary = computed(() => this._summary());
  readonly isLoading = computed(() => this._loading());
  readonly loadError = computed(() => this._failed());

  readonly canGoPrev = computed(() => this._month() > FIRST_MONTH);
  readonly canGoNext = computed(() => this._month() < LAST_MONTH);

  /** `August 2025`, derived from the requested month rather than the system clock. */
  readonly monthLabel = computed(() =>
    new Date(this._year(), this._month(), 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  );

  /** Full month grid — always 42 cells so the layout never reflows between months. */
  readonly days = computed<CalendarDay[]>(() => {
    const year = this._year();
    const month = this._month();
    const selected = this._selectedDay();
    const entryMap = this._entryMap();
    const now = new Date();

    // Monday-first offset of the 1st, then walk forward across the whole grid.
    const leading = (new Date(year, month, 1).getDay() + 6) % 7;
    const viewingCurrentMonth =
      year === now.getFullYear() && month === now.getMonth();

    const cells: CalendarDay[] = [];
    for (let i = 0; i < GRID_CELLS; i++) {
      const date = new Date(year, month, 1 - leading + i);
      const inMonth = date.getMonth() === month;
      const dayOfMonth = date.getDate();
      const entries = inMonth ? (entryMap[String(dayOfMonth)] ?? []) : [];

      cells.push({
        date: dayOfMonth,
        inMonth,
        isToday: inMonth && viewingCurrentMonth && dayOfMonth === now.getDate(),
        isSelected: inMonth && selected === dayOfMonth,
        entries,
        iso: toIso(date),
        // Cell i sits `leading + i` days past the Monday that opens the grid.
        weekdayShort: WEEKDAYS[i % 7],
        longLabel: date.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        spent: entries
          .filter((e) => e.type === 'expense')
          .reduce((sum, e) => sum + Math.abs(e.amount), 0),
      });
    }
    return cells;
  });

  /** The seven days of the week containing the selection (or of the 1st). */
  readonly weekDays = computed<CalendarDay[]>(() => {
    const all = this.days();
    const anchor = all.findIndex((d) => d.inMonth && d.isSelected);
    const fallback = anchor >= 0 ? anchor : all.findIndex((d) => d.inMonth);
    const start = Math.max(0, Math.floor(fallback / 7) * 7);
    return all.slice(start, start + 7);
  });

  readonly hasEntries = computed(() =>
    Object.values(this._entryMap()).some((entries) => entries.length > 0)
  );

  readonly selectedDayTransactions = computed<DayTransaction[]>(() => {
    const selected = this._selectedDay();
    if (selected === null) return [];
    return (this._entryMap()[String(selected)] ?? []).map((entry, i) => ({
      key: `${selected}-${i}`,
      title: entry.label,
      amount: entry.amount,
      type: entry.type,
    }));
  });

  /** `Friday, 14 August 2025` for the detail card heading. */
  readonly selectedDayLabel = computed(() => {
    const selected = this._selectedDay();
    if (selected === null) return 'No day selected';
    return new Date(this._year(), this._month(), selected).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  /** The month's biggest expenses — real entries, real days. */
  readonly topExpenses = computed<TopExpense[]>(() => {
    return Object.entries(this._entryMap())
      .flatMap(([day, entries]) =>
        entries
          .filter((e) => e.type === 'expense')
          .map((e) => ({ label: e.label, amount: Math.abs(e.amount), day: Number(day) }))
      )
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  });

  loadCalendar(month: number = this._month()): Observable<void> {
    const target = clamp(month, FIRST_MONTH, LAST_MONTH);
    const params = new HttpParams().set('month', String(target));
    this._loading.set(true);
    this._failed.set(false);

    return this.http
      .get<ApiResponse<CalendarPayload>>(this.apiUrl, { withCredentials: true, params })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          const monthChanged = target !== this._month();
          this._month.set(target);
          this._year.set(data.year);
          this._entryMap.set(data.entryMap ?? {});
          this._summary.set(data.summary);
          // A selection only survives while the month stays put.
          if (monthChanged) this._selectedDay.set(this.todayIn(data.year, target));
        }),
        catchError(() => {
          this._failed.set(true);
          return of(undefined);
        }),
        finalize(() => this._loading.set(false)),
        map(() => undefined)
      );
  }

  nextMonth(): void {
    if (this.canGoNext()) this.loadCalendar(this._month() + 1).subscribe();
  }

  prevMonth(): void {
    if (this.canGoPrev()) this.loadCalendar(this._month() - 1).subscribe();
  }

  /** Jumps back to the most recent month in the dataset. */
  goToLatest(): void {
    if (this._month() !== LATEST_MONTH) this.loadCalendar(LATEST_MONTH).subscribe();
  }

  selectDay(date: number): void {
    this._selectedDay.set(this._selectedDay() === date ? null : date);
  }

  setView(view: CalendarView): void {
    this._view.set(view);
  }

  /** Today when the requested month is the current one, otherwise the 1st. */
  private todayIn(year: number, month: number): number {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth() ? now.getDate() : 1;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toIso(date: Date): string {
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}