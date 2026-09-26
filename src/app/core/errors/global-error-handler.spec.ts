import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Injector } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
import { UiFeedbackService } from '../services/ui-feedback.service';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let feedbackServiceSpy: { showError: ReturnType<typeof vi.fn> };
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    feedbackServiceSpy = {
      showError: vi.fn(),
    };

    const injectorMock = {
      get: vi.fn().mockImplementation((token: any) => {
        if (token === UiFeedbackService) {
          return feedbackServiceSpy;
        }
        return null;
      }),
    } as unknown as Injector;

    handler = new GlobalErrorHandler(injectorMock);
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  it('should ignore HttpErrorResponse as it is handled by error interceptor', () => {
    const httpError = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
    handler.handleError(httpError);

    expect(consoleSpy).not.toHaveBeenCalled();
    expect(feedbackServiceSpy.showError).not.toHaveBeenCalled();
  });

  it('should log and display feedback for standard runtime Error', () => {
    const error = new Error('Cannot read properties of undefined');
    handler.handleError(error);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[GlobalErrorHandler] Caught unhandled exception:',
      error
    );
    expect(feedbackServiceSpy.showError).toHaveBeenCalledWith(
      'An unexpected client error occurred. Please refresh the page if issues persist.'
    );
  });

  it('should unwrap rejection error if present in promise rejections', () => {
    const innerError = new Error('Unhandled Promise Rejection');
    const rejectionContainer = { rejection: innerError };

    handler.handleError(rejectionContainer);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[GlobalErrorHandler] Caught unhandled exception:',
      innerError
    );
    expect(feedbackServiceSpy.showError).toHaveBeenCalledTimes(1);
  });

  it('should throttle identical error messages within 3 seconds', () => {
    const error1 = new Error('Repeated loop error');
    handler.handleError(error1);
    expect(feedbackServiceSpy.showError).toHaveBeenCalledTimes(1);

    // Immediate second call with identical message should be throttled
    const error2 = new Error('Repeated loop error');
    handler.handleError(error2);
    expect(feedbackServiceSpy.showError).toHaveBeenCalledTimes(1);
  });

  it('should not throw if injector fails to resolve feedback service', () => {
    const brokenInjector = {
      get: vi.fn().mockImplementation(() => {
        throw new Error('DI failed');
      }),
    } as unknown as Injector;

    const brokenHandler = new GlobalErrorHandler(brokenInjector);
    expect(() => {
      brokenHandler.handleError(new Error('Crash test'));
    }).not.toThrow();
  });
});
