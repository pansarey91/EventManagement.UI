import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrganizerDashboardService } from './organizer-dashboard.service';
import { environment } from '../../../environments/environment';
import { EventStatus, OrganizerDashboardDto } from '../models';

describe('OrganizerDashboardService', () => {
  let service: OrganizerDashboardService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/dashboard`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OrganizerDashboardService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(OrganizerDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch organizer dashboard metrics with date query parameters', () => {
    const mockDashboard: Partial<OrganizerDashboardDto> = {
      totalEvents: 5,
      totalRegistrations: 42,
      totalRevenue: 1500
    };

    service.getOrganizerDashboard('2026-01-01', '2026-06-01').subscribe((data) => {
      expect(data.totalEvents).toBe(5);
      expect(data.totalRevenue).toBe(1500);
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/organizer` &&
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

  it('should fetch event analytics list with filters', () => {
    service.getEventsAnalytics('2026-01-01', '2026-12-31', EventStatus.Published, 'cat-1').subscribe((events) => {
      expect(events.length).toBe(1);
      expect(events[0].eventName).toBe('Concert');
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/events` &&
      r.params.get('startDate') === '2026-01-01' &&
      r.params.get('status') === EventStatus.Published.toString() &&
      r.params.get('categoryId') === 'cat-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ eventId: 'e-1', eventName: 'Concert' }]);
  });

  it('should fetch event analytics by id', () => {
    service.getEventAnalytics('e-123').subscribe((data) => {
      expect(data.eventId).toBe('e-123');
    });

    const req = httpMock.expectOne(`${baseUrl}/events/e-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ eventId: 'e-123', eventName: 'Tech Summit' });
  });

  it('should fetch top events with limit parameter', () => {
    service.getTopEvents(3).subscribe((top) => {
      expect(top.length).toBe(1);
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/top-events` &&
      r.params.get('limit') === '3'
    );
    expect(req.request.method).toBe('GET');
    req.flush([{ eventId: 'e-1', eventName: 'Top 1' }]);
  });

  it('should fetch revenue report with optional filters', () => {
    service.getRevenueReport('2026-01-01', '2026-06-01', 'e-1').subscribe((report) => {
      expect(report.totalRevenue).toBe(500);
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/reports/revenue` &&
      r.params.get('eventId') === 'e-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ totalRevenue: 500, timeline: [] });
  });

  it('should fetch registration report with optional filters', () => {
    service.getRegistrationReport(undefined, undefined, 'e-1').subscribe((report) => {
      expect(report.totalRegistrations).toBe(20);
    });

    const req = httpMock.expectOne((r) =>
      r.url === `${baseUrl}/reports/registration` &&
      r.params.get('eventId') === 'e-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush({ totalRegistrations: 20, timeline: [] });
  });

  it('should fetch attendance report', () => {
    service.getAttendanceReport().subscribe((report) => {
      expect(report.totalAttendance).toBe(15);
    });

    const req = httpMock.expectOne(`${baseUrl}/reports/attendance`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalAttendance: 15 });
  });
});
