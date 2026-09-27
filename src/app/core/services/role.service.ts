import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RoleDto,
  CreateRoleDto,
  UpdateRoleDto,
  RoleQueryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/roles`;

  /**
   * Retrieves paginated roles with optional search and sorting. (Admin only)
   */
  getRoles(query?: RoleQueryDto): Observable<PagedResultDto<RoleDto>> {
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
    }

    return this.http.get<PagedResultDto<RoleDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves a single role by ID. (Admin only)
   */
  getRoleById(id: string): Observable<RoleDto> {
    return this.http.get<RoleDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new role. (Admin only)
   */
  createRole(dto: CreateRoleDto): Observable<RoleDto> {
    return this.http.post<RoleDto>(this.apiUrl, dto);
  }

  /**
   * Updates an existing role. (Admin only)
   */
  updateRole(id: string, dto: UpdateRoleDto): Observable<RoleDto> {
    return this.http.put<RoleDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes a role by ID. (Admin only)
   */
  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
