import { Component, EventEmitter, Output, signal } from '@angular/core';
import { ToggleRowComponent } from '../../../shared/components/toggle-row.component';

interface LoginEntry {
  device: string;
  location: string;
  time: string;
  current: boolean;
}

@Component({
  selector: 'eiq-settings-security',
  standalone: true,
  imports: [ToggleRowComponent],
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Security & Privacy</h3>
          <p class="eiq-card__subtitle">Manage your password and account security</p>
        </div>
      </div>
      <div class="settings-form">
        <div class="settings-field">
          <label class="settings-field__label" for="curPwd">Current Password</label>
          <input id="curPwd" class="settings-input" type="password" placeholder="••••••••" />
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="newPwd">New Password</label>
          <input id="newPwd" class="settings-input" type="password" placeholder="••••••••" />
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="confPwd">Confirm Password</label>
          <input id="confPwd" class="settings-input" type="password" placeholder="••••••••" />
        </div>
      </div>
      <div class="toggle-list toggle-list--bordered">
        <eiq-toggle-row
          label="Two-Factor Authentication"
          description="Add an extra layer of security to your account"
          [value]="twoFactor()"
          badge="Recommended"
          (valueChange)="twoFactor.set(!twoFactor())" />
      </div>
      <div class="settings-actions">
        <button type="button" class="eiq-btn eiq-btn--primary eiq-btn--sm">Update Password</button>
      </div>
    </div>

    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Login Activity</h3>
          <p class="eiq-card__subtitle">Recent sign-in activity on your account</p>
        </div>
      </div>
      <ul class="login-list">
        @for (entry of loginActivity(); track entry.device + entry.time) {
          <li class="login-item">
            <div class="login-item__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div class="login-item__body">
              <p class="login-item__device">{{ entry.device }}</p>
              <p class="login-item__meta">{{ entry.location }} · {{ entry.time }}</p>
            </div>
            @if (entry.current) {
              <span class="login-item__status login-item__status--current">Current</span>
            } @else {
              <span class="login-item__status login-item__status--muted">Signed in</span>
            }
          </li>
        }
      </ul>
    </div>

    <div class="eiq-card settings-danger">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title settings-danger__title">Delete Account</h3>
          <p class="eiq-card__subtitle">Permanently remove your account and data</p>
        </div>
        <button type="button" class="settings-danger__btn" (click)="accountDeleted.emit()">Delete Account</button>
      </div>
    </div>
  `,
  styles: [`
    .settings-form { display: grid; grid-template-columns: 1fr; gap: 1rem; padding: 1.25rem; }
    .settings-field__label { font-size: 0.8125rem; font-weight: 500; color: var(--eiq-muted); margin-bottom: 0.375rem; display: block; }
    .settings-input {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--eiq-border);
      border-radius: 8px; font-size: 0.875rem; background: var(--eiq-input-bg);
      color: var(--eiq-foreground); outline: none;
    }
    .settings-input:focus { border-color: var(--eiq-primary); }
    .toggle-list--bordered { border-top: 1px solid var(--eiq-border, #e5e7eb); }
    .settings-actions { padding: 1rem 1.25rem; }
    .login-list { list-style: none; margin: 0; padding: 0; }
    .login-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem; }
    .login-item + .login-item { border-top: 1px solid var(--eiq-border, #e5e7eb); }
    .login-item__icon { width: 36px; height: 36px; border-radius: 8px; background: var(--eiq-hover); display: flex; align-items: center; justify-content: center; color: var(--eiq-muted); flex-shrink: 0; }
    .login-item__body { flex: 1; min-width: 0; }
    .login-item__device { font-size: 0.875rem; font-weight: 500; color: var(--eiq-foreground); margin: 0; }
    .login-item__meta { font-size: 0.8125rem; color: var(--eiq-muted); margin: 0.125rem 0 0; }
    .login-item__status { font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.625rem; border-radius: 9999px; flex-shrink: 0; }
    .login-item__status--current { background: #dcfce7; color: #166534; }
    .login-item__status--muted { background: var(--eiq-hover); color: var(--eiq-muted); }
    .settings-danger { border-color: #fecaca; }
    .settings-danger__title { color: #dc2626; }
    .settings-danger__btn { padding: 0.5rem 1rem; font-size: 0.8125rem; font-weight: 500; border: 1px solid #dc2626; background: transparent; color: #dc2626; border-radius: 8px; cursor: pointer; }
    .settings-danger__btn:hover { background: #fef2f2; }
  `],
})
export class SettingsSecurityTabComponent {
  @Output() accountDeleted = new EventEmitter<void>();

  twoFactor = signal(false);

  loginActivity = signal<LoginEntry[]>([
    { device: 'MacBook Pro', location: 'New York, US', time: 'Today, 9:42 AM', current: true },
    { device: 'iPhone 15', location: 'Boston, US', time: 'Yesterday, 6:18 PM', current: false },
    { device: 'Chrome', location: 'Chicago, US', time: 'Jun 18, 2025 · 2:05 PM', current: false },
  ]);
}
