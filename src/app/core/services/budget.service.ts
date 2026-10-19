import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';
import { AuthService } from './auth.service';

export type BudgetStatus = 'on-track' | 'warning' | 'overspent' | 'untracked';

export interface BudgetTotals {
  /** Sum of every effective limit (raw limit + rollover carried in). */
  totalBudget: number;
  totalSpent: number;
  /** Percent used against the effective limits — may exceed 100 when overspent. */
  percentUsed: number;
  remainingBudget: number;
  /** Raw sum before rollover, so the UI can show what carried over. */
  rollover: number;
  /** Spend in categories that have no limit at all. */
  unbudgetedSpend: number;
  isLowBudget: boolean;
  categoriesTracked: number;
}

export interface CategoryBudget {
  category: string;
  color: string;
  /** What the user set for this month. */
  limit: number;
  /** Unspent budget carried in from the previous month. */
  carryIn: number;
  /** `limit + carryIn` — the number progress is measured against. */
  effectiveLimit: number;
  spent: number;
  /** 0–100+ against the effective limit. */
  progress: number;
  remaining: number;
  status: BudgetStatus;
  /** Rounded-up 3-month average spend, or null when there is no history. */
  suggestion: number | null;
  /** Whether the user has set a limit for this category this month. */
  isSet: boolean;
}

export interface BudgetInsight {
  type: 'success' | 'warning' | 'danger';
  icon: string;
  title: string;
  detail: string;
}

interface BudgetCategory {
  category: string;
  defaultLimit: number;
  color: string;
}

interface MonthSpend {
  index: number;
  offset: number;
  label: string | null;
  available: boolean;
  spentByCategory: Record<string, number>;
}

interface BudgetPayload {
  month: string;
  year: number;
  categories: BudgetCategory[];
  months: MonthSpend[];
}

/** Category limits the user has saved, keyed `YYYY-MM` → category → amount. */
type LimitsByMonth = Record<string, Record<string, number>>;

/** The seed dataset spans January–August 2025, so paging is bounded. */
const FIRST_MONTH = 0;
const LAST_MONTH = 7;
const DATA_YEAR = 2025;
const LATEST_MONTH = 7;

