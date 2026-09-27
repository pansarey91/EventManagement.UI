import { PagedRequest } from './common.model';

/**
 * Role data transfer object returned by the ASP.NET Core API.
 */
export interface RoleDto {
  id: string;
  name: string;
  description?: string | null;
  userCount?: number;
  createdAt: string;
  updatedAt?: string | null;
}

/**
 * Payload for POST /api/roles.
 */
export interface CreateRoleDto {
  name: string;
  description?: string | null;
}

/**
 * Payload for PUT /api/roles/{id}.
 */
export interface UpdateRoleDto {
  name: string;
  description?: string | null;
}

/**
 * Query parameters for GET /api/roles.
 */
export interface RoleQueryDto extends PagedRequest {
  // Inherits pageNumber, pageSize, search, sortBy, sortDescending, sortDirection
}
