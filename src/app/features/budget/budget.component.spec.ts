import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { BudgetComponent } from './budget.component';
import { environment } from '../../../environments/environment';

const URL = `${environment.apiUrl}/budget`;

const CATEGORIES = [
  { category: 'Food', defaultLimit: 600, color: '#fee2e2' },
  { category: 'Housing', defaultLimit: 1200, color: '#fef3c7' },
  { category: 'Fitness', defaultLimit: 100, color: '#dcfce7' },
];

const MONTHS = [
  { offset: 0, index: 7, label: 'August', available: true, spentByCategory: { Food: 540, Housing: 1200 } },
  { offset: 1, index: 6, label: 'July', available: true, spentByCategory: { Food: 300, Housing: 1200 } },
  { offset: 2, index: 5, label: 'June', available: true, spentByCategory: { Food: 360, Housing: 1200 } },
];

const RESPONSE = {
  success: true,
  message: 'Budget loaded.',
  data: { month: 'August', year: 2025, categories: CATEGORIES, months: MONTHS },
};

describe('BudgetComponent', () => {
  let fixture: ComponentFixture<BudgetComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  async function mount() {
    await TestBed.configureTestingModule({
      imports: [BudgetComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BudgetComponent);
    el = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
    http.expectOne((r) => r.url === URL).flush(RESPONSE);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
    await mount();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const setBudgetButton = (): HTMLButtonElement =>
    Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Set budget')
    ) as HTMLButtonElement;

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('Set budget button', () => {
    it('should not render the editor before it is clicked', () => {
      expect(el.querySelector('app-budget-editor')).toBeNull();
    });

    it('should open the editor when clicked', () => {
      setBudgetButton().click();
      fixture.detectChanges();

      const editor = el.querySelector('app-budget-editor');
      expect(editor).toBeTruthy();
      expect(editor!.querySelector('.eiq-modal')).toBeTruthy();
      expect(editor!.querySelector('.eiq-modal')!.getAttribute('aria-modal')).toBe('true');
    });

    it('should render one limit field per category', () => {
      setBudgetButton().click();
      fixture.detectChanges();

      const editor = el.querySelector('app-budget-editor')!;
      expect(editor.querySelectorAll('.be-row').length).toBe(CATEGORIES.length);
      expect(editor.querySelectorAll('.be-row__field').length).toBe(CATEGORIES.length);
    });

    it('should prefill the editor with the saved limits', async () => {
      fixture.componentInstance['budget'].saveLimits({ Food: 700 });
      fixture.detectChanges();

      setBudgetButton().click();
      fixture.detectChanges();
      // `ngModel` writes the input value on a microtask.
      await fixture.whenStable();

      const food = el.querySelector<HTMLInputElement>('app-budget-editor #be-Food')!;
      expect(food).toBeTruthy();
      expect(food.value).toBe('700');
    });

    it('should offer the 3-month average as an applyable suggestion', () => {
      setBudgetButton().click();
      fixture.detectChanges();

      const editor = el.querySelector('app-budget-editor')!;
      // Food averaged (300 + 360) / 2 = 330
      const chip = Array.from(editor.querySelectorAll('.be-row__suggest')).find((c) =>
        c.textContent?.includes('330')
      );
      expect(chip).toBeTruthy();
    });

    it('should close the editor on cancel', () => {
      setBudgetButton().click();
      fixture.detectChanges();

      const cancel = Array.from(el.querySelectorAll('app-budget-editor button')).find((b) =>
        b.textContent?.trim() === 'Cancel'
      ) as HTMLButtonElement;
      cancel.click();
      fixture.detectChanges();

      expect(el.querySelector('app-budget-editor')).toBeNull();
    });

    it('should close the editor when the backdrop is clicked', () => {
      setBudgetButton().click();
      fixture.detectChanges();

      const overlay = el.querySelector('.eiq-modal-overlay')!;
      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(el.querySelector('app-budget-editor')).toBeNull();
    });

    it('should persist limits and refresh the table on save', async () => {
      setBudgetButton().click();
      fixture.detectChanges();
      await fixture.whenStable();

      const food = el.querySelector<HTMLInputElement>('app-budget-editor #be-Food')!;
      food.value = '900';
      food.dispatchEvent(new Event('input'));
      await fixture.whenStable();
      fixture.detectChanges();

      const save = Array.from(
        el.querySelectorAll<HTMLButtonElement>('app-budget-editor button')
      ).find((b) => b.textContent?.trim() === 'Save budgets')!;
      save.click();
      fixture.detectChanges();

      expect(el.querySelector('app-budget-editor')).toBeNull();
      expect(fixture.componentInstance['budget'].rawLimits()['Food']).toBe(900);
    });

    it('should open the editor from a row edit button', () => {
      const rowEdit = el.querySelector('.eiq-txn-actions button, .eiq-icon-btn') as HTMLButtonElement;
      expect(rowEdit).toBeTruthy();
      rowEdit.click();
      fixture.detectChanges();

      expect(el.querySelector('app-budget-editor')).toBeTruthy();
    });
  });

  describe('table and totals', () => {
    it('should list every category', () => {
      expect(el.querySelectorAll('.eiq-txn-table tbody tr').length).toBe(CATEGORIES.length);
    });

    it('should show a No limit badge before anything is set', () => {
      expect(el.textContent).toContain('No limit');
    });

    it('should prompt with a call to action when no budgets are set', () => {
      expect(el.querySelector('.bd-cta')).toBeTruthy();
    });

    it('should hide the call to action once limits are saved', () => {
      fixture.componentInstance['budget'].saveLimits({ Food: 600 });
      fixture.detectChanges();
      expect(el.querySelector('.bd-cta')).toBeNull();
    });

    it('should report overspending against a too-small limit', () => {
      fixture.componentInstance['budget'].saveLimits({ Food: 400 });
      fixture.detectChanges();

      expect(el.textContent).toContain('Overspent');
      expect(el.querySelector('.eiq-badge--danger')).toBeTruthy();
    });

    it('should show formatted currency rather than raw numbers', () => {
      fixture.componentInstance['budget'].saveLimits({ Food: 600 });
      fixture.detectChanges();
      expect(el.querySelector('.eiq-kpi-card__value')?.textContent?.trim()).toBe('$600.00');
    });

    it('should render derived insights instead of hardcoded copy', () => {
      const copy = el.textContent ?? '';
      expect(copy).not.toContain('Summer AC');
      expect(copy).not.toContain('AI-powered');
      expect(el.querySelectorAll('.eiq-insight').length).toBeGreaterThan(0);
    });

    it('should list suggestions where history exists', () => {
      expect(el.querySelectorAll('.bd-suggest-row').length).toBeGreaterThan(0);
      expect(el.textContent).toContain('avg');
    });
  });

  describe('month navigation', () => {
    it('should allow paging back but not forward from the latest month', () => {
      const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('.eiq-month-btn'));
      expect(buttons.length).toBe(2);
      expect(buttons[0].disabled).toBeFalse();
      expect(buttons[1].disabled).toBeTrue();
    });

    it('should request the previous month', () => {
      fixture.componentInstance['budget'].load(4).subscribe();
      http.expectOne((r) => r.url === URL).flush(RESPONSE);
      fixture.detectChanges();

      fixture.componentInstance['budget'].prevMonth();
      const req = http.expectOne((r) => r.url === URL);
      expect(req.request.params.get('month')).toBe('3');
      req.flush(RESPONSE);
      fixture.detectChanges();

      expect(el.querySelector('.eiq-month-label')?.textContent).toContain('April');
    });
  });

  describe('failure handling', () => {
    it('should show a retry state instead of an empty table', () => {
      fixture.componentInstance['budget'].load().subscribe();
      http.expectOne((r) => r.url === URL).error(new ProgressEvent('network error'));
      fixture.detectChanges();

      expect(el.querySelector('.eiq-empty-state')).toBeTruthy();
      expect(el.textContent).toContain("Couldn't load your budget");
    });

    it('should survive a stale payload from an older backend', () => {
      fixture.componentInstance['budget'].load().subscribe();
      // What server.js returned before the rewrite — no `categories`, no `months`.
      http.expectOne((r) => r.url === URL).flush({
        success: true,
        message: 'Budget loaded.',
        data: { month: 'August 2025', totals: {}, categoryBudgets: [], insights: [], recommendations: [] },
      });
      fixture.detectChanges();

      expect(() => fixture.detectChanges()).not.toThrow();
      expect(el.querySelector('.bd-empty')).toBeTruthy();
    });
  });
});