import { Injectable, computed, signal } from '@angular/core';

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

export interface BudgetInsight  { type: 'success' | 'danger' | 'warning'; icon: string; title: string; detail: string; }
export interface BudgetRecommendation { icon: string; title: string; detail: string; }

const CATEGORY_BUDGETS: CategoryBudget[] = [
  { category: 'Food',          icon: '🍔', iconBg: '#fee2e2', budget: 600, spent: 480, progress: 80,  remaining: 120,  status: 'on-track' },
  { category: 'Transport',     icon: '🚗', iconBg: '#dbeafe', budget: 300, spent: 210, progress: 70,  remaining: 90,   status: 'on-track' },
  { category: 'Shopping',      icon: '🛍️', iconBg: '#fef3c7', budget: 500, spent: 490, progress: 98,  remaining: 10,   status: 'warning'  },
  { category: 'Health',        icon: '💊', iconBg: '#dcfce7', budget: 200, spent: 80,  progress: 40,  remaining: 120,  status: 'on-track' },
  { category: 'Entertainment', icon: '🎬', iconBg: '#fce7f3', budget: 300, spent: 310, progress: 103, remaining: -10,  status: 'overspent' },
  { category: 'Utilities',     icon: '⚡', iconBg: '#e0e7ff', budget: 400, spent: 350, progress: 88,  remaining: 50,   status: 'warning'  },
  { category: 'Education',     icon: '📚', iconBg: '#fae8ff', budget: 200, spent: 120, progress: 60,  remaining: 80,   status: 'on-track' },
  { category: 'Others',        icon: '⋯',  iconBg: '#f1f5f9', budget: 500, spent: 140, progress: 28,  remaining: 360,  status: 'on-track' },
];

const INSIGHTS: BudgetInsight[] = [
  { type: 'success', icon: '🎉', title: 'Great savings this month!',      detail: 'You saved 20% more than last month. Keep it up!' },
  { type: 'danger',   icon: '⚠️', title: 'Entertainment budget exceeded',  detail: 'You went over your Entertainment budget by $10 this month.' },
  { type: 'warning',  icon: '💡', title: 'Shopping nearing limit',         detail: 'Consider reducing Shopping spend — only $10 remaining.' },
];

const RECOMMENDATIONS: BudgetRecommendation[] = [
  { icon: '📉', title: 'Reduce Entertainment Spend', detail: 'Set a stricter $250 limit next month to avoid overspending on streaming and events.' },
  { icon: '🔄', title: 'Reallocate Others Budget',    detail: 'You have $360 unused in Others. Move $200 to your savings goal for faster progress.' },
  { icon: '💚', title: 'Boost Health Budget',         detail: 'Your health spending is low. Consider allocating more for preventive care and wellness.' },
];

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly _month = signal('June 2025');
  readonly month = computed(() => this._month());

  readonly totals = computed<BudgetTotals>(() => {
    const totalBudget = CATEGORY_BUDGETS.reduce((a, c) => a + c.budget, 0);
    const totalSpent  = CATEGORY_BUDGETS.reduce((a, c) => a + c.spent, 0);
    const percentUsed = Math.round((totalSpent / totalBudget) * 100);
    return {
      totalBudget, totalSpent, percentUsed,
      remainingBudget: totalBudget - totalSpent,
      isLowBudget: percentUsed >= 75,
    };
  });

  readonly categoryBudgets = computed(() => CATEGORY_BUDGETS);
  readonly insights        = computed(() => INSIGHTS);
  readonly recommendations  = computed(() => RECOMMENDATIONS);

  setMonth(month: string): void { this._month.set(month); }
}
