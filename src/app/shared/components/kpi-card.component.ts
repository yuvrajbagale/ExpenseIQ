import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';
import { AppIconName } from '../icons/app-icons';

@Component({
  selector: 'eiq-kpi-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="eiq-kpi-card">
      <div class="eiq-kpi-card__header">
        <div class="eiq-kpi-card__icon" [ngClass]="'eiq-kpi-card__icon--' + color">
          <eiq-icon [name]="icon" [size]="17" anim="pop" />
        </div>
        @if (trendPercent !== null && trendPercent !== undefined) {
          <span class="eiq-kpi-card__trend" [ngClass]="trendClass()">
            <eiq-icon
              [name]="trendDirection === 'up' ? 'lucideTrendingUp' : 'lucideTrendingDown'"
              [size]="12"
              [strokeWidth]="2.4"
              anim="slide" />
            {{ trendPercent > 0 ? '+' : '' }}{{ trendPercent }}%
          </span>
        }
      </div>
      <p class="eiq-kpi-card__label">{{ label }}</p>
      <p class="eiq-kpi-card__value">{{ value }}</p>
      @if (caption) {
        <p class="eiq-kpi-card__caption">{{ caption }}</p>
      }
      @if (footnote) {
        <p class="eiq-kpi-card__footnote">{{ footnote }}</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .eiq-kpi-card__trend eiq-icon { vertical-align: -2px; }
  `],
})
export class KpiCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input({ required: true }) icon!: AppIconName;
  @Input() color: 'blue' | 'green' | 'red' | 'purple' | 'amber' = 'blue';
  @Input() trendPercent: number | null = null;
  @Input() trendDirection: 'up' | 'down' = 'up';
  /**
   * Financial sentiment of the movement. Drives colour only — colour must encode
   * state (good/bad), never merely the arrow's direction. When omitted, the
   * sentiment is inferred from `trendDirection`.
   */
  @Input() sentiment: 'positive' | 'negative' | 'neutral' | null = null;
  @Input() caption = '';
  @Input() footnote = '';

  trendClass(): string {
    const tone = this.sentiment ?? (this.trendDirection === 'up' ? 'positive' : 'negative');
    return `eiq-kpi-card__trend--${tone === 'positive' ? 'up' : tone === 'negative' ? 'down' : 'flat'}`;
  }
}
