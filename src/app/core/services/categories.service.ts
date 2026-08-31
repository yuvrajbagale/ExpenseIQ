import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export type CategoryType = 'expense' | 'income';

export interface CategoryCard {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  type: CategoryType;
  transactions: number;
  totalSpent: number;
  budgetUsage: number;
}

export interface CategoryOverview {
  totalCategories: number;
  expenseCategories: number;
  incomeCategories: number;
}

export interface CategorySpendRow {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  private readonly _search = signal('');
  private readonly _typeFilter = signal<'all' | CategoryType>('all');
  private readonly _categories = signal<CategoryCard[]>([]);
  private readonly _spendingOverview = signal<CategorySpendRow[]>([]);

  readonly search = computed(() => this._search());
  readonly typeFilter = computed(() => this._typeFilter());

  readonly overview = computed<CategoryOverview>(() => {
    const all = this._categories();
    return {
      totalCategories: all.length,
      expenseCategories: all.filter(c => c.type === 'expense').length,
      incomeCategories: all.filter(c => c.type === 'income').length,
    };
  });

  readonly filteredCategories = computed(() => {
    const q = this._search().toLowerCase();
    const type = this._typeFilter();
    return this._categories().filter(c =>
      (type === 'all' || c.type === type) &&
      (!q || c.name.toLowerCase().includes(q))
    );
  });

  readonly spendingOverview = computed(() => this._spendingOverview());

  loadCategories(): Observable<void> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        const cats = response.data.categories;
        this._categories.set(cats);
        const maxSpent = Math.max(...cats.map((c: CategoryCard) => c.totalSpent));
        this._spendingOverview.set(
          cats
            .filter((c: CategoryCard) => c.type === 'expense')
            .sort((a: CategoryCard, b: CategoryCard) => b.totalSpent - a.totalSpent)
            .map((c: CategoryCard) => ({
              name: c.name,
              amount: c.totalSpent,
              percentage: maxSpent > 0 ? Math.round((c.totalSpent / maxSpent) * 100) : 0,
              color: c.iconColor,
            }))
        );
      }),
      catchError(() => of(undefined))
    );
  }

  setSearch(q: string): void { this._search.set(q); }
  setTypeFilter(type: 'all' | CategoryType): void { this._typeFilter.set(type); }

  remove(id: string): void {
    this._categories.update(list => list.filter(c => c.id !== id));
  }
}
