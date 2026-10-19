import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconComponent } from './icon.component';
import { provideAppIcons } from '../icons/app-icons';

@Component({
  standalone: true,
  imports: [IconComponent],
  template: `<eiq-icon name="lucideWallet" [size]="19" [anim]="anim" />`,
})
class HostComponent {
  anim: 'none' | 'draw' | 'pop' = 'none';
}

describe('IconComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [...provideAppIcons()],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const icon = (): HTMLElement =>
    (fixture.nativeElement as HTMLElement).querySelector('eiq-icon')!;

  it('should render the registered svg', () => {
    expect(icon().querySelector('svg')).toBeTruthy();
  });

  it('should size the icon from the size input', () => {
    expect(
      (icon().querySelector('ng-icon') as HTMLElement).style.getPropertyValue('--ng-icon__size')
    ).toBe('19px');
  });

  it('should be decorative by default', () => {
    expect(icon().getAttribute('aria-hidden')).toBe('true');
    expect(icon().getAttribute('role')).toBeNull();
  });

  it('should expose the animation as a class', () => {
    expect(icon().classList).toContain('eiq-icon');
    expect(icon().classList).toContain('eiq-icon--none');

    host.anim = 'draw';
    fixture.detectChanges();
    expect(icon().classList).toContain('eiq-icon--draw');
  });

  it('should publish each shape length for the draw animation', () => {
    host.anim = 'draw';
    fixture.detectChanges();

    const shapes = icon().querySelectorAll('path, line, polyline, polygon, circle, rect, ellipse');
    expect(shapes.length).toBeGreaterThan(0);
    for (const shape of Array.from(shapes)) {
      expect(dashOf(shape)).not.toBe('');
    }
  });

  it('should not measure geometry when no animation needs it', () => {
    const shapes = icon().querySelectorAll('path');
    for (const shape of Array.from(shapes)) {
      expect(dashOf(shape)).toBe('');
    }
  });

  function dashOf(shape: Element): string {
    return (shape as SVGElement).style.getPropertyValue('--dash');
  }
});
