import { Transaction } from '../interfaces/transaction.interface';

export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savings: number;
  budgetRemaining: number;
  balanceChangePercent: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  savingsChangePercent: number;
  budgetChangePercent: number;
}

export interface MonthlyChartData {
  month: string;
  income: number;
  expense: number;
}

export interface WeeklySpendingData {
  day: string;
  spending: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  icon: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentTransactions: Transaction[];
  monthlyChart: MonthlyChartData[];
  weeklySpending: WeeklySpendingData[];
  categoryBreakdown: CategorySpending[];
}
