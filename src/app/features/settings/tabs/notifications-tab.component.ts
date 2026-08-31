import { Component, signal } from '@angular/core';
import { ToggleRowComponent } from '../../../shared/components/toggle-row.component';

interface ToggleRow {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

@Component({
  selector: 'eiq-settings-notifications',
  standalone: true,
  imports: [ToggleRowComponent],
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Notification Preferences</h3>
          <p class="eiq-card__subtitle">Control how and when we contact you</p>
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
  styles: [`.toggle-list { padding: 0; }`],
})
export class SettingsNotificationsTabComponent {
  toggles = signal<ToggleRow[]>([
    { key: 'email', label: 'Email Notifications', description: 'Receive updates and alerts by email', value: true },
    { key: 'push', label: 'Push Notifications', description: 'Get instant mobile notifications', value: true },
    { key: 'budget', label: 'Budget Alerts', description: 'Warn when budgets are close to limits', value: true },
    { key: 'bill', label: 'Bill Reminders', description: 'Remind before recurring bills are due', value: true },
    { key: 'weekly', label: 'Weekly Summary Email', description: 'A weekly snapshot of your finances', value: true },
    { key: 'monthly', label: 'Monthly Report Email', description: 'Receive a monthly financial report', value: false },
    { key: 'txnAlert', label: 'Transaction Alerts', description: 'Notify when a transaction is added', value: true },
  ]);

  toggleRow(key: string): void {
    this.toggles.update(rows => rows.map(r => r.key === key ? { ...r, value: !r.value } : r));
  }
}
