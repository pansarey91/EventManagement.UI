import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { ApiError } from '../models';

/**
 * Normalizes error responses from the ASP.NET Core API.
 * Handles both backend ExceptionMiddleware errors and ASP.NET Core ValidationProblemDetails.
 * On 401 Unauthorized, terminates stale sessions and navigates to /login.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const feedbackService = inject(UiFeedbackService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let apiError: ApiError;

      // Extract correlation ID from response header or payload
      const correlationId =
        error.headers?.get('X-Correlation-ID') ||
        (error.error && typeof error.error === 'object' ? (error.error as any)['correlationId'] : undefined) ||
        req.headers.get('X-Correlation-ID') ||
        undefined;

      if (error.status === 0 || error.error instanceof ErrorEvent) {
        // Network failure, DNS error, server offline, or CORS block
        apiError = {
          statusCode: 0,
          message: 'Unable to connect to the server. Please check your network connection and try again.',
          correlationId,
        };
      } else if (error.error && typeof error.error === 'object') {
        const payload = error.error as Record<string, any>;

        // Case 1: Backend ExceptionMiddleware or custom error response
        // Format: { statusCode: number, message: string, detailed?: string, errors?: Record<string, string[]>, correlationId?: string }
        if (payload['message'] && typeof payload['message'] === 'string') {
          apiError = {
            statusCode: payload['statusCode'] || error.status,
            message: payload['message'],
            detailed: payload['detailed'],
            errors: payload['errors'],
            correlationId: payload['correlationId'] || correlationId,
          };
        }
        // Case 2: ASP.NET Core ValidationProblemDetails
        // Format: { title: string, status: number, errors: Record<string, string[]> }
        else if (payload['errors'] && typeof payload['errors'] === 'object') {
          const errors = payload['errors'] as Record<string, string[]>;
          const firstErrorMsg = Object.values(errors).flat()[0] || payload['title'] || 'One or more validation errors occurred.';
          apiError = {
            statusCode: payload['status'] || error.status,
            message: firstErrorMsg,
            errors,
            correlationId,
          };
        } else {
          apiError = {
            statusCode: error.status,
            message: error.statusText || 'An unexpected server error occurred.',
            correlationId,
          };
        }
      } else {
        apiError = {
          statusCode: error.status,
          message: typeof error.error === 'string' && error.error.trim().length > 0 ? error.error : (error.statusText || 'An unexpected error occurred.'),
          correlationId,
        };
      }

      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

      // Status Code Dispatch
      if (error.status === 0) {
        feedbackService.showError(apiError.message);
      } else if (error.status === 400 || error.status === 409 || error.status === 422) {
        if (!isAuthEndpoint) {
          feedbackService.showError(apiError.message);
        }
      } else if (error.status === 401) {
        if (!isAuthEndpoint) {
          const wasAuthenticated = authService.isAuthenticated();
          authService.logout();

          if (wasAuthenticated) {
            feedbackService.showWarning('Your session has expired. Please sign in again.');
          }

          const currentUrl = router.url;
          const isAuthPage = currentUrl.includes('/login') || currentUrl.includes('/register') || currentUrl.includes('/forbidden');
          if (!isAuthPage) {
            router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
          }
        }
      } else if (error.status === 403) {
        feedbackService.showError(apiError.message || 'You do not have permission to perform this action.');
      } else if (error.status === 429) {
        feedbackService.showError('Too many attempts. Please wait a moment before trying again.');
      } else if (error.status === 404) {
        // Show notification for mutating actions; GET requests let component display empty/not-found states
        if (req.method !== 'GET') {
          feedbackService.showError(apiError.message);
        }
      } else if (error.status >= 500) {
        feedbackService.showError(apiError.message || 'An unexpected server error occurred. Please try again later.');
      }

      return throwError(() => apiError);
    })
  );
};
