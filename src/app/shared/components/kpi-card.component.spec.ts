import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let component: KpiCardComponent;
  let fixture: ComponentFixture<KpiCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
    component.label = 'Test Label';
    component.value = '$1,000';
    component.icon = '<svg></svg>';
    component.color = 'blue';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
});
