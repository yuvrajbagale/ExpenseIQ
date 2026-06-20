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
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-root">
      <!-- Left Panel -->
      <div class="login-panel">
        <div class="login-panel__glow login-panel__glow--tr"></div>
        <div class="login-panel__glow login-panel__glow--bl"></div>

        <div class="login-panel__content">
          <!-- Brand -->
          <div class="login-panel__brand">
            <div class="login-panel__brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="white" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 3H8L6 7H18L16 3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="login-panel__brand-name">ExpenseIQ</span>
          </div>

          <!-- Hero Copy -->
          <div class="login-panel__hero">
            <div class="login-panel__tagline">
              <h2 class="login-panel__headline">
                Take control of<br />your finances
              </h2>
              <p class="login-panel__subheadline">
                Smart expense tracking, budgeting, and analytics — all in one place.
              </p>
            </div>

            <!-- Balance Card -->
            <div class="login-balance-card">
              <div class="login-balance-card__top">
                <div>
                  <p class="login-balance-card__label">Total Balance</p>
                  <p class="login-balance-card__amount">$24,850.00</p>
                </div>
                <div class="login-balance-card__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <path d="M16 3H8L6 7H18L16 3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </div>
              <div class="login-balance-card__stats">
                <div class="login-balance-card__stat">
                  <div class="login-balance-card__stat-header">
                    <div class="login-balance-card__stat-icon login-balance-card__stat-icon--income">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M23 6L13.5 15.5L8.5 10.5L1 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 6H23V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <span class="login-balance-card__stat-label">Income</span>
                  </div>
                  <p class="login-balance-card__stat-value">$6,240</p>
                </div>
                <div class="login-balance-card__stat">
                  <div class="login-balance-card__stat-header">
                    <div class="login-balance-card__stat-icon login-balance-card__stat-icon--expense">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M23 18L13.5 8.5L8.5 13.5L1 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 18H23V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <span class="login-balance-card__stat-label">Expense</span>
                  </div>
                  <p class="login-balance-card__stat-value">$3,180</p>
                </div>
              </div>
              <!-- Sparkline -->
              <div class="login-balance-card__sparkline">
                <svg width="100%" height="56" viewBox="0 0 240 56" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#2b7fff" stop-opacity="0.5"/>
                      <stop offset="100%" stop-color="#2b7fff" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path d="M0 45 L30 38 L60 42 L90 28 L120 32 L150 18 L180 22 L210 12 L240 8"
                    fill="none" stroke="#2b7fff" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M0 45 L30 38 L60 42 L90 28 L120 32 L150 18 L180 22 L210 12 L240 8 L240 56 L0 56 Z"
                    fill="url(#sparkGrad)"/>
                </svg>
              </div>
            </div>

            <!-- Category Pills -->
            <div class="login-categories">
              <div class="login-category-pill">
                <div class="login-category-pill__icon login-category-pill__icon--orange">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <span>Shopping</span>
              </div>
              <div class="login-category-pill">
                <div class="login-category-pill__icon login-category-pill__icon--teal">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 2h3l2.7 9.8M7.7 11.8L6 18h15l-1.4-6.2H7.7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="21" r="1" fill="currentColor"/><circle cx="20" cy="21" r="1" fill="currentColor"/></svg>
                </div>
                <span>Food</span>
              </div>
              <div class="login-category-pill">
                <div class="login-category-pill__icon login-category-pill__icon--blue">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="1" y="3" width="15" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M16 8h5l2 3v4h-7V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/><circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="2"/></svg>
                </div>
                <span>Transport</span>
              </div>
              <div class="login-category-pill">
                <div class="login-category-pill__icon login-category-pill__icon--yellow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <span>Utilities</span>
              </div>
            </div>

            <!-- Social Proof -->
            <div class="login-social-proof">
              <div class="login-social-proof__avatars">
                <div class="login-social-proof__avatar" style="background:#2b7fff">A</div>
                <div class="login-social-proof__avatar" style="background:#22c55e">M</div>
                <div class="login-social-proof__avatar" style="background:#f97316">J</div>
              </div>
              <p class="login-social-proof__text">
                Join <strong>50,000+</strong> users managing smarter
              </p>
            </div>
          </div>

          <!-- Trust Badges -->
          <div class="login-trust-badges">
            <div class="login-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Bank-level security</span>
            </div>
            <div class="login-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#22c55e" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>256-bit encryption</span>
            </div>
            <div class="login-trust-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="#eab308" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>4.9 rated app</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel — Login Form -->
      <div class="login-form-panel">
        <div class="login-form-container">
          <div class="login-form-header">
            <h1 class="login-form-header__title">Welcome Back</h1>
            <p class="login-form-header__subtitle">Sign in to your account to continue</p>
          </div>

          @if (authService.authError()) {
            <div class="login-error-alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              {{ authService.authError() }}
            </div>
          }

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>
            <!-- Email -->
            <div class="login-field">
              <label class="login-field__label" for="email">Email Address</label>
              <div class="login-field__input-wrap">
                <svg class="login-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/><polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
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
                  @else if (loginForm.get('email')?.errors?.['email']) { Please enter a valid email. }
                </p>
              }
            </div>

            <!-- Password -->
            <div class="login-field">
              <label class="login-field__label" for="password">Password</label>
              <div class="login-field__input-wrap">
                <svg class="login-field__icon" width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
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
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                >
                  @if (showPassword()) {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                  }
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <p class="login-field__error">
                  @if (loginForm.get('password')?.errors?.['required']) { Password is required. }
                  @else if (loginForm.get('password')?.errors?.['minlength']) { Minimum 6 characters. }
                </p>
              }
            </div>

            <!-- Remember + Forgot -->
            <div class="login-form__row">
              <label class="login-checkbox">
                <input
                  formControlName="rememberMe"
                  type="checkbox"
                  class="login-checkbox__input"
                />
                <span class="login-checkbox__label">Remember me</span>
              </label>
              <a href="#" class="login-link">Forgot Password?</a>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="login-submit-btn"
              [disabled]="authService.isLoading()"
            >
              @if (authService.isLoading()) {
                <span class="login-submit-btn__spinner"></span>
                Signing in…
              } @else {
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="10 17 15 12 10 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                Sign In
              }
            </button>
          </form>

          <!-- Divider -->
          <div class="login-divider">
            <div class="login-divider__line"></div>
            <span class="login-divider__label">OR</span>
            <div class="login-divider__line"></div>
          </div>

          <!-- Social Logins -->
          <div class="login-social">
            <button class="login-social-btn">
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <button class="login-social-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>

          <p class="login-signup-text">
            Don't have an account?
            <a href="#" class="login-link">Create one free</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  protected readonly authService = inject(AuthService);
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
      next: () => this.router.navigate(['/dashboard']),
      error: () => {},
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.touched || this.submitted()));
  }
}
