import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

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

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/recurring`;

  private readonly _items = signal<RecurringExpense[]>([]);
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

  readonly upcomingRenewals = computed(() => {
    return this._items()
      .filter(r => r.status === 'active')
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue))
      .slice(0, 5)
      .map(r => ({ name: r.name, amount: r.amount, dueDate: r.nextDue, dueSoon: r.dueSoon }));
  });

  readonly categorySlices = computed(() => {
    const cats: Record<string, number> = {};
    this._items().filter(r => r.status === 'active').forEach(r => {
      cats[r.category] = (cats[r.category] || 0) + r.amount;
    });
    const colors: Record<string, string> = { Housing: '#ef4444', Utilities: '#2b7fff', Entertainment: '#eab308', Health: '#16a34a', Education: '#9333ea', Insurance: '#06b6d4' };
    return Object.entries(cats).map(([category, amount]) => ({ category, amount, color: colors[category] || '#6b7280' }));
  });

  loadRecurring(): Observable<void> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        this._items.set(response.data.items);
      }),
      catchError(() => of(undefined))
    );
  }

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
