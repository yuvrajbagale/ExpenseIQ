import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { CalendarService } from './calendar.service';
import { environment } from '../../../environments/environment';

const URL = `${environment.apiUrl}/calendar`;

/** August 2025 — the dataset's latest month and the service's default. */
function payload(overrides: Partial<{ year: number; entryMap: Record<string, unknown[]> }> = {}) {
  return {
    success: true,
    message: 'Calendar loaded.',
    data: {
      month: 'August',
      year: 2025,
      entryMap: {
        '5': [{ label: 'Monthly Salary', amount: 5200, type: 'income' }],
        '8': [{ label: 'Whole Foods Market', amount: 127.43, type: 'expense' }],
      },
      summary: { totalIncome: 5200, totalExpenses: 127, netBalance: 5073 },
      ...overrides,
    },
  };
}

describe('CalendarService', () => {
  let service: CalendarService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalendarService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function load(month?: number) {
    service.loadCalendar(month).subscribe();
    const req = http.expectOne((r) => r.url === URL);
    req.flush(payload());
    return req;
  }

  describe('grid', () => {
    it('should always produce 42 cells so the layout never reflows', () => {
      load();
      expect(service.days().length).toBe(42);
    });

    it('should mark leading and trailing padding days as out of month', () => {
      load();
      const out = service.days().filter((d) => !d.inMonth);
      expect(out.length).toBeGreaterThan(0);
      expect(out.every((d) => d.entries.length === 0)).toBeTrue();
    });

    it('should place every day of the month exactly once', () => {
      load();
      const inMonth = service.days().filter((d) => d.inMonth);
      expect(inMonth.length).toBe(31); // August
      expect(new Set(inMonth.map((d) => d.date)).size).toBe(31);
    });

    it('should start each week row on a Monday', () => {
      load();
      const first = service.days()[0];
      expect(first.weekdayShort).toBe('MON');
    });

    it('should attach entries only to days inside the month', () => {
      load();
      const withEntries = service.days().filter((d) => d.entries.length > 0);
      expect(withEntries.map((d) => d.date).sort((a, b) => a - b)).toEqual([5, 8]);
    });

    it('should sum expenses per day for the cell footer', () => {
      load();
      const day = service.days().find((d) => d.inMonth && d.date === 8)!;
      expect(day.spent).toBeCloseTo(127.43, 2);
    });

    it('should not treat income as spending', () => {
      load();
      const day = service.days().find((d) => d.inMonth && d.date === 5)!;
      expect(day.spent).toBe(0);
    });
  });

  describe('month navigation', () => {
    it('should request the month it is given', () => {
      const req = load(3);
      expect(req.request.params.get('month')).toBe('3');
      expect(service.month()).toBe(3);
    });

    it('should allow paging backwards from the latest month', () => {
      load();
      expect(service.canGoPrev()).toBeTrue();
      expect(service.canGoNext()).toBeFalse();
    });

    it('should disable paging at the first month of the dataset', () => {
      load(0);
      expect(service.canGoPrev()).toBeFalse();
      expect(service.canGoNext()).toBeTrue();
    });

    it('should allow paging backwards mid-dataset', () => {
      load(4);
      expect(service.canGoPrev()).toBeTrue();
      expect(service.canGoNext()).toBeTrue();
    });

    it('should clamp an out-of-range month request', () => {
      const req = load(99);
      expect(req.request.params.get('month')).toBe('7');
    });

    it('should clear the loading flag once the request settles', () => {
      service.loadCalendar().subscribe();
      http.expectOne((r) => r.url === URL).flush(payload());
      expect(service.isLoading()).toBeFalse();
    });

    it('should flag a failure and stop loading when the request errors', () => {
      service.loadCalendar().subscribe();
      http.expectOne((r) => r.url === URL)
        .flush('boom', { status: 500, statusText: 'Server Error' });
      expect(service.loadError()).toBeTrue();
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('selection', () => {
    it('should select the first day when the month is not the current one', () => {
      load(3);
      expect(service.selectedDayTransactions()).toEqual([]);
    });

    it('should expose the selected day entries with stable keys', () => {
      load();
      service.selectDay(8);
      const txns = service.selectedDayTransactions();
      expect(txns.length).toBe(1);
      expect(txns[0].title).toBe('Whole Foods Market');
      expect(txns[0].key).toBeTruthy();
    });

    it('should deselect when the same day is clicked twice', () => {
      load();
      service.selectDay(8);
      service.selectDay(8);
      expect(service.selectedDayTransactions()).toEqual([]);
    });

    it('should not deselect when a different day is clicked', () => {
      load();
      service.selectDay(8);
      service.selectDay(5);
      expect(service.selectedDayTransactions()[0].title).toBe('Monthly Salary');
    });

    it('should format the selected day label from the requested month', () => {
      load(3);
      expect(service.selectedDayLabel()).toContain('April');
      expect(service.selectedDayLabel()).toContain('2025');
    });

    it('should preselect the 1st when the month is not the current one', () => {
      load(3);
      expect(service.selectedDayLabel()).toContain('April 1, 2025');
    });

    it('should report no selection when a day is deselected', () => {
      load();
      service.selectDay(8);
      service.selectDay(8);
      expect(service.selectedDayLabel()).toBe('No day selected');
    });
  });

  describe('week view', () => {
    it('should expose exactly seven days', () => {
      load();
      expect(service.weekDays().length).toBe(7);
    });

    it('should start on Monday', () => {
      load();
      expect(service.weekDays()[0].weekdayShort).toBe('MON');
    });

    it('should centre the week on the selected day', () => {
      load();
      service.selectDay(8);
      const week = service.weekDays();
      expect(week.some((d) => d.isSelected)).toBeTrue();
    });

    it('should default to month view and switch on demand', () => {
      load();
      expect(service.view()).toBe('month');
      service.setView('week');
      expect(service.view()).toBe('week');
    });
  });

  describe('summary and top expenses', () => {
    it('should surface the month summary from the response', () => {
      load();
      expect(service.monthSummary().netBalance).toBe(5073);
    });

    it('should rank the biggest expenses by amount', () => {
      load();
      expect(service.topExpenses()).toEqual([
        { label: 'Whole Foods Market', amount: 127.43, day: 8 },
      ]);
    });

    it('should report no entries for an empty month', () => {
      service.loadCalendar().subscribe();
      http.expectOne((r) => r.url === URL).flush(payload({ entryMap: {} }));
      expect(service.hasEntries()).toBeFalse();
      expect(service.topExpenses()).toEqual([]);
    });
  });

  describe('label', () => {
    it('should label the month from the requested month, not the system clock', () => {
      load(0);
      expect(service.monthLabel()).toBe('January 2025');
    });
  });
});