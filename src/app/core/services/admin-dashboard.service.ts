import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminDashboardDto,
  EventAnalyticsListDto,
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
export class AdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  /**
   * Retrieves comprehensive platform-wide admin dashboard metrics with optional date range filtering.
   */
  getAdminDashboard(startDate?: string, endDate?: string): Observable<AdminDashboardDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<AdminDashboardDto>(`${this.baseUrl}/admin`, { params });
  }

  /**
   * Retrieves overall system-wide overview statistics.
   */
  getOverview(): Observable<DashboardOverviewDto> {
    return this.http.get<DashboardOverviewDto>(`${this.baseUrl}/overview`);
  }

  /**
   * Retrieves analytics for events across all organizers with optional filters.
   */
  getEventsAnalytics(
    startDate?: string,
    endDate?: string,
    status?: EventStatus,
    categoryId?: string,
    organizerId?: string
  ): Observable<EventAnalyticsListDto[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (status !== undefined) params = params.set('status', status.toString());
    if (categoryId) params = params.set('categoryId', categoryId);
    if (organizerId) params = params.set('organizerId', organizerId);

    return this.http.get<EventAnalyticsListDto[]>(`${this.baseUrl}/events`, { params });
  }

  /**
   * Retrieves top-performing events system-wide.
   */
  getTopEvents(limit: number = 5): Observable<TopEventDto[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<TopEventDto[]>(`${this.baseUrl}/top-events`, { params });
  }

  /**
   * Retrieves the system-wide revenue report.
   */
  getRevenueReport(startDate?: string, endDate?: string, eventId?: string): Observable<RevenueReportDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<RevenueReportDto>(`${this.baseUrl}/reports/revenue`, { params });
  }

  /**
   * Retrieves the system-wide registration report.
   */
  getRegistrationReport(startDate?: string, endDate?: string, eventId?: string): Observable<RegistrationReportDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<RegistrationReportDto>(`${this.baseUrl}/reports/registration`, { params });
  }

  /**
   * Retrieves the system-wide attendance report.
   */
  getAttendanceReport(startDate?: string, endDate?: string, eventId?: string): Observable<AttendanceReportDto> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    if (eventId) params = params.set('eventId', eventId);

    return this.http.get<AttendanceReportDto>(`${this.baseUrl}/reports/attendance`, { params });
  }
}
