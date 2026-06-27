import { Injectable, computed, signal } from '@angular/core';

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

const CATEGORIES: CategoryCard[] = [
  { id: 'food',          name: 'Food & Dining',  icon: '🍔', iconBg: '#fee2e2', iconColor: '#ef4444', type: 'expense', transactions: 48, totalSpent: 1240, budgetUsage: 78  },
  { id: 'transport',     name: 'Transport',      icon: '🚗', iconBg: '#dbeafe', iconColor: '#2b7fff', type: 'expense', transactions: 31, totalSpent: 620,  budgetUsage: 62  },
  { id: 'salary',        name: 'Salary',         icon: '💼', iconBg: '#dcfce7', iconColor: '#16a34a', type: 'income',  transactions: 6,  totalSpent: 5200, budgetUsage: 80  },
  { id: 'shopping',      name: 'Shopping',       icon: '🛍️', iconBg: '#f3e8ff', iconColor: '#9333ea', type: 'expense', transactions: 22, totalSpent: 980,  budgetUsage: 82  },
  { id: 'health',        name: 'Health',         icon: '💊', iconBg: '#cffafe', iconColor: '#06b6d4', type: 'expense', transactions: 14, totalSpent: 420,  budgetUsage: 60  },
  { id: 'entertainment', name: 'Entertainment',  icon: '🎬', iconBg: '#fee2e2', iconColor: '#ef4444', type: 'expense', transactions: 18, totalSpent: 310,  budgetUsage: 103 },
];

const SPENDING_OVERVIEW: CategorySpendRow[] = [
  { name: 'Food & Dining', amount: 1240, percentage: 100, color: '#f59e0b' },
  { name: 'Shopping',      amount: 980,  percentage: 79,  color: '#9333ea' },
  { name: 'Transport',     amount: 620,  percentage: 50,  color: '#2b7fff' },
  { name: 'Entertainment', amount: 310,  percentage: 25,  color: '#ef4444' },
  { name: 'Health',        amount: 420,  percentage: 34,  color: '#06b6d4' },
  { name: 'Utilities',     amount: 520,  percentage: 42,  color: '#16a34a' },
];

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private readonly _search = signal('');
  private readonly _typeFilter = signal<'all' | CategoryType>('all');
  private readonly _categories = signal<CategoryCard[]>(CATEGORIES);

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

  readonly spendingOverview = computed(() => SPENDING_OVERVIEW);

  setSearch(q: string): void { this._search.set(q); }
  setTypeFilter(type: 'all' | CategoryType): void { this._typeFilter.set(type); }

  remove(id: string): void {
    this._categories.update(list => list.filter(c => c.id !== id));
  }
}
