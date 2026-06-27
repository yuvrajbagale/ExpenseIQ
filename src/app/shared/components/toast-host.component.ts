import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';

/**
 * Renders the global toast stack. Mounted once in AppComponent so any
 * feature can trigger feedback via ToastService.
 */
@Component({
  selector: 'eiq-toast-host',
  standalone: true,
  template: `
    <div class="eiq-toast-host" role="region" aria-label="Notifications" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="eiq-toast" [class]="'eiq-toast--' + toast.kind" role="status">
          <span class="eiq-toast__icon">
            @switch (toast.kind) {
              @case ('success') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              }
              @case ('error') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              }
              @case ('warning') {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
              @default {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              }
            }
          </span>
          <span class="eiq-toast__msg">{{ toast.message }}</span>
          <button
            type="button"
            class="eiq-toast__close"
            aria-label="Dismiss notification"
            (click)="toastService.dismiss(toast.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
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
}
