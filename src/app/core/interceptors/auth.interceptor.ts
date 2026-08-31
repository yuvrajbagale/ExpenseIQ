import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the bearer token to every outgoing request when the user is
 * authenticated. The token is sourced from the live auth signal (not a raw
 * localStorage read) so it stays correct after login/logout within the session.
 *
 * Also sets withCredentials: true so the browser sends HttpOnly cookies
 * (access_token, refresh_token) with every request.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Never attach a token to auth/login endpoints.
  const isAuthRequest = req.url.includes('/auth/') || req.url.includes('/login');

  // Always include credentials for cookie-based auth
  let cloned = req.clone({ withCredentials: true });

  if (token && !isAuthRequest) {
    cloned = cloned.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(cloned);
};
