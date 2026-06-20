import { Injectable, computed, signal } from '@angular/core';

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

const MONTHLY_COMPARISON: MonthlyComparisonPoint[] = [
  { month: 'Jan', income: 4800, expense: 3100, savings: 1700 },
  { month: 'Feb', income: 5100, expense: 3400, savings: 1700 },
  { month: 'Mar', income: 4900, expense: 2900, savings: 2000 },
  { month: 'Apr', income: 5300, expense: 3200, savings: 2100 },
  { month: 'May', income: 5000, expense: 3500, savings: 1500 },
  { month: 'Jun', income: 5200, expense: 3180, savings: 2020 },
  { month: 'Jul', income: 4950, expense: 3050, savings: 1900 },
  { month: 'Aug', income: 5150, expense: 3300, savings: 1850 },
  { month: 'Sep', income: 5000, expense: 3100, savings: 1900 },
  { month: 'Oct', income: 5400, expense: 3450, savings: 1950 },
  { month: 'Nov', income: 5100, expense: 3000, savings: 2100 },
  { month: 'Dec', income: 5250, expense: 3180, savings: 2070 },
];

const CATEGORY_SHARE: CategorySharePoint[] = [
  { category: 'Food',          percentage: 28, color: '#ef4444' },
  { category: 'Transport',     percentage: 15, color: '#2b7fff' },
  { category: 'Shopping',      percentage: 22, color: '#f59e0b' },
  { category: 'Health',        percentage: 10, color: '#64748b' },
  { category: 'Entertainment', percentage: 12, color: '#eab308' },
  { category: 'Others',        percentage: 13, color: '#14b8a6' },
];

const CASH_FLOW: CashFlowPoint[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const income  = 120 + Math.round(80 * Math.sin(day / 3) + 40 * Math.sin(day / 7));
  const expense = 90  + Math.round(60 * Math.sin(day / 4 + 1) + 30 * Math.cos(day / 5));
  return { day, income: Math.max(20, income), expense: Math.max(20, expense) };
});

const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEATMAP: HeatmapCell[] = [
  [42, 78, 135, 55, 190, 240, 98],
  [182, 30, 88, 205, 62, 285, 115],
  [48, 148, 68, 218, 75, 22, 108],
  [143, 82, 228, 38, 168, 285, 65],
].flatMap((row, weekIdx) =>
  row.map((amount, dayIdx) => ({ week: weekIdx + 1, day: HEATMAP_DAYS[dayIdx], amount }))
);

const FINANCIAL_SUMMARY: FinancialSummaryRow[] = [
  { month: 'January',  income: 4800, expense: 3100, savings: 1700, savingsRate: 35.4 },
  { month: 'February', income: 5100, expense: 3400, savings: 1700, savingsRate: 33.3 },
  { month: 'March',    income: 4900, expense: 2900, savings: 2000, savingsRate: 40.8 },
  { month: 'April',    income: 5300, expense: 3200, savings: 2100, savingsRate: 39.6 },
  { month: 'May',      income: 5000, expense: 3500, savings: 1500, savingsRate: 30.0 },
  { month: 'June',     income: 5200, expense: 3180, savings: 2020, savingsRate: 38.8 },
];

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly _range = signal<AnalyticsRange>('week');
  readonly range = computed(() => this._range());

  readonly kpis = computed<AnalyticsKpis>(() => ({
    totalSpent: 3180.50, totalIncome: 5200.00, netSavings: 2019.50, avgDailySpend: 102.60,
    totalSpentTrend: -5, totalIncomeTrend: 12, netSavingsTrend: 8, avgDailySpendTrend: -3,
  }));

  readonly monthlyComparison = computed(() => MONTHLY_COMPARISON);
  readonly categoryShare     = computed(() => CATEGORY_SHARE);
  readonly cashFlow          = computed(() => CASH_FLOW);
  readonly heatmap           = computed(() => HEATMAP);
  readonly heatmapDays       = computed(() => HEATMAP_DAYS);
  readonly financialSummary  = computed(() => FINANCIAL_SUMMARY);

  setRange(range: AnalyticsRange): void { this._range.set(range); }
}
