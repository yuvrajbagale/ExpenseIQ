export interface DashboardStats {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  savings: number;
  budgetRemaining: number;
  balanceTrend: number;
  incomeTrend: number;
  expenseTrend: number;
  savingsTrend: number;
  budgetTrend: number;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface IncomeExpenseDataPoint {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  category: string;
  percentage: number;
  amount: number;
  color: string;
  icon: string;
}
