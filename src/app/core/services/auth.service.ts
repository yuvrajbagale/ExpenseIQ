import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { AuthState, LoginCredentials, User } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _state = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Primary signals
  readonly user          = computed(() => this._state().user);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading     = computed(() => this._state().isLoading);
  readonly error         = computed(() => this._state().error);

  // Aliases used by some components
  readonly currentUser   = computed(() => this._state().user);
  readonly authError     = computed(() => this._state().error);

  constructor(private router: Router) {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const token    = localStorage.getItem('eq_token');
      const userJson = localStorage.getItem('eq_user');
      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        this._state.update(s => ({ ...s, user, token, isAuthenticated: true }));
      }
    } catch { /* ignore */ }
  }

  /** Async login — returns Observable for reactive forms */
  login(credentials: LoginCredentials): Observable<void> {
    return from(this._loginAsync(credentials));
  }

  private async _loginAsync(credentials: LoginCredentials): Promise<void> {
    this._state.update(s => ({ ...s, isLoading: true, error: null }));
    await new Promise(r => setTimeout(r, 800));
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: 'John Doe',
      initials: 'JD',
      createdAt: new Date(),
    };
    const token = 'mock_jwt_' + Date.now();
    if (credentials.rememberMe) {
      localStorage.setItem('eq_token', token);
      localStorage.setItem('eq_user', JSON.stringify(mockUser));
    }
    this._state.update(s => ({
      ...s, user: mockUser, token, isAuthenticated: true, isLoading: false,
    }));
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    localStorage.removeItem('eq_token');
    localStorage.removeItem('eq_user');
    this._state.set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
    this.router.navigate(['/auth/login']);
  }
}
