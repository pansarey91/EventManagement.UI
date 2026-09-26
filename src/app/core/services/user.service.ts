import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangePasswordDto,
  PagedResultDto,
  UpdateProfileDto,
  UpdateUserStatusDto,
  UserDto,
  UserProfileDto,
  UserQueryDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/users`;

  /**
   * Retrieves the authenticated user's profile details.
   */
  getMyProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.apiUrl}/me`);
  }

  /**
   * Updates the authenticated user's profile information.
   */
  updateMyProfile(dto: UpdateProfileDto): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.apiUrl}/me`, dto);
  }

  /**
   * Changes the authenticated user's password.
   */
  changePassword(dto: ChangePasswordDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, dto);
  }

  /**
   * Retrieves paginated users with optional search, status filtering, and sorting (Admin only).
   */
  getUsers(query?: UserQueryDto): Observable<PagedResultDto<UserDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber != null) {
        params = params.set('pageNumber', query.pageNumber.toString());
      }
      if (query.pageSize != null) {
        params = params.set('pageSize', query.pageSize.toString());
      }
      if (query.search && query.search.trim()) {
        params = params.set('search', query.search.trim());
      }
      if (query.sortBy) {
        params = params.set('sortBy', query.sortBy);
      }
      if (query.sortDirection) {
        params = params.set('sortDirection', query.sortDirection);
      }
      if (query.isActive !== undefined && query.isActive !== null) {
        params = params.set('isActive', String(query.isActive));
      }
      if (query.roleId) {
        params = params.set('roleId', query.roleId);
      }
    }

    return this.http.get<PagedResultDto<UserDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves a single user by ID (Self or Admin).
   */
  getUserById(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Activates or deactivates a user account (Admin only).
   */
  updateUserStatus(id: string, dto: UpdateUserStatusDto): Observable<UserDto> {
    return this.http.patch<UserDto>(`${this.apiUrl}/${id}/status`, dto);
  }

  /**
   * Assigns a role to a user (Admin only).
   */
  assignRole(userId: string, roleId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${userId}/roles/${roleId}`, {});
  }

  /**
   * Removes an assigned role from a user (Admin only).
   */
  removeRole(userId: string, roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/roles/${roleId}`);
  }
}
