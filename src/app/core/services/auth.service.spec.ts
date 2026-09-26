import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { AuthResponseDto, CurrentUserDto, LoginDto, RegisterDto } from '../models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  // Helper to create a base64url encoded mock JWT
  function createMockJwt(payload: Record<string, any>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const body = btoa(JSON.stringify(payload))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    return `${header}.${body}.mockSignature`;
  }

  const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
  const pastExp = Math.floor(Date.now() / 1000) - 3600;   // 1 hour in past

  const validToken = createMockJwt({
    sub: 'user-123',
    email: 'test@example.com',
    exp: futureExp,
  });

  const expiredToken = createMockJwt({
    sub: 'user-123',
    email: 'test@example.com',
    exp: pastExp,
  });

  const mockUser: CurrentUserDto = {
    id: 'user-123',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'test@example.com',
    isActive: true,
    roles: ['Attendee', 'Organizer'],
  };

  const mockAuthResponse: AuthResponseDto = {
    accessToken: validToken,
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
    roles: ['Attendee', 'Organizer'],
    user: mockUser,
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

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize with null state when localStorage is empty', () => {
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(service.roles()).toEqual([]);
  });

  describe('JWT Decoding and Expiration', () => {
    it('should correctly parse valid JWT payload', () => {
      const payload = service.parseJwt(validToken);
      expect(payload).not.toBeNull();
      expect(payload?.sub).toBe('user-123');
      expect(payload?.email).toBe('test@example.com');
      expect(payload?.exp).toBe(futureExp);
    });

    it('should return null for malformed JWT strings', () => {
      expect(service.parseJwt('invalid.token')).toBeNull();
      expect(service.parseJwt('')).toBeNull();
      expect(service.parseJwt(null)).toBeNull();
    });

    it('should identify unexpired tokens as not expired', () => {
      expect(service.isTokenExpired(validToken)).toBe(false);
    });

    it('should identify past tokens as expired', () => {
      expect(service.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should treat null or undefined as expired', () => {
      expect(service.isTokenExpired(null)).toBe(true);
      expect(service.isTokenExpired(undefined)).toBe(true);
    });
  });

  describe('login()', () => {
    it('should send POST to /api/auth/login and establish session', () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      let resultResponse: AuthResponseDto | undefined;
      service.login(loginDto).subscribe((res) => {
        resultResponse = res;
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginDto);
      req.flush(mockAuthResponse);

      expect(resultResponse).toEqual(mockAuthResponse);
      expect(service.token()).toBe(validToken);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.isOrganizer()).toBe(true);
      expect(service.isAdmin()).toBe(false);
      expect(localStorage.getItem(environment.tokenStorageKey)).toBe(validToken);
      expect(localStorage.getItem(environment.userStorageKey)).toContain('Jane');
    });
  });

  describe('register()', () => {
    it('should send POST to /api/auth/register and establish session', () => {
      const registerDto: RegisterDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
      };

      let resultResponse: AuthResponseDto | undefined;
      service.register(registerDto).subscribe((res) => {
        resultResponse = res;
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerDto);
      req.flush(mockAuthResponse);

      expect(resultResponse).toEqual(mockAuthResponse);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('logout()', () => {
    it('should clear signals and remove tokens from localStorage', () => {
      // First seed a session
      service.token.set(validToken);
      service.currentUser.set(mockUser);
      localStorage.setItem(environment.tokenStorageKey, validToken);
      localStorage.setItem(environment.userStorageKey, JSON.stringify(mockUser));

      expect(service.isAuthenticated()).toBe(true);

      service.logout();

      expect(service.token()).toBeNull();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(localStorage.getItem(environment.tokenStorageKey)).toBeNull();
      expect(localStorage.getItem(environment.userStorageKey)).toBeNull();
    });
  });

  describe('Role and User helpers', () => {
    beforeEach(() => {
      service.currentUser.set({
        ...mockUser,
        roles: ['Admin', 'Organizer'],
      });
      service.token.set(validToken);
    });

    it('should correctly evaluate role checks', () => {
      expect(service.hasRole('Admin')).toBe(true);
      expect(service.hasRole('Organizer')).toBe(true);
      expect(service.hasRole('Staff')).toBe(false);
      expect(service.hasAnyRole(['Staff', 'Admin'])).toBe(true);
      expect(service.hasAnyRole(['UnknownRole'])).toBe(false);
      expect(service.isAdmin()).toBe(true);
      expect(service.isOrganizer()).toBe(true);
      expect(service.isStaff()).toBe(false);
    });

    it('should compute user full name correctly', () => {
      expect(service.userFullName()).toBe('Jane Doe');
    });

    it('should return userId from currentUser or fallback to JWT payload', () => {
      expect(service.getUserId()).toBe('user-123');
    });

    it('should return userEmail from currentUser or fallback to JWT payload', () => {
      expect(service.getUserEmail()).toBe('test@example.com');
    });
  });
});
