import { Component, AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';

interface Stat {
  label: string;
  value: number;
  prefix: string;
  decimals: number;
  trend: string;
  positive: boolean;
}

interface Category {
  name: string;
  amount: number;
  percent: number;
  color: string;
}

interface Transaction {
  merchant: string;
  date: string;
  category: string;
  amount: string;
  positive?: boolean;
  initials: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements AfterViewInit {
  @ViewChild('cardGrid') cardGrid!: ElementRef;
  @ViewChildren('statValue') statValues!: QueryList<ElementRef>;

  userInitials = 'JR';
  userName = 'Jordan Rao';

  stats: Stat[] = [
    { label: 'Spent this month', value: 2480.1, prefix: '$', decimals: 2, trend: '+8.2% vs last month', positive: false },
    { label: 'Budget remaining', value: 519.9, prefix: '$', decimals: 2, trend: 'On track', positive: true },
    { label: 'Avg. daily spend', value: 82.67, prefix: '$', decimals: 2, trend: '−4.1% vs last month', positive: true },
    { label: 'Transactions', value: 47, prefix: '', decimals: 0, trend: '6 pending review', positive: true },
  ];

  categories: Category[] = [
    { name: 'Groceries', amount: 412.3, percent: 28, color: '#B8862E' },
    { name: 'Dining', amount: 288.4, percent: 20, color: '#4A7A5D' },
    { name: 'Transport', amount: 196.4, percent: 14, color: '#6B7280' },
    { name: 'Utilities', amount: 172.1, percent: 12, color: '#B5473A' },
    { name: 'Subscriptions', amount: 84.5, percent: 6, color: '#8FA598' },
    { name: 'Other', amount: 289.1, percent: 20, color: '#D9D4C2' },
  ];

  // conic-gradient string built from category percentages
  get donutGradient(): string {
    let acc = 0;
    const stops = this.categories.map((c) => {
      const start = acc;
      acc += c.percent;
      return `${c.color} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  trend = [
    { month: 'Mar', value: 40 },
    { month: 'Apr', value: 65 },
    { month: 'May', value: 50 },
    { month: 'Jun', value: 80 },
    { month: 'Jul', value: 60 },
    { month: 'Aug', value: 90 },
  ];

  transactions: Transaction[] = [
    { merchant: 'Whole Foods Market', date: 'Aug 28', category: 'Groceries', amount: '$86.55', initials: 'WF' },
    { merchant: 'Uber Trip', date: 'Aug 28', category: 'Transport', amount: '$18.20', initials: 'UB' },
    { merchant: 'Payroll Deposit', date: 'Aug 27', category: 'Income', amount: '+$3,200.00', positive: true, initials: 'PD' },
    { merchant: 'Blue Bottle Coffee', date: 'Aug 26', category: 'Dining', amount: '$6.40', initials: 'BB' },
    { merchant: 'Con Edison', date: 'Aug 24', category: 'Utilities', amount: '$142.10', initials: 'CE' },
    { merchant: 'Netflix', date: 'Aug 22', category: 'Subscriptions', amount: '$15.49', initials: 'NF' },
    { merchant: 'CVS Pharmacy', date: 'Aug 21', category: 'Health', amount: '$24.90', initials: 'CV' },
  ];

  ngAfterViewInit(): void {
    // GSAP Animation 3 of 3 — dashboard entry
    // Stat cards rise into place in sequence, and each headline number counts
    // up from zero rather than just appearing — the ledger "settling" on open.
    const cards = this.cardGrid.nativeElement.querySelectorAll('.stat-card');

    gsap.set(cards, { opacity: 0, y: 18 });
    gsap.to(cards, { opacity: 1, y: 0, duration: 0.55, stagger: 0.1, ease: 'power2.out' });

    this.statValues.forEach((ref, i) => {
      const stat = this.stats[i];
      const counter = { val: 0 };
      gsap.to(counter, {
        val: stat.value,
        duration: 1.1,
        delay: 0.15 * i,
        ease: 'power1.out',
        onUpdate: () => {
          ref.nativeElement.textContent = stat.prefix + counter.val.toFixed(stat.decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        },
      });
    });
  }
}
