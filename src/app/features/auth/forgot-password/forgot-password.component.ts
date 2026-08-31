import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-root">
      <div class="auth-panel">
        <div class="auth-panel__glow auth-panel__glow--tr"></div>
        <div class="auth-panel__glow auth-panel__glow--bl"></div>
        <div class="auth-panel__content">
          <div class="auth-panel__brand">
            <div class="auth-panel__brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" stroke-width="2" stroke-linejoin="round"/><path d="M2 17l10 5 10-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 12l10 5 10-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <span class="auth-panel__brand-name">ExpenseIQ</span>
          </div>
          <div class="auth-panel__hero">
            <h1 class="auth-panel__headline">Reset your password</h1>
            <p class="auth-panel__subheadline">Enter your email and we'll send you a reset link.</p>
          </div>
          <div class="auth-trust-badges">
            <div class="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/></svg>
              Secure reset
            </div>
            <div class="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              No data lost
            </div>
          </div>
        </div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-container">
          @if (!submitted()) {
            <div class="auth-form-header">
              <h2 class="auth-form-header__title">Forgot password?</h2>
              <p class="auth-form-header__subtitle">Enter the email address associated with your account</p>
            </div>

            <form [formGroup]="resetForm" (ngSubmit)="onSubmit()" class="auth-form">
              <div class="auth-field">
                <label class="auth-field__label">Email address</label>
                <div class="auth-field__input-wrap">
                  <svg class="auth-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M22 7l-10 7L2 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  <input formControlName="email" type="email" placeholder="you@example.com"
                    class="auth-field__input" [class.auth-field__input--error]="isFieldInvalid('email')" />
                </div>
                @if (isFieldInvalid('email')) {
                  <p class="auth-field__error">
                    @if (resetForm.get('email')?.errors?.['required']) { Email is required. }
                    @else if (resetForm.get('email')?.errors?.['email']) { Enter a valid email. }
                  </p>
                }
              </div>

              <button type="submit" class="auth-submit-btn" [disabled]="isLoading()">
                @if (isLoading()) {
                  <span class="auth-submit-btn__spinner"></span>
                  Sending…
                } @else {
                  Send reset link
                }
              </button>
            </form>
          } @else {
            <div class="auth-success">
              <div class="auth-success__icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              <h2 class="auth-success__title">Check your email</h2>
              <p class="auth-success__text">If an account with that email exists, we've sent a password reset link.</p>
              <a routerLink="/auth/login" class="auth-back-link">← Back to sign in</a>
            </div>
          }

          <p class="auth-alt-text">
            Remember your password? <a routerLink="/auth/login" class="auth-link">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-root { display: flex; min-height: 100vh; width: 100%; background: var(--eiq-bg); }
    .auth-panel { width: 480px; flex-shrink: 0; background: oklch(0.18 0.06 259.815); position: relative; overflow: hidden; display: flex; flex-direction: column; }
    .auth-panel__glow { position: absolute; border-radius: 50%; pointer-events: none; }
    .auth-panel__glow--tr { top: -80px; right: -80px; width: 320px; height: 320px; background: radial-gradient(ellipse at top right, oklch(0.45 0.18 259.815) 0%, transparent 60%); }
    .auth-panel__glow--bl { bottom: -60px; left: -60px; width: 256px; height: 256px; background: radial-gradient(ellipse at bottom left, oklch(0.35 0.12 220) 0%, transparent 55%); }
    .auth-panel__content { position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: space-between; height: 100%; padding: 48px; }
    .auth-panel__brand { display: flex; align-items: center; gap: 12px; }
    .auth-panel__brand-icon { width: 40px; height: 40px; background: var(--eiq-primary); border-radius: var(--eiq-radius-lg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(43, 127, 255, 0.4); }
    .auth-panel__brand-name { font-size: 24px; font-weight: 700; color: #fff; letter-spacing: -0.03em; }
    .auth-panel__hero { display: flex; flex-direction: column; gap: 16px; margin-top: 48px; }
    .auth-panel__headline { font-size: 32px; font-weight: 700; color: #fff; line-height: 1.2; letter-spacing: -0.02em; }
    .auth-panel__subheadline { font-size: 15px; color: oklch(0.75 0.04 259.815); line-height: 1.6; }
    .auth-trust-badges { display: flex; gap: 24px; margin-top: 32px; }
    .auth-trust-badge { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.6); }
    .auth-form-panel { flex: 1; display: flex; align-items: center; justify-content: center; padding: 48px; background: var(--eiq-bg); }
    .auth-form-container { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 32px; }
    .auth-form-header__title { font-size: 26px; font-weight: 600; color: var(--eiq-foreground); letter-spacing: -0.02em; }
    .auth-form-header__subtitle { font-size: 14px; color: var(--eiq-subtle); margin-top: 6px; }
    .auth-form { display: flex; flex-direction: column; gap: 20px; }
    .auth-field { display: flex; flex-direction: column; gap: 8px; }
    .auth-field__label { font-size: 14px; font-weight: 500; color: var(--eiq-foreground); }
    .auth-field__input-wrap { position: relative; }
    .auth-field__icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--eiq-subtle); pointer-events: none; }
    .auth-field__input { width: 100%; height: 44px; padding: 0 12px 0 40px; border: 1px solid var(--eiq-border); border-radius: var(--eiq-radius); font-size: 14px; color: var(--eiq-foreground); background: var(--eiq-input-bg); outline: none; transition: border-color var(--eiq-transition), box-shadow var(--eiq-transition); font-family: var(--eiq-font); }
    .auth-field__input:focus { border-color: var(--eiq-primary); box-shadow: 0 0 0 3px var(--eiq-primary-10); }
    .auth-field__input--error { border-color: var(--eiq-red); }
    .auth-field__error { font-size: 12px; color: var(--eiq-red); }
    .auth-submit-btn { width: 100%; height: 44px; background: var(--eiq-primary); color: #fff; border-radius: var(--eiq-radius); font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: var(--eiq-shadow-primary); transition: background var(--eiq-transition), opacity var(--eiq-transition); font-family: var(--eiq-font); }
    .auth-submit-btn:hover:not(:disabled) { background: var(--eiq-primary-dark); }
    .auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .auth-submit-btn__spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .auth-success { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; padding: 32px 0; }
    .auth-success__icon { color: oklch(0.6 0.118 184.704); }
    .auth-success__title { font-size: 22px; font-weight: 600; color: var(--eiq-foreground); }
    .auth-success__text { font-size: 14px; color: var(--eiq-subtle); line-height: 1.6; max-width: 320px; }
    .auth-back-link { font-size: 14px; font-weight: 500; color: var(--eiq-primary); margin-top: 8px; }
    .auth-back-link:hover { text-decoration: underline; }
    .auth-alt-text { text-align: center; font-size: 14px; color: var(--eiq-subtle); }
    .auth-link { font-weight: 500; color: var(--eiq-primary); }
    .auth-link:hover { text-decoration: underline; }
    @media (max-width: 1024px) { .auth-panel { display: none; } .auth-form-panel { padding: 24px; } }
  `],
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);

  resetForm!: FormGroup;
  submitted = signal(false);
  isLoading = signal(false);

  ngOnInit(): void {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;
    this.isLoading.set(true);
    const email = this.resetForm.value.email;
    this.http.post('/api/auth/forgot-password', { email }).subscribe({
      next: () => { this.isLoading.set(false); this.submitted.set(true); },
      error: () => { this.isLoading.set(false); this.submitted.set(true); },
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.resetForm.get(field);
    return !!(control && control.invalid && (control.touched || this.submitted()));
  }
}
