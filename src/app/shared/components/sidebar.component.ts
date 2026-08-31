import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NAV_ITEMS, NavItem } from '../constants/nav-items';

export type { NavItem } from '../constants/nav-items';

const ICON_MAP: Record<string, string> = {
  dashboard:              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
  swap_horiz:             '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4m0 0L3 8m4-4l4 4"/><path d="M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>',
  add_circle:             '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  label:                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  pie_chart:              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>',
  trending_up:            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  description:            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  flag:                   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
  calendar_month:         '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  account_balance_wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/><path d="M16 3H8L6 7h12l-2-4z"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>',
  autorenew:              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  person:                 '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  settings:               '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0"/><path d="M4.93 19.07a10 10 0 0 0 14.14 0"/><path d="M22 12h-2M4 12H2M12 22v-2M12 4V2"/></svg>',
};

@Component({
  selector: 'eiq-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside class="eiq-sidebar">
      <div class="eiq-sidebar__brand">
        <div class="eiq-sidebar__logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 7H4C2.9 7 2 7.9 2 9v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/>
            <path d="M16 3H8L6 7h12l-2-4z"/>
          </svg>
        </div>
        <span class="eiq-sidebar__name">ExpenseIQ</span>
      </div>

      <nav class="eiq-sidebar__nav">
        @for (item of resolvedNavItems; track item.route) {
          <a [routerLink]="item.route"
             routerLinkActive="eiq-nav__item--active"
             [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
             class="eiq-nav__item"
             (click)="closeMobileNav()">
            <span class="eiq-nav__icon" [innerHTML]="getIcon(item.icon)"></span>
            <span class="eiq-nav__label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="eiq-sidebar__divider"></div>

      <div class="eiq-sidebar__footer">
        <a routerLink="/profile" routerLinkActive="eiq-nav__item--active" class="eiq-nav__item" (click)="closeMobileNav()">
          <span class="eiq-nav__icon" [innerHTML]="getIcon('person')"></span>
          <span class="eiq-nav__label">Profile</span>
        </a>
        <a routerLink="/settings" routerLinkActive="eiq-nav__item--active" class="eiq-nav__item" (click)="closeMobileNav()">
          <span class="eiq-nav__icon" [innerHTML]="getIcon('settings')"></span>
          <span class="eiq-nav__label">Settings</span>
        </a>
        <button class="eiq-nav__item eiq-nav__item--danger" (click)="onLogout()">
          <span class="eiq-nav__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </span>
          <span class="eiq-nav__label">Logout</span>
        </button>
      </div>
    </aside>
    <!-- Mobile scrim: closes the off-canvas sidebar when tapped -->
    <button type="button" class="eiq-scrim" aria-label="Close navigation" (click)="closeMobileNav()"></button>
  `,
  styles: [`
    .eiq-sidebar {
      width: 240px; flex-shrink: 0; position: fixed;
      top: 0; left: 0; bottom: 0; z-index: 40;
      background: var(--eiq-sidebar-bg);
      border-right: 1px solid var(--eiq-border);
      box-shadow: 2px 0 8px 0 var(--eiq-overlay);
      display: flex; flex-direction: column; padding: 1rem; gap: 0.125rem;
      overflow-y: auto;
    }
    .eiq-sidebar__brand {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.75rem 0.5rem 1.25rem; margin-bottom: 0.25rem;
    }
    .eiq-sidebar__logo {
      width: 2rem; height: 2rem; background: var(--eiq-primary); border-radius: 0.5rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      svg { width: 1rem; height: 1rem; color: #fff; }
    }
    .eiq-sidebar__name {
      font-weight: 700; font-size: 1.125rem; letter-spacing: -0.025em;
      color: var(--eiq-foreground);
    }
    .eiq-sidebar__nav { display: flex; flex-direction: column; gap: 0.125rem; flex: 1; }
    .eiq-nav__item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.5rem 0.75rem; border-radius: 0.5rem;
      font-size: 0.875rem; font-weight: 500; color: var(--eiq-muted);
      cursor: pointer; text-decoration: none; transition: background 150ms ease, color 150ms ease;
      background: none; border: none; width: 100%; text-align: left;
      &:hover { background: var(--eiq-hover); color: var(--eiq-foreground); }
      &:focus-visible { outline: 2px solid var(--eiq-primary); outline-offset: -2px; }
    }
    .eiq-nav__item--active { background: var(--eiq-primary) !important; color: #fff !important; font-weight: 600; box-shadow: var(--eiq-shadow-primary); }
    .eiq-nav__item--danger { color: var(--eiq-red); &:hover { background: var(--eiq-red-10); } }
    .eiq-nav__icon { width: 1rem; height: 1rem; flex-shrink: 0; display: flex; align-items: center; svg { width: 1rem; height: 1rem; } }
    .eiq-sidebar__divider { border-top: 1px solid var(--eiq-border); margin: 0.5rem 0; }
    .eiq-sidebar__footer { display: flex; flex-direction: column; gap: 0.125rem; }
  `]
})
export class SidebarComponent {
  @Input() navItems: NavItem[] | null = null;
  @Output() logoutClicked = new EventEmitter<void>();

  constructor(private auth: AuthService) {}

  get resolvedNavItems(): NavItem[] {
    return this.navItems ?? NAV_ITEMS;
  }

  getIcon(name: string): string {
    return ICON_MAP[name] ?? ICON_MAP['label'];
  }

  onLogout(): void {
    this.logoutClicked.emit();
    this.auth.logout();
  }

  /** Closes the mobile off-canvas sidebar (no-op on desktop). */
  closeMobileNav(): void {
    document.body.classList.remove('eiq-nav-open');
  }
}
