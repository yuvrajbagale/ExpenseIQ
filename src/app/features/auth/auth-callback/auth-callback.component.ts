import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="callback-root">
      <div class="callback-card">
        @if (error) {
          <div class="callback-icon callback-icon--error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </div>
          <h2>Authentication Failed</h2>
          <p>{{ error }}</p>
          <a routerLink="/auth/login" class="callback-link">Back to Sign In</a>
        } @else {
          <div class="callback-spinner"></div>
          <h2>Signing you in...</h2>
          <p>Completing GitHub authentication.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-root { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--eiq-bg); }
    .callback-card { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 48px; background: var(--eiq-surface); border: 1px solid var(--eiq-border); border-radius: var(--eiq-radius-xl); max-width: 400px; }
    .callback-icon--error { color: var(--eiq-red); }
    .callback-card h2 { font-size: 20px; font-weight: 600; color: var(--eiq-foreground); }
    .callback-card p { font-size: 14px; color: var(--eiq-subtle); }
    .callback-link { font-size: 14px; font-weight: 500; color: var(--eiq-primary); text-decoration: none; }
    .callback-link:hover { text-decoration: underline; }
    .callback-spinner { width: 48px; height: 48px; border: 3px solid var(--eiq-border); border-top-color: var(--eiq-primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
  `],
})
export class AuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  error: string | null = null;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.error = params['error'].replace(/_/g, ' ');
        return;
      }

      const token = params['token'];
      const csrfToken = params['csrfToken'];
      const email = params['email'];
      const name = params['name'];
      const avatar = params['avatar'];

      if (token && email) {
        // Store token and user, then navigate to dashboard
        try {
          localStorage.setItem('eq_token', token);
          localStorage.setItem('eq_user', JSON.stringify({
            id: email,
            email,
            name: name || email.split('@')[0],
            avatar: avatar || undefined,
            initials: this.deriveInitials(name || email),
            createdAt: new Date().toISOString(),
          }));
          // Reload to pick up the new auth state
          window.location.href = '/dashboard';
        } catch {
          this.error = 'Failed to store authentication data.';
        }
      } else {
        this.error = 'No authentication data received.';
      }
    });
  }

  private deriveInitials(name: string): string {
    const parts = name.split(/[.\s_-]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
}
