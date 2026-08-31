import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { NAV_ITEMS } from '../../shared/constants/nav-items';
import { HeaderComponent } from '../../shared/components/header.component';
import { SettingsGeneralTabComponent } from './tabs/general-tab.component';
import { SettingsNotificationsTabComponent } from './tabs/notifications-tab.component';
import { SettingsSecurityTabComponent } from './tabs/security-tab.component';
import { SettingsAppearanceTabComponent } from './tabs/appearance-tab.component';
import { SettingsCurrencyTabComponent } from './tabs/currency-tab.component';
import { SettingsDataTabComponent } from './tabs/data-tab.component';
import { SettingsIntegrationsTabComponent } from './tabs/integrations-tab.component';

type SettingsTab =
  | 'general'
  | 'notifications'
  | 'security'
  | 'appearance'
  | 'currency'
  | 'data'
  | 'integrations';

interface NavTab {
  id: SettingsTab;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    SidebarComponent,
    HeaderComponent,
    SettingsGeneralTabComponent,
    SettingsNotificationsTabComponent,
    SettingsSecurityTabComponent,
    SettingsAppearanceTabComponent,
    SettingsCurrencyTabComponent,
    SettingsDataTabComponent,
    SettingsIntegrationsTabComponent,
  ],
  template: `
    <div class="eiq-app">
      <eiq-sidebar [navItems]="navItems" (logoutClicked)="onLogout()" />
      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="0"
          searchPlaceholder="Search settings…" />
        <main class="eiq-content">

          <!-- Page Header -->
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Settings</h1>
              <nav class="eiq-breadcrumb">
                <span class="eiq-breadcrumb__link" (click)="goTo('/dashboard')">Dashboard</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span class="eiq-breadcrumb__active">Settings</span>
              </nav>
            </div>
            <div class="eiq-page-header__actions">
              <button type="button" class="eiq-btn eiq-btn--primary eiq-btn--sm" (click)="save()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                </svg>
                Save Changes
              </button>
            </div>
          </div>

          <div class="settings-layout">
            <!-- Settings Sub-navigation -->
            <aside class="settings-nav">
              @for (tab of tabs; track tab.id) {
                <button
                  type="button"
                  class="settings-nav__item"
                  [class.settings-nav__item--active]="activeTab() === tab.id"
                  (click)="activeTab.set(tab.id)">
                  <span class="settings-nav__icon" [innerHTML]="tabIcon(tab.icon)"></span>
                  <span class="settings-nav__label">{{ tab.label }}</span>
                </button>
              }
            </aside>

            <!-- Settings Content -->
            <div class="settings-content">
              @if (saved()) {
                <div class="settings-toast" role="status">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Settings saved successfully.
                </div>
              }

              <!-- ════ GENERAL ════ -->
              @if (activeTab() === 'general') {
                <eiq-settings-general />
              }

              <!-- ════ NOTIFICATIONS ════ -->
              @if (activeTab() === 'notifications') {
                <eiq-settings-notifications />
              }

              <!-- ════ SECURITY ════ -->
              @if (activeTab() === 'security') {
                <eiq-settings-security (accountDeleted)="confirmDelete()" />
              }

              <!-- ════ APPEARANCE ════ -->
              @if (activeTab() === 'appearance') {
                <eiq-settings-appearance (themeChanged)="onThemeChanged($event)" />
              }

              <!-- ════ CURRENCY & LANGUAGE ════ -->
              @if (activeTab() === 'currency') {
                <eiq-settings-currency />
              }

              <!-- ════ DATA & EXPORT ════ -->
              @if (activeTab() === 'data') {
                <eiq-settings-data />
              }

              <!-- ════ INTEGRATIONS ════ -->
              @if (activeTab() === 'integrations') {
                <eiq-settings-integrations />
              }
            </div>
          </div>

        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .settings-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    /* ── Sub-navigation ── */
    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      position: sticky;
      top: 1rem;
    }
    .settings-nav__item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.5rem;
      border: none;
      background: transparent;
      color: var(--eiq-muted);
      font-size: 0.8125rem;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease;
      font-family: inherit;
    }
    .settings-nav__item:hover {
      background: var(--eiq-hover);
      color: var(--eiq-foreground);
    }
    .settings-nav__item--active {
      background: var(--eiq-primary);
      color: #fff;
      font-weight: 600;
    }
    .settings-nav__icon {
      width: 1rem;
      height: 1rem;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      svg { width: 1rem; height: 1rem; }
    }
    .settings-nav__label { flex: 1; }

    /* ── Content ── */
    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-width: 0;
    }

    .settings-toast {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--eiq-green-12);
      color: var(--eiq-green);
      border: 1px solid var(--eiq-green);
      border-radius: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    /* ── Forms ── */
    .settings-form {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem 1.5rem;
    }
    .settings-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .settings-field--full { grid-column: 1 / -1; }
    .settings-field__label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--eiq-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .settings-input,
    .settings-select {
      height: 2.5rem;
      padding: 0 0.75rem;
      border: 1px solid var(--eiq-border);
      border-radius: 0.5rem;
      background: var(--eiq-input-bg);
      color: var(--eiq-foreground);
      font-size: 0.875rem;
      font-family: inherit;
      outline: none;
      width: 100%;
      &:focus {
        border-color: var(--eiq-primary);
        box-shadow: 0 0 0 3px var(--eiq-primary-10);
      }
    }
    .settings-select {
      appearance: none;
      cursor: pointer;
      padding-right: 2rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.625rem center;
    }
    .settings-select--sm { height: 2.25rem; font-size: 0.8125rem; width: auto; min-width: 9rem; }

    /* ── Segmented buttons ── */
    .settings-section-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--eiq-border);
    }
    .settings-section-row:last-of-type { border-bottom: none; }
    .seg-group { display: flex; gap: 0.5rem; }
    .seg-btn {
      padding: 0.4375rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--eiq-border);
      background: var(--eiq-surface);
      color: var(--eiq-muted);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease;
      font-family: inherit;
    }
    .seg-btn:hover { background: var(--eiq-hover); color: var(--eiq-foreground); }
    .seg-btn--active {
      background: var(--eiq-primary);
      color: #fff;
      border-color: var(--eiq-primary);
    }

    /* ── Accent dots ── */
    .accent-row { display: flex; gap: 0.625rem; }
    .accent-dot {
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
      padding: 0;
      transition: transform 150ms ease;
    }
    .accent-dot:hover { transform: scale(1.1); }
    .accent-dot--active {
      border-color: var(--eiq-foreground);
      box-shadow: 0 0 0 2px var(--eiq-surface), 0 0 0 4px var(--eiq-primary-40);
    }

    /* ── Toggle list ── */
    .toggle-list { display: flex; flex-direction: column; }
    .toggle-list--bordered { border-top: 1px solid var(--eiq-border); margin-top: 0.5rem; padding-top: 0.5rem; }
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.875rem 0;
      border-bottom: 1px solid var(--eiq-border);
    }
    .toggle-row:last-child { border-bottom: none; }
    .toggle-row__body { flex: 1; min-width: 0; }
    .toggle-row__label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--eiq-foreground);
      margin: 0;
    }
    .toggle-row__desc {
      font-size: 0.75rem;
      color: var(--eiq-muted);
      margin: 0.125rem 0 0;
    }
    .toggle-switch {
      position: relative;
      width: 2.75rem;
      height: 1.5rem;
      border-radius: 9999px;
      border: none;
      background: var(--eiq-border);
      cursor: pointer;
      flex-shrink: 0;
      transition: background 200ms ease;
    }
    .toggle-switch--on { background: var(--eiq-primary); }
    .toggle-switch::after {
      content: '';
      position: absolute;
      top: 0.125rem;
      left: 0.125rem;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      background: var(--eiq-surface);
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 200ms ease;
    }
    .toggle-switch--on::after { transform: translateX(1.25rem); }

    /* ── Badges & actions ── */
    .settings-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.0625rem 0.4375rem;
      border-radius: 9999px;
      margin-left: 0.5rem;
      vertical-align: middle;
    }
    .settings-badge--warning { background: var(--eiq-amber-15); color: var(--eiq-orange); }
    .settings-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid var(--eiq-border);
      margin-top: 0.5rem;
    }

    /* ── Login activity ── */
    .login-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .login-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border: 1px solid var(--eiq-border);
      border-radius: 0.625rem;
    }
    .login-item__icon {
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.5rem;
      background: var(--eiq-primary-10);
      color: var(--eiq-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .login-item__body { flex: 1; min-width: 0; }
    .login-item__device { font-size: 0.8125rem; font-weight: 600; color: var(--eiq-foreground); margin: 0; }
    .login-item__meta { font-size: 0.6875rem; color: var(--eiq-muted); margin: 0.125rem 0 0; }
    .login-item__status {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.1875rem 0.5rem;
      border-radius: 9999px;
      flex-shrink: 0;
    }
    .login-item__status--current { background: var(--eiq-green-12); color: var(--eiq-green); }
    .login-item__status--muted { background: var(--eiq-hover); color: var(--eiq-muted); }

    /* ── Danger zone ── */
    .settings-danger__title { color: var(--eiq-red); }
    .settings-danger__btn {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--eiq-red);
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-red);
      border-radius: 0.5rem;
      padding: 0.4375rem 1rem;
      cursor: pointer;
      transition: background 150ms ease;
      font-family: inherit;
    }
    .settings-danger__btn:hover { background: var(--eiq-red-10); }

    /* ── Data & Export ── */
    .data-block {
      padding: 1rem 0;
      border-bottom: 1px solid var(--eiq-border);
    }
    .data-block:last-child { border-bottom: none; }
    .data-block__label { font-size: 0.8125rem; font-weight: 600; color: var(--eiq-foreground); margin: 0 0 0.25rem; }
    .data-block__desc { font-size: 0.75rem; color: var(--eiq-muted); margin: 0 0 0.75rem; }
    .data-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .data-link {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--eiq-primary);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
    }
    .data-link:hover { text-decoration: underline; }
    .data-link--muted { color: var(--eiq-muted); }
    .data-dropzone {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      padding: 1.25rem;
      border: 2px dashed var(--eiq-primary-40);
      border-radius: 0.75rem;
      background: var(--eiq-primary-10);
      color: var(--eiq-muted);
      font-size: 0.8125rem;
      cursor: pointer;
    }
    .data-retention { display: flex; align-items: center; gap: 0.75rem; }

    /* ── Integrations ── */
    .integrations-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.625rem; }
    .integration {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      border: 1px solid var(--eiq-border);
      border-radius: 0.75rem;
    }
    .integration__icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.625rem;
      background: var(--eiq-hover);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .integration__body { flex: 1; min-width: 0; }
    .integration__name { font-size: 0.875rem; font-weight: 600; color: var(--eiq-foreground); margin: 0; }
    .integration__desc { font-size: 0.6875rem; color: var(--eiq-muted); margin: 0.125rem 0 0; }
    .integration__status {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.1875rem 0.5rem;
      border-radius: 9999px;
      background: var(--eiq-hover);
      color: var(--eiq-muted);
      flex-shrink: 0;
    }
    .integration__status--active { background: var(--eiq-green-12); color: var(--eiq-green); }
    .integration__btn {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.375rem 0.875rem;
      border-radius: 0.5rem;
      cursor: pointer;
      flex-shrink: 0;
      transition: all 150ms ease;
      font-family: inherit;
    }
    .integration__btn--muted {
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border);
      color: var(--eiq-muted);
    }
    .integration__btn--muted:hover { background: var(--eiq-hover); color: var(--eiq-foreground); }
    .integration__btn--primary {
      background: var(--eiq-primary);
      border: 1px solid var(--eiq-primary);
      color: #fff;
    }
    .integration__btn--primary:hover { background: var(--eiq-primary-dark); }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .settings-layout { grid-template-columns: 1fr; }
      .settings-nav {
        position: static;
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }
      .settings-nav__item { flex-shrink: 0; }
    }
    @media (max-width: 640px) {
      .settings-form { grid-template-columns: 1fr; }
      .settings-section-row { flex-direction: column; align-items: flex-start; gap: 0.625rem; }
      .integration { flex-wrap: wrap; }
      .data-retention { flex-wrap: wrap; }
    }
  `],
})
export class SettingsComponent {
  readonly authService = inject(AuthService);
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly activeTab = signal<SettingsTab>('general');
  readonly saved = signal(false);

