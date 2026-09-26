import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { environment } from '../../../environments/environment';
import { AdminDashboardDto } from '../models';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AdminDashboardService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AdminDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch admin dashboard metrics with date query parameters', () => {
    const mockDashboard: Partial<AdminDashboardDto> = {
      totalUsers: 150,
      totalEvents: 25,
      totalRevenue: 50000,
      totalAttendance: 320
    };

    service.getAdminDashboard('2026-01-01', '2026-06-01').subscribe((data) => {
      expect(data.totalUsers).toBe(150);
      expect(data.totalRevenue).toBe(50000);
      expect(data.totalAttendance).toBe(320);
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/admin` &&
      r.params.get('startDate') === '2026-01-01' &&
      r.params.get('endDate') === '2026-06-01'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboard);
  });

  it('should fetch overview metrics', () => {
    service.getOverview().subscribe((data) => {
      expect(data.totalEvents).toBe(10);
    });

    const req = httpMock.expectOne(`${baseUrl}/overview`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalEvents: 10 });
  });

  it('should fetch top events system-wide', () => {
    service.getTopEvents(5).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(data[0].eventName).toBe('Global Dev Summit');
    });

    const req = httpMock.expectOne(`${baseUrl}/top-events?limit=5`);
    expect(req.request.method).toBe('GET');
    req.flush([{ eventId: 'e-1', eventName: 'Global Dev Summit', registrationCount: 100, revenue: 5000, attendanceCount: 85 }]);
  });

  it('should fetch revenue report', () => {
    service.getRevenueReport('2026-01-01', '2026-03-01').subscribe((data) => {
      expect(data.totalRevenue).toBe(12500);
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/reports/revenue` &&
      r.params.get('startDate') === '2026-01-01' &&
      r.params.get('endDate') === '2026-03-01'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ totalRevenue: 12500, successfulPaymentCount: 50, pendingPaymentCount: 2, failedPaymentCount: 1, events: [], timeline: [] });
  });

  it('should fetch registration report', () => {
    service.getRegistrationReport().subscribe((data) => {
      expect(data.totalRegistrations).toBe(300);
    });

    const req = httpMock.expectOne(`${baseUrl}/reports/registration`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalRegistrations: 300, confirmedRegistrations: 280, pendingRegistrations: 10, cancelledRegistrations: 10, events: [], timeline: [] });
  });

  it('should fetch attendance report', () => {
    service.getAttendanceReport().subscribe((data) => {
      expect(data.totalAttendance).toBe(250);
    });

    const req = httpMock.expectOne(`${baseUrl}/reports/attendance`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalAttendance: 250, totalConfirmedRegistrations: 280, overallAttendanceRate: 89.29, events: [] });
  });
});
