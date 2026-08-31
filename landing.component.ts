import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import gsap from 'gsap';

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

interface LedgerEntry {
  merchant: string;
  amount: string;
  category: string;
  positive?: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements AfterViewInit {
  @ViewChild('heroEyebrow') heroEyebrow!: ElementRef;
  @ViewChild('heroHeadline') heroHeadline!: ElementRef;
  @ViewChild('heroSub') heroSub!: ElementRef;
  @ViewChild('heroCtas') heroCtas!: ElementRef;
  @ViewChild('heroTicker') heroTicker!: ElementRef;

  constructor(private router: Router) {}

  steps = [
    { n: '01', title: 'Capture', copy: 'Forward a receipt, snap a photo, or link a bank feed. No manual entry.' },
    { n: '02', title: 'Categorize', copy: 'ExpenseIQ reads every line item and files it under the right ledger category, instantly.' },
    { n: '03', title: 'Understand', copy: 'See where money actually goes, spot the drift early, and act on it before month-end.' },
  ];

  features: Feature[] = [
    { icon: 'scan', title: 'Receipt scanning', copy: 'Point your camera at a receipt. Merchant, tax, and total are pulled out in seconds.' },
    { icon: 'brain', title: 'Smart categorization', copy: 'Every transaction is filed automatically, and gets sharper the more you correct it.' },
    { icon: 'bell', title: 'Budget alerts', copy: 'Know the moment a category runs hot, not when the statement arrives.' },
    { icon: 'bank', title: 'Bank sync', copy: 'Connect accounts and cards. Balances and transactions stay current on their own.' },
    { icon: 'team', title: 'Team reports', copy: 'Roll up spend across a team or household into one shared ledger.' },
    { icon: 'chart', title: 'Monthly insight', copy: 'A plain-language summary of what moved, and why, on the first of every month.' },
  ];

  pricing: PricingTier[] = [
    { name: 'Personal', price: '$0', cadence: '/forever', copy: 'For tracking your own spend.', perks: ['1 bank connection', 'Manual receipt capture', 'Monthly summary'], featured: false },
    { name: 'Pro', price: '$9', cadence: '/month', copy: 'For anyone serious about their numbers.', perks: ['Unlimited connections', 'Auto receipt scanning', 'Budget alerts', 'Export to CSV'], featured: true },
    { name: 'Team', price: '$24', cadence: '/month', copy: 'For households and small teams.', perks: ['Everything in Pro', 'Shared ledgers', 'Role-based access', 'Priority support'], featured: false },
  ];

  ledgerEntries: LedgerEntry[] = [
    { merchant: 'Blue Bottle Coffee', amount: '$6.40', category: 'Dining' },
    { merchant: 'Uber Trip', amount: '$18.20', category: 'Transport' },
    { merchant: 'Whole Foods', amount: '$86.55', category: 'Groceries' },
    { merchant: 'Payroll Deposit', amount: '$3,200.00', category: 'Income', positive: true },
    { merchant: 'Con Edison', amount: '$142.10', category: 'Utilities' },
    { merchant: 'Delta Air Lines', amount: '$412.00', category: 'Travel' },
    { merchant: 'Netflix', amount: '$15.49', category: 'Subscriptions' },
    { merchant: 'CVS Pharmacy', amount: '$24.90', category: 'Health' },
  ];

  // duplicated once so the CSS marquee can loop seamlessly
  get tickerLoop(): LedgerEntry[] {
    return [...this.ledgerEntries, ...this.ledgerEntries];
  }

  ngAfterViewInit(): void {
    // GSAP Animation 1 of 3 — hero entrance
    // A deliberate staggered reveal: eyebrow, then the headline (word by word),
    // then the subhead, then the CTA row. Reads like a ledger being written line by line.
    const headlineWords = this.heroHeadline.nativeElement.querySelectorAll('.word');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.set([this.heroEyebrow.nativeElement, this.heroSub.nativeElement, this.heroCtas.nativeElement, this.heroTicker.nativeElement], {
      opacity: 0,
    })
      .set(headlineWords, { opacity: 0, y: 24 })
      .to(this.heroEyebrow.nativeElement, { opacity: 1, duration: 0.5 })
      .to(headlineWords, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }, '-=0.2')
      .to(this.heroSub.nativeElement, { opacity: 1, y: 0, duration: 0.6 }, '-=0.3')
      .to(this.heroCtas.nativeElement, { opacity: 1, y: 0, duration: 0.5 }, '-=0.35')
      .to(this.heroTicker.nativeElement, { opacity: 1, duration: 0.6 }, '-=0.25');
  }

  goToAuth(mode: 'login' | 'signup'): void {
    this.router.navigate(['/auth'], { queryParams: { mode } });
  }
}
