import { PagedRequest } from './common.model';

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface UserProfileDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt?: string | null;
}

export interface UpdateProfileDto {
  firstName: string;
  lastName: string;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  isActive: boolean;
}

export interface UpdateUserStatusDto {
  isActive: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export type { RoleDto } from './role.model';

export interface UserQueryDto extends PagedRequest {
  isActive?: boolean;
  roleId?: string;
}
