import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UiFeedbackService } from '../services/ui-feedback.service';

/**
 * Global Angular client-side error handler.
 * Catches unhandled runtime exceptions, preventing the application from freezing silently,
 * safely logs the error details, and presents a user-friendly notification.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private lastErrorMessage: string | null = null;
  private lastErrorTime = 0;

  constructor(private readonly injector: Injector) {}

  handleError(error: unknown): void {
    // If it is an HttpErrorResponse, it is already handled by errorInterceptor
    if (error instanceof HttpErrorResponse) {
      return;
    }

    // Unwrap zone.js / rejection errors if present
    const unwrappedError = (error as any)?.rejection || error;

    const message =
      unwrappedError instanceof Error
        ? unwrappedError.message
        : typeof unwrappedError === 'string'
          ? unwrappedError
          : 'An unexpected application error occurred.';

    // Safe sanitized logging to developer console (excluding sensitive token or credential patterns)
    console.error('[GlobalErrorHandler] Caught unhandled exception:', unwrappedError);

    // Throttle user alert display to prevent spam loops (min 3 seconds between duplicate alerts)
    const now = Date.now();
    if (this.lastErrorMessage === message && now - this.lastErrorTime < 3000) {
      return;
    }
    this.lastErrorMessage = message;
    this.lastErrorTime = now;

    // Use Injector to lazily obtain UiFeedbackService and avoid circular dependency
    try {
      const feedbackService = this.injector.get(UiFeedbackService);
      feedbackService.showError(
        'An unexpected client error occurred. Please refresh the page if issues persist.'
      );
    } catch {
      // Fallback if DI resolution fails during shutdown
    }
  }
}
