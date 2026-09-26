import { TestBed } from '@angular/core/testing';
import { AuthorizationService } from './authorization.service';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';
import { CurrentUserDto } from '../models';

describe('AuthorizationService', () => {
  let service: AuthorizationService;
  let authServiceMock: {
    isAuthenticated: ReturnType<typeof signal<boolean>>;
    currentUser: ReturnType<typeof signal<CurrentUserDto | null>>;
    token: ReturnType<typeof signal<string | null>>;
    parseJwt: ReturnType<typeof vi.fn>;
    getUserId: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authServiceMock = {
      isAuthenticated: signal<boolean>(false),
      currentUser: signal<CurrentUserDto | null>(null),
      token: signal<string | null>(null),
      parseJwt: vi.fn().mockReturnValue(null),
      getUserId: vi.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthorizationService,
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    service = TestBed.inject(AuthorizationService);
  });

  describe('Unauthenticated state', () => {
    it('should return empty roles and false for all role checks when unauthenticated', () => {
      authServiceMock.isAuthenticated.set(false);

      expect(service.roles()).toEqual([]);
      expect(service.isAdmin()).toBe(false);
      expect(service.isOrganizer()).toBe(false);
      expect(service.isStaff()).toBe(false);
      expect(service.isAttendee()).toBe(false);
      expect(service.hasRole('Admin')).toBe(false);
      expect(service.hasAnyRole(['Admin', 'Organizer'])).toBe(false);
      expect(service.getLandingRoute()).toBe('/events');
    });
  });

  describe('Role Evaluation and Normalization', () => {
    it('should resolve roles from currentUser state', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'user-1',
        firstName: 'Alice',
        lastName: 'Admin',
        email: 'admin@example.com',
        isActive: true,
        roles: ['Admin', 'Organizer'],
      });

      expect(service.roles()).toEqual(['Admin', 'Organizer']);
      expect(service.isAdmin()).toBe(true);
      expect(service.isOrganizer()).toBe(true);
      expect(service.isStaff()).toBe(false);
    });

    it('should fall back to JWT role claim when currentUser has no roles', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set(null);
      authServiceMock.token.set('mock-jwt-token');
      authServiceMock.parseJwt.mockReturnValue({
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': ['Organizer'],
      });

      expect(service.roles()).toEqual(['Organizer']);
      expect(service.isOrganizer()).toBe(true);
      expect(service.isAdmin()).toBe(false);
    });

    it('should handle single string role in JWT payload', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.token.set('mock-jwt-token');
      authServiceMock.parseJwt.mockReturnValue({
        role: 'Staff',
      });

      expect(service.roles()).toEqual(['Staff']);
      expect(service.isStaff()).toBe(true);
    });

    it('should perform case-insensitive role checks', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        roles: ['Organizer'],
      });

      expect(service.hasRole('organizer')).toBe(true);
      expect(service.hasRole('ORGANIZER')).toBe(true);
      expect(service.hasRole('Organizer')).toBe(true);
      expect(service.hasRole('Admin')).toBe(false);
    });

    it('should evaluate hasAnyRole correctly', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        roles: ['Staff'],
      });

      expect(service.hasAnyRole(['Admin', 'Staff'])).toBe(true);
      expect(service.hasAnyRole(['Admin', 'Organizer'])).toBe(false);
    });

    it('should evaluate hasAllRoles correctly', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        isActive: true,
        roles: ['Admin', 'Organizer'],
      });

      expect(service.hasAllRoles(['Admin', 'Organizer'])).toBe(true);
      expect(service.hasAllRoles(['Admin', 'Staff'])).toBe(false);
    });
  });

  describe('Ownership and Action Permissions', () => {
    it('should correctly evaluate isOwner', () => {
      authServiceMock.getUserId.mockReturnValue('user-100');

      expect(service.isOwner('user-100')).toBe(true);
      expect(service.isOwner('USER-100')).toBe(true);
      expect(service.isOwner('other-user')).toBe(false);
      expect(service.isOwner(null)).toBe(false);
    });

    it('should allow Admin to manage all events regardless of owner', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'admin-1',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@example.com',
        isActive: true,
        roles: ['Admin'],
      });
      authServiceMock.getUserId.mockReturnValue('admin-1');

      expect(service.canManageEvent({ organizerId: 'other-organizer' })).toBe(true);
    });

    it('should allow Organizer to manage only their own events', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'org-1',
        firstName: 'Event',
        lastName: 'Host',
        email: 'org@example.com',
        isActive: true,
        roles: ['Organizer'],
      });
      authServiceMock.getUserId.mockReturnValue('org-1');

      expect(service.canManageEvent({ organizerId: 'org-1' })).toBe(true);
      expect(service.canManageEvent({ organizerId: 'different-org' })).toBe(false);
    });

    it('should allow Admin, Organizer, and Staff to check in attendees', () => {
      authServiceMock.isAuthenticated.set(true);

      authServiceMock.currentUser.set({
        id: 's1',
        firstName: 'Staff',
        lastName: 'Member',
        email: 'staff@example.com',
        isActive: true,
        roles: ['Staff'],
      });
      expect(service.canCheckIn()).toBe(true);

      authServiceMock.currentUser.set({
        id: 'a1',
        firstName: 'Attendee',
        lastName: 'Person',
        email: 'att@example.com',
        isActive: true,
        roles: ['Attendee'],
      });
      expect(service.canCheckIn()).toBe(false);
    });
  });

  describe('getLandingRoute', () => {
    it('should prioritize Admin route first', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Multi',
        lastName: 'Role',
        email: 'multi@example.com',
        isActive: true,
        roles: ['Organizer', 'Admin'],
      });

      expect(service.getLandingRoute()).toBe('/admin/dashboard');
    });

    it('should return organizer dashboard for Organizers', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Org',
        lastName: 'Role',
        email: 'org@example.com',
        isActive: true,
        roles: ['Organizer'],
      });

      expect(service.getLandingRoute()).toBe('/organizer/dashboard');
    });

    it('should return check-in route for Staff', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Staff',
        lastName: 'Role',
        email: 'staff@example.com',
        isActive: true,
        roles: ['Staff'],
      });

      expect(service.getLandingRoute()).toBe('/organizer/check-in');
    });

    it('should return /events for Attendee or standard user', () => {
      authServiceMock.isAuthenticated.set(true);
      authServiceMock.currentUser.set({
        id: 'u1',
        firstName: 'Att',
        lastName: 'Role',
        email: 'att@example.com',
        isActive: true,
        roles: ['Attendee'],
      });

      expect(service.getLandingRoute()).toBe('/events');
    });
  });
});
