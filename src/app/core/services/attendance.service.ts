import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttendanceDto,
  CheckInDto,
  AttendanceQueryDto,
  AttendanceSummaryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Performs an attendee check-in via QR token, ticket number, ticket ID, or registration ID.
   */
  checkIn(dto: CheckInDto): Observable<AttendanceDto> {
    return this.http.post<AttendanceDto>(`${this.baseUrl}/attendance/check-in`, dto);
  }

  /**
   * Retrieves an attendance record by ID.
   */
  getById(id: string): Observable<AttendanceDto> {
    return this.http.get<AttendanceDto>(`${this.baseUrl}/attendance/${id}`);
  }

  /**
   * Retrieves paginated attendance records for a specific event with search and filtering.
   */
  getByEventId(
    eventId: string,
    query?: AttendanceQueryDto
  ): Observable<PagedResultDto<AttendanceDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber !== undefined) {
        params = params.set('pageNumber', query.pageNumber.toString());
      }
      if (query.pageSize !== undefined) {
        params = params.set('pageSize', query.pageSize.toString());
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
      if (query.checkedInById) {
        params = params.set('checkedInById', query.checkedInById);
      }
      if (query.fromDate) {
        params = params.set('fromDate', query.fromDate);
      }
      if (query.toDate) {
        params = params.set('toDate', query.toDate);
      }
    }

    return this.http.get<PagedResultDto<AttendanceDto>>(
      `${this.baseUrl}/events/${eventId}/attendance`,
      { params }
    );
  }

  /**
   * Retrieves aggregated attendance statistics for a specific event.
   */
  getSummary(eventId: string): Observable<AttendanceSummaryDto> {
    return this.http.get<AttendanceSummaryDto>(
      `${this.baseUrl}/events/${eventId}/attendance/summary`
    );
  }

  /**
   * Retrieves all attendance history for a specific attendee.
   */
  getByUserId(userId: string): Observable<AttendanceDto[]> {
    return this.http.get<AttendanceDto[]>(`${this.baseUrl}/users/${userId}/attendance`);
  }
}
