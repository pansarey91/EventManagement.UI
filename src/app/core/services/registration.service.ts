import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  RegistrationDto,
  CreateRegistrationDto,
  RegistrationQueryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class RegistrationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/registrations`;

  /**
   * Retrieves paginated registrations with optional filtering (scoped server-side).
   */
  getAll(query?: RegistrationQueryDto): Observable<PagedResultDto<RegistrationDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber != null) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize != null) params = params.set('pageSize', query.pageSize.toString());
      if (query.search?.trim()) params = params.set('search', query.search.trim());
      if (query.userId) params = params.set('userId', query.userId);
      if (query.eventId) params = params.set('eventId', query.eventId);
      if (query.status != null) params = params.set('status', query.status.toString());
      if (query.fromDate) params = params.set('fromDate', query.fromDate);
      if (query.toDate) params = params.set('toDate', query.toDate);
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);
    }

    return this.http.get<PagedResultDto<RegistrationDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves a single registration by ID (Owner, Event Organizer, or Admin).
   */
  getById(id: string): Observable<RegistrationDto> {
    return this.http.get<RegistrationDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves all registrations made by a specific user.
   */
  getByUserId(userId: string): Observable<RegistrationDto[]> {
    return this.http.get<RegistrationDto[]>(`${this.apiUrl}/user/${userId}`);
  }

  /**
   * Retrieves all registrations for an event (Organizer or Admin).
   */
  getByEventId(eventId: string): Observable<RegistrationDto[]> {
    return this.http.get<RegistrationDto[]>(`${this.apiUrl}/event/${eventId}`);
  }

  /**
   * Creates a new registration and atomically reduces ticket inventory on the backend.
   */
  create(dto: CreateRegistrationDto): Observable<RegistrationDto> {
    return this.http.post<RegistrationDto>(this.apiUrl, dto);
  }

  /**
   * Cancels a registration and atomically restores ticket inventory on the backend.
   */
  cancel(id: string): Observable<RegistrationDto> {
    return this.http.patch<RegistrationDto>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
