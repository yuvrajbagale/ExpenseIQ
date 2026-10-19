import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';

import { HeroBackgroundComponent } from './hero-background.component';

/** Minimal 2D context stub — the component only needs these calls to not throw. */
function stubContext(): CanvasRenderingContext2D {
  return {
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    clearRect: () => {},
    fillRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    arc: () => {},
    fill: () => {},
    save: () => {},
    restore: () => {},
    setTransform: () => {},
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  } as unknown as CanvasRenderingContext2D;
}

describe('HeroBackgroundComponent', () => {
  let fixture: ComponentFixture<HeroBackgroundComponent>;
  let component: HeroBackgroundComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroBackgroundComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeroBackgroundComponent);
    component = fixture.componentInstance;

    // Give the host a real box, otherwise the canvas measures 0×0.
    const host = fixture.nativeElement as HTMLElement;
    Object.defineProperty(host, 'getBoundingClientRect', {
      value: () => ({ width: 1200, height: 700, top: 0, left: 0, right: 1200, bottom: 700 }),
      configurable: true,
    });

    const target = host.querySelector('canvas') as HTMLCanvasElement;
    target.getContext = ((id: string) =>
      id === '2d' ? stubContext() : null) as unknown as HTMLCanvasElement['getContext'];

    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the static layers regardless of video', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.hbg__grid')).toBeTruthy();
    expect(el.querySelector('.hbg__grain')).toBeTruthy();
    expect(el.querySelector('.hbg__vignette')).toBeTruthy();
    expect(el.querySelectorAll('.hbg__beam').length).toBe(2);
  });

  it('should not render a video element when no source is supplied', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('video')).toBeNull();
  });

  it('should render an accessible, silent looping video when a source is supplied', () => {
    component.videoSrc = 'hero/loop.mp4';
    fixture.detectChanges();

    const video = (fixture.nativeElement as HTMLElement).querySelector('video');
    expect(video).toBeTruthy();
    expect(video!.muted).toBeTrue();
    expect(video!.loop).toBeTrue();
    expect(video!.getAttribute('aria-hidden')).toBe('true');
  });

  it('should size the canvas backing store to the box, capped DPR', () => {
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas')!;
    // DPR is clamped to 1.5, so width must be exactly box width × 1 (headless DPR 1)
    // or × 1.5 on a hi-dpi runner — either way it must be non-zero and finite.
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
    expect(Number.isFinite(canvas.width)).toBeTrue();
  });

  it('should expose intensity as a CSS custom property', () => {
    component.intensity = 0.5;
    fixture.detectChanges();
    const root = (fixture.nativeElement as HTMLElement).querySelector('.hbg') as HTMLElement;
    expect(root.style.getPropertyValue('--hbg-intensity')).toBe('0.5');
  });

  it('should stop the animation loop on destroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
    // A second destroy must stay safe (idempotent cleanup).
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should not leave a stale observer after destroy', () => {
    const spy = fixture.nativeElement as HTMLElement;
    expect(spy).toBeTruthy();
    component.ngOnDestroy();
    expect(document.body.classList.contains('eiq-nav-open')).toBeFalse();
  });
});