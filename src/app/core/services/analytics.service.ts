import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';

export interface AnalyticsKpis {
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  avgDailySpend: number;
  totalSpentTrend: number;
  totalIncomeTrend: number;
  netSavingsTrend: number;
  avgDailySpendTrend: number;
}

export interface MonthlyComparisonPoint { month: string; income: number; expense: number; savings: number; }
export interface CategorySharePoint { category: string; percentage: number; color: string; }
export interface CashFlowPoint { day: number; income: number; expense: number; }
export interface HeatmapCell { week: number; day: string; amount: number; }
export interface FinancialSummaryRow {
  month: string; income: number; expense: number; savings: number; savingsRate: number;
}

export type AnalyticsRange = 'week' | 'month' | 'year' | 'custom';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/analytics`;

  private readonly _range = signal<AnalyticsRange>('week');
  private readonly _kpis = signal<AnalyticsKpis>({ totalSpent: 0, totalIncome: 0, netSavings: 0, avgDailySpend: 0, totalSpentTrend: 0, totalIncomeTrend: 0, netSavingsTrend: 0, avgDailySpendTrend: 0 });
  private readonly _monthlyComparison = signal<MonthlyComparisonPoint[]>([]);
  private readonly _categoryShare = signal<CategorySharePoint[]>([]);
  private readonly _financialSummary = signal<FinancialSummaryRow[]>([]);

  readonly range = computed(() => this._range());
  readonly kpis = computed(() => this._kpis());
  readonly monthlyComparison = computed(() => this._monthlyComparison());
  readonly categoryShare = computed(() => this._categoryShare());
  readonly financialSummary = computed(() => this._financialSummary());
  readonly cashFlow = computed(() => [] as CashFlowPoint[]);
  readonly heatmap = computed(() => [] as HeatmapCell[]);
  readonly heatmapDays = computed(() => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

  loadAnalytics(): Observable<void> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        const d = response.data;
        this._kpis.set(d.kpis);
        this._monthlyComparison.set(d.monthlyComparison);
        this._categoryShare.set(d.categoryShare);
        this._financialSummary.set(d.financialSummary);
      }),
      catchError(() => of(undefined))
    );
  }

  setRange(range: AnalyticsRange): void { this._range.set(range); }
}
