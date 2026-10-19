import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../core/interfaces/user.interface';
import { IconComponent } from './icon.component';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  tone: 'info' | 'warning' | 'success';
}

@Component({
  selector: 'eiq-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="eiq-header">
      <button
        type="button"
        class="eiq-menu-btn"
        aria-label="Open navigation menu"
        (click)="toggleMobileNav()">
        <eiq-icon name="lucideMenu" [size]="21" [strokeWidth]="2" anim="pop" />
      </button>

      <div class="eiq-header__search">
        <span class="eiq-header__search-icon" aria-hidden="true">
          <eiq-icon name="lucideSearch" [size]="16" [strokeWidth]="2" />
        </span>
        <input
          type="search"
          class="eiq-header__search-input"
          [attr.aria-label]="searchPlaceholder"
          [placeholder]="searchPlaceholder"
          (input)="onSearch($event)" />
      </div>

      <div class="eiq-header__actions">
        <!-- Theme toggle -->
        <button
          type="button"
          class="eiq-header__icon-btn"
          [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          [title]="theme.isDark() ? 'Light mode' : 'Dark mode'"
          (click)="toggleTheme()">
          <eiq-icon [name]="theme.isDark() ? 'lucideMoon' : 'lucideSun'" [size]="19" anim="draw" />
        </button>

        <!-- Notifications -->
        <div class="eiq-header__wrap">
          <button
            type="button"
            class="eiq-header__icon-btn"
            [class.eiq-header__icon-btn--open]="showNotifications()"
            aria-label="Notifications"
            [attr.aria-expanded]="showNotifications()"
            (click)="toggleNotifications($event)">
            <eiq-icon name="lucideBell" [size]="19" anim="swing" />
            @if (unreadCount() > 0) {
              <span class="eiq-header__badge">{{ unreadCount() }}</span>
            }
          </button>

          @if (showNotifications()) {
            <div class="eiq-dropdown eiq-header__menu eiq-header__menu--wide" role="dialog" aria-label="Notifications">
              <div class="eiq-header__menu-head">
                <span>Notifications</span>
                @if (unreadCount() > 0) {
                  <button type="button" class="eiq-link" (click)="markAllRead()">Mark all read</button>
                }
              </div>
              <div class="eiq-header__menu-body">
                @for (item of notifications(); track item.id) {
                  <button
                    type="button"
                    class="eiq-notif"
                    [class.eiq-notif--unread]="!item.read"
                    (click)="openNotification(item)">
                    <span class="eiq-notif__dot" [class]="'eiq-notif__dot--' + item.tone" aria-hidden="true"></span>
                    <span class="eiq-notif__body">
                      <span class="eiq-notif__title">{{ item.title }}</span>
                      <span class="eiq-notif__msg">{{ item.message }}</span>
                      <span class="eiq-notif__time">{{ item.time }}</span>
                    </span>
                  </button>
                } @empty {
                  <p class="eiq-header__menu-empty">You're all caught up.</p>
                }
              </div>
            </div>
          }
        </div>

        <!-- User menu -->
        <div class="eiq-header__wrap">
          <button
            type="button"
            class="eiq-header__avatar"
            [class.eiq-header__avatar--open]="showUserMenu()"
            aria-label="Account menu"
            [attr.aria-expanded]="showUserMenu()"
            (click)="toggleUserMenu($event)">
            {{ initials }}
          </button>

          @if (showUserMenu()) {
            <div class="eiq-dropdown eiq-header__menu" role="dialog" aria-label="Account">
              <div class="eiq-header__menu-user">
                <div class="eiq-header__menu-avatar">{{ initials }}</div>
                <div class="eiq-header__menu-identity">
                  <p class="eiq-header__menu-name">{{ resolvedUser?.name ?? 'John Doe' }}</p>
                  <p class="eiq-header__menu-email">{{ resolvedUser?.email ?? 'john@example.com' }}</p>
                </div>
              </div>
              <div class="eiq-header__menu-divider"></div>
              <button type="button" class="eiq-header__menu-item" (click)="goToProfile()">
                <eiq-icon name="lucideUser" [size]="16" anim="draw" />
                Profile
              </button>
              <button type="button" class="eiq-header__menu-item" (click)="goToSettings()">
                <eiq-icon name="lucideSettings" [size]="16" anim="draw" />
                Settings
              </button>
              <button type="button" class="eiq-header__menu-item" (click)="toggleThemeFromMenu()">
                <eiq-icon [name]="theme.isDark() ? 'lucideSun' : 'lucideMoon'" [size]="16" anim="draw" />
                {{ theme.isDark() ? 'Light mode' : 'Dark mode' }}
              </button>
              <div class="eiq-header__menu-divider"></div>
              <button type="button" class="eiq-header__menu-item eiq-header__menu-item--danger" (click)="logout()">
                <eiq-icon name="lucideLogOut" [size]="16" anim="draw" />
                Log out
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .eiq-header__wrap { position: relative; display: flex; }
    .eiq-header__icon-btn--open { background: var(--eiq-hover); color: var(--eiq-foreground); }
    .eiq-header__avatar--open { box-shadow: 0 0 0 3px var(--eiq-primary-ring); }
    .eiq-header__avatar svg { width: 17px; height: 17px; }

    .eiq-header__menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 230px;
      overflow: hidden;
      animation: eiq-rise-in 160ms cubic-bezier(0.2, 0, 0.2, 1);
    }
    .eiq-header__menu--wide { width: 340px; }

    .eiq-header__menu-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--eiq-border);
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--eiq-foreground);
      letter-spacing: -0.01em;
    }
    .eiq-header__menu-body { max-height: 340px; overflow-y: auto; }
    .eiq-header__menu-empty {
      padding: 30px 16px;
      text-align: center;
      color: var(--eiq-muted);
      font-size: 0.8125rem;
    }

    .eiq-notif {
      display: flex;
      gap: 10px;
      width: 100%;
      padding: 12px 14px;
      border: none;
      border-bottom: 1px solid var(--eiq-border-subtle);
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: background 160ms ease;
    }
    .eiq-notif:last-child { border-bottom: none; }
    .eiq-notif:hover { background: var(--eiq-hover); }
    .eiq-notif--unread { background: var(--eiq-primary-softer); }
    .eiq-notif--unread:hover { background: var(--eiq-primary-soft); }
    .eiq-notif__dot {
      width: 8px; height: 8px; border-radius: 50%;
      margin-top: 6px; flex-shrink: 0; background: var(--eiq-primary);
    }
    .eiq-notif__dot--warning { background: var(--eiq-warning); }
    .eiq-notif__dot--success { background: var(--eiq-positive); }
    .eiq-notif__body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .eiq-notif__title { font-size: 0.8125rem; font-weight: 700; color: var(--eiq-foreground); }
    .eiq-notif__msg { font-size: 0.75rem; color: var(--eiq-muted); line-height: 1.45; }
    .eiq-notif__time { font-size: 0.6875rem; color: var(--eiq-faint); margin-top: 2px; }

    .eiq-header__menu-user { display: flex; align-items: center; gap: 11px; padding: 14px; }
    .eiq-header__menu-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: var(--eiq-primary-grad); color: #fff;
      font-size: 0.8125rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .eiq-header__menu-identity { min-width: 0; }
    .eiq-header__menu-name {
      font-size: 0.8125rem; font-weight: 700; color: var(--eiq-foreground);
      margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .eiq-header__menu-email {
      font-size: 0.75rem; color: var(--eiq-muted); margin: 1px 0 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .eiq-header__menu-divider { height: 1px; background: var(--eiq-border); }

    .eiq-header__menu-item {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 10px 14px; border: none;
      background: transparent; color: var(--eiq-foreground);
      font-size: 0.8125rem; font-weight: 500; cursor: pointer; text-align: left;
      transition: background 160ms ease;
      eiq-icon { color: var(--eiq-subtle); }
      &:hover { background: var(--eiq-hover); }
    }
    .eiq-header__menu-item--danger { color: var(--eiq-negative); eiq-icon { color: var(--eiq-negative); } &:hover { background: var(--eiq-negative-soft); } }
  `],
})
export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Input() notificationCount = 3;
  @Input() searchPlaceholder = 'Search transactions, categories…';
  @Output() searchChanged = new EventEmitter<string>();

  readonly auth = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly showNotifications = signal(false);
  readonly showUserMenu = signal(false);

  readonly notifications = signal<AppNotification[]>([
    {
      id: '1',
      title: 'Food & Dining near limit',
      message: 'You are at 85% of this month’s Food & Dining budget.',
      time: '2 min ago',
      read: false,
      tone: 'warning',
    },
    {
      id: '2',
      title: 'Transaction recorded',
      message: 'Grocery expense of $84.50 was added under Food & Dining.',
      time: '1 hr ago',
      read: false,
      tone: 'success',
    },
    {
      id: '3',
      title: 'Weekly summary',
      message: 'You spent 12% less than last week. Keep it up.',
      time: 'Yesterday',
      read: false,
      tone: 'info',
    },
  ]);

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  get resolvedUser(): User | null {
    return this.currentUser ?? this.auth.user();
  }

  get initials(): string {
    return this.resolvedUser?.initials ?? 'JD';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenus();
  }

  onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  toggleTheme(): void {
    this.theme.toggleTheme();
  }

  toggleThemeFromMenu(): void {
    this.theme.toggleTheme();
    this.showUserMenu.set(false);
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu.set(false);
    this.showNotifications.update((v) => !v);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications.set(false);
    this.showUserMenu.update((v) => !v);
  }

  markAllRead(): void {
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
  }

  openNotification(item: AppNotification): void {
    if (!item.read) {
      this.notifications.update((items) =>
        items.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    }
    this.showNotifications.set(false);
  }

  goToSettings(): void {
    this.closeMenus();
    this.router.navigate(['/settings']);
  }

  goToProfile(): void {
    this.closeMenus();
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.closeMenus();
    this.auth.logout();
  }

  /** Mobile sidebar overlay: toggles the off-canvas navigation. */
  toggleMobileNav(): void {
    document.body.classList.toggle('eiq-nav-open');
  }

  /** Close the mobile sidebar (called by the scrim in the sidebar component). */
  closeMobileNav(): void {
    document.body.classList.remove('eiq-nav-open');
  }

  private closeMenus(): void {
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
  }
}