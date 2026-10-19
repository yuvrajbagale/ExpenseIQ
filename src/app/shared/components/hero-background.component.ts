import {
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  AfterViewInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Animated marketing-page background.
 *
 * Layered like the reference sites (Stripe / Linear / Vercel) but dependency-free:
 *
 *   1. `video`   — optional looping MP4/WebM. Enable by passing `videoSrc`.
 *                  Silent, inline, non-blocking; the layers beneath stay visible
 *                  while it loads, so there is never a blank hero.
 *   2. `canvas`  — canvas-2D aurora: slow Lissajous gradient blobs + light streaks
 *                  + a low-opacity constellation. This is the default and needs
 *                  no asset at all.
 *   3. CSS mesh  — static gradient orbs (painted by the parent's stylesheet).
 *   4. grid      — faint engineering grid, masked toward the centre.
 *   5. grain     — SVG turbulence so large gradients don't band on wide gamuts.
 *
 * Performance rules baked in:
 * - `devicePixelRatio` capped at 1.5 (fill-rate guard on retina).
 * - Animation pauses when the tab is hidden or the element scrolls out of view.
 * - `prefers-reduced-motion: reduce` renders exactly one static frame, then stops.
 */
@Component({
  selector: 'eiq-hero-bg',
  standalone: true,
  template: `
    <div class="hbg" [style.--hbg-intensity]="intensity">
      @if (videoSrc) {
        <video
          class="hbg__video"
          [src]="videoSrc"
          [poster]="posterSrc || null"
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          aria-hidden="true"
          tabindex="-1"></video>
        <div class="hbg__video-scrim"></div>
      }

      <canvas
        #canvas
        class="hbg__canvas"
        [class.hbg__canvas--hidden]="videoSrc"
        aria-hidden="true"></canvas>

      <div class="hbg__grid" aria-hidden="true"></div>
      <div class="hbg__beams" aria-hidden="true">
        <span class="hbg__beam hbg__beam--1"></span>
        <span class="hbg__beam hbg__beam--2"></span>
      </div>
      <div class="hbg__vignette" aria-hidden="true"></div>
      <div class="hbg__grain" aria-hidden="true"></div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .hbg {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      /* Layered motion: zoom the canvas slowly, sweep the beams. */
      --hbg-intensity: 1;
    }

    .hbg__video,
    .hbg__canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .hbg__video { opacity: 0.4; filter: saturate(1.1); }
    .hbg__canvas--hidden { opacity: 0; }

    /* Darkens video so foreground text always clears 4.5:1. */
    .hbg__video-scrim {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 70% 60% at 50% 45%, rgba(11, 13, 20, 0.35), transparent 70%),
        linear-gradient(180deg, rgba(11, 13, 20, 0.82) 0%, rgba(11, 13, 20, 0.6) 45%, rgba(11, 13, 20, 0.95) 100%);
    }

    .hbg__grid {
      position: absolute;
      inset: -1px;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 58px 58px;
      mask-image: radial-gradient(ellipse 82% 64% at 50% 42%, #000 35%, transparent 100%);
      -webkit-mask-image: radial-gradient(ellipse 82% 64% at 50% 42%, #000 35%, transparent 100%);
      animation: hbg-drift 40s linear infinite;
    }
    @keyframes hbg-drift {
      from { background-position: 0 0, 0 0; }
      to   { background-position: 58px 58px, 58px 58px; }
    }

    /* Sweeping light beams — reads as "live" without costing frames. */
    .hbg__beams { position: absolute; inset: 0; overflow: hidden; }
    .hbg__beam {
      position: absolute;
      top: -30%;
      width: 42%;
      height: 160%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(129, 140, 248, 0.07) 45%,
        rgba(56, 189, 248, 0.05) 55%,
        transparent
      );
      filter: blur(28px);
      transform: rotate(18deg);
      opacity: var(--hbg-intensity);
    }
    .hbg__beam--1 { left: -20%; animation: hbg-sweep 19s cubic-bezier(0.65, 0, 0.35, 1) infinite; }
    .hbg__beam--2 { right: -22%; animation: hbg-sweep 26s cubic-bezier(0.65, 0, 0.35, 1) infinite reverse; }
    @keyframes hbg-sweep {
      0%   { transform: translateX(-40%) rotate(18deg); opacity: 0; }
      18%  { opacity: var(--hbg-intensity); }
      82%  { opacity: var(--hbg-intensity); }
      100% { transform: translateX(140%) rotate(18deg); opacity: 0; }
    }

    .hbg__vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 100% 78% at 50% 50%, transparent 42%, rgba(6, 7, 12, 0.72) 100%);
    }

    /* Fractal-noise grain — kills gradient banding on wide-gamut displays. */
    .hbg__grain {
      position: absolute;
      inset: -50%;
      opacity: 0.16;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
      animation: hbg-grain 700ms steps(4) infinite;
    }
    @keyframes hbg-grain {
      0%   { transform: translate(0, 0); }
      25%  { transform: translate(-4%, 3%); }
      50%  { transform: translate(3%, -4%); }
      75%  { transform: translate(-3%, -3%); }
      100% { transform: translate(0, 0); }
    }

    @media (prefers-reduced-motion: reduce) {
      .hbg__grid,
      .hbg__beam,
      .hbg__grain {
        animation: none !important;
      }
      .hbg__beam { opacity: 0.25; }
    }
  `],
})
export class HeroBackgroundComponent implements AfterViewInit, OnDestroy {
  /** Optional looping video URL. Leave null to use the canvas aurora only. */
  @Input() videoSrc: string | null = null;
  @Input() posterSrc: string | null = null;
  /** Scales the beam/opacity layers. 1 = full, 0 = flat. */
  @Input() intensity = 1;

  private canvas: HTMLCanvasElement | null = null;
  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId = 0;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private running = false;
  private startTime = 0;
  private width = 0;
  private height = 0;
  private reduceMotion = false;
  private lastT = 0;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.hostRef.nativeElement.querySelector<HTMLCanvasElement>('canvas');
    this.canvas = canvas ?? null;
    if (!canvas) return;

    this.ctx = canvas.getContext('2d', { alpha: true });
    if (!this.ctx) return;

    // Run entirely outside Angular — no change detection per frame.
    this.zone.runOutsideAngular(() => {
      this.resize();
      this.render(0);

      if (this.reduceMotion) return; // single static frame, done

      this.observeVisibility();
      this.observeResize();
      this.running = true;
      this.startTime = performance.now();
      this.loop();
    });
  }

  ngOnDestroy(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
  }

  /* ── Lifecycle plumbing ─────────────────────────────────────────────── */

  private loop = (): void => {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.loop);
    if (document.hidden) return;
    this.render((performance.now() - this.startTime) / 1000);
  };

  private observeVisibility(): void {
    this.intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.running = entry.isIntersecting && !document.hidden;
        if (this.running) {
          // Reset the clock so the animation resumes where it paused.
          this.startTime = performance.now() - (this.lastT ?? 0) * 1000;
          this.loop();
        } else {
          cancelAnimationFrame(this.rafId);
        }
      },
      { threshold: 0.01 }
    );
    this.intersectionObserver.observe(this.hostRef.nativeElement);
  }

  private observeResize(): void {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.hostRef.nativeElement);
  }

  private resize(): void {
    if (!this.canvas) return;
    const rect = this.hostRef.nativeElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));

    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* ── Painting ───────────────────────────────────────────────────────── */

  /** Soft drifting gradient blobs — the "aurora" layer. */
  private drawAurora(ctx: CanvasRenderingContext2D, t: number): void {
    const w = this.width;
    const h = this.height;
    const scale = Math.max(w, h) / 1000;

    // [colour, r, x-phase, y-phase, x-freq, y-freq, x-amp, y-amp, alpha]
    const blobs: Array<[number[], number, number, number, number, number, number, number, number]> = [
      [[99, 102, 241], 620 * scale, 0.0, 0.0, 0.11, 0.09, 0.28, 0.16, 0.5],
      [[56, 189, 248], 480 * scale, 2.1, 1.3, 0.08, 0.13, 0.30, 0.18, 0.34],
      [[139, 92, 246], 520 * scale, 4.2, 2.7, 0.10, 0.07, 0.26, 0.20, 0.38],
      [[79, 70, 229], 400 * scale, 1.4, 4.1, 0.14, 0.06, 0.22, 0.14, 0.3],
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const [rgb, r, px, py, fx, fy, ax, ay, alpha] of blobs) {
      const cx = w * (0.5 + Math.sin(t * fx + px) * ax);
      const cy = h * (0.46 + Math.cos(t * fy + py) * ay);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const c = `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
      g.addColorStop(0, `rgba(${c}, ${alpha})`);
      g.addColorStop(0.45, `rgba(${c}, ${alpha * 0.28})`);
      g.addColorStop(1, `rgba(${c}, 0)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  /** Low-opacity node constellation — the "data" texture behind the product. */
  private drawConstellation(ctx: CanvasRenderingContext2D, t: number): void {
    const w = this.width;
    const h = this.height;
    const nodes = Math.round(Math.min(46, Math.max(18, (w * h) / 26000)));
    const linkDist = Math.min(w, h) * 0.16;

    const pts: Array<{ x: number; y: number; vx: number; vy: number; r: number }> = [];
    for (let i = 0; i < nodes; i++) {
      const angle = (i / nodes) * Math.PI * 2;
      const radius = (0.2 + ((i * 37) % 100) / 160) * Math.min(w, h);
      pts.push({
        x: w * 0.5 + Math.cos(angle) * radius * 1.5,
        y: h * 0.46 + Math.sin(angle) * radius * 0.85,
        vx: 0.06 + (((i * 13) % 10) / 100) * (i % 2 ? 1 : -1),
        vy: 0.05 + (((i * 7) % 10) / 100) * (i % 3 ? 1 : -1),
        r: 0.8 + ((i * 11) % 10) / 14,
      });
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < nodes; i++) {
      const p = pts[i];
      p.x += p.vx * 1.6;
      p.y += p.vy * 1.6;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      for (let j = i + 1; j < nodes; j++) {
        const q = pts[j];
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        if (d > linkDist) continue;
        const a = (1 - d / linkDist) * 0.16;
        ctx.strokeStyle = `rgba(165, 180, 252, ${a.toFixed(3)})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(199, 210, 254, ${(0.16 + p.r * 0.05).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** Horizontal light streaks sweeping across — subtle "throughput" cue. */
  private drawStreaks(ctx: CanvasRenderingContext2D, t: number): void {
    const w = this.width;
    const h = this.height;
    const streaks = [
      { y: 0.22, speed: 0.055, len: 0.34, alpha: 0.1, hue: '165, 180, 252' },
      { y: 0.62, speed: -0.038, len: 0.26, alpha: 0.08, hue: '56, 189, 248' },
      { y: 0.82, speed: 0.07, len: 0.2, alpha: 0.06, hue: '196, 181, 253' },
    ];

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const s of streaks) {
      const period = 11;
      const phase = ((t * s.speed) % period + period) % period / period;
      const x = -w * s.len + phase * w * 1.6;
      const g = ctx.createLinearGradient(x, 0, x + w * s.len, 0);
      g.addColorStop(0, `rgba(${s.hue}, 0)`);
      g.addColorStop(0.5, `rgba(${s.hue}, ${s.alpha})`);
      g.addColorStop(1, `rgba(${s.hue}, 0)`);
      ctx.fillStyle = g;
      const y = h * s.y;
      const th = Math.max(1, h * 0.0022);
      ctx.fillRect(x, y, w * s.len, th);
    }
    ctx.restore();
  }

  private render(t: number): void {
    const ctx = this.ctx;
    if (!ctx || this.width === 0 || this.height === 0) return;
    this.lastT = t;

    ctx.clearRect(0, 0, this.width, this.height);
    this.drawAurora(ctx, t);
    this.drawConstellation(ctx, t);
    this.drawStreaks(ctx, t);
  }
}