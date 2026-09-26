import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: {
    token: ReturnType<typeof vi.fn>;
    isTokenExpired: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      token: vi.fn(),
      isTokenExpired: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should attach Authorization Bearer header when token is valid and not expired', () => {
    authServiceMock.token.mockReturnValue('valid-bearer-token');
    authServiceMock.isTokenExpired.mockReturnValue(false);

    http.get('/api/events').subscribe();

    const req = httpMock.expectOne('/api/events');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-bearer-token');
    req.flush({});
  });

  it('should NOT attach Authorization header when token is expired', () => {
    authServiceMock.token.mockReturnValue('expired-token');
    authServiceMock.isTokenExpired.mockReturnValue(true);

    http.get('/api/events').subscribe();

    const req = httpMock.expectOne('/api/events');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should NOT attach Authorization header when token is null', () => {
    authServiceMock.token.mockReturnValue(null);

    http.get('/api/events').subscribe();

    const req = httpMock.expectOne('/api/events');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
