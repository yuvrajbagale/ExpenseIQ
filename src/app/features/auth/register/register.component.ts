import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, IconComponent],
  template: `
    <div class="auth-root">
      <div class="auth-panel">
        <div class="auth-panel__mesh">
          <span class="auth-panel__orb auth-panel__orb--tr"></span>
          <span class="auth-panel__orb auth-panel__orb--bl"></span>
        </div>
        <div class="auth-panel__content">
          <div class="auth-panel__brand">
            <div class="auth-panel__brand-icon">
              <eiq-icon name="lucideWallet" [size]="19" [strokeWidth]="2" />
            </div>
            <span class="auth-panel__brand-name">ExpenseIQ</span>
          </div>
          <div class="auth-panel__hero">
            <h1 class="auth-panel__headline">Start tracking smarter</h1>
            <p class="auth-panel__subheadline">Create a free account and see exactly where your money goes.</p>
            <ul class="auth-panel__points">
              <li><eiq-icon name="lucideCircleCheck" [size]="15" [strokeWidth]="2.2" anim="pop" />Free forever — no card required</li>
              <li><eiq-icon name="lucideCircleCheck" [size]="15" [strokeWidth]="2.2" anim="pop" />Unlimited transactions and budgets</li>
              <li><eiq-icon name="lucideCircleCheck" [size]="15" [strokeWidth]="2.2" anim="pop" />Passwords hashed with bcrypt</li>
            </ul>
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
              <eiq-icon name="lucideCircleAlert" [size]="16" [strokeWidth]="2.2" anim="pop" />
              {{ authError() }}
            </div>
          }

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="auth-field">
              <label class="auth-field__label">Email address</label>
              <div class="auth-field__input-wrap">
                <eiq-icon class="auth-field__icon" name="lucideMail" [size]="16" [strokeWidth]="2" />
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
                <eiq-icon class="auth-field__icon" name="lucideLock" [size]="16" [strokeWidth]="2" />
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                  placeholder="Minimum 6 characters" class="auth-field__input auth-field__input--padded-right"
                  [class.auth-field__input--error]="isFieldInvalid('password')" />
                <button type="button" class="auth-field__toggle" (click)="showPassword.set(!showPassword())">
                  @if (showPassword()) {
                    <eiq-icon name="lucideEyeOff" [size]="16" [strokeWidth]="2" anim="pop" />
                  } @else {
                    <eiq-icon name="lucideEye" [size]="16" [strokeWidth]="2" anim="pop" />
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
