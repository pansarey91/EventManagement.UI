/**
 * Payload for POST /api/auth/login.
 */
export interface LoginDto {
  email: string;
  password: string;
}

/**
 * Payload for POST /api/auth/register.
 */
export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

/**
 * Response from POST /api/auth/login and POST /api/auth/register.
 */
export interface AuthResponseDto {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: CurrentUserDto;
  roles: string[];
}

/**
 * User profile returned by GET /api/auth/me.
 */
export interface CurrentUserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  isActive: boolean;
  roles: string[];
}

/**
 * System roles supported by the backend ASP.NET Core API.
 */
export type AppRole = 'Admin' | 'Organizer' | 'Staff' | 'Attendee';

export const APP_ROLES = {
  Admin: 'Admin' as const,
  Organizer: 'Organizer' as const,
  Staff: 'Staff' as const,
  Attendee: 'Attendee' as const,
};
