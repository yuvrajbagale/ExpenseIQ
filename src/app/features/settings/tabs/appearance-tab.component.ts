import { Component, EventEmitter, Output, signal } from '@angular/core';
import { ToggleRowComponent } from '../../../shared/components/toggle-row.component';

interface ToggleRow {
  key: string;
  label: string;
  description: string;
  value: boolean;
}

interface Accent {
  id: string;
  label: string;
  color: string;
}

@Component({
  selector: 'eiq-settings-appearance',
  standalone: true,
  imports: [ToggleRowComponent],
  template: `
    <div class="eiq-card">
      <div class="eiq-card__header">
        <div>
          <h3 class="eiq-card__title">Appearance</h3>
          <p class="eiq-card__subtitle">Customize how ExpenseIQ looks</p>
        </div>
      </div>
      <div class="settings-section-row">
        <span class="settings-field__label">Theme</span>
        <div class="seg-group">
          <button type="button" class="seg-btn" [class.seg-btn--active]="themeChoice() === 'light'" (click)="setTheme('light')">Light</button>
          <button type="button" class="seg-btn" [class.seg-btn--active]="themeChoice() === 'dark'" (click)="setTheme('dark')">Dark</button>
          <button type="button" class="seg-btn" [class.seg-btn--active]="themeChoice() === 'system'" (click)="setTheme('system')">System</button>
        </div>
      </div>
      <div class="settings-section-row">
        <span class="settings-field__label">Accent Color</span>
        <div class="accent-row">
          @for (acc of accentColors; track acc.id) {
            <button type="button" class="accent-dot" [class.accent-dot--active]="accent() === acc.id" [style.background]="acc.color" [attr.aria-label]="acc.label" (click)="accent.set(acc.id)"></button>
          }
        </div>
      </div>
      <div class="settings-section-row">
        <span class="settings-field__label">Font Size</span>
        <div class="seg-group">
          <button type="button" class="seg-btn" [class.seg-btn--active]="fontSize() === 'small'" (click)="fontSize.set('small')">Small</button>
          <button type="button" class="seg-btn" [class.seg-btn--active]="fontSize() === 'medium'" (click)="fontSize.set('medium')">Medium</button>
          <button type="button" class="seg-btn" [class.seg-btn--active]="fontSize() === 'large'" (click)="fontSize.set('large')">Large</button>
        </div>
      </div>
      <div class="toggle-list toggle-list--bordered">
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
    .settings-section-row { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1.25rem; }
    .settings-section-row + .settings-section-row { border-top: 1px solid var(--eiq-border, #e5e7eb); }
    .settings-field__label { font-size: 0.8125rem; font-weight: 500; color: var(--eiq-muted); }
    .seg-group { display: flex; gap: 0; border: 1px solid var(--eiq-border, #e5e7eb); border-radius: 8px; overflow: hidden; }
    .seg-btn {
      flex: 1; padding: 0.5rem 0.75rem; font-size: 0.8125rem; font-weight: 500;
      border: none; background: var(--eiq-surface); color: var(--eiq-muted);
      cursor: pointer; transition: all 0.15s;
    }
    .seg-btn--active { background: var(--eiq-primary); color: #fff; }
    .accent-row { display: flex; gap: 0.5rem; }
    .accent-dot { width: 28px; height: 28px; border-radius: 50%; border: 3px solid transparent; cursor: pointer; transition: border-color 0.15s, transform 0.15s; }
    .accent-dot:hover { transform: scale(1.1); }
    .accent-dot--active { border-color: var(--eiq-foreground); }
    .toggle-list--bordered { border-top: 1px solid var(--eiq-border, #e5e7eb); }
  `],
})
export class SettingsAppearanceTabComponent {
  @Output() themeChanged = new EventEmitter<'light' | 'dark' | 'system'>();

  themeChoice = signal<'light' | 'dark' | 'system'>('light');
  accent = signal('blue');
  fontSize = signal<'small' | 'medium' | 'large'>('medium');

  readonly accentColors: Accent[] = [
    { id: 'blue', label: 'Blue', color: '#2b7fff' },
    { id: 'purple', label: 'Purple', color: '#8b5cf6' },
    { id: 'green', label: 'Green', color: '#22c55e' },
    { id: 'orange', label: 'Orange', color: '#f97316' },
    { id: 'red', label: 'Red', color: '#ef4444' },
    { id: 'pink', label: 'Pink', color: '#ec4899' },
  ];

  toggles = signal<ToggleRow[]>([
    { key: 'compact', label: 'Compact Mode', description: 'Reduce spacing and padding', value: false },
    { key: 'sidebarCollapsed', label: 'Sidebar Collapsed by Default', description: 'Collapse the sidebar on load', value: false },
  ]);

  setTheme(choice: 'light' | 'dark' | 'system'): void {
    this.themeChoice.set(choice);
    this.themeChanged.emit(choice);
  }

  toggleRow(key: string): void {
    this.toggles.update(rows => rows.map(r => r.key === key ? { ...r, value: !r.value } : r));
  }
}
