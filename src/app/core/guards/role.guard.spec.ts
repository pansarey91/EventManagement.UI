import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthorizationService } from '../services/authorization.service';

describe('roleGuard', () => {
  let router: Router;
  let authMock: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasAnyRole: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authMock = {
      isAuthenticated: vi.fn(),
      hasAnyRole: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthorizationService, useValue: authMock },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('should redirect unauthenticated visitor to /login with returnUrl', () => {
    authMock.isAuthenticated.mockReturnValue(false);

    const guard = roleGuard(['Admin']);
    const mockRoute: any = {};
    const mockState: any = { url: '/admin/dashboard' };

    const result = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/login?returnUrl=%2Fadmin%2Fdashboard');
  });

  it('should redirect authenticated user lacking role to /forbidden', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    authMock.hasAnyRole.mockReturnValue(false);

    const guard = roleGuard(['Admin']);
    const mockRoute: any = {};
    const mockState: any = { url: '/admin/dashboard' };

    const result = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/forbidden');
    expect(authMock.hasAnyRole).toHaveBeenCalledWith(['Admin']);
  });

  it('should allow access when authenticated user possesses at least one allowed role', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    authMock.hasAnyRole.mockReturnValue(true);

    const guard = roleGuard(['Organizer', 'Admin']);
    const mockRoute: any = {};
    const mockState: any = { url: '/organizer/dashboard' };

    const result = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

    expect(result).toBe(true);
  });

  it('should read roles from route.data when not passed to guard factory', () => {
    authMock.isAuthenticated.mockReturnValue(true);
    authMock.hasAnyRole.mockReturnValue(true);

    const guard = roleGuard();
    const mockRoute: any = { data: { roles: ['Staff', 'Organizer'] } };
    const mockState: any = { url: '/organizer/check-in' };

    const result = TestBed.runInInjectionContext(() => guard(mockRoute, mockState));

    expect(result).toBe(true);
    expect(authMock.hasAnyRole).toHaveBeenCalledWith(['Staff', 'Organizer']);
  });
});
