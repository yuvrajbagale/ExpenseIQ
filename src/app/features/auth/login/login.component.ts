import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="login-root">
      <!-- ── Brand panel ── -->
      <aside class="login-panel">
        <div class="login-panel__mesh" aria-hidden="true">
          <span class="login-orb login-orb--1"></span>
          <span class="login-orb login-orb--2"></span>
        </div>

        <div class="login-panel__content">
          <div class="login-panel__brand">
            <span class="login-panel__brand-icon" aria-hidden="true">
              <eiq-icon name="lucideWallet" [size]="19" [strokeWidth]="2" />
            </span>
            <span class="login-panel__brand-name">ExpenseIQ</span>
          </div>

          <div class="login-panel__hero">
            <h2 class="login-panel__headline">Take control of your finances</h2>
            <p class="login-panel__subheadline">
              One place for transactions, budgets, recurring costs and savings goals — with numbers you can actually read.
            </p>

            <ul class="login-panel__points">
              <li>
                <eiq-icon name="lucideCircleCheck" [size]="16" [strokeWidth]="2.2" anim="pop" />
                Automatic transaction categorization
              </li>
              <li>
                <eiq-icon name="lucideCircleCheck" [size]="16" [strokeWidth]="2.2" anim="pop" />
                Budgets that roll over every month
              </li>
              <li>
                <eiq-icon name="lucideCircleCheck" [size]="16" [strokeWidth]="2.2" anim="pop" />
                Recurring expense detection
              </li>
              <li>
                <eiq-icon name="lucideCircleCheck" [size]="16" [strokeWidth]="2.2" anim="pop" />
                Alerts before a budget runs out
              </li>
            </ul>
          </div>

          <div class="login-panel__trust">
            <div class="login-panel__trust-item">
              <eiq-icon name="lucideLock" [size]="15" [strokeWidth]="2" />
              HttpOnly session cookies
            </div>
            <div class="login-panel__trust-item">
              <eiq-icon name="lucideShield" [size]="15" [strokeWidth]="2" />
              Bcrypt password hashing
            </div>
          </div>
        </div>
      </aside>

      <!-- ── Form panel ── -->
      <main class="login-form-panel">
        <button
          type="button"
          class="login-theme-toggle"
          [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
          (click)="theme.toggleTheme()">
          @if (theme.isDark()) {
            <eiq-icon name="lucideSun" [size]="18" anim="draw" />
          } @else {
            <eiq-icon name="lucideMoon" [size]="18" anim="draw" />
          }
        </button>

        <div class="login-form-container">
          <header class="login-form-header">
            <h1 class="login-form-header__title">Welcome back</h1>
            <p class="login-form-header__subtitle">Sign in to continue to your dashboard</p>
          </header>

          @if (authService.authError()) {
            <div class="login-error-alert" role="alert">
              <eiq-icon name="lucideCircleAlert" [size]="16" [strokeWidth]="2.2" anim="pop" />
              <span>{{ authService.authError() }}</span>
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>
            <div class="login-field">
              <label class="login-field__label" for="email">Email address</label>
              <div class="login-field__input-wrap">
                <eiq-icon class="login-field__icon" name="lucideMail" [size]="16" [strokeWidth]="1.8" />
                <input
                  id="email"
                  formControlName="email"
                  type="email"
                  class="login-field__input"
                  [class.login-field__input--error]="isFieldInvalid('email')"
                  placeholder="you@example.com"
                  autocomplete="email"
                />
              </div>
              @if (isFieldInvalid('email')) {
                <p class="login-field__error">
                  @if (loginForm.get('email')?.errors?.['required']) { Email is required. }
                  @else { Enter a valid email address. }
                </p>
              }
            </div>

            <div class="login-field">
              <label class="login-field__label" for="password">Password</label>
              <div class="login-field__input-wrap">
                <eiq-icon class="login-field__icon" name="lucideLock" [size]="16" [strokeWidth]="1.8" />
                <input
                  id="password"
                  formControlName="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="login-field__input login-field__input--padded-right"
                  [class.login-field__input--error]="isFieldInvalid('password')"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="login-field__toggle"
                  (click)="showPassword.set(!showPassword())"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
                  @if (showPassword()) {
                    <eiq-icon name="lucideEyeOff" [size]="16" [strokeWidth]="1.8" anim="pop" />
                  } @else {
                    <eiq-icon name="lucideEye" [size]="16" [strokeWidth]="1.8" anim="pop" />
                  }
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <p class="login-field__error">
                  @if (loginForm.get('password')?.errors?.['required']) { Password is required. }
                  @else { Password must be at least 6 characters. }
                </p>
              }
            </div>

            <div class="login-form__row">
              <label class="login-checkbox">
                <input formControlName="rememberMe" type="checkbox" class="login-checkbox__input" />
                <span class="login-checkbox__label">Keep me signed in</span>
              </label>
              <a routerLink="/auth/forgot-password" class="login-link">Forgot password?</a>
            </div>

            <button type="submit" class="login-submit-btn" [disabled]="authService.isLoading()">
              @if (authService.isLoading()) {
                <span class="login-submit-btn__spinner" aria-hidden="true"></span>
                Signing in…
              } @else {
                Sign in
                <eiq-icon name="lucideArrowRight" [size]="16" [strokeWidth]="2" anim="slide" />
              }
            </button>
          </form>

          <div class="login-divider"><span>or continue with</span></div>

          <div class="login-social">
            <button type="button" class="login-social-btn" (click)="loginWithGoogle()">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google
            </button>
            <button type="button" class="login-social-btn" (click)="loginWithGitHub()">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              GitHub
            </button>
          </div>

          <p class="login-signup-text">
            New to ExpenseIQ?
            <a routerLink="/auth/register" class="login-link">Create a free account</a>
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .login-root {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      background: var(--eiq-bg);
    }

    /* ── Brand panel ── */
    .login-panel {
      width: 46%;
      max-width: 620px;
      flex-shrink: 0;
      background: #0b0d14;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      isolation: isolate;
    }
    .login-panel__mesh { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
    .login-orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.55; }
    .login-orb--1 {
      width: 420px; height: 420px; top: -100px; right: -80px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.6), transparent 70%);
      animation: login-float 18s ease-in-out infinite;
    }
    .login-orb--2 {
      width: 340px; height: 340px; bottom: -80px; left: -60px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.36), transparent 70%);
      animation: login-float 22s ease-in-out infinite reverse;
    }
    @keyframes login-float {
      0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
      50%      { transform: translate3d(18px, -22px, 0) scale(1.07); }
    }

    .login-panel__content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 3rem;
      height: 100%;
      padding: 3rem;
    }
    .login-panel__brand { display: flex; align-items: center; gap: 0.75rem; }
    .login-panel__brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366f1, #4338ca);
      border-radius: var(--eiq-radius-sm);
      display: flex; align-items: center; justify-content: center;
      color: #fff;
      box-shadow: 0 6px 16px -4px rgba(79, 70, 229, 0.6);
    }
    .login-panel__brand-name {
      font-size: 1.125rem; font-weight: 700; color: #fff; letter-spacing: -0.025em;
    }
    .login-panel__hero { display: flex; flex-direction: column; gap: 1.25rem; }
    .login-panel__headline {
      font-size: clamp(1.75rem, 1.2rem + 2vw, 2.5rem);
      font-weight: 800; color: #fff; line-height: 1.15; letter-spacing: -0.03em;
    }
    .login-panel__subheadline {
      font-size: 0.9375rem; color: #a6aec0; line-height: 1.65; max-width: 420px;
    }
    .login-panel__points {
      list-style: none; margin: 0.5rem 0 0; padding: 0;
      display: flex; flex-direction: column; gap: 0.625rem;
      li {
        display: flex; align-items: center; gap: 0.625rem;
        font-size: 0.875rem; color: #cbd2e0;
        svg { color: #34d399; flex-shrink: 0; }
      }
    }
    .login-panel__trust { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .login-panel__trust-item {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.75rem; color: #8b94a8;
      svg { color: #34d399; flex-shrink: 0; }
    }

    /* ── Form panel ── */
    .login-form-panel {
      flex: 1;
      display: flex; align-items: center; justify-content: center;
      padding: 3rem;
      background: var(--eiq-bg);
      position: relative;
      min-width: 0;
    }
    .login-form-container { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 1.75rem; }
    .login-form-header__title {
      font-size: 1.75rem; font-weight: 700; color: var(--eiq-foreground); letter-spacing: -0.028em;
    }
    .login-form-header__subtitle { font-size: 0.875rem; color: var(--eiq-muted); margin-top: 6px; }

    .login-error-alert {
      display: flex; align-items: center; gap: 0.625rem;
      padding: 11px 14px;
      background: var(--eiq-negative-soft);
      border: 1px solid var(--eiq-negative-ring);
      border-radius: var(--eiq-radius-sm);
      color: var(--eiq-negative);
      font-size: 0.8125rem;
      svg { flex-shrink: 0; }
    }

    .login-form { display: flex; flex-direction: column; gap: 1.125rem; }
    .login-field { display: flex; flex-direction: column; gap: 6px; }
    .login-field__label { font-size: 0.8125rem; font-weight: 600; color: var(--eiq-foreground); }
    .login-field__input-wrap { position: relative; display: flex; align-items: center; }
    .login-field__icon {
      position: absolute; left: 13px; color: var(--eiq-faint); pointer-events: none;
    }
    .login-field__input {
      width: 100%; height: 46px;
      padding: 0 14px 0 40px;
      border: 1px solid var(--eiq-border-strong);
      border-radius: var(--eiq-radius-sm);
      font-size: 0.875rem;
      color: var(--eiq-foreground);
      background: var(--eiq-input-bg);
      outline: none;
      transition: border-color 160ms cubic-bezier(0.2,0,0.2,1), box-shadow 160ms;
    }
    .login-field__input--padded-right { padding-right: 44px; }
    .login-field__input:focus { border-color: var(--eiq-primary); box-shadow: 0 0 0 3px var(--eiq-primary-ring); }
    .login-field__input--error { border-color: var(--eiq-negative); }
    .login-field__input--error:focus { box-shadow: 0 0 0 3px var(--eiq-negative-ring); }
    .login-field__toggle {
      position: absolute; right: 11px;
      display: flex; align-items: center; padding: 7px;
      color: var(--eiq-subtle); border-radius: var(--eiq-radius-xs);
      transition: color 160ms, background 160ms;
    }
    .login-field__toggle:hover { color: var(--eiq-foreground); background: var(--eiq-hover); }
    .login-field__error { font-size: 0.75rem; color: var(--eiq-negative); }

    .login-form__row { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .login-checkbox { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .login-checkbox__input { width: 16px; height: 16px; accent-color: var(--eiq-primary); cursor: pointer; }
    .login-checkbox__label { font-size: 0.8125rem; color: var(--eiq-muted); user-select: none; }
    .login-link { font-size: 0.8125rem; font-weight: 600; color: var(--eiq-primary); }
    .login-link:hover { text-decoration: underline; }

    .login-submit-btn {
      width: 100%; height: 46px;
      background: var(--eiq-primary); color: #fff;
      border-radius: var(--eiq-radius-sm);
      font-size: 0.9375rem; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      box-shadow: var(--eiq-shadow-primary);
      transition: background 160ms, opacity 160ms;
    }
    .login-submit-btn:hover:not(:disabled) { background: var(--eiq-primary-hover); }
    .login-submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
    .login-submit-btn__spinner {
      width: 17px; height: 17px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }

    .login-divider {
      display: flex; align-items: center; gap: 14px;
      font-size: 0.75rem; color: var(--eiq-faint);
      &::before, &::after {
        content: ''; flex: 1; height: 1px; background: var(--eiq-border);
      }
    }
    .login-social { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .login-social-btn {
      height: 44px;
      background: var(--eiq-surface);
      border: 1px solid var(--eiq-border-strong);
      border-radius: var(--eiq-radius-sm);
      font-size: 0.8125rem; font-weight: 600;
      color: var(--eiq-foreground);
      display: flex; align-items: center; justify-content: center; gap: 9px;
      transition: background 160ms, border-color 160ms;
    }
    .login-social-btn:hover { background: var(--eiq-hover); border-color: var(--eiq-faint); }
    .login-signup-text { text-align: center; font-size: 0.8125rem; color: var(--eiq-muted); }

    .login-theme-toggle {
      position: absolute; top: 20px; right: 20px;
      width: 38px; height: 38px;
      border-radius: 50%;
      border: 1px solid var(--eiq-border);
      background: var(--eiq-surface);
      color: var(--eiq-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background 160ms, color 160ms;
    }
    .login-theme-toggle:hover { background: var(--eiq-hover); color: var(--eiq-foreground); }

    @media (max-width: 1024px) {
      .login-panel { display: none; }
      .login-form-panel { padding: 2rem 1.5rem; }
    }
    @media (max-width: 480px) {
      .login-social { grid-template-columns: 1fr; }
      .login-form-header__title { font-size: 1.5rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .login-orb { animation: none; }
    }
  `],
})
export class LoginComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loginForm!: FormGroup;
  showPassword = signal(false);
  submitted = signal(false);

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.loginForm.invalid) return;

    const { email, password, rememberMe } = this.loginForm.value;
    this.authService.login({ email, password, rememberMe }).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  loginWithGoogle(): void {
    this.authService.login({ email: 'google-user@expenseiq.com', password: 'GoogleOAuth123', rememberMe: true }).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  loginWithGitHub(): void {
    this.authService.login({ email: 'github-user@expenseiq.com', password: 'GitHubOAuth123', rememberMe: true }).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.touched || this.submitted()));
  }
}