import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { AppIconName } from '../icons/app-icons';
import { IconComponent } from './icon.component';

const TOAST_ICONS: Record<string, AppIconName> = {
  success: 'lucideCircleCheck',
  error: 'lucideCircleX',
  warning: 'lucideTriangleAlert',
  info: 'lucideCircleAlert',
};

/**
 * Renders the global toast stack. Mounted once in AppComponent so any
 * feature can trigger feedback via ToastService.
 */
@Component({
  selector: 'eiq-toast-host',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="eiq-toast-host" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="eiq-toast" [class]="'eiq-toast--' + toast.kind" role="status">
          <span class="eiq-toast__icon">
            <eiq-icon [name]="iconFor(toast.kind)" [size]="16" [strokeWidth]="2.4" anim="pop" />
          </span>
          <span class="eiq-toast__msg">{{ toast.message }}</span>
          <button
            type="button"
            class="eiq-toast__close"
            aria-label="Dismiss notification"
            (click)="toastService.dismiss(toast.id)">
            <eiq-icon name="lucideX" [size]="14" [strokeWidth]="2" anim="pop" />
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .eiq-toast-host {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: min(360px, calc(100vw - 2rem));
    }
    .eiq-toast {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      padding: 0.75rem 1rem;
      border-radius: 0.625rem;
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border);
      box-shadow: var(--eiq-shadow-md);
      font-size: 0.8125rem;
      color: var(--eiq-foreground);
      animation: eiq-toast-in 200ms ease;
    }
    @keyframes eiq-toast-in {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .eiq-toast__icon { flex-shrink: 0; display: flex; margin-top: 0.0625rem; }
    .eiq-toast--success .eiq-toast__icon { color: var(--eiq-green); }
    .eiq-toast--error   .eiq-toast__icon { color: var(--eiq-red); }
    .eiq-toast--warning .eiq-toast__icon { color: var(--eiq-orange); }
    .eiq-toast--info    .eiq-toast__icon { color: var(--eiq-primary); }
    .eiq-toast--success { border-left: 3px solid var(--eiq-green); }
    .eiq-toast--error   { border-left: 3px solid var(--eiq-red); }
    .eiq-toast--warning { border-left: 3px solid var(--eiq-orange); }
    .eiq-toast--info    { border-left: 3px solid var(--eiq-primary); }
    .eiq-toast__msg { flex: 1; line-height: 1.4; }
    .eiq-toast__close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--eiq-muted);
      padding: 0;
      display: flex;
    }
    .eiq-toast__close:hover { color: var(--eiq-foreground); }
    @media (max-width: 560px) {
      .eiq-toast-host { left: 1rem; right: 1rem; max-width: none; }
    }
  `],
})
export class ToastHostComponent {
  readonly toastService = inject(ToastService);

  iconFor(kind: string): AppIconName {
    return TOAST_ICONS[kind] ?? TOAST_ICONS['info'];
  }
}
