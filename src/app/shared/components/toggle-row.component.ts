import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eiq-toggle-row',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toggle-row">
      <div class="toggle-row__body">
        <p class="toggle-row__label">
          {{ label }}
          @if (badge) {
            <span class="settings-badge" [ngClass]="badgeClass">{{ badge }}</span>
          }
        </p>
        @if (description) {
          <p class="toggle-row__desc">{{ description }}</p>
        }
      </div>
      <button
        type="button"
        class="toggle-switch"
        [class.toggle-switch--on]="value"
        [attr.aria-label]="label"
        (click)="valueChange.emit()"></button>
    </div>
  `,
  styles: [`
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.25rem;
    }
    .toggle-row + .toggle-row { border-top: 1px solid var(--eiq-border, #e5e7eb); }
    .toggle-row__body { flex: 1; min-width: 0; }
    .toggle-row__label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--eiq-foreground);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .toggle-row__desc {
      font-size: 0.8125rem;
      color: var(--eiq-muted);
      margin: 0.125rem 0 0;
    }
    .settings-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }
    .settings-badge--warning { background: #fef3c7; color: #92400e; }
  `],
})
export class ToggleRowComponent {
  @Input() label = '';
  @Input() description = '';
  @Input() value = false;
  @Input() badge = '';
  @Input() badgeClass = 'settings-badge--warning';
  @Output() valueChange = new EventEmitter<void>();
}
