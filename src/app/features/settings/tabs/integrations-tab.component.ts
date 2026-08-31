import { Component, signal } from '@angular/core';

interface Integration {
  name: string;
  icon: string;
  description: string;
  connected: boolean;
}

@Component({
  selector: 'eiq-settings-integrations',
  standalone: true,
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Integrations</h3>
          <p class="eiq-card__subtitle">Connect ExpenseIQ with your favorite services</p>
        </div>
      </div>
      <ul class="integrations-list">
        @for (int of integrations(); track int.name) {
          <li class="integration">
            <div class="integration__icon">{{ int.icon }}</div>
            <div class="integration__body">
              <p class="integration__name">{{ int.name }}</p>
              <p class="integration__desc">{{ int.description }}</p>
            </div>
            <span class="integration__status" [class.integration__status--active]="int.connected">
              {{ int.connected ? 'Active' : 'Not Connected' }}
            </span>
            @if (int.connected) {
              <button type="button" class="integration__btn integration__btn--muted" (click)="toggleIntegration(int.name)">Disconnect</button>
            } @else {
              <button type="button" class="integration__btn integration__btn--primary" (click)="toggleIntegration(int.name)">Connect</button>
            }
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    .integrations-list { list-style: none; margin: 0; padding: 0; }
    .integration { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.25rem; }
    .integration + .integration { border-top: 1px solid var(--eiq-border, #e5e7eb); }
    .integration__icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--eiq-hover); border-radius: 8px; flex-shrink: 0; }
    .integration__body { flex: 1; min-width: 0; }
    .integration__name { font-size: 0.875rem; font-weight: 500; color: var(--eiq-foreground); margin: 0; }
    .integration__desc { font-size: 0.8125rem; color: var(--eiq-muted); margin: 0.125rem 0 0; }
    .integration__status { font-size: 0.75rem; font-weight: 500; padding: 0.25rem 0.625rem; border-radius: 9999px; background: var(--eiq-hover); color: var(--eiq-muted); flex-shrink: 0; }
    .integration__status--active { background: #dcfce7; color: #166534; }
    .integration__btn {
      font-size: 0.8125rem; font-weight: 500; padding: 0.375rem 0.75rem; border-radius: 6px;
      border: none; cursor: pointer; flex-shrink: 0; transition: background 0.15s;
    }
    .integration__btn--primary { background: var(--eiq-primary); color: #fff; }
    .integration__btn--primary:hover { background: #1d6ae5; }
    .integration__btn--muted { background: var(--eiq-hover); color: var(--eiq-muted); }
    .integration__btn--muted:hover { background: var(--eiq-border); }
  `],
})
export class SettingsIntegrationsTabComponent {
  integrations = signal<Integration[]>([
    { name: 'Google Drive', icon: '📁', description: 'Backup and sync files to Drive', connected: true },
    { name: 'Dropbox', icon: '📦', description: 'Store exports and backups securely', connected: false },
    { name: 'Plaid Bank Sync', icon: '🏦', description: 'Connect bank accounts for live sync', connected: true },
    { name: 'Zapier', icon: '⚡', description: 'Automate workflows and notifications', connected: false },
  ]);

  toggleIntegration(name: string): void {
    this.integrations.update(list => list.map(i => i.name === name ? { ...i, connected: !i.connected } : i));
  }
}