/** Percentage at which a budget turns from on-track to warning. */
export const WARNING_THRESHOLD = 80;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/budget`;

  private readonly _year = signal(DATA_YEAR);
  private readonly _month = signal(LATEST_MONTH);
  private readonly _budgetCategories = signal<BudgetCategory[]>([]);
  private readonly _months = signal<MonthSpend[]>([]);
  private readonly _limits = signal<LimitsByMonth>({});
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);
  private hydrated = false;

  readonly year = computed(() => this._year());
  readonly month = computed(() => this._month());
  readonly isLoading = computed(() => this._loading());
  readonly loadError = computed(() => this._failed());

  /** `August 2025`. */
  readonly monthLabel = computed(() => `${MONTH_NAMES[this._month()]} ${this._year()}`);

  readonly canGoPrev = computed(() => this._month() > FIRST_MONTH);
  readonly canGoNext = computed(() => this._month() < LAST_MONTH);

  /** Limits saved for the month on screen. */
  readonly rawLimits = computed(() => this._limits()[this.monthKey()] ?? {});

  /** True once the user has saved at least one limit for this month. */
  readonly hasLimits = computed(() => Object.keys(this.rawLimits()).length > 0);

  readonly categories = computed<CategoryBudget[]>(() => {
    const key = this.monthKey();
    const limits = this._limits()[key] ?? {};
    const spent = this.spendFor(0);

    return this._budgetCategories().map((category) => {
      const limit = limits[category.category] ?? 0;
      const carryIn = this.carryIn(category.category);
      const effectiveLimit = limit + carryIn;
      const categorySpent = spent[category.category] ?? 0;
      const progress = effectiveLimit > 0 ? Math.round((categorySpent / effectiveLimit) * 100) : 0;

      return {
        category: category.category,
        color: category.color,
        limit,
        carryIn,
        effectiveLimit,
        spent: Math.round(categorySpent * 100) / 100,
        progress,
        remaining: Math.round((effectiveLimit - categorySpent) * 100) / 100,
        status: statusFor(progress, effectiveLimit),
        suggestion: this.suggestion(category.category),
        isSet: limits[category.category] !== undefined,
      };
    });
  });

  /** Default limits shipped by the backend — the starting point for a new user. */
  readonly defaults = computed<Record<string, number>>(() =>
    Object.fromEntries(this._budgetCategories().map((c) => [c.category, c.defaultLimit]))
  );

  readonly totals = computed<BudgetTotals>(() => {
    const rows = this.categories();
    const tracked = rows.filter((r) => r.effectiveLimit > 0);
    const totalBudget = tracked.reduce((sum, r) => sum + r.effectiveLimit, 0);
    // Remaining is measured against the budget that exists, so spending in a
    // category with no limit must not eat into it — that is reported separately
    // as `unbudgetedSpend`.
    const trackedSpent = tracked.reduce((sum, r) => sum + r.spent, 0);
    const totalSpent = rows.reduce((sum, r) => sum + r.spent, 0);
    const rawTotal = tracked.reduce((sum, r) => sum + r.limit, 0);

    return {
      totalBudget: round2(totalBudget),
      totalSpent: round2(totalSpent),
      percentUsed: totalBudget > 0 ? Math.round((trackedSpent / totalBudget) * 100) : 0,
      remainingBudget: round2(totalBudget - trackedSpent),
      rollover: round2(totalBudget - rawTotal),
      unbudgetedSpend: round2(rows.filter((r) => !r.isSet).reduce((sum, r) => sum + r.spent, 0)),
      isLowBudget: totalBudget > 0 && trackedSpent / totalBudget >= 0.75,
      categoriesTracked: tracked.length,
    };
  });

  readonly overspent = computed(() => this.categories().filter((c) => c.status === 'overspent'));

  /** Everything the insights card says, derived from the saved limits and real spend. */
  readonly insights = computed<BudgetInsight[]>(() => {
    const rows = this.categories();
    const t = this.totals();
    const out: BudgetInsight[] = [];

    if (!this.hasLimits()) {
      return [{
        type: 'warning',
        icon: 'lucideTarget',
        title: 'No budgets set for ' + this.monthLabel(),
        detail: 'Set a limit per category to track spending against it.',
      }];
    }

    for (const row of [...rows]
      .filter((r) => r.status === 'overspent')
      .sort((a, b) => Math.abs(b.remaining) - Math.abs(a.remaining))) {
      out.push({
        type: 'danger',
        icon: 'lucideTriangleAlert',
        title: `${row.category} is over budget`,
        detail: `$${row.spent.toFixed(2)} spent against a $${row.effectiveLimit.toFixed(2)} limit — $${Math.abs(row.remaining).toFixed(2)} over.`,
      });
    }

    for (const row of [...rows].filter((r) => r.status === 'warning')) {
      out.push({
        type: 'warning',
        icon: 'lucideClock',
        title: `${row.category} is at ${row.progress}%`,
        detail: `$${row.spent.toFixed(2)} of $${row.effectiveLimit.toFixed(2)} used. $${row.remaining.toFixed(2)} left.`,
      });
    }

    if (out.length === 0 && t.totalBudget > 0) {
      out.push({
        type: 'success',
        icon: 'lucideCircleCheck',
        title: 'Every category is on track',
        detail: `${t.percentUsed}% of your $${t.totalBudget.toFixed(2)} budget used across ${t.categoriesTracked} categories.`,
      });
    }

    if (t.rollover > 0) {
      out.push({
        type: 'success',
        icon: 'lucideRefreshCw',
        title: `$${t.rollover.toFixed(2)} rolled over`,
        detail: 'Unspent budget from last month was carried into these limits.',
      });
    }

    const unbudgeted = rows.filter((r) => !r.isSet && r.spent > 0);
    if (unbudgeted.length) {
      const amount = unbudgeted.reduce((sum, r) => sum + r.spent, 0);
      out.push({
        type: 'warning',
        icon: 'lucideCircleAlert',
        title: `${unbudgeted.length} categor${unbudgeted.length === 1 ? 'y has' : 'ies have'} spending but no limit`,
        detail: `${unbudgeted.map((r) => r.category).join(', ')} — $${amount.toFixed(2)} tracked, unbudgeted.`,
      });
    }

    return out;
  });

  load(month: number = this._month()): Observable<void> {
    const target = clamp(month, FIRST_MONTH, LAST_MONTH);
    const params = new HttpParams().set('month', String(target));
    this.hydrateOnce();
    this._loading.set(true);
    this._failed.set(false);

    return this.http
      .get<ApiResponse<BudgetPayload>>(this.apiUrl, { withCredentials: true, params })
      .pipe(
        map((response) => response.data),
        tap((data) => {
          this._month.set(target);
          this._year.set(data.year ?? this._year());
          // Defensive: a stale backend (older server.js) omits these fields, and
          // `.map()` over undefined would take the whole page down.
          this._budgetCategories.set(Array.isArray(data?.categories) ? data.categories : []);
          this._months.set(Array.isArray(data?.months) ? data.months : []);
        }),
        catchError(() => {
          this._failed.set(true);
          return of(undefined);
        }),
        finalize(() => this._loading.set(false)),
        map(() => undefined)
      );
  }

  nextMonth(): void {
    if (this.canGoNext()) this.load(this._month() + 1).subscribe();
  }

  prevMonth(): void {
    if (this.canGoPrev()) this.load(this._month() - 1).subscribe();
  }

  goToLatest(): void {
    if (this._month() !== LATEST_MONTH) this.load(LATEST_MONTH).subscribe();
  }

  /** Persists the given limits for the month on screen. */
  saveLimits(limits: Record<string, number>): void {
    const cleaned: Record<string, number> = {};
    for (const [category, value] of Object.entries(limits)) {
      if (Number.isFinite(value) && value > 0) cleaned[category] = round2(value);
    }
    this._limits.update((all) => ({ ...all, [this.monthKey()]: cleaned }));
    this.persist();
  }

  /** Copies the previous month's saved limits into this month. */
  copyPreviousMonth(): number {
    const previous = this._limits()[this.keyFor(this._month() - 1)];
    if (!previous || !Object.keys(previous).length) return 0;
    const count = Object.keys(previous).length;
    this._limits.update((all) => ({ ...all, [this.monthKey()]: { ...previous } }));
    this.persist();
    return count;
  }

  /** Falls back to the backend's suggested starting limits. */
  resetToDefaults(): void {
    this.saveLimits(this.defaults());
  }

  // ── Derived helpers ──

  /** Saved limits for an arbitrary month offset relative to the one on screen. */
  limitsForOffset(offset: number): Record<string, number> {
    return this._limits()[this.keyFor(this._month() + offset)] ?? {};
  }

  /** Rounded-up 3-month average spend, or null when no month has any spend. */
  suggestion(category: string): number | null {
    const history = this._months().filter((m) => m.offset > 0 && m.available);
    if (!history.length) return null;
    const total = history.reduce((sum, m) => sum + (m.spentByCategory[category] ?? 0), 0);
    if (total <= 0) return null;
    return Math.ceil(total / history.length);
  }

  /** Unspent budget from the previous month, floored at zero. */
  carryIn(category: string): number {
    const previousLimits = this.limitsForOffset(-1)[category] ?? 0;
    if (previousLimits <= 0) return 0;
    const previousSpend = this.spendFor(1)[category] ?? 0;
    return Math.max(0, round2(previousLimits - previousSpend));
  }

  private spendFor(offset: number): Record<string, number> {
    return this._months().find((m) => m.offset === offset)?.spentByCategory ?? {};
  }

  private monthKey(): string {
    return this.keyFor(this._month());
  }

  /**
   * Storage key for a month offset. Rolls the year over correctly so that
   * `limitsForOffset(-1)` in January reads December rather than January itself.
   */
  private keyFor(month: number): string {
    const date = new Date(this._year(), month, 1);
    return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`;
  }

  /** Limits are per-browser, scoped to the signed-in user. */
  private persist(): void {
    try {
      localStorage.setItem(this.storageKey(), JSON.stringify(this._limits()));
    } catch {
      /* storage unavailable — limits stay session-only */
    }
  }

  /** Reads saved limits once, on the first load. */
  private hydrateOnce(): void {
    if (this.hydrated) return;
    this.hydrated = true;
    try {
      const raw = localStorage.getItem(this.storageKey());
      if (raw) this._limits.set(JSON.parse(raw) as LimitsByMonth);
    } catch {
      this._limits.set({});
    }
  }

  private storageKey(): string {
    return `eiq.budgets.${this.auth.currentUser()?.id ?? 'anonymous'}`;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** No limit means the category is not tracked — never reported as overspent. */
function statusFor(progress: number, limit: number): BudgetStatus {
  if (limit <= 0) return 'untracked';
  if (progress >= 100) return 'overspent';
  if (progress >= WARNING_THRESHOLD) return 'warning';
  return 'on-track';
}