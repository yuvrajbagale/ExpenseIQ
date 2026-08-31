import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export interface CalendarEntry {
  label: string;
  amount: number;
  type: 'income' | 'expense' | 'due';
}

export interface CalendarDay {
  date: number;
  inMonth: boolean;
  isToday?: boolean;
  isSelected?: boolean;
  entries: CalendarEntry[];
}

export interface DayTransaction {
  title: string;
  amount: number;
  type: 'income' | 'expense' | 'due';
  method: string;
}

export interface UpcomingBill {
  name: string;
  amount: number;
  dueDate: string;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/calendar`;

  private readonly _selectedDay = signal(new Date().getDate());
  private readonly _view = signal<'month' | 'week'>('month');
  private readonly _monthLabel = signal('');
  private readonly _entryMap = signal<Record<string, CalendarEntry[]>>({});
  private readonly _monthSummary = signal({ totalIncome: 0, totalExpenses: 0, netBalance: 0 });

  readonly selectedDay = computed(() => this._selectedDay());
  readonly view = computed(() => this._view());
  readonly monthLabel = computed(() => this._monthLabel());
  readonly weekdays = computed(() => WEEKDAYS);
  readonly monthSummary = computed(() => this._monthSummary());

  readonly days = computed(() => {
    const em = this._entryMap();
    const now = new Date();
    const today = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const firstDayOfWeek = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;

    const result: CalendarDay[] = [];
    for (let d = firstDayOfWeek; d > 0; d--) {
      const prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      result.push({ date: prevMonthDays - d + 1, inMonth: false, entries: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = String(d);
      result.push({
        date: d,
        inMonth: true,
        isToday: d === today,
        isSelected: d === this._selectedDay(),
        entries: em[key] ?? [],
      });
    }
    return result;
  });

  readonly selectedDayTransactions = computed(() => {
    const key = String(this._selectedDay());
    const em = this._entryMap();
    return (em[key] ?? []).map(e => ({
      title: e.label,
      amount: e.amount,
      type: e.type,
      method: e.type === 'income' ? 'Bank transfer' : 'Card payment',
    }));
  });

  readonly upcomingBills = computed(() => {
    const em = this._entryMap();
    const bills: UpcomingBill[] = [];
    Object.entries(em).forEach(([day, entries]) => {
      entries.forEach(e => {
        if (e.type === 'due' || e.type === 'expense') {
          bills.push({ name: e.label, amount: Math.abs(e.amount), dueDate: `Day ${day}` });
        }
      });
    });
    return bills.slice(0, 5);
  });

  loadCalendar(month?: number): Observable<void> {
    const params: any = {};
    if (month !== undefined) params.month = month;
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true, params }).pipe(
      map(response => {
        const d = response.data;
        this._monthLabel.set(d.month);
        this._entryMap.set(d.entryMap);
        this._monthSummary.set(d.summary);
      }),
      catchError(() => of(undefined))
    );
  }

  selectDay(date: number): void { this._selectedDay.set(date); }
  setView(view: 'month' | 'week'): void { this._view.set(view); }
}
