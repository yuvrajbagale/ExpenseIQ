import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthState, LoginCredentials, User } from '../interfaces/user.interface';

const TOKEN_KEY = 'eq_token';
const USER_KEY = 'eq_user';

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
  readonly user = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly error = computed(() => this._state().error);

  // Aliases used by some components
  readonly currentUser = computed(() => this._state().user);
  readonly authError = computed(() => this._state().error);

  constructor(private router: Router) {
    this.restoreSession();
  }

  /** Restore an authenticated session from storage on app load. */
  private restoreSession(): void {
    try {
      const token = this.readStorage(TOKEN_KEY);
      const userJson = this.readStorage(USER_KEY);
      if (!token || !userJson) {
        return;
      }
      const user = this.parseUser(userJson);
      if (!user || !user.id || !user.email) {
        this.clearStorage();
        return;
      }
      this._state.update((s) => ({
        ...s,
        user,
        token,
        isAuthenticated: true,
      }));
    } catch {
      this.clearStorage();
    }
  }

  /** Async login — returns Observable for reactive forms. */
  login(credentials: LoginCredentials): Observable<void> {
    return from(this._loginAsync(credentials)).pipe(
      catchError((err) => {
        this._state.update((s) => ({
          ...s,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Login failed.',
        }));
        return throwError(() => err);
      })
    );
  }

  private async _loginAsync(credentials: LoginCredentials): Promise<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    // Simulated network latency.
    await new Promise((r) => setTimeout(r, 800));

    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required.');
    }

    const initials = this.deriveInitials(credentials.email);
    const mockUser: User = {
      id: '1',
      email: credentials.email,
      name: this.deriveName(credentials.email),
      initials,
      createdAt: new Date(),
    };
    const token = 'mock_jwt_' + Date.now();

    // Persist so refresh keeps the session alive.
    this.writeStorage(TOKEN_KEY, token);
    this.writeStorage(USER_KEY, JSON.stringify(mockUser));

    this._state.update((s) => ({
      ...s,
      user: mockUser,
      token,
      isAuthenticated: true,
      isLoading: false,
    }));
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.clearStorage();
    this._state.set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    this.router.navigate(['/auth/login']);
  }

  /** Surface an auth error (e.g. 401 from the error interceptor). */
  setError(message: string): void {
    this._state.update((s) => ({ ...s, error: message }));
  }

  clearError(): void {
    this._state.update((s) => (s.error ? { ...s, error: null } : s));
  }

  // ── Helpers ────────────────────────────────────────────────

  private deriveName(email: string): string {
    const local = email.split('@')[0] ?? 'User';
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ') || 'John Doe';
  }

  private deriveInitials(email: string): string {
    const local = email.split('@')[0] ?? 'U';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (local.slice(0, 2)).toUpperCase();
  }

  private parseUser(raw: string): User | null {
    try {
      const parsed = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed.id === 'string' &&
        typeof parsed.email === 'string'
      ) {
        return {
          ...parsed,
          createdAt: parsed.createdAt ? new Date(parsed.createdAt) : new Date(),
        } as User;
      }
    } catch {
      /* fall through */
    }
    return null;
  }

  private readStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage may be unavailable (private mode); session stays in-memory */
    }
  }

  private clearStorage(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  }
}
