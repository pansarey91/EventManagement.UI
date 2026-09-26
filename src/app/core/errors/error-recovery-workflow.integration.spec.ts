import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from '../interceptors/error.interceptor';
import { AuthService } from '../services/auth.service';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Error Recovery & Interceptor Workflow Integration Tests', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let feedbackServiceMock: {
    showError: ReturnType<typeof vi.fn>;
    showWarning: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
    url: string;
  };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      logout: vi.fn(),
    };
    feedbackServiceMock = {
      showError: vi.fn(),
      showWarning: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
      url: '/organizer/events',
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should handle 401 Unauthorized by logging out user, showing warning, and redirecting to /login with returnUrl', () => {
    let capturedError: any = null;
    httpClient.get('/api/protected-resource').subscribe({
      next: () => {},
      error: (err: any) => {
        capturedError = err;
      },
    });

    const req = httpTesting.expectOne('/api/protected-resource');
    req.flush(
      { message: 'Token expired.' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(capturedError).not.toBeNull();
    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(feedbackServiceMock.showWarning).toHaveBeenCalledWith('Your session has expired. Please sign in again.');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/organizer/events' },
    });
  });

  it('should handle 403 Forbidden without redirecting but showing error feedback', () => {
    let capturedError: any = null;
    httpClient.get('/api/admin/system').subscribe({
      next: () => {},
      error: (err: any) => {
        capturedError = err;
      },
    });

    const req = httpTesting.expectOne('/api/admin/system');
    req.flush(
      { message: 'You do not have permission to access admin center.' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(capturedError).not.toBeNull();
    expect(capturedError.statusCode).toBe(403);
    expect(feedbackServiceMock.showError).toHaveBeenCalledWith('You do not have permission to access admin center.');
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should handle 429 Rate Limiting with appropriate user guidance message', () => {
    let capturedError: any = null;
    httpClient.get('/api/events/search').subscribe({
      next: () => {},
      error: (err: any) => {
        capturedError = err;
      },
    });

    const req = httpTesting.expectOne('/api/events/search');
    req.flush('Too many requests', { status: 429, statusText: 'Too Many Requests' });

    expect(capturedError).not.toBeNull();
    expect(capturedError.statusCode).toBe(429);
    expect(feedbackServiceMock.showError).toHaveBeenCalledWith(
      'Too many attempts. Please wait a moment before trying again.'
    );
  });

  it('should handle 0 Network/CORS failure with clear connectivity message', () => {
    let capturedError: any = null;
    httpClient.get('/api/events').subscribe({
      next: () => {},
      error: (err: any) => {
        capturedError = err;
      },
    });

    const req = httpTesting.expectOne('/api/events');
    req.error(new ProgressEvent('error'));

    expect(capturedError).not.toBeNull();
    expect(capturedError.statusCode).toBe(0);
    expect(feedbackServiceMock.showError).toHaveBeenCalledWith(
      'Unable to connect to the server. Please check your network connection and try again.'
    );
  });
});
