import { Injectable, computed, signal } from '@angular/core';

export type RecurringFrequency = 'monthly' | 'yearly' | 'weekly';
export type RecurringStatus = 'active' | 'paused';

export interface RecurringExpense {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  category: string;
  amount: number;
  frequency: RecurringFrequency;
  nextDue: string;
  dueSoon: boolean;
  payment: string;
  status: RecurringStatus;
}

export interface UpcomingRenewal { name: string; amount: number; dueDate: string; dueSoon: boolean; }
export interface RecurringCategorySlice { category: string; amount: number; color: string; }

const RECURRING: RecurringExpense[] = [
  { id: 'netflix',   name: 'Netflix',          icon: '🎬', iconBg: '#fee2e2', iconColor: '#ef4444', category: 'Entertainment', amount: 15.99,  frequency: 'monthly', nextDue: 'Jun 15', dueSoon: true,  payment: 'Card', status: 'active' },
  { id: 'internet',  name: 'Internet Bill',    icon: '📶', iconBg: '#dbeafe', iconColor: '#2b7fff', category: 'Utilities',     amount: 59.00,   frequency: 'monthly', nextDue: 'Jun 18', dueSoon: true,  payment: 'Bank', status: 'active' },
  { id: 'rent',      name: 'Rent',             icon: '🏠', iconBg: '#fef3c7', iconColor: '#d97706', category: 'Housing',       amount: 1200.00, frequency: 'monthly', nextDue: 'Jul 01', dueSoon: false, payment: 'Bank', status: 'active' },
  { id: 'gym',       name: 'Gym Membership',   icon: '💪', iconBg: '#dcfce7', iconColor: '#16a34a', category: 'Health',        amount: 49.00,   frequency: 'monthly', nextDue: 'Jun 14', dueSoon: true,  payment: 'Card', status: 'active' },
  { id: 'spotify',   name: 'Spotify',          icon: '🎵', iconBg: '#fee2e2', iconColor: '#ef4444', category: 'Entertainment', amount: 9.99,    frequency: 'monthly', nextDue: 'Jun 22', dueSoon: false, payment: 'Card', status: 'paused' },
  { id: 'insurance', name: 'Insurance Premium', icon: '🛡️', iconBg: '#dbeafe', iconColor: '#2b7fff', category: 'Insurance',     amount: 240.00,  frequency: 'yearly',  nextDue: 'Dec 01', dueSoon: false, payment: 'Bank', status: 'active' },
  { id: 'electric',  name: 'Electricity',      icon: '⚡', iconBg: '#fef3c7', iconColor: '#d97706', category: 'Utilities',     amount: 120.00,  frequency: 'monthly', nextDue: 'Jun 28', dueSoon: false, payment: 'UPI',  status: 'active' },
  { id: 'coursera',  name: 'Coursera Plus',    icon: '🎓', iconBg: '#dcfce7', iconColor: '#16a34a', category: 'Education',     amount: 59.00,   frequency: 'yearly',  nextDue: 'Sep 10', dueSoon: false, payment: 'Card', status: 'active' },
];

const UPCOMING_RENEWALS: UpcomingRenewal[] = [
  { name: 'Gym Membership', amount: 49.00, dueDate: 'Jun 14', dueSoon: true },
  { name: 'Netflix',        amount: 15.99, dueDate: 'Jun 15', dueSoon: true },
  { name: 'Internet Bill',  amount: 59.00, dueDate: 'Jun 18', dueSoon: true },
  { name: 'Spotify',        amount: 9.99,  dueDate: 'Jun 22', dueSoon: false },
  { name: 'Electricity',    amount: 120.00, dueDate: 'Jun 28', dueSoon: false },
];

const CATEGORY_SLICES: RecurringCategorySlice[] = [
  { category: 'Housing',       amount: 1200, color: '#ef4444' },
  { category: 'Insurance',     amount: 240,  color: '#2b7fff' },
  { category: 'Utilities',     amount: 179,  color: '#16a34a' },
  { category: 'Education',     amount: 59,   color: '#9333ea' },
  { category: 'Health',        amount: 49,   color: '#06b6d4' },
  { category: 'Entertainment', amount: 26,   color: '#eab308' },
];

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private readonly _items = signal<RecurringExpense[]>(RECURRING);
  private readonly _search = signal('');
  private readonly _frequencyFilter = signal<'all' | RecurringFrequency>('all');
  private readonly _categoryFilter = signal<'all' | string>('all');
  private readonly _statusFilter = signal<'all' | RecurringStatus>('all');

  readonly search = computed(() => this._search());

  readonly totals = computed(() => {
    const list = this._items();
    const monthlyEquivalent = list
      .filter(r => r.status === 'active')
      .reduce((a, r) => a + (r.frequency === 'yearly' ? r.amount / 12 : r.frequency === 'weekly' ? r.amount * 4.33 : r.amount), 0);
    return {
      totalMonthly: Math.round(monthlyEquivalent),
      activeCount: list.filter(r => r.status === 'active').length,
      totalCount: list.length,
      dueThisWeek: list.filter(r => r.dueSoon).length,
    };
  });

  readonly filteredItems = computed(() => {
    const q = this._search().toLowerCase();
    const freq = this._frequencyFilter();
    const cat = this._categoryFilter();
    const status = this._statusFilter();
    return this._items().filter(r =>
      (!q || r.name.toLowerCase().includes(q)) &&
      (freq === 'all' || r.frequency === freq) &&
      (cat === 'all' || r.category === cat) &&
      (status === 'all' || r.status === status)
    );
  });

  readonly upcomingRenewals = computed(() => UPCOMING_RENEWALS);
  readonly categorySlices   = computed(() => CATEGORY_SLICES);

  setSearch(q: string): void { this._search.set(q); }
  setFrequencyFilter(f: 'all' | RecurringFrequency): void { this._frequencyFilter.set(f); }
  setCategoryFilter(c: string): void { this._categoryFilter.set(c); }
  setStatusFilter(s: 'all' | RecurringStatus): void { this._statusFilter.set(s); }

  resetFilters(): void {
    this._search.set('');
    this._frequencyFilter.set('all');
    this._categoryFilter.set('all');
    this._statusFilter.set('all');
  }

  toggleStatus(id: string): void {
    this._items.update(list => list.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
    ));
  }

  remove(id: string): void {
    this._items.update(list => list.filter(r => r.id !== id));
  }
}
