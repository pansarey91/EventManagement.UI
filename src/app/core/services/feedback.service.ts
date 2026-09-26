import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  FeedbackDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  FeedbackQueryDto,
  EventFeedbackSummaryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Submits a new feedback and rating for an event.
   */
  create(dto: CreateFeedbackDto): Observable<FeedbackDto> {
    return this.http.post<FeedbackDto>(`${this.baseUrl}/feedback`, dto);
  }

  /**
   * Updates an existing feedback's rating and comment.
   */
  update(id: string, dto: UpdateFeedbackDto): Observable<FeedbackDto> {
    return this.http.put<FeedbackDto>(`${this.baseUrl}/feedback/${id}`, dto);
  }

  /**
   * Deletes a feedback by ID.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/feedback/${id}`);
  }

  /**
   * Retrieves a feedback record by ID.
   */
  getById(id: string): Observable<FeedbackDto> {
    return this.http.get<FeedbackDto>(`${this.baseUrl}/feedback/${id}`);
  }

  /**
   * Retrieves paginated feedback for a specific event with optional rating filter, search, and sorting.
   */
  getByEventId(
    eventId: string,
    query?: FeedbackQueryDto
  ): Observable<PagedResultDto<FeedbackDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber !== undefined) {
        params = params.set('pageNumber', query.pageNumber.toString());
      }
      if (query.pageSize !== undefined) {
        params = params.set('pageSize', query.pageSize.toString());
      }
      if (query.rating !== undefined) {
        params = params.set('rating', query.rating.toString());
      }
      if (query.minRating !== undefined) {
        params = params.set('minRating', query.minRating.toString());
      }
      if (query.maxRating !== undefined) {
        params = params.set('maxRating', query.maxRating.toString());
      }
      if (query.search?.trim()) {
        params = params.set('search', query.search.trim());
      }
      if (query.sortBy?.trim()) {
        params = params.set('sortBy', query.sortBy.trim());
      }
      if (query.sortDescending !== undefined) {
        params = params.set('sortDescending', query.sortDescending.toString());
      }
    }

    return this.http.get<PagedResultDto<FeedbackDto>>(
      `${this.baseUrl}/events/${eventId}/feedback`,
      { params }
    );
  }

  /**
   * Retrieves the aggregate rating summary and star distribution for an event.
   */
  getRatingSummary(eventId: string): Observable<EventFeedbackSummaryDto> {
    return this.http.get<EventFeedbackSummaryDto>(
      `${this.baseUrl}/events/${eventId}/rating-summary`
    );
  }

  /**
   * Retrieves the authenticated user's feedback for a specific event, if any.
   * Returns null if no feedback has been submitted (HTTP 404).
   */
  getMyFeedbackForEvent(eventId: string): Observable<FeedbackDto | null> {
    return this.http
      .get<FeedbackDto>(`${this.baseUrl}/events/${eventId}/feedback/my-feedback`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          return throwError(() => error);
        })
      );
  }

  /**
   * Retrieves all feedback submitted by the authenticated user across events.
   */
  getMyFeedback(): Observable<FeedbackDto[]> {
    return this.http.get<FeedbackDto[]>(`${this.baseUrl}/feedback/my-feedback`);
  }
}
