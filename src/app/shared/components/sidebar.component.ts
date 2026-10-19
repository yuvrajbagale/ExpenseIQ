import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NavItem } from '../constants/nav-items';
import { IconComponent } from './icon.component';

export type { NavItem } from '../constants/nav-items';

interface NavGroup {
  label: string;
  items: NavItem[];
}

/** Items grouped for the sidebar's information hierarchy. */
const PRIMARY_GROUP: NavGroup = {
  label: 'Overview',
  items: [
    { label: 'Dashboard', route: '/dashboard', icon: 'lucideLayoutDashboard', exact: true },
    { label: 'Transactions', route: '/transactions', icon: 'lucideArrowLeftRight' },
    { label: 'Add Transaction', route: '/transactions/add', icon: 'lucideCirclePlus' },
  ],
};

const INSIGHTS_GROUP: NavGroup = {
  label: 'Insights',
  items: [
    { label: 'Budget', route: '/budget', icon: 'lucideChartPie' },
    { label: 'Analytics', route: '/analytics', icon: 'lucideTrendingUp' },
    { label: 'Reports', route: '/reports', icon: 'lucideFileText' },
    { label: 'Goals', route: '/goals', icon: 'lucideFlag' },
    { label: 'Calendar', route: '/calendar', icon: 'lucideCalendarDays' },
  ],
};

const MANAGE_GROUP: NavGroup = {
  label: 'Manage',
  items: [
    { label: 'Wallet Accounts', route: '/accounts', icon: 'lucideWalletCards' },
    { label: 'Recurring', route: '/recurring', icon: 'lucideRefreshCw' },
    { label: 'Categories', route: '/categories', icon: 'lucideTag' },
  ],
};

/** Five destinations surfaced in the mobile bottom bar. */
const BOTTOM_NAV: NavItem[] = [
  PRIMARY_GROUP.items[0],
  PRIMARY_GROUP.items[1],
  { label: 'Add', route: '/transactions/add', icon: 'lucideCirclePlus' },
  INSIGHTS_GROUP.items[0],
  INSIGHTS_GROUP.items[4],
];

@Component({
  selector: 'eiq-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  template: `
    <aside class="eiq-sidebar" [attr.aria-label]="'Main navigation'">
      <div class="eiq-sidebar__brand">
        <div class="eiq-sidebar__logo" aria-hidden="true">
          <eiq-icon name="lucideWallet" [size]="17" [strokeWidth]="2.1" />
        </div>
        <span class="eiq-sidebar__brand-name">ExpenseIQ</span>
      </div>

      <button
        type="button"
        class="eiq-sidebar__collapse"
        [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
        [attr.aria-expanded]="!collapsed()"
        (click)="toggleCollapse()">
        <eiq-icon name="lucideChevronLeft" [size]="14" [strokeWidth]="2.2" anim="pop" />
      </button>

      <nav class="eiq-sidebar__nav">
        @for (group of groups; track group.label) {
          <span class="eiq-sidebar__section">{{ group.label }}</span>
          @for (item of group.items; track item.route) {
            <a [routerLink]="item.route"
               routerLinkActive="eiq-nav__item--active"
               [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
               class="eiq-nav__item"
               [attr.title]="collapsed() ? item.label : null"
               (click)="closeMobileNav()">
              <span class="eiq-nav__icon">
                <eiq-icon [name]="item.icon" [size]="19" anim="draw" />
              </span>
              <span class="eiq-nav__label">{{ item.label }}</span>
            </a>
          }
        }
      </nav>

      <div class="eiq-sidebar__footer">
        <a routerLink="/profile" routerLinkActive="eiq-nav__item--active" class="eiq-nav__item"
           [attr.title]="collapsed() ? 'Profile' : null" (click)="closeMobileNav()">
          <span class="eiq-nav__icon"><eiq-icon name="lucideUser" [size]="19" anim="draw" /></span>
          <span class="eiq-nav__label">Profile</span>
        </a>
        <a routerLink="/settings" routerLinkActive="eiq-nav__item--active" class="eiq-nav__item"
           [attr.title]="collapsed() ? 'Settings' : null" (click)="closeMobileNav()">
          <span class="eiq-nav__icon"><eiq-icon name="lucideSettings" [size]="19" anim="draw" /></span>
          <span class="eiq-nav__label">Settings</span>
        </a>
        <button type="button" class="eiq-nav__item eiq-nav__item--danger"
                [attr.title]="collapsed() ? 'Logout' : null" (click)="onLogout()">
          <span class="eiq-nav__icon"><eiq-icon name="lucideLogOut" [size]="19" anim="draw" /></span>
          <span class="eiq-nav__label">Logout</span>
        </button>
      </div>
    </aside>

    <button type="button" class="eiq-scrim" aria-label="Close navigation" (click)="closeMobileNav()"></button>

    <nav class="eiq-bottom-nav" aria-label="Primary">
      @for (item of bottomNav; track item.route) {
        <a [routerLink]="item.route"
           routerLinkActive="eiq-bottom-nav__item--active"
           [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
           class="eiq-bottom-nav__item"
           (click)="closeMobileNav()">
          <span class="eiq-bottom-nav__icon"><eiq-icon [name]="item.icon" [size]="21" anim="pop" /></span>
          <span class="eiq-bottom-nav__label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .eiq-sidebar__collapse {
      position: absolute;
      top: 22px;
      right: -13px;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border-strong);
      color: var(--eiq-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
      box-shadow: var(--eiq-shadow-sm);
      transition: background 160ms ease, color 160ms ease, transform 320ms cubic-bezier(0.2, 0, 0.2, 1);
      &:hover { background: var(--eiq-hover); color: var(--eiq-foreground); }
    }
    :host-context(.eiq-app--rail) .eiq-sidebar__collapse {
      transform: rotate(180deg);
    }
    @media (max-width: 1024px) {
      .eiq-sidebar__collapse { display: none; }
    }
  `],
})
export class SidebarComponent {
  @Input() navItems: NavItem[] | null = null;
  @Output() logoutClicked = new EventEmitter<void>();

  private readonly auth = inject(AuthService);

  readonly collapsed = signal(this.readCollapsed());

  constructor() {
    // Re-apply the persisted rail state so a reload keeps the collapsed layout.
    if (this.collapsed()) {
      document.body.classList.add('eiq-app--rail');
    }
  }

  /** Nav groups; falls back to a single flat group when `navItems` is supplied. */
  get groups(): NavGroup[] {
    return this.navItems
      ? [{ label: 'Navigation', items: this.navItems }]
      : [PRIMARY_GROUP, INSIGHTS_GROUP, MANAGE_GROUP];
  }

  get bottomNav(): NavItem[] {
    return BOTTOM_NAV;
  }

  toggleCollapse(): void {
    const next = !this.collapsed();
    this.collapsed.set(next);
    try {
      localStorage.setItem('eiq.sidebar.collapsed', String(next));
    } catch {
      /* storage unavailable — collapse stays session-only */
    }
    document.body.classList.toggle('eiq-app--rail', next);
  }

  onLogout(): void {
    this.logoutClicked.emit();
    this.auth.logout();
  }

  /** Closes the mobile off-canvas sidebar (no-op on desktop). */
  closeMobileNav(): void {
    document.body.classList.remove('eiq-nav-open');
  }

  private readCollapsed(): boolean {
    try {
      return localStorage.getItem('eiq.sidebar.collapsed') === 'true';
    } catch {
      return false;
    }
  }
}
