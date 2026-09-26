import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';
import { AuthResponseDto, CurrentUserDto } from '../../core/models';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Auth Workflow Integration Tests', () => {
  let authService: AuthService;
  let httpTesting: HttpTestingController;

  // Generate a valid future JWT payload
  const createMockToken = (roles: string[] = ['Attendee']): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: 'usr-12345',
      email: 'user@eventsync.com',
      role: roles,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in future
    }));
    return `${header}.${payload}.mockSignature`;
  };

  const mockUser: CurrentUserDto = {
    id: 'usr-12345',
    firstName: 'Dev',
    lastName: 'Tester',
    email: 'user@eventsync.com',
    phoneNumber: '555-123-4567',
    isActive: true,
    roles: ['Attendee', 'Organizer'],
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    authService = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('should complete full login lifecycle and update authenticated reactive state', () => {
    const validToken = createMockToken(['Attendee', 'Organizer']);
    const mockAuthResponse: AuthResponseDto = {
      accessToken: validToken,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: mockUser,
      roles: ['Attendee', 'Organizer'],
    };

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.currentUser()).toBeNull();

    authService.login({ email: 'user@eventsync.com', password: 'Password123!' }).subscribe((res) => {
      expect(res.accessToken).toBe(validToken);
      expect(res.user.email).toBe('user@eventsync.com');
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockAuthResponse);

    // Verify signals updated
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.token()).toBe(validToken);
    expect(authService.currentUser()?.id).toBe('usr-12345');
    expect(authService.userFullName()).toBe('Dev Tester');
    expect(authService.isOrganizer()).toBe(true);
    expect(authService.isAdmin()).toBe(false);

    // Verify localStorage persistence
    expect(localStorage.getItem(environment.tokenStorageKey)).toBe(validToken);
    expect(JSON.parse(localStorage.getItem(environment.userStorageKey)!)).toEqual(mockUser);
  });

  it('should clear all session and storage on logout', () => {
    const validToken = createMockToken(['Admin']);
    authService['setSession']({
      accessToken: validToken,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { ...mockUser, roles: ['Admin'] },
      roles: ['Admin'],
    });

    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.isAdmin()).toBe(true);

    authService.logout();

    expect(authService.isAuthenticated()).toBe(false);
    expect(authService.token()).toBeNull();
    expect(authService.currentUser()).toBeNull();
    expect(authService.roles()).toEqual([]);
    expect(localStorage.getItem(environment.tokenStorageKey)).toBeNull();
    expect(localStorage.getItem(environment.userStorageKey)).toBeNull();
  });

  it('should detect role-based permissions correctly', () => {
    const adminToken = createMockToken(['Admin', 'Organizer']);
    authService['setSession']({
      accessToken: adminToken,
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: { ...mockUser, roles: ['Admin', 'Organizer'] },
      roles: ['Admin', 'Organizer'],
    });

    expect(authService.hasRole('Admin')).toBe(true);
    expect(authService.hasRole('Organizer')).toBe(true);
    expect(authService.hasRole('Staff')).toBe(false);
    expect(authService.hasAnyRole(['Staff', 'Admin'])).toBe(true);
    expect(authService.hasAnyRole(['Moderator', 'VIP'])).toBe(false);
  });

  it('should load current user from /auth/me and synchronize state', () => {
    const validToken = createMockToken(['Attendee']);
    authService['token'].set(validToken);

    authService.loadCurrentUser().subscribe((user) => {
      expect(user.id).toBe(mockUser.id);
      expect(user.email).toBe(mockUser.email);
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    expect(authService.currentUser()).toEqual(mockUser);
    expect(localStorage.getItem(environment.userStorageKey)).toBeTruthy();
  });
});
