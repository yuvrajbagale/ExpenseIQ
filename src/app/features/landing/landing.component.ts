import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ElementRef, ViewChild, NgZone, PLATFORM_ID, Inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroCanvas') heroCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('nav') navRef!: ElementRef<HTMLElement>;

  private ctx: gsap.Context | null = null;
  private threeScene: any = null;
  private animFrameId = 0;
  private isBrowser: boolean;

  readonly steps = [
    { n: '01', title: 'Capture', copy: 'Forward a receipt or snap a photo. OCR pulls every detail automatically.' },
    { n: '02', title: 'Categorize', copy: 'AI files each line item under the right ledger. No manual sorting.' },
    { n: '03', title: 'Understand', copy: 'See where money goes with real-time reports and budget alerts.' },
  ];

  readonly features: Feature[] = [
    { icon: 'scan', title: 'Receipt scanning', copy: 'Point your camera at a receipt. Merchant, tax, total — extracted in seconds.' },
    { icon: 'brain', title: 'Smart categorization', copy: 'Filed automatically. Gets sharper every time you correct it.' },
    { icon: 'bell', title: 'Budget alerts', copy: 'Know the moment a category runs hot, not when the statement arrives.' },
    { icon: 'bank', title: 'Bank sync', copy: 'Connect accounts and cards. Balances stay current on their own.' },
    { icon: 'team', title: 'Team reports', copy: 'Roll up spend across a team or household into one shared ledger.' },
    { icon: 'chart', title: 'Monthly insight', copy: 'A plain-language summary of what moved, and why.' },
  ];

  readonly pricing: PricingTier[] = [
    { name: 'Personal', price: '$0', cadence: '/forever', copy: 'For tracking your own spend.', perks: ['1 bank connection', 'Manual receipt capture', 'Monthly summary'], featured: false },
    { name: 'Pro', price: '$9', cadence: '/month', copy: 'For anyone serious about their numbers.', perks: ['Unlimited connections', 'Auto receipt scanning', 'Budget alerts', 'CSV export'], featured: true },
    { name: 'Team', price: '$24', cadence: '/month', copy: 'For households and small teams.', perks: ['Everything in Pro', 'Shared ledgers', 'Role-based access', 'Priority support'], featured: false },
  ];

  constructor(
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) platformId: Object,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    this.initThree();
    this.initGSAP();
  }

  ngOnDestroy(): void {
    this.ctx?.revert();
    cancelAnimationFrame(this.animFrameId);
    this.threeScene?.dispose?.();
  }

  /* ─── THREE.JS — Subtle floating particles ─────────────────────────── */

  private async initThree(): Promise<void> {
    const THREE = await import('three');
    const canvas = this.heroCanvas.nativeElement;
    const w = window.innerWidth;
    const h = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5);

    /* ── Subtle particle field ── */
    const count = 300;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x3b82f6,
      size: 0.015,
      transparent: true,
      opacity: 0.3,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    /* ── Soft radial glow ── */
    const glowGeo = new THREE.PlaneGeometry(12, 12);
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uColor: { value: new THREE.Color(0x3b82f6) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float d = distance(vUv, vec2(0.5));
          float glow = exp(-d * 3.0) * 0.12;
          float pulse = 1.0 + sin(uTime * 0.3) * 0.15;
          gl_FragColor = vec4(uColor, glow * pulse);
        }
      `,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.set(0, 1, -4);
    scene.add(glowMesh);

    /* ── Store & animate ── */
    const clock = new THREE.Clock();
    this.threeScene = { renderer, scene, camera, particles, dispose: () => {
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
    }};

    this.ngZone.runOutsideAngular(() => {
      const animate = () => {
        this.animFrameId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();

        particles.rotation.y = t * 0.015;
        particles.rotation.x = Math.sin(t * 0.1) * 0.02;

        glowMat.uniforms.uTime.value = t;

        renderer.render(scene, camera);
      };
      animate();
    });

    window.addEventListener('resize', () => {
      const w2 = window.innerWidth;
      const h2 = window.innerHeight;
      camera.aspect = w2 / h2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    });
  }

  /* ─── GSAP ──────────────────────────────────────────────────────────── */

  private initGSAP(): void {
    this.ctx = gsap.context(() => {
      /* ── Hero entrance ── */
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.ld-hero__badge', { opacity: 0, y: 20, duration: 0.6 }, 0.2)
        .from('.ld-hero__title', { opacity: 0, y: 30, duration: 0.8 }, 0.3)
        .from('.ld-hero__sub', { opacity: 0, y: 20, duration: 0.7 }, 0.5)
        .from('.ld-hero__ctas', { opacity: 0, y: 20, duration: 0.6 }, 0.6)
        .from('.ld-hero__trust', { opacity: 0, y: 15, duration: 0.6 }, 0.7);

      /* ── Section reveals ── */
      gsap.utils.toArray<HTMLElement>('.ld-reveal').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 60%', scrub: 1 },
          opacity: 0,
          y: 40,
        });
      });

      /* ── Pricing stagger ── */
      gsap.from('.ld-tier', {
        scrollTrigger: { trigger: '.ld-pricing__grid', start: 'top 80%' },
        opacity: 0,
        y: 40,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
      });

      /* ── Security badges stagger ── */
      gsap.from('.ld-security__badge', {
        scrollTrigger: { trigger: '.ld-security__badges', start: 'top 85%' },
        opacity: 0,
        x: -20,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
      });

    }, document.body);
  }

  /* ─── HELPERS ───────────────────────────────────────────────────────── */

  goToAuth(mode: 'login' | 'signup'): void {
    this.router.navigate(['/auth'], { queryParams: { mode } });
  }
}
