import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * CSRF token management service.
 *
 * Fetches a CSRF token from the backend and keeps it in memory.
 * The actual CSRF cookie is HttpOnly and read by the backend;
 * this service holds the token value for the X-CSRF-Token header.
 */
@Injectable({ providedIn: 'root' })
export class CsrfService {
  private readonly _token = signal<string | null>(null);
  private readonly _sessionId = signal<string | null>(null);

  readonly token = this._token.asReadonly();
  readonly sessionId = this._sessionId.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Fetch a fresh CSRF token from the backend.
   * Should be called on app initialization.
   */
  fetchToken(): void {
    this.http.get<{ data: { csrfToken: string; sessionId: string } }>(
      `${environment.apiUrl}/csrf-token`,
      { withCredentials: true }
    ).subscribe({
      next: (res) => {
        if (res.data) {
          this._token.set(res.data.csrfToken);
          this._sessionId.set(res.data.sessionId);
        }
      },
      error: () => {
        // CSRF fetch failed — state-changing requests may fail
        console.warn('Failed to fetch CSRF token.');
      },
    });
  }

  /** Clear the CSRF token (e.g., on logout). */
  clear(): void {
    this._token.set(null);
    this._sessionId.set(null);
  }
}
