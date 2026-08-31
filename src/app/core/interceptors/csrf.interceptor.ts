import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CsrfService } from '../services/csrf.service';

/**
 * Attaches the CSRF token to state-changing requests (POST, PUT, PATCH, DELETE).
 * The CSRF token is read from the HttpOnly cookie by the CsrfService.
 */
export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  const csrf = inject(CsrfService);
  const token = csrf.token();

  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (isStateChanging && token) {
    const cloned = req.clone({
      setHeaders: { 'X-CSRF-Token': token },
    });
    return next(cloned);
  }

  return next(req);
};
