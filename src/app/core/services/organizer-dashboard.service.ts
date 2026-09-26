import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  OrganizerDashboardDto,
  EventAnalyticsListDto,
  EventAnalyticsDto,
  TopEventDto,
  RevenueReportDto,
  RegistrationReportDto,
  AttendanceReportDto,
  DashboardOverviewDto,
  EventStatus
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class OrganizerDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  /**
   * Retrieves high-level organizer dashboard metrics with optional date range filter.
   */
  getOrganizerDashboard(startDate?: string, endDate?: string): Observable<OrganizerDashboardDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<OrganizerDashboardDto>(`${this.baseUrl}/organizer`, { params });
  }

  /**
   * Retrieves overall dashboard overview metrics.
   */
  getOverview(): Observable<DashboardOverviewDto> {
    return this.http.get<DashboardOverviewDto>(`${this.baseUrl}/overview`);
  }

  /**
   * Retrieves aggregated event analytics for all events owned by the authenticated organizer.
   */
  getEventsAnalytics(
    startDate?: string,
    endDate?: string,
    status?: EventStatus,
    categoryId?: string
  ): Observable<EventAnalyticsListDto[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (status !== undefined) params = params.set('status', status.toString());
    if (categoryId) params = params.set('categoryId', categoryId);

    return this.http.get<EventAnalyticsListDto[]>(`${this.baseUrl}/events`, { params });
  }

  /**
   * Retrieves detailed analytics for a specific event owned by the organizer.
   */
  getEventAnalytics(eventId: string): Observable<EventAnalyticsDto> {
    return this.http.get<EventAnalyticsDto>(`${this.baseUrl}/events/${eventId}`);
  }

  /**
   * Retrieves the top-performing events ranked by registrations and revenue.
   */
  getTopEvents(limit: number = 5): Observable<TopEventDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopEventDto[]>(`${this.baseUrl}/top-events`, { params });
  }

  /**
   * Retrieves the revenue report including daily timeline and event breakdowns.
   */
  getRevenueReport(startDate?: string, endDate?: string, eventId?: string): Observable<RevenueReportDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<RevenueReportDto>(`${this.baseUrl}/reports/revenue`, { params });
  }

  /**
   * Retrieves the registration report including daily timeline and event breakdowns.
   */
  getRegistrationReport(startDate?: string, endDate?: string, eventId?: string): Observable<RegistrationReportDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<RegistrationReportDto>(`${this.baseUrl}/reports/registration`, { params });
  }

  /**
   * Retrieves the attendance report including event breakdowns.
   */
  getAttendanceReport(startDate?: string, endDate?: string, eventId?: string): Observable<AttendanceReportDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<AttendanceReportDto>(`${this.baseUrl}/reports/attendance`, { params });
  }
}
