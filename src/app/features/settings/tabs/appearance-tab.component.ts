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
    .settings-section-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.875rem 1.25rem; }
    .settings-section-row + .settings-section-row { border-top: 1px solid var(--eiq-border); }
    .settings-field__label { font-size: 0.8125rem; font-weight: 500; color: var(--eiq-muted); }
    .seg-group { display: flex; gap: 0; border: 1px solid var(--eiq-border-strong); border-radius: var(--eiq-radius-sm); overflow: hidden; }
    .seg-btn {
      flex: 1; min-height: 38px; padding: 0 0.75rem; font-size: 0.8125rem; font-weight: 600;
      border: none; background: var(--eiq-surface); color: var(--eiq-muted);
      cursor: pointer; transition: background 160ms cubic-bezier(0.2,0,0.2,1), color 160ms;
    }
    .seg-btn:not(:last-child) { border-right: 1px solid var(--eiq-border-strong); }
    .seg-btn:hover:not(.seg-btn--active) { background: var(--eiq-hover); color: var(--eiq-foreground); }
    .seg-btn--active { background: var(--eiq-primary); color: var(--eiq-on-primary); }
    .accent-row { display: flex; gap: 0.625rem; }
    .accent-dot {
      width: 32px; height: 32px; border-radius: 50%;
      border: 2px solid transparent; cursor: pointer;
      transition: transform 160ms cubic-bezier(0.2,0,0.2,1), box-shadow 160ms;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.18);
    }
    .accent-dot:hover { transform: scale(1.08); }
    .accent-dot--active { box-shadow: 0 0 0 2px var(--eiq-surface), 0 0 0 4px var(--eiq-foreground); }
    .toggle-list--bordered { border-top: 1px solid var(--eiq-border); }
  `],
})
export class SettingsAppearanceTabComponent {
  @Output() themeChanged = new EventEmitter<'light' | 'dark' | 'system'>();

  themeChoice = signal<'light' | 'dark' | 'system'>('light');
  accent = signal('indigo');
  fontSize = signal<'small' | 'medium' | 'large'>('medium');

  readonly accentColors: Accent[] = [
    { id: 'indigo', label: 'Indigo', color: '#4f46e5' },
    { id: 'blue', label: 'Blue', color: '#2563eb' },
    { id: 'violet', label: 'Violet', color: '#7c3aed' },
    { id: 'teal', label: 'Teal', color: '#0d9488' },
    { id: 'rose', label: 'Rose', color: '#e11d48' },
    { id: 'slate', label: 'Slate', color: '#334155' },
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
