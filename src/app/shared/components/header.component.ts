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

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'eiq-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="header-search">
        <span class="search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input class="search-input"
          [placeholder]="searchPlaceholder"
          (input)="onSearch($event)" />
      </div>

      <div class="header-actions">
        <!-- Notifications -->
        <div class="header-dropdown-wrap">
          <button
            type="button"
            class="action-btn"
            [class.action-btn--active]="showNotifications()"
            aria-label="Notifications"
            (click)="toggleNotifications($event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            @if (unreadCount() > 0) {
              <span class="notif-badge">{{ unreadCount() }}</span>
            }
          </button>

          @if (showNotifications()) {
            <div class="header-dropdown header-dropdown--notifications">
              <div class="header-dropdown__head">
                <span>Notifications</span>
                @if (unreadCount() > 0) {
                  <button type="button" class="header-dropdown__link" (click)="markAllRead()">
                    Mark all read
                  </button>
                }
              </div>
              <div class="header-dropdown__body">
                @for (item of notifications(); track item.id) {
                  <button
                    type="button"
                    class="notif-item"
                    [class.notif-item--unread]="!item.read"
                    (click)="openNotification(item)">
                    <span class="notif-item__title">{{ item.title }}</span>
                    <span class="notif-item__msg">{{ item.message }}</span>
                    <span class="notif-item__time">{{ item.time }}</span>
                  </button>
                } @empty {
                  <p class="header-dropdown__empty">No notifications</p>
                }
              </div>
            </div>
          }
        </div>

        <!-- Theme toggle -->
        <button
          type="button"
          class="action-btn"
          [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          [title]="theme.isDark() ? 'Light mode' : 'Dark mode'"
          (click)="toggleTheme()">
          @if (theme.isDark()) {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          } @else {
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            </svg>
          }
        </button>

        <!-- User menu -->
        <div class="header-dropdown-wrap">
          <button
            type="button"
            class="user-avatar"
            aria-label="User menu"
            [class.user-avatar--active]="showUserMenu()"
            (click)="toggleUserMenu($event)">
            {{ resolvedUser?.initials ?? auth.user()?.initials ?? 'JD' }}
          </button>

          @if (showUserMenu()) {
            <div class="header-dropdown header-dropdown--menu">
              <div class="header-dropdown__user">
                <div class="header-dropdown__avatar">{{ resolvedUser?.initials ?? 'JD' }}</div>
                <div>
                  <p class="header-dropdown__name">{{ resolvedUser?.name ?? 'John Doe' }}</p>
                  <p class="header-dropdown__email">{{ resolvedUser?.email ?? 'john@example.com' }}</p>
                </div>
              </div>
              <div class="header-dropdown__divider"></div>
              <button type="button" class="header-dropdown__item" (click)="goToSettings()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.07 4.93a10 10 0 0 0-14.14 0"/>
                  <path d="M4.93 19.07a10 10 0 0 0 14.14 0"/>
                </svg>
                Settings
              </button>
              <button type="button" class="header-dropdown__item" (click)="toggleThemeFromMenu()">
                @if (theme.isDark()) {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  </svg>
                  Light mode
                } @else {
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                  Dark mode
                }
              </button>
              <div class="header-dropdown__divider"></div>
              <button type="button" class="header-dropdown__item header-dropdown__item--danger" (click)="logout()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Logout
              </button>
            </div>
          }
        </div>

        <!-- Settings -->
        <button
          type="button"
          class="action-btn"
          aria-label="Settings"
          title="Settings"
          (click)="goToSettings()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 3.5rem;
      background: var(--eiq-surface);
      border-bottom: 1px solid var(--eiq-border);
      box-shadow: var(--eiq-shadow-sm);
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 1.5rem;
      flex-shrink: 0;
      position: relative;
      z-index: 35;
    }

    .header-search { position: relative; flex: 1; }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      svg { width: 1rem; height: 1rem; color: var(--eiq-muted); }
    }

    .search-input {
      max-width: 24rem;
      width: 100%;
      background: var(--eiq-input-bg);
      border: 1px solid var(--eiq-border);
      border-radius: 0.5rem;
      color: var(--eiq-foreground);
      font-size: 0.875rem;
      padding: 0.375rem 1rem 0.375rem 2.25rem;
      outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
      &::placeholder { color: var(--eiq-muted); }
      &:focus {
        border-color: var(--eiq-primary);
        box-shadow: 0 0 0 3px var(--eiq-primary-10);
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .header-dropdown-wrap {
      position: relative;
    }

    .action-btn {
      position: relative;
      background: none;
      border: none;
      cursor: pointer;
      border-radius: 0.5rem;
      padding: 0.5rem;
      color: var(--eiq-muted);
      display: flex;
      align-items: center;
      transition: background 150ms ease, color 150ms ease;
      svg { width: 1.25rem; height: 1.25rem; }
      &:hover,
      &.action-btn--active {
        background: var(--eiq-hover);
        color: var(--eiq-foreground);
      }
    }

    .notif-badge {
      position: absolute;
      right: 0.125rem;
      top: 0.125rem;
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.2rem;
      background: var(--eiq-red);
      border-radius: 9999px;
      font-size: 0.6rem;
      font-weight: 700;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-avatar {
      width: 2rem;
      height: 2rem;
      background: var(--eiq-primary);
      border-radius: 50%;
      color: #eff6ff;
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px solid var(--eiq-primary);
      transition: box-shadow 150ms ease, transform 150ms ease;
      &:hover,
      &.user-avatar--active {
        box-shadow: 0 0 0 3px var(--eiq-primary-10);
      }
    }

    .header-dropdown {
      position: absolute;
      top: calc(100% + 0.5rem);
      right: 0;
      min-width: 18rem;
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border);
      border-radius: 0.75rem;
      box-shadow: var(--eiq-shadow-md);
      overflow: hidden;
      z-index: 50;
    }

    .header-dropdown--notifications {
      width: 20rem;
    }

    .header-dropdown__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--eiq-border);
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--eiq-foreground);
    }

    .header-dropdown__link {
      background: none;
      border: none;
      color: var(--eiq-primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
      &:hover { text-decoration: underline; }
    }

    .header-dropdown__body {
      max-height: 16rem;
      overflow-y: auto;
    }

    .header-dropdown__empty {
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--eiq-muted);
      font-size: 0.875rem;
    }

    .notif-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.125rem;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-bottom: 1px solid var(--eiq-border);
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: background 150ms ease;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--eiq-hover); }
    }

    .notif-item--unread {
      background: var(--eiq-primary-10);
      &:hover { background: var(--eiq-primary-12); }
    }

    .notif-item__title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--eiq-foreground);
    }

    .notif-item__msg {
      font-size: 0.75rem;
      color: var(--eiq-muted);
      line-height: 1.4;
    }

    .notif-item__time {
      font-size: 0.6875rem;
      color: var(--eiq-subtle);
      margin-top: 0.125rem;
    }

    .header-dropdown__user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
    }

    .header-dropdown__avatar {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--eiq-primary);
      color: white;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-dropdown__name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--eiq-foreground);
      margin: 0;
    }

    .header-dropdown__email {
      font-size: 0.75rem;
      color: var(--eiq-muted);
      margin: 0.125rem 0 0;
    }

    .header-dropdown__divider {
      height: 1px;
      background: var(--eiq-border);
    }

    .header-dropdown__item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      width: 100%;
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      color: var(--eiq-foreground);
      font-size: 0.875rem;
      cursor: pointer;
      text-align: left;
      transition: background 150ms ease;
      svg { width: 1rem; height: 1rem; color: var(--eiq-muted); }
      &:hover {
        background: var(--eiq-hover);
      }
    }

    .header-dropdown__item--danger {
      color: var(--eiq-red);
      svg { color: var(--eiq-red); }
      &:hover { background: var(--eiq-red-10); }
    }
  `]
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
      title: 'Budget alert',
      message: 'Food & Dining is at 85% of your monthly budget.',
      time: '2 min ago',
      read: false,
    },
    {
      id: '2',
      title: 'Transaction added',
      message: 'Grocery expense of $84.50 was recorded.',
      time: '1 hr ago',
      read: false,
    },
    {
      id: '3',
      title: 'Weekly summary',
      message: 'You spent 12% less than last week. Great job!',
      time: 'Yesterday',
      read: false,
    },
  ]);

  readonly unreadCount = computed(
    () => this.notifications().filter(n => !n.read).length
  );

  get resolvedUser(): User | null {
    return this.currentUser ?? this.auth.user();
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
    const value = (event.target as HTMLInputElement).value;
    this.searchChanged.emit(value);
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
    this.showNotifications.update(v => !v);
  }

  toggleUserMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotifications.set(false);
    this.showUserMenu.update(v => !v);
  }

  markAllRead(): void {
    this.notifications.update(items =>
      items.map(item => ({ ...item, read: true }))
    );
  }

  openNotification(item: AppNotification): void {
    if (!item.read) {
      this.notifications.update(items =>
        items.map(n => (n.id === item.id ? { ...n, read: true } : n))
      );
    }
    this.showNotifications.set(false);
  }

  goToSettings(): void {
    this.closeMenus();
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.closeMenus();
    this.auth.logout();
  }

  private closeMenus(): void {
    this.showNotifications.set(false);
    this.showUserMenu.set(false);
  }
}
