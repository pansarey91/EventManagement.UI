import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EventCategoryDto,
  CreateEventCategoryDto,
  UpdateEventCategoryDto,
  EventCategoryQueryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/eventcategories`;

  /**
   * Retrieves paginated event categories with optional search, status filtering, and sorting.
   */
  getAll(query?: EventCategoryQueryDto): Observable<PagedResultDto<EventCategoryDto>> {
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
    }

    return this.http.get<PagedResultDto<EventCategoryDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves a single event category by unique ID.
   */
  getById(id: string): Observable<EventCategoryDto> {
    return this.http.get<EventCategoryDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new event category (Admin only).
   */
  create(dto: CreateEventCategoryDto): Observable<EventCategoryDto> {
    return this.http.post<EventCategoryDto>(this.apiUrl, dto);
  }

  /**
   * Updates an existing event category (Admin only).
   */
  update(id: string, dto: UpdateEventCategoryDto): Observable<EventCategoryDto> {
    return this.http.put<EventCategoryDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes an event category (Admin only).
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
