import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';
import { DashboardData, DashboardSummary, MonthlyChartData, CategorySpending } from '../models/dashboard.model';
import { DashboardStats } from '../interfaces/dashboard.interface';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;

  private readonly _summary = signal<DashboardSummary | null>(null);

  readonly stats = computed<DashboardStats>(() => {
    const s = this._summary();
    return {
      currentBalance: s?.totalBalance ?? 0,
      monthlyIncome: s?.monthlyIncome ?? 0,
      monthlyExpense: s?.monthlyExpense ?? 0,
      savings: s?.savings ?? 0,
      budgetRemaining: s?.budgetRemaining ?? 0,
      balanceTrend: s?.balanceChangePercent ?? 0,
      incomeTrend: s?.incomeChangePercent ?? 0,
      expenseTrend: s?.expenseChangePercent ?? 0,
      savingsTrend: s?.savingsChangePercent ?? 0,
      budgetTrend: s?.budgetChangePercent ?? 0,
    };
  });

  loadDashboard(): Observable<DashboardData> {
    return this.http.get<ApiResponse<any>>(this.apiUrl, { withCredentials: true }).pipe(
      map(response => {
        const d = response.data;
        const summary: DashboardSummary = {
          totalBalance: d.summary.totalBalance,
          monthlyIncome: d.summary.monthlyIncome,
          monthlyExpense: d.summary.monthlyExpense,
          savings: d.summary.savings,
          budgetRemaining: d.summary.budgetRemaining,
          balanceChangePercent: d.summary.balanceChangePercent,
          incomeChangePercent: d.summary.incomeChangePercent,
          expenseChangePercent: d.summary.expenseChangePercent,
          savingsChangePercent: d.summary.savingsChangePercent,
          budgetChangePercent: d.summary.budgetChangePercent,
        };
        this._summary.set(summary);
        return {
          summary,
          recentTransactions: d.recentTransactions ?? [],
          monthlyChart: d.monthlyChart ?? [],
          weeklySpending: d.weeklySpending ?? [],
          categoryBreakdown: d.categoryBreakdown ?? [],
        };
      }),
      catchError(() => {
        return of({
          summary: {
            totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0, savings: 0,
            budgetRemaining: 0, balanceChangePercent: 0, incomeChangePercent: 0,
            expenseChangePercent: 0, savingsChangePercent: 0, budgetChangePercent: 0,
          } as DashboardSummary,
          recentTransactions: [],
          monthlyChart: [],
          weeklySpending: [],
          categoryBreakdown: [],
        });
      })
    );
  }
}