  readonly navItems = NAV_ITEMS;

  readonly tabs: NavTab[] = [
    { id: 'general',       label: 'General',            icon: 'general' },
    { id: 'notifications', label: 'Notifications',      icon: 'notifications' },
    { id: 'security',      label: 'Security & Privacy', icon: 'security' },
    { id: 'appearance',    label: 'Appearance',         icon: 'appearance' },
    { id: 'currency',      label: 'Currency & Language', icon: 'currency' },
    { id: 'data',          label: 'Data & Export',      icon: 'data' },
    { id: 'integrations',  label: 'Integrations',       icon: 'integrations' },
  ];

  onThemeChanged(choice: 'light' | 'dark' | 'system'): void {
    const effective: ThemeMode = choice === 'system' ? 'light' : choice;
    this.theme.setTheme(effective);
  }

  confirmDelete(): void {
    if (confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
      this.authService.logout();
    }
  }

  save(): void {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2500);
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  onLogout(): void {
    this.authService.logout();
  }

  private readonly ICONS: Record<string, string> = {
    general:       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    security:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    appearance:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
    currency:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    data:          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    integrations:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M12 8v4M5 16v-2a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/></svg>',
  };

  tabIcon(name: string): string {
    return this.ICONS[name] ?? this.ICONS['general'];
  }
}
