import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AttendanceService } from '../../core/services/attendance.service';
import { environment } from '../../../environments/environment';
import { AttendanceDto, CheckInDto, AttendanceSummaryDto } from '../../core/models';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Attendance Check-In Workflow Integration Tests', () => {
  let attendanceService: AttendanceService;
  let httpTesting: HttpTestingController;

  const mockAttendance: AttendanceDto = {
    id: 'att-100',
    registrationId: 'reg-001',
    eventTicketId: 'tkt-001',
    ticketNumber: 'TKT-2026-001',
    eventId: 'evt-100',
    eventName: 'Cloud Architecture Summit',
    userId: 'usr-12345',
    userName: 'Jane Attendee',
    userEmail: 'jane@example.com',
    checkedInAt: new Date().toISOString(),
    checkedInById: 'usr-org-01',
    checkedInByName: 'Event Organizer',
    createdAt: new Date().toISOString(),
  };

  const mockSummary: AttendanceSummaryDto = {
    eventId: 'evt-100',
    eventName: 'Cloud Architecture Summit',
    totalTickets: 100,
    checkedInCount: 45,
    remainingCount: 55,
    checkInPercentage: 45.0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    attendanceService = TestBed.inject(AttendanceService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should successfully check in attendee with QR token payload', () => {
    const checkInPayload: CheckInDto = {
      eventId: 'evt-100',
      qrToken: 'SECURE_QR_TOKEN_ABC_123',
    };

    let result: AttendanceDto | null = null;
    attendanceService.checkIn(checkInPayload).subscribe((res) => {
      result = res;
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/attendance/check-in`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(checkInPayload);
    req.flush(mockAttendance);

    expect(result).not.toBeNull();
    expect((result as any).userName).toBe('Jane Attendee');
    expect((result as any).ticketNumber).toBe('TKT-2026-001');
    expect((result as any).eventTicketId).toBe('tkt-001');
  });

  it('should handle already checked-in duplicate scan conflict (409)', () => {
    const checkInPayload: CheckInDto = {
      eventId: 'evt-100',
      ticketNumber: 'TKT-2026-001',
    };

    let errorResponse: any = null;
    attendanceService.checkIn(checkInPayload).subscribe({
      next: () => {},
      error: (err) => {
        errorResponse = err;
      },
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/attendance/check-in`);
    req.flush(
      { statusCode: 409, message: 'Ticket has already been checked in.' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(errorResponse).not.toBeNull();
    expect(errorResponse.status).toBe(409);
    expect(errorResponse.error.message).toContain('already been checked in');
  });

  it('should fetch attendance summary for the event to monitor live check-in percentage', () => {
    let summary: AttendanceSummaryDto | null = null;
    attendanceService.getSummary('evt-100').subscribe((res) => {
      summary = res;
    });

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/events/evt-100/attendance/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);

    expect(summary).not.toBeNull();
    expect((summary as any).checkedInCount).toBe(45);
    expect((summary as any).checkInPercentage).toBe(45.0);
  });
});
