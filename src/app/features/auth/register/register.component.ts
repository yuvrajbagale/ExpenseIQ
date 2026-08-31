import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
            <h1 class="auth-panel__headline">Start tracking smarter</h1>
            <p class="auth-panel__subheadline">Create your free account and take control of your finances in under 2 minutes.</p>
          </div>
          <div class="auth-trust-badges">
            <div class="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2"/></svg>
              Bank-level security
            </div>
            <div class="auth-trust-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              Free forever
            </div>
          </div>
        </div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-container">
          <div class="auth-form-header">
            <h2 class="auth-form-header__title">Create your account</h2>
            <p class="auth-form-header__subtitle">Enter your details to get started</p>
          </div>

          @if (authError()) {
            <div class="auth-error-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              {{ authError() }}
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="auth-field">
              <label class="auth-field__label">Email address</label>
              <div class="auth-field__input-wrap">
                <svg class="auth-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" stroke-width="2"/><path d="M22 7l-10 7L2 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                <input formControlName="email" type="email" placeholder="you@example.com"
                  class="auth-field__input" [class.auth-field__input--error]="isFieldInvalid('email')" />
              </div>
              @if (isFieldInvalid('email')) {
                <p class="auth-field__error">
                  @if (registerForm.get('email')?.errors?.['required']) { Email is required. }
                  @else if (registerForm.get('email')?.errors?.['email']) { Enter a valid email. }
                </p>
              }
            </div>

            <div class="auth-field">
              <label class="auth-field__label">Password</label>
              <div class="auth-field__input-wrap">
                <svg class="auth-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2"/></svg>
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                  placeholder="Minimum 6 characters" class="auth-field__input auth-field__input--padded-right"
                  [class.auth-field__input--error]="isFieldInvalid('password')" />
                <button type="button" class="auth-field__toggle" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                  }
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <p class="auth-field__error">
                  @if (registerForm.get('password')?.errors?.['required']) { Password is required. }
                  @else if (registerForm.get('password')?.errors?.['minlength']) { Minimum 6 characters. }
                </p>
              }
            </div>

            <button type="submit" class="auth-submit-btn" [disabled]="authService.isLoading()">
              @if (authService.isLoading()) {
                <span class="auth-submit-btn__spinner"></span>
                Creating account…
              } @else {
                Create account
              }
            </button>
          </form>

          <p class="auth-alt-text">
            Already have an account? <a routerLink="/auth/login" class="auth-link">Sign in</a>
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
    .auth-error-alert { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--eiq-red-10); border: 1px solid rgba(231,0,11,0.2); border-radius: var(--eiq-radius); color: var(--eiq-red); font-size: 13px; }
    .auth-form { display: flex; flex-direction: column; gap: 20px; }
    .auth-field { display: flex; flex-direction: column; gap: 8px; }
    .auth-field__label { font-size: 14px; font-weight: 500; color: var(--eiq-foreground); }
    .auth-field__input-wrap { position: relative; }
    .auth-field__icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--eiq-subtle); pointer-events: none; }
    .auth-field__input { width: 100%; height: 44px; padding: 0 40px 0 40px; border: 1px solid var(--eiq-border); border-radius: var(--eiq-radius); font-size: 14px; color: var(--eiq-foreground); background: var(--eiq-input-bg); outline: none; transition: border-color var(--eiq-transition), box-shadow var(--eiq-transition); font-family: var(--eiq-font); }
    .auth-field__input:focus { border-color: var(--eiq-primary); box-shadow: 0 0 0 3px var(--eiq-primary-10); }
    .auth-field__input--error { border-color: var(--eiq-red); }
    .auth-field__input--padded-right { padding-right: 40px; }
    .auth-field__toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--eiq-subtle); display: flex; align-items: center; padding: 4px; }
    .auth-field__toggle:hover { color: var(--eiq-foreground); }
    .auth-field__error { font-size: 12px; color: var(--eiq-red); }
    .auth-submit-btn { width: 100%; height: 44px; background: var(--eiq-primary); color: #fff; border-radius: var(--eiq-radius); font-size: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: var(--eiq-shadow-primary); transition: background var(--eiq-transition), opacity var(--eiq-transition); font-family: var(--eiq-font); }
    .auth-submit-btn:hover:not(:disabled) { background: var(--eiq-primary-dark); }
    .auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .auth-submit-btn__spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    .auth-alt-text { text-align: center; font-size: 14px; color: var(--eiq-subtle); }
    .auth-link { font-weight: 500; color: var(--eiq-primary); }
    .auth-link:hover { text-decoration: underline; }
    @media (max-width: 1024px) { .auth-panel { display: none; } .auth-form-panel { padding: 24px; } }
  `],
})
export class RegisterComponent {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  registerForm!: FormGroup;
  showPassword = signal(false);
  submitted = signal(false);
  authError = signal<string | null>(null);

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.authError.set(null);
    if (this.registerForm.invalid) return;

    const { email, password } = this.registerForm.value;
    this.authService.register({ email, password, rememberMe: false }).subscribe({
      next: () => {},
      error: (err) => this.authError.set(err?.error?.message || 'Registration failed. Please try again.'),
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && (control.touched || this.submitted()));
  }
}
