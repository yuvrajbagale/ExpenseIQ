import { Component, computed, input } from '@angular/core';
import { TransactionStatus } from '../../core/interfaces/transaction.interface';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span class="eiq-badge" [class]="badgeClass()">
      @if (status() === 'completed') {
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      } @else if (status() === 'pending') {
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      } @else {
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      }
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<TransactionStatus>();

  label = computed(() => ({
    completed: 'Completed', pending: 'Pending', failed: 'Failed',
  }[this.status()]));

  badgeClass = computed(() => ({
    completed: 'eiq-badge--success', pending: 'eiq-badge--warning', failed: 'eiq-badge--danger',
  }[this.status()]));
}
