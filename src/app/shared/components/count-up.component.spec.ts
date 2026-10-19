import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { CountUpComponent } from './count-up.component';

function text(el: HTMLElement): string {
  return el.querySelector('span')!.textContent!.trim();
}

describe('CountUpComponent', () => {
  let fixture: ComponentFixture<CountUpComponent>;
  let component: CountUpComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CountUpComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CountUpComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('formatting', () => {
    it('groups thousands', () => {
      component.value = 24850;
      component.prefix = '$';
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).toBe('$24,850');
    });

    it('renders decimals without grouping them', () => {
      component.value = 24850;
      component.decimals = 2;
      component.prefix = '$';
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).toBe('$24,850.00');
    });

    it('renders a percentage suffix with one decimal', () => {
      component.value = 4.2;
      component.decimals = 1;
      component.suffix = '%';
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).toBe('4.2%');
    });

    it('renders a signed negative-style prefix', () => {
      component.value = 84.5;
      component.decimals = 2;
      component.prefix = '−$';
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).toBe('−$84.50');
    });

    it('handles values below 1000 without a separator', () => {
      component.value = 42;
      component.prefix = '$';
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).toBe('$42');
    });
  });

  describe('settled-value guarantee', () => {
    it('paints the final value on first render even before any animation', () => {
      component.value = 3120;
      component.prefix = '$';
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).toBe('$3,120');
    });

    it('never renders a blank string', () => {
      component.value = 0;
      fixture.detectChanges();
      expect(text(fixture.nativeElement)).not.toBe('');
    });

    it('renders the settled value when animate is false', fakeAsync(() => {
      component.value = 100;
      component.animate = false;
      fixture.detectChanges();
      tick(2000);
      expect(text(fixture.nativeElement)).toBe('100');
    }));

    it('renders the settled value when duration is zero', fakeAsync(() => {
      component.value = 100;
      component.duration = 0;
      fixture.detectChanges();
      tick(2000);
      expect(text(fixture.nativeElement)).toBe('100');
    }));
  });

  describe('lifecycle', () => {
    it('updates the DOM when value changes after boot', () => {
      component.value = 100;
      fixture.detectChanges();

      component.value = 250;
      component.ngOnChanges({
        value: {
          currentValue: 250,
          previousValue: 100,
          firstChange: false,
          isFirstChange: () => false,
        },
      });
      fixture.detectChanges();

      expect(text(fixture.nativeElement)).toBe('250');
    });

    it('is safe to destroy repeatedly', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('skips the tween when from equals value', fakeAsync(() => {
      component.value = 500;
      component.from = 500;
      fixture.detectChanges();
      tick(3000);
      expect(text(fixture.nativeElement)).toBe('500');
    }));
  });
});