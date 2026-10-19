import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { BudgetService, WARNING_THRESHOLD } from './budget.service';
import { environment } from '../../../environments/environment';

const URL = `${environment.apiUrl}/budget`;

const CATEGORIES = [
  { category: 'Food', defaultLimit: 600, color: '#fee2e2' },
  { category: 'Housing', defaultLimit: 1200, color: '#fef3c7' },
  { category: 'Fitness', defaultLimit: 100, color: '#dcfce7' },
];

interface MonthSpend {
  offset: number;
  index: number;
  label: string;
  available: boolean;
  spentByCategory: Record<string, number>;
}

const AUGUST: MonthSpend = {
  offset: 0,
  index: 7,
  label: 'August',
  available: true,
  spentByCategory: { Food: 540, Housing: 1200, Fitness: 40 },
};
const JULY: MonthSpend = {
  offset: 1,
  index: 6,
  label: 'July',
  available: true,
  spentByCategory: { Food: 300, Housing: 1200, Fitness: 20 },
};
const JUNE: MonthSpend = {
  offset: 2,
  index: 5,
  label: 'June',
  available: true,
  spentByCategory: { Food: 360, Housing: 1200, Fitness: 60 },
};

function payload(months: MonthSpend[] = [AUGUST, JULY, JUNE]) {
  return {
    success: true,
    message: 'Budget loaded.',
    data: { month: 'August', year: 2025, categories: CATEGORIES, months },
  };
}

