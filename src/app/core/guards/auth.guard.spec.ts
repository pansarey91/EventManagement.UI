import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
  let router: Router;
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    token: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: vi.fn(),
      token: vi.fn(),
      logout: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should allow access if user is authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const mockRoute: any = {};
      const mockState: any = { url: '/profile' };

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect to /login with returnUrl if user is not authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      authServiceMock.token.mockReturnValue(null);

      const mockRoute: any = {};
      const mockState: any = { url: '/profile' };

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toContain('/login?returnUrl=%2Fprofile');
    });

    it('should purge expired token and redirect if token exists but isAuthenticated is false', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);
      authServiceMock.token.mockReturnValue('expired-token');

      const mockRoute: any = {};
      const mockState: any = { url: '/organizer/dashboard' };

      const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toContain('/login?returnUrl=%2Forganizer%2Fdashboard');
    });
  });

  describe('guestGuard', () => {
    it('should allow navigation if user is not authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(false);

      const mockRoute: any = {};
      const mockState: any = { url: '/login' };

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result).toBe(true);
    });

    it('should redirect to /events if user is already authenticated', () => {
      authServiceMock.isAuthenticated.mockReturnValue(true);

      const mockRoute: any = {};
      const mockState: any = { url: '/login' };

      const result = TestBed.runInInjectionContext(() => guestGuard(mockRoute, mockState));
      expect(result instanceof UrlTree).toBe(true);
      expect((result as UrlTree).toString()).toBe('/events');
    });
  });
});
