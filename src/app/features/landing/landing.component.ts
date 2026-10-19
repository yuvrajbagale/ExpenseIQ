import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  NgZone,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { HeroBackgroundComponent } from '../../shared/components/hero-background.component';
import { CountUpComponent } from '../../shared/components/count-up.component';
import { IconComponent } from '../../shared/components/icon.component';
import { AppIconName } from '../../shared/icons/app-icons';

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  icon: string;
  title: string;
  copy: string;
}

interface PricingTier {
  name: string;
  price: string;
  cadence: string;
  copy: string;
  perks: string[];
  featured: boolean;
}

interface Metric {
  /** Value the counter lands on. */
  count: number;
  /** Rendered after the digits. */
  suffix: string;
  label: string;
}

/** Icon names for the landing-page feature, marquee and security sections. */
const FEATURE_ICONS = {
  scan: 'lucideFilter',
  budget: 'lucideChartPie',
  chart: 'lucideTrendingUp',
  calendar: 'lucideCalendarDays',
  wallet: 'lucideWallet',
  bell: 'lucideBell',
  flag: 'lucideFlag',
  shield: 'lucideShield',
  lock: 'lucideLock',
  check: 'lucideCheck',
  spark: 'lucideZap',
} as const satisfies Record<string, AppIconName>;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, HeroBackgroundComponent, CountUpComponent, IconComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('nav') navRef!: ElementRef<HTMLElement>;
  @ViewChild('panel') panelRef!: ElementRef<HTMLElement>;

  private ctx: gsap.Context | null = null;
  private scrollHandler: (() => void) | null = null;
  private tiltHandler: ((e: PointerEvent) => void) | null = null;
  private readonly isBrowser: boolean;
  private readonly reduceMotion: boolean;

  readonly year = new Date().getFullYear();

  /**
   * Optional looping hero video.
   *
   * To enable: drop a silent, muted 1920×1080 (or 2560×1440) MP4/WebM loop into
   * `public/` and set this, e.g. `hero/assets/hero-loop.mp4`.
   *
   * The canvas aurora renders underneath regardless, so the hero is never blank
   * while the video buffers — and if the asset is missing, nothing breaks.
   */
  readonly heroVideoSrc: string | null = null;

  /** Concrete platform capabilities — verifiable, not vanity metrics. */
  readonly strip = [
    { label: 'Secure sessions', icon: FEATURE_ICONS.shield },
    { label: 'Server-side pagination', icon: FEATURE_ICONS.chart },
    { label: 'Budget alerts', icon: FEATURE_ICONS.bell },
    { label: 'Recurring detection', icon: FEATURE_ICONS.calendar },
    { label: 'CSV export', icon: FEATURE_ICONS.wallet },
  ];

  /** Duplicated once for a seamless marquee loop. */
  readonly marqueeItems = [...this.strip, ...this.strip];

  /** Recent rows in the hero preview — amounts count up in sequence. */
  readonly panelTransactions = [
    { name: 'Whole Foods Market', amount: 84.5, income: false },
    { name: 'Salary deposit', amount: 3120, income: true },
    { name: 'Metro Transit', amount: 42, income: false },
  ];

  /** Count-up figures — factual capabilities, not invented traction. */
  readonly metrics: Metric[] = [
    { count: 12, suffix: ' rounds', label: 'bcrypt cost' },
    { count: 100, suffix: ' req / 15 min', label: 'Rate limit per IP' },
    { count: 1, suffix: ' MB', label: 'Max request body' },
    { count: 24, suffix: ' h', label: 'Access token life' },
  ];

  readonly steps = [
    {
      n: '01',
      title: 'Capture',
      copy: 'Record an expense the moment it happens — merchant, amount, category and date in one pass.',
    },
    {
      n: '02',
      title: 'Categorize',
      copy: 'Every entry files itself under the right category, so your ledger stays clean without busywork.',
    },
    {
      n: '03',
      title: 'Understand',
      copy: 'Budgets, trends and reports show exactly where your money goes and what to change.',
    },
  ];

  readonly features: Feature[] = [
    { icon: 'wallet', title: 'Accounts & wallets', copy: 'Track balances across cash, bank and card accounts in one ledger.' },
    { icon: 'budget', title: 'Budgets that roll over', copy: 'Set a monthly limit per category. Unspent budget carries into the next month.' },
    { icon: 'chart', title: 'Spend analytics', copy: 'Income-versus-expense trends, category breakdowns and recurring-pattern detection.' },
    { icon: 'calendar', title: 'Calendar view', copy: 'See spending laid out across the month, with a heatmap of your heaviest days.' },
    { icon: 'bell', title: 'Budget alerts', copy: 'Get told the moment a category runs hot, not when the statement arrives.' },
    { icon: 'flag', title: 'Savings goals', copy: 'Name a goal, set a target and watch progress move with every transaction.' },
  ];

  readonly securityFacts = [
    { icon: 'lock', title: 'Passwords hashed with bcrypt', copy: '12 rounds. Plain-text passwords are never stored or logged.' },
    { icon: 'shield', title: 'Sessions in HttpOnly cookies', copy: 'Tokens stay out of JavaScript reach. Secure and SameSite=Strict.' },
    { icon: 'check', title: 'CSRF protection on writes', copy: 'State-changing requests are signed and verified server-side.' },
    { icon: 'spark', title: 'Rate limited & validated', copy: '100 requests per 15 minutes per IP, with server-side input validation.' },
  ];

  readonly pricing: PricingTier[] = [
    {
      name: 'Personal',
      price: '$0',
      cadence: '/forever',
      copy: 'Everything you need to see where your money goes.',
      perks: ['Unlimited transactions', 'Budgets & categories', 'Analytics & reports', 'CSV export', 'Dark mode'],
      featured: false,
    },
    {
      name: 'Pro',
      price: '$9',
      cadence: '/month',
      copy: 'Automation and forecasting for serious money habits.',
      perks: ['Everything in Personal', 'Recurring transaction detection', 'Savings goal forecasting', 'Calendar heatmap', 'Priority support'],
      featured: true,
    },
    {
      name: 'Team',
      price: '$24',
      cadence: '/month',
      copy: 'Shared ledgers for households and small teams.',
      perks: ['Everything in Pro', 'Shared ledgers', 'Role-based access', 'Consolidated reporting'],
      featured: false,
    },
  ];

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    this.reduceMotion = this.isBrowser
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initNav();
    if (this.reduceMotion) return;
    this.initGSAP();
    this.initPanelTilt();
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    if (!this.isBrowser) return;
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
    const panel = this.panelRef?.nativeElement;
    if (panel && this.tiltHandler) {
      panel.removeEventListener('pointermove', this.tiltHandler);
      panel.removeEventListener('pointerleave', this.tiltHandler);
    }
  }

  /* ─── Nav: solidifies on scroll ──────────────────────────────────────── */

  private initNav(): void {
    const nav = this.navRef?.nativeElement;
    if (!nav) return;
    const apply = () => nav.classList.toggle('ld-nav--solid', window.scrollY > 12);
    this.ngZone.runOutsideAngular(() => {
      this.scrollHandler = apply;
      window.addEventListener('scroll', apply, { passive: true });
      apply();
    });
  }

  /* ─── Product panel: pointer-following tilt (fine pointer only) ───────── */

  private initPanelTilt(): void {
    const panel = this.panelRef?.nativeElement;
    if (!panel || !window.matchMedia('(pointer: fine)').matches) return;

    this.ngZone.runOutsideAngular(() => {
      const reset = () => {
        panel.style.setProperty('--tilt-x', '0deg');
        panel.style.setProperty('--tilt-y', '0deg');
        panel.style.setProperty('--glow-x', '50%');
        panel.style.setProperty('--glow-y', '50%');
      };

      this.tiltHandler = (e: PointerEvent) => {
        const r = panel.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        panel.style.setProperty('--tilt-x', `${(0.5 - py) * 7}deg`);
        panel.style.setProperty('--tilt-y', `${(px - 0.5) * 9}deg`);
        panel.style.setProperty('--glow-x', `${px * 100}%`);
        panel.style.setProperty('--glow-y', `${py * 100}%`);
      };

      panel.addEventListener('pointermove', this.tiltHandler);
      panel.addEventListener('pointerleave', reset);
    });
  }

  /* ─── GSAP entrances. Reveals use `fromTo` with `immediateRender: false`
         so content can never be left stuck at opacity 0 if a trigger misfires. */

  private initGSAP(): void {
    this.ctx = gsap.context(() => {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.ld-hero__badge', { opacity: 0, y: 18, duration: 0.5 }, 0.1)
        .from('.ld-hero__title', { opacity: 0, y: 28, duration: 0.7 }, 0.2)
        .from('.ld-hero__sub', { opacity: 0, y: 18, duration: 0.6 }, 0.38)
        .from('.ld-hero__ctas', { opacity: 0, y: 18, duration: 0.5 }, 0.48)
        .from('.ld-hero__trust', { opacity: 0, y: 14, duration: 0.5 }, 0.58)
        .from('.ld-hero__panel', { opacity: 0, y: 40, duration: 0.9, ease: 'power2.out' }, 0.45);

      gsap.utils.toArray<HTMLElement>('.ld-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          }
        );
      });

      gsap.from('.ld-tier', {
        scrollTrigger: { trigger: '.ld-pricing__grid', start: 'top 82%' },
        opacity: 0,
        y: 32,
        stagger: 0.1,
        duration: 0.7,
        ease: 'power2.out',
      });

      // Parallax: hero content drifts slower than the page.
      gsap.to('.ld-hero__copy', {
        yPercent: 14,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: '.ld-hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      gsap.to('.ld-hero__panel', {
        yPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: '.ld-hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
    });
  }

  /* ─── Helpers ───────────────────────────────────────────────────────── */

  featureIcon(name: string): AppIconName {
    return FEATURE_ICONS[name as keyof typeof FEATURE_ICONS] ?? 'lucideCircle';
  }

  goToAuth(mode: 'login' | 'signup'): void {
    this.router.navigate(['/auth'], { queryParams: { mode } });
  }
}