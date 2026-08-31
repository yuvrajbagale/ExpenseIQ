import { Component, signal } from '@angular/core';

@Component({
  selector: 'eiq-settings-data',
  standalone: true,
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Data & Export</h3>
          <p class="eiq-card__subtitle">Manage your data and exports</p>
        </div>
      </div>

      <div class="data-block">
        <p class="data-block__label">Export Data</p>
        <p class="data-block__desc">Download your financial data in your preferred format</p>
        <div class="data-actions">
          <button type="button" class="data-link" (click)="exportData('csv')">Export as CSV</button>
          <button type="button" class="data-link" (click)="exportData('pdf')">Export as PDF</button>
          <button type="button" class="data-link" (click)="exportData('excel')">Export as Excel</button>
        </div>
      </div>

      <div class="data-block">
        <p class="data-block__label">Data Backup</p>
        <p class="data-block__desc">Last backup: {{ lastBackup }}</p>
        <button type="button" class="eiq-btn eiq-btn--primary eiq-btn--sm">Backup Now</button>
      </div>

      <div class="data-block">
        <p class="data-block__label">Import Data</p>
        <div class="data-dropzone">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span>Drop CSV file here or click to browse</span>
        </div>
      </div>

      <div class="data-block">
        <p class="data-block__label">Data Retention</p>
        <div class="data-retention">
          <select class="settings-select settings-select--sm" [value]="retention()" (change)="retention.set(inputValue($event))">
            <option value="Keep all data">Keep all data</option>
            <option value="Keep 1 year">Keep 1 year</option>
            <option value="Keep 2 years">Keep 2 years</option>
          </select>
          <button type="button" class="data-link data-link--muted">Clear Cache</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .data-block { padding: 1.25rem; }
    .data-block + .data-block { border-top: 1px solid var(--eiq-border, #e5e7eb); }
    .data-block__label { font-size: 0.875rem; font-weight: 500; color: var(--eiq-foreground); margin: 0 0 0.25rem; }
    .data-block__desc { font-size: 0.8125rem; color: var(--eiq-muted); margin: 0 0 0.75rem; }
    .data-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .data-link {
      font-size: 0.8125rem; font-weight: 500; color: var(--eiq-primary);
      background: none; border: none; cursor: pointer; padding: 0;
    }
    .data-link:hover { text-decoration: underline; }
    .data-link--muted { color: var(--eiq-muted); }
    .data-dropzone {
      display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
      padding: 1.5rem; border: 2px dashed var(--eiq-border, #e5e7eb); border-radius: 8px;
      color: var(--eiq-muted); font-size: 0.8125rem; cursor: pointer;
      transition: border-color 0.15s;
    }
    .data-dropzone:hover { border-color: var(--eiq-primary); }
    .data-retention { display: flex; align-items: center; gap: 1rem; }
    .settings-select--sm { width: auto; min-width: 160px; padding: 0.375rem 0.625rem; font-size: 0.8125rem; border: 1px solid var(--eiq-border); border-radius: 8px; background: var(--eiq-input-bg); }
  `],
})
export class SettingsDataTabComponent {
  retention = signal('Keep all data');
  lastBackup = 'Jun 10, 2025';

  exportData(format: string): void {
    const blob = new Blob([`ExpenseIQ export (${format.toUpperCase()})\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenseiq-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
