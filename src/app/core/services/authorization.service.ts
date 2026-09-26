import { Injectable, computed, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { AppRole } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthorizationService {
  private readonly authService = inject(AuthService);

  /**
   * Reactive signal representing all roles assigned to the currently authenticated user.
   * Derived from the currentUser state with fallback to decoded JWT claims.
   */
  readonly roles = computed<string[]>(() => {
    if (!this.authService.isAuthenticated()) {
      return [];
    }

    const userRoles = this.authService.currentUser()?.roles;
    if (userRoles && userRoles.length > 0) {
      return userRoles;
    }

    // Fallback: extract role claims directly from decoded JWT token
    const token = this.authService.token();
    if (!token) return [];

    const payload = this.authService.parseJwt(token);
    if (!payload) return [];

    const rawRole =
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
      payload['role'] ??
      payload['roles'];

    if (Array.isArray(rawRole)) {
      return rawRole.map((r) => String(r).trim());
    }
    if (typeof rawRole === 'string' && rawRole.trim().length > 0) {
      return [rawRole.trim()];
    }

    return [];
  });

  readonly isAuthenticated = this.authService.isAuthenticated;

  readonly isAdmin = computed(() => this.hasRole('Admin'));
  readonly isOrganizer = computed(() => this.hasRole('Organizer'));
  readonly isStaff = computed(() => this.hasRole('Staff'));
  readonly isAttendee = computed(() =>
    this.hasRole('Attendee') || this.hasRole('User') || (this.isAuthenticated() && !this.isAdmin() && !this.isOrganizer() && !this.isStaff())
  );

  /**
   * Performs a case-insensitive check whether the current user has the specified role.
   */
  hasRole(role: AppRole | string): boolean {
    if (!role) return false;
    const target = role.trim().toLowerCase();
    return this.roles().some((r) => r.trim().toLowerCase() === target);
  }

  /**
   * Returns true if the user possesses at least one of the specified roles.
   */
  hasAnyRole(roles: (AppRole | string)[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.some((r) => this.hasRole(r));
  }

  /**
   * Returns true if the user possesses all of the specified roles.
   */
  hasAllRoles(roles: (AppRole | string)[]): boolean {
    if (!roles || roles.length === 0) return false;
    return roles.every((r) => this.hasRole(r));
  }

  /**
   * Determines whether the current user is the owner of a given resource.
   */
  isOwner(ownerId?: string | null): boolean {
    if (!ownerId) return false;
    const currentUserId = this.authService.getUserId();
    return !!currentUserId && currentUserId.toLowerCase() === ownerId.trim().toLowerCase();
  }

  /**
   * Evaluates if the user has permission to manage (edit, publish, cancel, delete) an event.
   * Admins can manage all events. Organizers can only manage events they own.
   */
  canManageEvent(eventOrOrganizerId?: { organizerId?: string } | string | null): boolean {
    if (!this.isAuthenticated()) return false;
    if (this.isAdmin()) return true;

    if (!this.isOrganizer()) return false;

    const organizerId =
      typeof eventOrOrganizerId === 'string'
        ? eventOrOrganizerId
        : eventOrOrganizerId?.organizerId;

    return this.isOwner(organizerId);
  }

  /**
   * Evaluates whether the user can access check-in scanning tools.
   */
  canCheckIn(): boolean {
    return this.hasAnyRole(['Admin', 'Organizer', 'Staff']);
  }

  /**
   * Determines the appropriate landing route upon login based on role hierarchy.
   */
  getLandingRoute(): string {
    if (this.isAdmin()) {
      return '/admin/dashboard';
    }
    if (this.isOrganizer()) {
      return '/organizer/dashboard';
    }
    if (this.isStaff()) {
      return '/organizer/check-in';
    }
    return '/events';
  }
}
