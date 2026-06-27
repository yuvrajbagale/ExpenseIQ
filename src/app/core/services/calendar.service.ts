import { Injectable, computed, signal } from '@angular/core';

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

function buildJune2025(): CalendarDay[] {
  const days: CalendarDay[] = [];
  // Leading days from May
  for (let d = 26; d <= 31; d++) days.push({ date: d, inMonth: false, entries: [] });

  const entryMap: Record<number, CalendarEntry[]> = {
    1:  [{ label: 'Food',   amount: -84.50, type: 'expense' }],
    2:  [{ label: 'Rent Due', amount: 0, type: 'due' }],
    3:  [{ label: 'Uber',   amount: -18.75, type: 'expense' }],
    4:  [{ label: 'Salary', amount: 5200,   type: 'income'  }],
    5:  [{ label: 'Bill',   amount: -65.00, type: 'expense' }],
    7:  [{ label: 'Health', amount: -22.75, type: 'expense' }],
    8:  [{ label: 'Insurance', amount: 0, type: 'due' }],
    9:  [{ label: 'Netflix', amount: -15.99, type: 'expense' }],
    10: [{ label: 'Rent',   amount: -85.49, type: 'expense' }],
    11: [
      { label: 'Lunch',  amount: -24.50, type: 'expense' },
      { label: 'Refund', amount: 240,    type: 'income'  },
      { label: '+1 more', amount: 0, type: 'due' },
    ],
    12: [{ label: 'Gym Membership', amount: -49.00, type: 'expense' }],
    15: [{ label: 'Shopping', amount: -69.49, type: 'expense' }],
    18: [{ label: 'Utilities', amount: -85.00, type: 'expense' }],
    19: [{ label: 'Fitness',   amount: -49.00, type: 'expense' }],
    21: [{ label: 'Internet',  amount: 0, type: 'due' }],
    22: [{ label: 'Salary',    amount: 5200, type: 'income' }],
  };

  for (let d = 1; d <= 30; d++) {
    days.push({
      date: d,
      inMonth: true,
      isToday: d === 11,
      isSelected: d === 11,
      entries: entryMap[d] ?? [],
    });
  }
  return days;
}

const DAY_TRANSACTIONS: Record<number, DayTransaction[]> = {
  11: [
    { title: 'Lunch at Café Bistro',     amount: -24.50, type: 'expense', method: 'Card payment'  },
    { title: 'Refund received',          amount: 240.00, type: 'income',  method: 'Bank transfer' },
    { title: 'Electricity bill reminder', amount: 0,      type: 'due',     method: 'UPI payment'   },
  ],
};

const UPCOMING_BILLS: UpcomingBill[] = [
  { name: 'Electricity Bill', amount: 120, dueDate: 'Jun 18' },
  { name: 'Internet Bill',    amount: 59,  dueDate: 'Jun 21' },
  { name: 'Gym Membership',   amount: 49,  dueDate: 'Jun 14' },
  { name: 'Rent',             amount: 1200, dueDate: 'Jul 1' },
];

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly _selectedDay = signal(11);
  private readonly _view = signal<'month' | 'week'>('month');
  private readonly _monthLabel = signal('June 2025');

  readonly selectedDay = computed(() => this._selectedDay());
  readonly view = computed(() => this._view());
  readonly monthLabel = computed(() => this._monthLabel());
  readonly weekdays = computed(() => WEEKDAYS);

  readonly days = computed(() => buildJune2025());

  readonly monthSummary = computed(() => ({
    totalIncome: 5200.00,
    totalExpenses: 3180.50,
    netBalance: 2019.50,
  }));

  readonly selectedDayTransactions = computed(() => DAY_TRANSACTIONS[this._selectedDay()] ?? []);
  readonly upcomingBills = computed(() => UPCOMING_BILLS);

  selectDay(date: number): void { this._selectedDay.set(date); }
  setView(view: 'month' | 'week'): void { this._view.set(view); }
}
