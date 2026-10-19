import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';
import { provideAppIcons } from '../icons/app-icons';

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
      providers: [...provideAppIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
    component.label = 'Test Label';
    component.value = '$1,000';
    component.icon = 'lucideWallet';
    component.color = 'blue';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the icon from the shared registry', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eiq-kpi-card__icon eiq-icon')).toBeTruthy();
    expect(el.querySelector('.eiq-kpi-card__icon svg')).toBeTruthy();
  });

  it('should display label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eiq-kpi-card__label')?.textContent).toContain('Test Label');
  });

  it('should display value', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eiq-kpi-card__value')?.textContent).toContain('$1,000');
  });

  it('should apply color class', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eiq-kpi-card__icon--blue')).toBeTruthy();
  });

  it('should show trend when percent is provided', () => {
    component.trendPercent = 12.5;
    component.trendDirection = 'up';
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const trend = el.querySelector('.eiq-kpi-card__trend');
    expect(trend).toBeTruthy();
    expect(trend?.textContent).toContain('12.5%');
    expect(trend?.classList.contains('eiq-kpi-card__trend--up')).toBeTrue();
  });

  it('should hide trend when percent is null', () => {
    component.trendPercent = null;
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.eiq-kpi-card__trend')).toBeNull();
  });

  describe('sentiment', () => {
    it('should infer sentiment from trend direction when not set', () => {
      component.trendPercent = 5;
      component.trendDirection = 'down';
      expect(component.trendClass()).toBe('eiq-kpi-card__trend--down');

      component.trendDirection = 'up';
      expect(component.trendClass()).toBe('eiq-kpi-card__trend--up');
    });

    it('should let an explicit positive sentiment override a downward arrow', () => {
      // Expense trending down is GOOD news — colour must encode state, not direction.
      component.trendPercent = -8;
      component.trendDirection = 'down';
      component.sentiment = 'positive';
      expect(component.trendClass()).toBe('eiq-kpi-card__trend--up');
    });

    it('should let an explicit negative sentiment override an upward arrow', () => {
      component.trendPercent = 12;
      component.trendDirection = 'up';
      component.sentiment = 'negative';
      expect(component.trendClass()).toBe('eiq-kpi-card__trend--down');
    });

    it('should support a neutral tone', () => {
      component.trendPercent = 0;
      component.sentiment = 'neutral';
      expect(component.trendClass()).toBe('eiq-kpi-card__trend--flat');
    });
  });

  describe('caption and footnote', () => {
    it('should not render caption or footnote when empty', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.eiq-kpi-card__caption')).toBeNull();
      expect(el.querySelector('.eiq-kpi-card__footnote')).toBeNull();
    });

    it('should render caption and footnote when provided', () => {
      component.caption = 'Across 3 accounts';
      component.footnote = 'Updated 2 min ago';
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.eiq-kpi-card__caption')?.textContent).toContain('Across 3 accounts');
      expect(el.querySelector('.eiq-kpi-card__footnote')?.textContent).toContain('Updated 2 min ago');
    });
  });
});