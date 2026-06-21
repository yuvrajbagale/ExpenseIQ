import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SidebarComponent, HeaderComponent],
  template: `
    <div class="eiq-app">
      <eiq-sidebar (logoutClicked)="authService.logout()" />

      <div class="eiq-main">
        <eiq-header
          [currentUser]="authService.currentUser()"
          [notificationCount]="0"
          searchPlaceholder="Search settings…" />

        <main class="eiq-content">
          <div class="eiq-page-header">
            <div>
              <h1 class="eiq-page-header__title">Settings</h1>
              <p class="eiq-page-header__subtitle">Manage your app preferences</p>
            </div>
          </div>

          <div class="eiq-card settings-card">
            <h2 class="settings-card__title">Appearance</h2>
            <p class="settings-card__desc">Choose how ExpenseIQ looks on your device.</p>

            <div class="settings-theme-options">
              @for (option of themeOptions; track option.value) {
                <button
                  type="button"
                  class="settings-theme-option"
                  [class.settings-theme-option--active]="theme.theme() === option.value"
                  (click)="setTheme(option.value)">
                  <span class="settings-theme-option__icon">{{ option.icon }}</span>
                  <span class="settings-theme-option__label">{{ option.label }}</span>
                  <span class="settings-theme-option__hint">{{ option.hint }}</span>
                </button>
              }
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .settings-card__title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--eiq-foreground);
      margin: 0 0 0.25rem;
    }

    .settings-card__desc {
      font-size: 0.875rem;
      color: var(--eiq-muted);
      margin: 0 0 1.25rem;
    }

    .settings-theme-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .settings-theme-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      padding: 1rem;
      border: 2px solid var(--eiq-border);
      border-radius: 0.75rem;
      background: var(--eiq-input-bg);
      cursor: pointer;
      text-align: left;
      transition: border-color 150ms ease, background 150ms ease, box-shadow 150ms ease;
    }

    .settings-theme-option:hover {
      border-color: var(--eiq-primary-40);
    }

    .settings-theme-option--active {
      border-color: var(--eiq-primary);
      background: var(--eiq-primary-10);
      box-shadow: 0 0 0 3px var(--eiq-primary-10);
    }

    .settings-theme-option__icon {
      font-size: 1.25rem;
    }

    .settings-theme-option__label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--eiq-foreground);
    }

    .settings-theme-option__hint {
      font-size: 0.75rem;
      color: var(--eiq-muted);
    }
  `]
})
export class SettingsComponent {
  readonly authService = inject(AuthService);
  readonly theme = inject(ThemeService);

  readonly themeOptions: { value: ThemeMode; label: string; hint: string; icon: string }[] = [
    { value: 'light', label: 'Light', hint: 'Bright and clean', icon: '☀️' },
    { value: 'dark', label: 'Dark', hint: 'Easy on the eyes', icon: '🌙' },
  ];

  setTheme(mode: ThemeMode): void {
    this.theme.setTheme(mode);
  }
}
