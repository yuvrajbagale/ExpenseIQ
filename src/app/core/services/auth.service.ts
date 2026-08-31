import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interfaces/api.interface';
import { AuthState, LoginCredentials, User } from '../interfaces/user.interface';
import { CsrfService } from './csrf.service';

/**
 * Authentication service with dual-mode token support:
 *
 * 1. HttpOnly cookies (preferred, secure) — backend sets access_token cookie
 * 2. Bearer token in localStorage (backward compatible fallback)
 *
 * When the backend is fully upgraded, localStorage storage can be removed
 * and only HttpOnly cookies will be used.
 */
const TOKEN_KEY = 'eq_token';
const USER_KEY = 'eq_user';

type ApiUser = Partial<Omit<User, 'createdAt'>> & {
  createdAt?: string | Date;
};

interface LoginApiData {
  user: ApiUser;
  token: string;
  csrfToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _state = signal<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  readonly user = computed(() => this._state().user);
  readonly token = computed(() => this._state().token);
  readonly isAuthenticated = computed(() => this._state().isAuthenticated);
  readonly isLoading = computed(() => this._state().isLoading);

  /** Canonical error signal. Use this (not a duplicate) to read auth errors. */
  readonly authError = computed(() => this._state().error);

  /**
   * Alias for user signal — used by HeaderComponent and other consumers.
   * Kept for backward compatibility; both resolve to the same computed value.
   */
  readonly currentUser = computed(() => this._state().user);

  constructor(
    private router: Router,
    private http: HttpClient,
    private csrf: CsrfService,
  ) {
    this.restoreSession();
  }

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

      // Fetch CSRF token for authenticated session
      this.csrf.fetchToken();
    } catch {
      this.clearStorage();
    }
  }

  login(credentials: LoginCredentials): Observable<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    return this.http.post<ApiResponse<LoginApiData>>(`${environment.apiUrl}/auth/login`, credentials, {
      withCredentials: true,
    }).pipe(
      tap((response) => {
        if (!response.success || !response.data?.token || !response.data?.user) {
          throw new Error(response.message || 'Login failed.');
        }

        const user = this.normalizeUser(response.data.user, credentials.email);
        const token = response.data.token;

        // Store in localStorage for backward compatibility
        this.writeStorage(TOKEN_KEY, token);
        this.writeStorage(USER_KEY, JSON.stringify(user));

        this._state.update((s) => ({
          ...s,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }));

        // Fetch CSRF token for state-changing requests
        this.csrf.fetchToken();

        this.router.navigate(['/dashboard']);
      }),
      map(() => void 0),
      catchError((err) => {
        this._state.update((s) => ({
          ...s,
          isLoading: false,
          error: this.getErrorMessage(err, 'Login failed.'),
        }));
        return throwError(() => err);
      })
    );
  }

  register(credentials: LoginCredentials): Observable<void> {
    this._state.update((s) => ({ ...s, isLoading: true, error: null }));

    return this.http.post<ApiResponse<LoginApiData>>(`${environment.apiUrl}/auth/register`, credentials, {
      withCredentials: true,
    }).pipe(
      tap((response) => {
        if (!response.success || !response.data?.token || !response.data?.user) {
          throw new Error(response.message || 'Registration failed.');
        }

        const user = this.normalizeUser(response.data.user, credentials.email);
        const token = response.data.token;

        this.writeStorage(TOKEN_KEY, token);
        this.writeStorage(USER_KEY, JSON.stringify(user));

        this._state.update((s) => ({
          ...s,
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        }));

        this.csrf.fetchToken();
        this.router.navigate(['/dashboard']);
      }),
      map(() => void 0),
      catchError((err) => {
        this._state.update((s) => ({
          ...s,
          isLoading: false,
          error: this.getErrorMessage(err, 'Registration failed.'),
        }));
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.clearStorage();
    this.csrf.clear();
    this._state.set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Notify backend to clear HttpOnly cookies
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      error: () => { /* ignore — cookies will expire */ },
    });

    this.router.navigate(['/auth/login']);
  }

  setError(message: string): void {
    this._state.update((s) => ({ ...s, error: message }));
  }

  clearError(): void {
    this._state.update((s) => (s.error ? { ...s, error: null } : s));
  }

  private deriveName(email: string): string {
    const local = email.split('@')[0] ?? 'User';
    return local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || 'John Doe';
  }

  private deriveInitials(email: string): string {
    const local = email.split('@')[0] ?? 'U';
    const parts = local.split(/[._-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return local.slice(0, 2).toUpperCase();
  }

  private normalizeUser(user: ApiUser, fallbackEmail: string): User {
    const email = user.email ?? fallbackEmail;
    return {
      id: user.id ?? email,
      email,
      name: user.name ?? this.deriveName(email),
      avatar: user.avatar,
      initials: user.initials ?? this.deriveInitials(email),
      createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    };
  }

  private parseUser(raw: string): User | null {
    try {
      const parsed = JSON.parse(raw) as ApiUser;
      if (parsed && typeof parsed.id === 'string' && typeof parsed.email === 'string') {
        return this.normalizeUser(parsed, parsed.email);
      }
    } catch {
      /* fall through */
    }
    return null;
  }

  private getErrorMessage(err: unknown, fallback: string): string {
    const maybeHttpError = err as {
      error?: { message?: string } | string;
      message?: string;
    };
    const apiError = maybeHttpError?.error;

    if (typeof apiError === 'string') {
      return apiError;
    }
    if (apiError && typeof apiError === 'object' && apiError.message) {
      return apiError.message;
    }
    if (maybeHttpError?.message) {
      return maybeHttpError.message;
    }
    return fallback;
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
      /* storage may be unavailable; session stays in memory */
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
