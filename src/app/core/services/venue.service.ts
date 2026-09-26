import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  VenueDto,
  CreateVenueDto,
  UpdateVenueDto,
  VenueQueryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class VenueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/venues`;

  /**
   * Retrieves paginated venues with optional searching, city/status filtering, and sorting.
   */
  getAll(query?: VenueQueryDto): Observable<PagedResultDto<VenueDto>> {
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
      if (query.city && query.city.trim()) {
        params = params.set('city', query.city.trim());
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

    return this.http.get<PagedResultDto<VenueDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves a single venue by ID.
   */
  getById(id: string): Observable<VenueDto> {
    return this.http.get<VenueDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new venue (Admin only).
   */
  create(dto: CreateVenueDto): Observable<VenueDto> {
    return this.http.post<VenueDto>(this.apiUrl, dto);
  }

  /**
   * Updates an existing venue (Admin only).
   */
  update(id: string, dto: UpdateVenueDto): Observable<VenueDto> {
    return this.http.put<VenueDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes a venue by ID (Admin only).
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
