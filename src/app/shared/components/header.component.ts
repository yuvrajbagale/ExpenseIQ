import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/interfaces/user.interface';

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
        <button class="action-btn notif-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          @if (notificationCount > 0) {
            <span class="notif-badge">{{ notificationCount }}</span>
          }
        </button>
        <button class="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          </svg>
        </button>
        <div class="user-avatar">{{ resolvedUser?.initials ?? auth.user()?.initials ?? 'JD' }}</div>
        <button class="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.07 4.93a10 10 0 0 0-14.14 0"/>
            <path d="M4.93 19.07a10 10 0 0 0 14.14 0"/>
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 3.5rem; background: white;
      border-bottom: 1px solid oklch(0.92 0.004 286.32);
      box-shadow: 0 2px 8px 0 oklch(0 0 0 / 0.06);
      display: flex; align-items: center; gap: 1rem; padding: 0 1.5rem; flex-shrink: 0;
    }
    .header-search { position: relative; flex: 1; }
    .search-icon {
      position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); pointer-events: none;
      svg { width: 1rem; height: 1rem; color: oklch(0.552 0.016 285.938); }
    }
    .search-input {
      max-width: 24rem; width: 100%;
      background: oklch(0.967 0.001 286.375); border: 1px solid oklch(0.92 0.004 286.32);
      border-radius: 0.5rem; color: oklch(0.141 0.005 285.823); font-size: 0.875rem;
      padding: 0.375rem 1rem 0.375rem 2.25rem; outline: none;
      &::placeholder { color: oklch(0.552 0.016 285.938); }
    }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
    .action-btn {
      position: relative; background: none; border: none; cursor: pointer;
      border-radius: 0.5rem; padding: 0.5rem; color: oklch(0.552 0.016 285.938);
      display: flex; align-items: center;
      svg { width: 1.25rem; height: 1.25rem; }
      &:hover { background: oklch(0.94 0.002 286.32); }
    }
    .notif-badge {
      position: absolute; right: 0.125rem; top: 0.125rem;
      min-width: 1rem; height: 1rem; padding: 0 0.2rem;
      background: oklch(0.577 0.245 27.325); border-radius: 9999px;
      font-size: 0.6rem; font-weight: 700; color: white;
      display: flex; align-items: center; justify-content: center;
    }
    .user-avatar {
      width: 2rem; height: 2rem; background: #2b7fff;
      border-radius: 50%; color: #eff6ff; font-size: 0.875rem; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; border: 2px solid #2b7fff;
    }
  `]
})
export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Input() notificationCount = 3;
  @Input() searchPlaceholder = 'Search transactions, categories…';
  @Output() searchChanged = new EventEmitter<string>();

  constructor(public auth: AuthService) {}

  get resolvedUser(): User | null {
    return this.currentUser ?? this.auth.user();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchChanged.emit(value);
  }
}
