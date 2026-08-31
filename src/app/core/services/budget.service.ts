import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export type BudgetStatus = 'on-track' | 'warning' | 'overspent';

export interface BudgetTotals {
  totalBudget: number;
  totalSpent: number;
  percentUsed: number;
  remainingBudget: number;
  isLowBudget: boolean;
}

export interface CategoryBudget {
  category: string;
  icon: string;
  iconBg: string;
  budget: number;
  spent: number;
  progress: number;
  remaining: number;
  status: BudgetStatus;
}

export interface BudgetInsight { type: 'success' | 'danger' | 'warning'; icon: string; title: string; detail: string; }
export interface BudgetRecommendation { icon: string; title: string; detail: string; }

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/budget`;

  private readonly _month = signal('August 2025');
  private readonly _totals = signal<BudgetTotals>({ totalBudget: 0, totalSpent: 0, percentUsed: 0, remainingBudget: 0, isLowBudget: false });
  private readonly _categoryBudgets = signal<CategoryBudget[]>([]);
  private readonly _insights = signal<BudgetInsight[]>([]);
  private readonly _recommendations = signal<BudgetRecommendation[]>([]);

  readonly month = computed(() => this._month());
  readonly totals = computed(() => this._totals());
  readonly categoryBudgets = computed(() => this._categoryBudgets());
  readonly insights = computed(() => this._insights());
  readonly recommendations = computed(() => this._recommendations());

  loadBudget(): Observable<void> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        const d = response.data;
        this._month.set(d.month);
        this._totals.set(d.totals);
        this._categoryBudgets.set(d.categoryBudgets);
        this._insights.set(d.insights);
        this._recommendations.set(d.recommendations);
      }),
      catchError(() => of(undefined))
    );
  }

  setMonth(month: string): void { this._month.set(month); }
}