describe('BudgetService', () => {
  let service: BudgetService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BudgetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function load(month?: number) {
    service.load(month).subscribe();
    const req = http.expectOne((r) => r.url === URL);
    req.flush(payload());
    return req;
  }

  describe('loading', () => {
    it('should request the month it is given', () => {
      expect(load(3).request.params.get('month')).toBe('3');
      expect(service.month()).toBe(3);
    });

    it('should default to the latest month in the dataset', () => {
      load();
      expect(service.month()).toBe(7);
      expect(service.monthLabel()).toBe('August 2025');
    });

    it('should clamp an out-of-range month', () => {
      expect(load(42).request.params.get('month')).toBe('7');
    });

    it('should allow paging back but not forward from the latest month', () => {
      load();
      expect(service.canGoPrev()).toBeTrue();
      expect(service.canGoNext()).toBeFalse();
    });

    it('should disable paging at the first month of the dataset', () => {
      load(0);
      expect(service.canGoPrev()).toBeFalse();
      expect(service.canGoNext()).toBeTrue();
    });

    it('should flag an error and stop loading on failure', () => {
      service.load().subscribe();
      http.expectOne((r) => r.url === URL).flush('nope', { status: 500, statusText: 'Server Error' });
      expect(service.loadError()).toBeTrue();
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('with no limits set', () => {
    it('should report no budget rather than a divide-by-zero', () => {
      load();
      const t = service.totals();
      expect(t.totalBudget).toBe(0);
      expect(t.percentUsed).toBe(0);
      expect(t.categoriesTracked).toBe(0);
    });

    it('should mark every category untracked', () => {
      load();
      expect(service.categories().every((c) => c.status === 'untracked')).toBeTrue();
    });

    it('should still total the real spend', () => {
      load();
      expect(service.totals().totalSpent).toBe(1780);
    });

    it('should prompt the user to set budgets', () => {
      load();
      expect(service.insights()[0].title).toContain('No budgets set');
    });
  });

  describe('thresholds', () => {
    it('should be on track below the warning threshold', () => {
      load();
      service.saveLimits({ Food: 1000 });
      const food = service.categories().find((c) => c.category === 'Food')!;
      expect(food.progress).toBe(54);
      expect(food.status).toBe('on-track');
    });

    it('should warn at the threshold', () => {
      load();
      service.saveLimits({ Food: 675 }); // 540 / 675 = 80%
      const food = service.categories().find((c) => c.category === 'Food')!;
      expect(food.status).toBe('warning');
      expect(WARNING_THRESHOLD).toBe(80);
    });

    it('should report overspent at 100%', () => {
      load();
      service.saveLimits({ Food: 540 });
      const food = service.categories().find((c) => c.category === 'Food')!;
      expect(food.status).toBe('overspent');
      expect(food.remaining).toBe(0);
    });

    it('should go negative on remaining when overspent', () => {
      load();
      service.saveLimits({ Food: 400 });
      const food = service.categories().find((c) => c.category === 'Food')!;
      expect(food.remaining).toBe(-140);
    });

    it('should let percentUsed exceed 100 so overspend is visible', () => {
      load();
      service.saveLimits({ Food: 400 });
      expect(service.totals().percentUsed).toBeGreaterThan(100);
    });
  });

  describe('totals', () => {
    beforeEach(() => {
      load();
      service.saveLimits({ Food: 600, Housing: 1200 });
    });

    it('should sum the effective limits', () => {
      expect(service.totals().totalBudget).toBe(1800);
    });

    it('should exclude untracked categories from the budget total', () => {
      expect(service.totals().categoriesTracked).toBe(2);
    });

    it('should report remaining against the tracked budget only', () => {
      // Food 540 + Housing 1200 = 1740 tracked spend against an 1800 budget.
      // Fitness (40) has no limit, so it must not eat into what is left.
      expect(service.totals().remainingBudget).toBe(60);
    });

    it('should report unbudgeted spend separately', () => {
      expect(service.totals().unbudgetedSpend).toBe(40);
    });
  });

  describe('rollover', () => {
    beforeEach(() => {
      // Save July's limits, then step forward to August.
      load(6);
      service.saveLimits({ Food: 600, Housing: 1200, Fitness: 100 });
      load(7);
    });

    it('should carry unspent budget into the next month', () => {
      const food = service.categories().find((c) => c.category === 'Food')!;
      expect(service.month()).toBe(7);
      expect(food.carryIn).toBe(300);
      expect(food.effectiveLimit).toBe(food.limit + 300);
    });

    it('should not carry anything for a fully spent category', () => {
      const housing = service.categories().find((c) => c.category === 'Housing')!;
      expect(housing.carryIn).toBe(0);
    });

    it('should report the rollover in the totals', () => {
      // Food 300 (600 − 300) + Fitness 80 (100 − 20); Housing spent in full.
      expect(service.totals().rollover).toBe(380);
    });
  });

  describe('suggestions', () => {
    beforeEach(() => load());

    it('should average the preceding months, rounded up', () => {
      // Food: 300 (Jul) + 360 (Jun) = 660 / 2 = 330
      const food = service.categories().find((c) => c.category === 'Food')!;
      expect(food.suggestion).toBe(330);
    });

    it('should round up to the nearest whole unit', () => {
      // Housing: 1200 + 1200 = 2400 / 2 = 1200
      const housing = service.categories().find((c) => c.category === 'Housing')!;
      expect(housing.suggestion).toBe(1200);
    });

    it('should return null when no history has spend', () => {
      service.load().subscribe();
      http.expectOne((r) => r.url === URL).flush(
        payload([AUGUST, { ...JULY, spentByCategory: {} }, { ...JUNE, spentByCategory: {} }])
      );
      expect(service.categories().every((c) => c.suggestion === null)).toBeTrue();
    });
  });

  describe('persistence', () => {
    it('should save limits per month', () => {
      load(7);
      service.saveLimits({ Food: 700 });

      load(3);
      expect(service.rawLimits()['Food']).toBeUndefined();

      load(7);
      expect(service.rawLimits()['Food']).toBe(700);
    });

    it('should ignore zero and non-numeric limits', () => {
      load();
      service.saveLimits({ Food: 0, Housing: 500, Fitness: NaN });
      expect(service.rawLimits()).toEqual({ Housing: 500 });
    });

    it('should clear all limits when given an empty map', () => {
      load();
      service.saveLimits({ Food: 700 });
      service.saveLimits({});
      expect(service.hasLimits()).toBeFalse();
    });

    it('should round saved limits to cents', () => {
      load();
      service.saveLimits({ Food: 100.567 });
      expect(service.rawLimits()['Food']).toBe(100.57);
    });
  });

  describe('copy previous month', () => {
    it('should copy the previous month limits and report how many', () => {
      load(6);
      service.saveLimits({ Food: 400, Housing: 1300 });

      load(7);
      const copied = service.copyPreviousMonth();
      expect(copied).toBe(2);
      expect(service.rawLimits()).toEqual({ Food: 400, Housing: 1300 });
    });

    it('should return 0 when the previous month has nothing saved', () => {
      load();
      expect(service.copyPreviousMonth()).toBe(0);
    });
  });

  describe('reset to defaults', () => {
    it('should apply the backend defaults', () => {
      load();
      service.resetToDefaults();
      expect(service.rawLimits()).toEqual({ Food: 600, Housing: 1200, Fitness: 100 });
    });
  });

  describe('insights', () => {
    it('should lead with the biggest overshoot, not the biggest spend', () => {
      load();
      service.saveLimits({ Food: 400, Housing: 1200 });
      // Food is $140 over; Housing is exactly at its limit, so Food leads.
      const first = service.insights()[0];
      expect(first.type).toBe('danger');
      expect(first.title).toContain('Food');
    });

    it('should celebrate when everything is on track', () => {
      load();
      // Food 54%, Housing 75%, Fitness 40% — all under the 80% warning line.
      service.saveLimits({ Food: 1000, Housing: 1600, Fitness: 100 });
      expect(service.insights().some((i) => i.type === 'success' && i.title.includes('on track'))).toBeTrue();
    });

    it('should flag spending in categories with no limit', () => {
      load();
      service.saveLimits({ Food: 600, Housing: 1200 });
      expect(service.insights().some((i) => i.title.includes('no limit'))).toBeTrue();
    });

    it('should never invent insight copy', () => {
      load();
      service.saveLimits({ Food: 600, Housing: 1200, Fitness: 100 });
      const copy = service.insights().map((i) => i.detail).join(' ');
      expect(copy).not.toContain('Summer');
      expect(copy).not.toContain('AI');
    });
  });
});