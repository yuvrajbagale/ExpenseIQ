import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-forgot-password',
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
            <h1 class="auth-panel__headline">Reset your password</h1>
            <p class="auth-panel__subheadline">Enter the email on your account and we'll send a reset link.</p>
            <ul class="auth-panel__points">
              <li><eiq-icon name="lucideCircleCheck" [size]="15" [strokeWidth]="2.2" anim="pop" />Links expire after a short window</li>
              <li><eiq-icon name="lucideCircleCheck" [size]="15" [strokeWidth]="2.2" anim="pop" />Your data stays exactly as it is</li>
            </ul>
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
                  <eiq-icon class="auth-field__icon" name="lucideMail" [size]="16" [strokeWidth]="2" />
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
                <eiq-icon name="lucideCircleCheck" [size]="48" [strokeWidth]="2" anim="pop" />
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
