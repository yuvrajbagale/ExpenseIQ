import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Attaches the bearer token to every outgoing request when the user is
 * authenticated. The token is sourced from the live auth signal (not a raw
 * localStorage read) so it stays correct after login/logout within the session.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  // Never attach a token to auth/login endpoints.
  const isAuthRequest = req.url.includes('/auth/') || req.url.includes('/login');
  if (token && !isAuthRequest) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    return next(cloned);
  }
  return next(req);
};
