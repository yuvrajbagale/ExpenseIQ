import { Component, computed, input } from '@angular/core';
import { TransactionStatus } from '../../core/interfaces/transaction.interface';
import { AppIconName } from '../icons/app-icons';
import { IconComponent } from './icon.component';

const STATUS_ICONS: Record<TransactionStatus, AppIconName> = {
  completed: 'lucideCircleCheck',
  pending: 'lucideClock',
  failed: 'lucideCircleX',
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [IconComponent],
  template: `
    <span class="eiq-badge" [class]="badgeClass()">
      <eiq-icon [name]="icon()" [size]="12" [strokeWidth]="2.2" anim="pop" />
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<TransactionStatus>();

  label = computed(() => ({
    completed: 'Completed', pending: 'Pending', failed: 'Failed',
  }[this.status()]));

  icon = computed(() => STATUS_ICONS[this.status()]);

  badgeClass = computed(() => ({
    completed: 'eiq-badge--success', pending: 'eiq-badge--warning', failed: 'eiq-badge--danger',
  }[this.status()]));
}
