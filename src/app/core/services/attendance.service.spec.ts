import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AttendanceService } from './attendance.service';
import { environment } from '../../../environments/environment';
import {
  AttendanceDto,
  CheckInDto,
  AttendanceSummaryDto,
  PagedResultDto,
} from '../models';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let httpMock: HttpTestingController;

  const mockAttendance: AttendanceDto = {
    id: 'att-1',
    eventTicketId: 'tkt-1',
    ticketNumber: 'TKT-20261015-ABC12345',
    registrationId: 'reg-1',
    registrationNumber: 'REG-20261015-TEST1234',
    eventId: 'event-1',
    eventName: 'Tech Con 2026',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    checkedInById: 'checker-1',
    checkedInByName: 'Admin User',
    checkedInAt: '2026-09-13T10:30:00Z',
    createdAt: '2026-09-13T10:30:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AttendanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform check-in with QR token', () => {
    const dto: CheckInDto = {
      eventId: 'event-1',
      qrToken: 'test-qr-token',
    };

    service.checkIn(dto).subscribe((result) => {
      expect(result).toEqual(mockAttendance);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/attendance/check-in`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockAttendance);
  });

  it('should get attendance by ID', () => {
    service.getById('att-1').subscribe((result) => {
      expect(result).toEqual(mockAttendance);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/attendance/att-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAttendance);
  });

  it('should get paginated attendance by event ID with query params', () => {
    const mockPagedResult: PagedResultDto<AttendanceDto> = {
      items: [mockAttendance],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    service
      .getByEventId('event-1', {
        pageNumber: 1,
        pageSize: 10,
        search: 'John',
        sortBy: 'checkedInAt',
        sortDescending: true,
      })
      .subscribe((result) => {
        expect(result).toEqual(mockPagedResult);
      });

    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiBaseUrl}/events/event-1/attendance` &&
      r.params.get('search') === 'John' &&
      r.params.get('pageNumber') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);
  });

  it('should get attendance summary for an event', () => {
    const mockSummary: AttendanceSummaryDto = {
      eventId: 'event-1',
      eventName: 'Tech Con 2026',
      totalTickets: 100,
      checkedInCount: 65,
      remainingCount: 35,
      checkInPercentage: 65.0,
    };

    service.getSummary('event-1').subscribe((result) => {
      expect(result).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/events/event-1/attendance/summary`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should get attendance records by user ID', () => {
    service.getByUserId('user-1').subscribe((result) => {
      expect(result).toEqual([mockAttendance]);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/user-1/attendance`);
    expect(req.request.method).toBe('GET');
    req.flush([mockAttendance]);
  });
});
