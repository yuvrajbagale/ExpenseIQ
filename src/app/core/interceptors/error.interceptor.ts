import {
  HttpInterceptorFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Centralized HTTP error handling. On 401 it invalidates the local session and
 * redirects to login; all other errors are re-thrown for callers to handle.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        auth.setError('Your session has expired. Please sign in again.');
        // Avoid double navigation if already on an auth route.
        if (!router.url.startsWith('/auth')) {
          router.navigate(['/auth/login']);
        }
      }
      return throwError(() => err);
    })
  );
};
