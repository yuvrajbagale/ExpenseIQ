import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eiq-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eiq-kpi-card">
      <div class="eiq-kpi-card__header">
        <div class="eiq-kpi-card__icon" [ngClass]="'eiq-kpi-card__icon--' + color">
          <span [innerHTML]="icon"></span>
        </div>
        @if (trendPercent !== null && trendPercent !== undefined) {
          <span class="eiq-kpi-card__trend"
                [ngClass]="trendDirection === 'up' ? 'eiq-kpi-card__trend--up' : 'eiq-kpi-card__trend--down'">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              @if (trendDirection === 'up') {
                <path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              } @else {
                <path d="M23 18L13.5 8.5L8.5 13.5L1 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              }
            </svg>
            {{ trendDirection === 'up' ? '+' : '' }}{{ trendPercent }}%
          </span>
        }
      </div>
      <p class="eiq-kpi-card__label">{{ label }}</p>
      <p class="eiq-kpi-card__value">{{ value }}</p>
    </div>
  `,
  styles: [`
    .eiq-kpi-card {
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border);
      border-radius: 0.75rem;
      padding: 1.25rem;
      transition: transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease;
    }
    .eiq-kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--eiq-shadow-md);
      border-color: var(--eiq-primary-40);
    }
    .eiq-kpi-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }
    .eiq-kpi-card__icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.625rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .eiq-kpi-card__icon--blue { background: var(--eiq-primary-12); color: var(--eiq-primary); }
    .eiq-kpi-card__icon--green { background: var(--eiq-green-10); color: var(--eiq-green); }
    .eiq-kpi-card__icon--red { background: var(--eiq-red-10); color: var(--eiq-red); }
    .eiq-kpi-card__icon--purple { background: var(--eiq-purple-10); color: var(--eiq-purple); }
    .eiq-kpi-card__icon--amber { background: var(--eiq-yellow-15); color: var(--eiq-yellow); }
    .eiq-kpi-card__trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: var(--eiq-radius-full);
    }
    .eiq-kpi-card__trend--up { color: var(--eiq-green); background: var(--eiq-green-10); }
    .eiq-kpi-card__trend--down { color: var(--eiq-red); background: var(--eiq-red-10); }
    .eiq-kpi-card__label {
      font-size: 0.8125rem;
      color: var(--eiq-muted);
      margin: 0 0 0.25rem 0;
    }
    .eiq-kpi-card__value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--eiq-foreground);
      margin: 0;
      letter-spacing: -0.02em;
    }
  `],
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) icon!: string;
  @Input() color: 'blue' | 'green' | 'red' | 'purple' | 'amber' = 'blue';
  @Input() trendPercent: number | null = null;
  @Input() trendDirection: 'up' | 'down' = 'up';
}
