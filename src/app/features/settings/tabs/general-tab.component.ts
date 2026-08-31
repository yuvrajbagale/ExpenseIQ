import { Component, signal } from '@angular/core';
import { ToggleRowComponent } from '../../../shared/components/toggle-row.component';

interface ToggleRow {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

@Component({
  selector: 'eiq-settings-general',
  standalone: true,
  imports: [ToggleRowComponent],
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">General Settings</h3>
          <p class="eiq-card__subtitle">Basic application preferences</p>
        </div>
      </div>
      <div class="settings-form">
        <div class="settings-field">
          <label class="settings-field__label" for="appName">App Name</label>
          <input id="appName" class="settings-input" type="text" [value]="appName()" (input)="appName.set(inputValue($event))" />
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="dashView">Default Dashboard View</label>
          <select id="dashView" class="settings-select" [value]="dashboardView()" (change)="dashboardView.set(inputValue($event))">
            <option value="Overview">Overview</option>
            <option value="Transactions">Transactions</option>
            <option value="Analytics">Analytics</option>
            <option value="Budget">Budget</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="dateFormat">Date Format</label>
          <select id="dateFormat" class="settings-select" [value]="dateFormat()" (change)="dateFormat.set(inputValue($event))">
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </div>
        <div class="settings-field">
          <label class="settings-field__label" for="timezone">Time Zone</label>
          <select id="timezone" class="settings-select" [value]="timezone()" (change)="timezone.set(inputValue($event))">
            <option value="UTC-5 Eastern">UTC-5 Eastern</option>
            <option value="UTC-0 UTC">UTC-0 UTC</option>
            <option value="UTC+1 Central European">UTC+1 Central European</option>
            <option value="UTC+5:30 India">UTC+5:30 India</option>
          </select>
        </div>
        <div class="settings-field settings-field--full">
          <span class="settings-field__label">Week Starts On</span>
          <div class="seg-group">
            <button type="button" class="seg-btn" [class.seg-btn--active]="weekStart() === 'Sunday'" (click)="weekStart.set('Sunday')">Sunday</button>
            <button type="button" class="seg-btn" [class.seg-btn--active]="weekStart() === 'Monday'" (click)="weekStart.set('Monday')">Monday</button>
          </div>
        </div>
      </div>
    </div>

    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Preferences</h3>
          <p class="eiq-card__subtitle">Application behavior options</p>
        </div>
      </div>
      <div class="toggle-list">
        @for (row of toggles(); track row.key) {
          <eiq-toggle-row
            [label]="row.label"
            [description]="row.description"
            [value]="row.value"
            (valueChange)="toggleRow(row.key)" />
        }
      </div>
    </div>
  `,
  styles: [`
    .settings-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.5rem; padding: 1.25rem; }
    .settings-field--full { grid-column: 1 / -1; }
    .settings-field__label { font-size: 0.8125rem; font-weight: 500; color: var(--eiq-muted); margin-bottom: 0.375rem; display: block; }
    .settings-input, .settings-select {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--eiq-border);
      border-radius: 8px; font-size: 0.875rem; background: var(--eiq-input-bg);
      color: var(--eiq-foreground); outline: none; transition: border-color 0.15s;
    }
    .settings-input:focus, .settings-select:focus { border-color: var(--eiq-primary); }
    .seg-group { display: flex; gap: 0; border: 1px solid var(--eiq-border, #e5e7eb); border-radius: 8px; overflow: hidden; }
    .seg-btn {
      flex: 1; padding: 0.5rem 0.75rem; font-size: 0.8125rem; font-weight: 500;
      border: none; background: var(--eiq-surface); color: var(--eiq-muted);
      cursor: pointer; transition: all 0.15s;
    }
    .seg-btn--active { background: var(--eiq-primary); color: #fff; }
    .toggle-list { padding: 0; }
  `],
})
export class SettingsGeneralTabComponent {
  appName = signal('ExpenseIQ');
  dashboardView = signal('Overview');
  dateFormat = signal('MM/DD/YYYY');
  timezone = signal('UTC-5 Eastern');
  weekStart = signal<'Sunday' | 'Monday'>('Sunday');

  toggles = signal<ToggleRow[]>([
    { key: 'autoSave', label: 'Auto-save', description: 'Automatically save changes', value: true },
    { key: 'onboardingTips', label: 'Show Onboarding Tips', description: 'Display helpful tips on startup', value: false },
  ]);

  toggleRow(key: string): void {
    this.toggles.update(rows => rows.map(r => r.key === key ? { ...r, value: !r.value } : r));
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
