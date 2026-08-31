import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleRowComponent } from './toggle-row.component';

describe('ToggleRowComponent', () => {
  let component: ToggleRowComponent;
  let fixture: ComponentFixture<ToggleRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToggleRowComponent);
    component = fixture.componentInstance;
    component.label = 'Test Toggle';
    component.description = 'A test description';
    component.value = false;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toggle-row__label')?.textContent).toContain('Test Toggle');
  });

  it('should display description', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toggle-row__desc')?.textContent).toContain('A test description');
  });

  it('should emit valueChange on click', () => {
    spyOn(component.valueChange, 'emit');
    const btn = fixture.nativeElement.querySelector('.toggle-switch') as HTMLElement;
    btn.click();
    expect(component.valueChange.emit).toHaveBeenCalled();
  });

  it('should apply active class when value is true', () => {
    component.value = true;
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.toggle-switch') as HTMLElement;
    expect(btn.classList.contains('toggle-switch--on')).toBeTrue();
  });

  it('should hide description when not provided', () => {
    component.description = '';
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.toggle-row__desc')).toBeNull();
  });
});
