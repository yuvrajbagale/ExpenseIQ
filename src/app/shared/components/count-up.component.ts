import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Animated numeric readout for money figures.
 *
 * Counts from zero (or `from`) up to `value` using an eased rAF tween, formatted
 * through `Intl.NumberFormat`. Deliberately dependency-free — no GSAP, no library.
 *
 * Behaviour guarantees:
 * - The **final value is rendered synchronously on init**, so if animation is
 *   disabled, the tab is backgrounded, or rAF never fires, the user still sees a
 *   correct number — never a blank or a stuck `0`.
 * - Runs entirely outside Angular and writes straight to the text node, so a
 *   60fps tween triggers zero change-detection cycles.
 * - `prefers-reduced-motion: reduce` skips straight to the final value.
 * - Cleans up rAF and observers in `ngOnDestroy`.
 */
@Component({
  selector: 'eiq-count-up',
  standalone: true,
  template: `<span #t class="eiq-count-up">{{ text }}</span>`,
  styles: [`
    :host { display: inline-block; font-variant-numeric: tabular-nums; }
    .eiq-count-up {
      display: inline-block;
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum" 1;
      transition: opacity 200ms cubic-bezier(0.2, 0, 0.2, 1);
    }
    .eiq-count-up--tweening { opacity: 0.82; }
  `],
})
export class CountUpComponent implements OnInit, OnChanges, OnDestroy {
  /** Target value to land on. */
  @Input() value = 0;
  /** Starting value. Defaults to 0. */
  @Input() from = 0;
  /** Tween length in milliseconds. */
  @Input() duration = 1400;
  /** Milliseconds to wait before the tween starts (used to stagger siblings). */
  @Input() delay = 0;
  /** Digits after the decimal point. */
  @Input() decimals = 0;
  /** Rendered before the digits, e.g. `$`, `+`, `−`. */
  @Input() prefix = '';
  /** Rendered after the digits, e.g. `%`, ` h`. */
  @Input() suffix = '';
  /** Locale for digit grouping. */
  @Input() locale: string | null = null;
  /** Set false to render the final value with no animation. */
  @Input() animate = true;

  /** Current rendered text — also used for SSR / no-JS output. */
  text = '';

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private rafId = 0;
  private timerId: ReturnType<typeof setTimeout> | undefined;
  private observer: IntersectionObserver | null = null;
  private started = false;
  private reduceMotion = false;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    // Always paint the settled value first — animation is an enhancement.
    this.text = this.format(this.value);
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.render(this.value);

    if (!this.shouldAnimate()) return;

    this.zone.runOutsideAngular(() => {
      const host = this.el.nativeElement;
      // Defer the tween until the element is on screen, so off-screen figures
      // don't burn frames animating nobody's view.
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            this.observer?.disconnect();
            this.schedule();
          }
        },
        { threshold: 0.2 }
      );
      this.observer.observe(host);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Value changes after boot (e.g. async data) simply re-render settled.
    if (!changes['value'] || changes['value'].firstChange) return;
    this.cancel();
    this.render(this.value);
  }

  ngOnDestroy(): void {
    this.cancel();
  }

  /* ── Internals ───────────────────────────────────────────────────────── */

  private shouldAnimate(): boolean {
    return this.animate && !this.reduceMotion && this.duration > 0 && this.value !== this.from;
  }

  private schedule(): void {
    if (this.started) return;
    this.started = true;

    if (this.delay > 0) {
      this.timerId = setTimeout(() => this.tween(), this.delay);
      return;
    }
    this.tween();
  }

  private tween(): void {
    const start = performance.now();
    const from = this.from;
    const to = this.value;
    const span = this.duration;

    this.el.nativeElement.firstElementChild?.classList.add('eiq-count-up--tweening');

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / span);
      this.render(from + (to - from) * easeOutExpo(t));
      if (t < 1) {
        this.rafId = requestAnimationFrame(step);
      } else {
        this.render(to);
        this.el.nativeElement.firstElementChild?.classList.remove('eiq-count-up--tweening');
      }
    };
    this.rafId = requestAnimationFrame(step);
  }

  private cancel(): void {
    cancelAnimationFrame(this.rafId);
    if (this.timerId !== undefined) clearTimeout(this.timerId);
    this.timerId = undefined;
    this.observer?.disconnect();
    this.observer = null;
    this.started = false;
    this.el.nativeElement.firstElementChild?.classList.remove('eiq-count-up--tweening');
  }

  private render(n: number): void {
    const text = this.format(n);
    this.text = text;
    const node = this.el.nativeElement.querySelector('span');
    if (node) node.textContent = text;
  }

  private format(n: number): string {
    const rounded = this.decimals > 0 ? n.toFixed(this.decimals) : String(Math.round(n));
    // Only group the integer part — avoids locale surprises on decimals.
    const [int, frac] = rounded.split('.');
    const grouped = new Intl.NumberFormat(this.locale ?? undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(int));
    const body = frac ? `${grouped}.${frac}` : grouped;
    return `${this.prefix}${body}${this.suffix}`;
  }
}

/** Fast-out, slow-in — settles hard on the target so the last digit feels precise. */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}