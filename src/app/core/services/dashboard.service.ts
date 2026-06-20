import { Injectable, computed, inject } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { TransactionService } from './transaction.service';
import { DashboardStats, IncomeExpenseDataPoint, ChartDataPoint, CategoryBreakdown } from '../interfaces/dashboard.interface';
import { DashboardData } from '../models/dashboard.model';

// Exported chart constants
export const MONTHLY_CHART: IncomeExpenseDataPoint[] = [
  { month: 'Jan', income: 4800, expense: 2900 },
  { month: 'Feb', income: 5100, expense: 3100 },
  { month: 'Mar', income: 4600, expense: 2700 },
  { month: 'Apr', income: 5300, expense: 3400 },
  { month: 'May', income: 4900, expense: 2800 },
  { month: 'Jun', income: 5200, expense: 3180 },
];

export const WEEKLY_SPENDING = [
  { day: 'Mon', spending: 320 },
  { day: 'Tue', spending: 480 },
  { day: 'Wed', spending: 210 },
  { day: 'Thu', spending: 560 },
  { day: 'Fri', spending: 390 },
  { day: 'Sat', spending: 720 },
  { day: 'Sun', spending: 280 },
];

export const CATEGORY_BREAKDOWN: CategoryBreakdown[] = [
  { category: 'Food & Dining', percentage: 45, amount: 1431, color: 'oklch(0.646 0.222 41.116)', icon: '🍔' },
  { category: 'Transport',     percentage: 20, amount:  636, color: '#2b7fff',                   icon: '🚗' },
  { category: 'Shopping',      percentage: 18, amount:  572, color: 'oklch(0.6 0.118 184.704)',   icon: '🛍️' },
  { category: 'Others',        percentage: 17, amount:  541, color: 'oklch(0.398 0.07 227.392)',  icon: '📦' },
];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly txService = inject(TransactionService);

  readonly stats = computed<DashboardStats>(() => ({
    currentBalance:  12450.80,
    monthlyIncome:    5200.00,
    monthlyExpense:   3180.50,
    savings:          2019.50,
    budgetRemaining:   820.00,
    balanceTrend:   2.4,
    incomeTrend:    5.1,
    expenseTrend:   3.2,
    savingsTrend:   8.7,
    budgetTrend:   -1.5,
  }));

  loadDashboard(): Observable<DashboardData> {
    const data: DashboardData = {
      summary: {
        totalBalance: 12450.80,
        monthlyIncome: 5200.00,
        monthlyExpense: 3180.50,
        savings: 2019.50,
        budgetRemaining: 820.00,
        balanceChangePercent: 2.4,
        incomeChangePercent: 5.1,
        expenseChangePercent: 3.2,
        savingsChangePercent: 8.7,
        budgetChangePercent: -1.5,
      },
      recentTransactions: this.txService.recentTransactions(),
      monthlyChart: MONTHLY_CHART,
      weeklySpending: WEEKLY_SPENDING,
      categoryBreakdown: CATEGORY_BREAKDOWN,
    };
    return of(data).pipe(delay(400));
  }
}
