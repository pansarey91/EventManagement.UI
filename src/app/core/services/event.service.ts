import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EventDto,
  PublicEventDto,
  PublicEventDetailsDto,
  CreateEventDto,
  UpdateEventDto,
  EventQueryDto,
  EventDiscoveryQueryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/events`;

  /**
   * Discovers public events with search, category/venue filters, pricing, and pagination.
   */
  discover(query?: EventDiscoveryQueryDto): Observable<PagedResultDto<PublicEventDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber != null) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize != null) params = params.set('pageSize', query.pageSize.toString());
      if (query.search?.trim()) params = params.set('search', query.search.trim());
      if (query.categoryId) params = params.set('categoryId', query.categoryId);
      if (query.venueId) params = params.set('venueId', query.venueId);
      if (query.organizerId) params = params.set('organizerId', query.organizerId);
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);
      if (query.upcomingOnly != null) params = params.set('upcomingOnly', String(query.upcomingOnly));
      if (query.minPrice != null) params = params.set('minPrice', query.minPrice.toString());
      if (query.maxPrice != null) params = params.set('maxPrice', query.maxPrice.toString());
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);
    }

    return this.http.get<PagedResultDto<PublicEventDto>>(`${this.apiUrl}/discover`, { params });
  }

  /**
   * Retrieves public details of an event by ID (including public ticket types and schedule).
   */
  getPublicDetails(id: string): Observable<PublicEventDetailsDto> {
    return this.http.get<PublicEventDetailsDto>(`${this.apiUrl}/${id}/public`);
  }

  /**
   * Gets all events with management filters (automatically scoped to current organizer if not admin).
   */
  getAll(query?: EventQueryDto): Observable<PagedResultDto<EventDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber != null) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize != null) params = params.set('pageSize', query.pageSize.toString());
      if (query.search?.trim()) params = params.set('search', query.search.trim());
      if (query.categoryId) params = params.set('categoryId', query.categoryId);
      if (query.venueId) params = params.set('venueId', query.venueId);
      if (query.organizerId) params = params.set('organizerId', query.organizerId);
      if (query.status != null) params = params.set('status', query.status.toString());
      if (query.fromDate) params = params.set('fromDate', query.fromDate);
      if (query.toDate) params = params.set('toDate', query.toDate);
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);
    }

    return this.http.get<PagedResultDto<EventDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves an event by ID (management model).
   */
  getById(id: string): Observable<EventDto> {
    return this.http.get<EventDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new event (Organizer or Admin).
   */
  create(dto: CreateEventDto): Observable<EventDto> {
    return this.http.post<EventDto>(this.apiUrl, dto);
  }

  /**
   * Updates an existing event (Event Owner Organizer or Admin).
   */
  update(id: string, dto: UpdateEventDto): Observable<EventDto> {
    return this.http.put<EventDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes an event (Event Owner Organizer or Admin).
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Publishes a draft event.
   */
  publish(id: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${this.apiUrl}/${id}/publish`, {});
  }

  /**
   * Starts a published event when scheduled time arrives.
   */
  start(id: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${this.apiUrl}/${id}/start`, {});
  }

  /**
   * Marks an ongoing or ended event as completed.
   */
  complete(id: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${this.apiUrl}/${id}/complete`, {});
  }

  /**
   * Cancels an event.
   */
  cancel(id: string): Observable<EventDto> {
    return this.http.post<EventDto>(`${this.apiUrl}/${id}/cancel`, {});
  }
}
