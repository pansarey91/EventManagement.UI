import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { UiFeedbackService } from '../services/ui-feedback.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let feedbackServiceMock: {
    showError: ReturnType<typeof vi.fn>;
    showWarning: ReturnType<typeof vi.fn>;
    showSuccess: ReturnType<typeof vi.fn>;
  };
  let routerMock: {
    navigate: ReturnType<typeof vi.fn>;
    url: string;
  };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
      logout: vi.fn(),
    };
    feedbackServiceMock = {
      showError: vi.fn(),
      showWarning: vi.fn(),
      showSuccess: vi.fn(),
    };
    routerMock = {
      navigate: vi.fn(),
      url: '/protected-page',
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

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should logout and redirect on 401 for standard protected API endpoints', () => {
    authServiceMock.isAuthenticated.mockReturnValue(true);

    http.get('/api/users/me').subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(401);
      },
    });

    const req = httpMock.expectOne('/api/users/me');
    req.flush({ statusCode: 401, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(feedbackServiceMock.showWarning).toHaveBeenCalledWith('Your session has expired. Please sign in again.');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/protected-page' } });
  });

  it('should NOT logout or navigate on 401 from /api/auth/login', () => {
    authServiceMock.isAuthenticated.mockReturnValue(false);

    http.post('/api/auth/login', {}).subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Invalid email or password.');
      },
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ statusCode: 401, message: 'Invalid email or password.' }, { status: 401, statusText: 'Unauthorized' });

    expect(authServiceMock.logout).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should display rate limit message on 429 Too Many Requests', () => {
    http.get('/api/auth/login').subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(429);
      },
    });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush('Too many requests', { status: 429, statusText: 'Too Many Requests' });

    expect(feedbackServiceMock.showError).toHaveBeenCalledWith('Too many attempts. Please wait a moment before trying again.');
  });

  it('should handle status 0 network error gracefully with user-friendly message', () => {
    http.get('/api/events').subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(0);
        expect(err.message).toBe('Unable to connect to the server. Please check your network connection and try again.');
      },
    });

    const req = httpMock.expectOne('/api/events');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(feedbackServiceMock.showError).toHaveBeenCalledWith(
      'Unable to connect to the server. Please check your network connection and try again.'
    );
  });

  it('should display error message on 403 Forbidden', () => {
    http.get('/api/admin/metrics').subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(403);
      },
    });

    const req = httpMock.expectOne('/api/admin/metrics');
    req.flush(
      { statusCode: 403, message: 'You do not have permission to access admin metrics.' },
      { status: 403, statusText: 'Forbidden' }
    );

    expect(feedbackServiceMock.showError).toHaveBeenCalledWith(
      'You do not have permission to access admin metrics.'
    );
  });

  it('should display error message on 409 Conflict', () => {
    http.post('/api/attendance/check-in', {}).subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Attendee is already checked in.');
      },
    });

    const req = httpMock.expectOne('/api/attendance/check-in');
    req.flush(
      { statusCode: 409, message: 'Attendee is already checked in.' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(feedbackServiceMock.showError).toHaveBeenCalledWith('Attendee is already checked in.');
  });

  it('should extract correlation ID from X-Correlation-ID response header', () => {
    const traceId = 'test-trace-id-12345';

    http.get('/api/events/123').subscribe({
      error: (err) => {
        expect(err.correlationId).toBe(traceId);
      },
    });

    const req = httpMock.expectOne('/api/events/123');
    req.flush(
      { statusCode: 404, message: 'Event not found' },
      {
        status: 404,
        statusText: 'Not Found',
        headers: { 'X-Correlation-ID': traceId },
      }
    );
  });

  it('should not redirect to login on 401 if already on /login', () => {
    routerMock.url = '/login';
    authServiceMock.isAuthenticated.mockReturnValue(false);

    http.get('/api/data').subscribe({
      error: (err) => {
        expect(err.statusCode).toBe(401);
      },
    });

    const req = httpMock.expectOne('/api/data');
    req.flush({ statusCode: 401, message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerMock.navigate).not.toHaveBeenCalled();
  });
});
