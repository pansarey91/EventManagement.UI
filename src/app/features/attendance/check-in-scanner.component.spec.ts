import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CheckInScannerComponent } from './check-in-scanner.component';
import { AttendanceService } from '../../core/services/attendance.service';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import {
  AttendanceDto,
  AttendanceSummaryDto,
  EventDto,
  EventStatus,
} from '../../core/models';

describe('CheckInScannerComponent', () => {
  let component: CheckInScannerComponent;
  let fixture: ComponentFixture<CheckInScannerComponent>;
  let attendanceServiceMock: { checkIn: any; getSummary: any };
  let eventServiceMock: { getById: any; getAll: any };
  let authServiceMock: { isOrganizer: any; isAdmin: any; isStaff: any };

  const mockEvent: EventDto = {
    id: 'event-1',
    name: 'Tech Con 2026',
    description: 'Annual tech summit',
    startDateTime: '2026-10-15T09:00:00Z',
    endDateTime: '2026-10-15T18:00:00Z',
    venueId: 'venue-1',
    venueName: 'Expo Center Hall A',
    categoryId: 'cat-1',
    categoryName: 'Technology',
    organizerId: 'org-1',
    organizerName: 'Tech Group',
    status: EventStatus.Published,
    maxCapacity: 500,
    bannerImageUrl: null,
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
  };

  const mockSummary: AttendanceSummaryDto = {
    eventId: 'event-1',
    eventName: 'Tech Con 2026',
    totalTickets: 200,
    checkedInCount: 50,
    remainingCount: 150,
    checkInPercentage: 25.0,
  };

  const mockAttendance: AttendanceDto = {
    id: 'att-1',
    eventTicketId: 'tkt-1',
    ticketNumber: 'TKT-20261015-ABC12345',
    registrationId: 'reg-1',
    registrationNumber: 'REG-20261015-TEST1234',
    eventId: 'event-1',
    eventName: 'Tech Con 2026',
    userId: 'user-1',
    userName: 'Jane Doe',
    userEmail: 'jane@example.com',
    checkedInById: 'checker-1',
    checkedInByName: 'Admin',
    checkedInAt: '2026-09-13T11:00:00Z',
    createdAt: '2026-09-13T11:00:00Z',
    updatedAt: null,
  };

  beforeEach(async () => {
    attendanceServiceMock = {
      checkIn: vi.fn().mockReturnValue(of(mockAttendance)),
      getSummary: vi.fn().mockReturnValue(of(mockSummary)),
    };

    eventServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockEvent)),
      getAll: vi.fn().mockReturnValue(of({ items: [mockEvent] })),
    };

    authServiceMock = {
      isOrganizer: vi.fn().mockReturnValue(true),
      isAdmin: vi.fn().mockReturnValue(false),
      isStaff: vi.fn().mockReturnValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [CheckInScannerComponent],
      providers: [
        provideRouter([]),
        { provide: AttendanceService, useValue: attendanceServiceMock },
        { provide: EventService, useValue: eventServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'eventId' ? 'event-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckInScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load event context and summary when eventId is provided', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getById).toHaveBeenCalledWith('event-1');
    expect(attendanceServiceMock.getSummary).toHaveBeenCalledWith('event-1');
    expect(component.selectedEvent()).toEqual(mockEvent);
    expect(component.summary()).toEqual(mockSummary);
  });

  it('should successfully execute check-in with a ticket number', () => {
    component.manualCode = 'TKT-20261015-ABC12345';
    component.submitManualCode();

    expect(attendanceServiceMock.checkIn).toHaveBeenCalledWith({
      eventId: 'event-1',
      ticketNumber: 'TKT-20261015-ABC12345',
    });

    expect(component.lastResult()).toBeTruthy();
    expect(component.lastResult()?.success).toBe(true);
    expect(component.lastResult()?.attendance).toEqual(mockAttendance);
    expect(component.recentCheckIns().length).toBe(1);
  });

  it('should handle duplicate check-in error correctly', () => {
    attendanceServiceMock.checkIn.mockReturnValue(
      throwError(() => ({ error: { message: 'Attendee is already checked in for this ticket.' } }))
    );

    component.executeCheckIn('test-qr-token');

    expect(component.lastResult()?.success).toBe(false);
    expect(component.lastResult()?.statusType).toBe('duplicate');
    expect(component.lastResult()?.message).toContain('already checked in');
  });

  it('should handle wrong event check-in rejection', () => {
    attendanceServiceMock.checkIn.mockReturnValue(
      throwError(() => ({ error: { message: 'This ticket belongs to a different event.' } }))
    );

    component.executeCheckIn('different-event-qr');

    expect(component.lastResult()?.success).toBe(false);
    expect(component.lastResult()?.statusType).toBe('wrong_event');
  });

  it('should dismiss last result when ready to scan next', () => {
    component.executeCheckIn('TKT-20261015-ABC12345');
    expect(component.lastResult()).toBeTruthy();

    component.dismissResultAndReady();
    expect(component.lastResult()).toBeNull();
  });
});
