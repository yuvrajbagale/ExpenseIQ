import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { CalendarComponent } from './calendar.component';
import { environment } from '../../../environments/environment';

const URL = `${environment.apiUrl}/calendar`;

const RESPONSE = {
  success: true,
  message: 'Calendar loaded.',
  data: {
    month: 'August',
    year: 2025,
    entryMap: {
      '5': [{ label: 'Monthly Salary', amount: 5200, type: 'income' }],
      '8': [
        { label: 'Whole Foods Market', amount: 127.43, type: 'expense' },
        { label: 'Starbucks Coffee', amount: 5.75, type: 'expense' },
        { label: 'Metro Transit', amount: 42, type: 'expense' },
      ],
    },
    summary: { totalIncome: 5200, totalExpenses: 175, netBalance: 5025 },
  },
};

describe('CalendarComponent', () => {
  let fixture: ComponentFixture<CalendarComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CalendarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CalendarComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne((r) => r.url === URL).flush(RESPONSE);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render a full 42-cell grid', () => {
    expect(el.querySelectorAll('.cal-day').length).toBe(42);
  });

  it('should render the requested month label', () => {
    expect(el.querySelector('.eiq-month-label')?.textContent).toContain('August 2025');
  });

  it('should allow paging back but not forward from the latest month', () => {
    const buttons = el.querySelectorAll<HTMLButtonElement>('.eiq-month-btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].disabled).toBeFalse(); // previous — January is reachable
    expect(buttons[1].disabled).toBeTrue(); // next — August is the newest
  });

  it('should request the previous month when paging back', () => {
    // Drop to a mid-dataset month so paging is enabled.
    fixture.componentInstance['cal'].loadCalendar(4).subscribe();
    http.expectOne((r) => r.url === URL).flush(RESPONSE);
    fixture.detectChanges();

    fixture.componentInstance['cal'].prevMonth();
    const req = http.expectOne((r) => r.url === URL);
    expect(req.request.params.get('month')).toBe('3');
    req.flush(RESPONSE);
    fixture.detectChanges();
    expect(el.querySelector('.eiq-month-label')?.textContent).toContain('April');
  });

  it('should cap a day at two entries plus an overflow counter', () => {
    const eighth = Array.from(el.querySelectorAll('.cal-day')).find((d) =>
      d.querySelector('.cal-day__num')?.textContent?.trim() === '8'
    )!;
    expect(eighth.querySelectorAll('.cal-day__entry').length).toBe(2);
    expect(eighth.querySelector('.cal-day__more')?.textContent).toBe('+1 more');
  });

  it('should mark padding days as disabled', () => {
    const out = el.querySelectorAll<HTMLButtonElement>('.cal-day--out');
    expect(out.length).toBeGreaterThan(0);
    for (const cell of Array.from(out)) {
      expect(cell.disabled).toBeTrue();
    }
  });

  it('should describe each day with its full date and entry count', () => {
    const eighth = Array.from(el.querySelectorAll('.cal-day')).find((d) =>
      d.querySelector('.cal-day__num')?.textContent?.trim() === '8'
    ) as HTMLButtonElement;
    expect(eighth.getAttribute('aria-label')).toContain('August 8, 2025');
    expect(eighth.getAttribute('aria-label')).toContain('3 entries');
  });

  it('should render the summary with formatted currency', () => {
    const values = Array.from(el.querySelectorAll('.cal-summary-row__value')).map((v) =>
      v.textContent?.trim()
    );
    expect(values).toContain('$5,200.00');
    expect(values).toContain('$175.00');
  });

  it('should populate the day detail once a day is selected', () => {
    const eighth = Array.from(el.querySelectorAll('.cal-day')).find((d) =>
      d.querySelector('.cal-day__num')?.textContent?.trim() === '8'
    ) as HTMLButtonElement;
    eighth.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.cal-day-detail').length).toBe(3);
    expect(el.querySelector('.cal-sidebar__date')?.textContent).toContain('August');
  });

  it('should show an empty state before a day is picked', () => {
    expect(el.querySelector('.cal-inline-empty')).toBeTruthy();
  });

  it('should switch between the month grid and the week strip', () => {
    expect(el.querySelectorAll('.cal-day').length).toBe(42);

    const weekButton = Array.from(el.querySelectorAll('.cal-segment__btn')).find(
      (b) => b.textContent?.trim() === 'Week'
    ) as HTMLButtonElement;
    weekButton.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('.cal-day').length).toBe(0);
    expect(el.querySelectorAll('.cal-week__day').length).toBe(7);
    expect(weekButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('should list the biggest spends', () => {
    expect(el.querySelectorAll('.cal-bill-row').length).toBe(3);
    const first = el.querySelector('.cal-bill-row')!;
    expect(first.querySelector('.cal-bill-row__name')?.textContent).toContain('Whole Foods');
  });

  it('should show an empty month state when nothing is recorded', () => {
    fixture.componentInstance['cal'].loadCalendar(2).subscribe();
    http.expectOne((r) => r.url === URL).flush({
      ...RESPONSE,
      data: { ...RESPONSE.data, month: 'March', entryMap: {}, summary: { totalIncome: 0, totalExpenses: 0, netBalance: 0 } },
    });
    fixture.detectChanges();

    expect(el.querySelector('.cal-empty')).toBeTruthy();
  });
});