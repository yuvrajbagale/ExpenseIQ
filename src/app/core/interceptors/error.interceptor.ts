import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Module-level flag to prevent duplicate 401 handling.
 * Multiple concurrent requests that all receive 401 will only trigger
 * one logout + redirect cycle.
 */
let handling401 = false;

/**
 * Centralized HTTP error handling.
 *
 * On 401:
 *  - Clears auth state (localStorage + signals) via AuthService.logout()
 *  - Redirects to login (unless already on an auth route)
 *  - Prevents duplicate redirects for concurrent 401s
 *  - Re-throws the error for callers to handle
 *
 * IMPORTANT: This interceptor does NOT implement token refresh because
 * the backend does not support refresh tokens. When the backend is
 * upgraded to support HttpOnly cookies + refresh tokens, this interceptor
 * should be updated to attempt a refresh before logout.
 *
 * SECURITY NOTE: The backend currently accepts ANY Bearer token.
 * 401 errors should only occur if the backend is upgraded to validate
 * tokens. Until then, 401s are unlikely but handled defensively.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        if (!handling401) {
          handling401 = true;

          // Clear auth state: removes token from localStorage + resets signals
          auth.logout();

          // Avoid redirect if already on an auth route
          if (!router.url.startsWith('/auth')) {
            router.navigate(['/auth/login']);
          }

          // Reset flag after a short delay to allow subsequent 401s
          // to be handled if they occur after the initial logout cycle
          setTimeout(() => { handling401 = false; }, 1000);
        }
      }
      return throwError(() => err);
    })
  );
};
