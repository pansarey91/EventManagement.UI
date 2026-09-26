import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AttendanceListComponent } from './attendance-list.component';
import { AttendanceService } from '../../core/services/attendance.service';
import { EventService } from '../../core/services/event.service';
import {
  AttendanceDto,
  AttendanceSummaryDto,
  EventDto,
  EventStatus,
  PagedResultDto,
} from '../../core/models';

describe('AttendanceListComponent', () => {
  let component: AttendanceListComponent;
  let fixture: ComponentFixture<AttendanceListComponent>;
  let attendanceServiceMock: { getByEventId: any; getSummary: any };
  let eventServiceMock: { getById: any };

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
    checkedInCount: 150,
    remainingCount: 50,
    checkInPercentage: 75.0,
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

  const mockPagedAttendance: PagedResultDto<AttendanceDto> = {
    items: [mockAttendance],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 15,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    attendanceServiceMock = {
      getByEventId: vi.fn().mockReturnValue(of(mockPagedAttendance)),
      getSummary: vi.fn().mockReturnValue(of(mockSummary)),
    };

    eventServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockEvent)),
    };

    await TestBed.configureTestingModule({
      imports: [AttendanceListComponent],
      providers: [
        provideRouter([]),
        { provide: AttendanceService, useValue: attendanceServiceMock },
        { provide: EventService, useValue: eventServiceMock },
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

    fixture = TestBed.createComponent(AttendanceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load event, summary, and attendance roster on init', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getById).toHaveBeenCalledWith('event-1');
    expect(attendanceServiceMock.getSummary).toHaveBeenCalledWith('event-1');
    expect(attendanceServiceMock.getByEventId).toHaveBeenCalledWith('event-1', expect.any(Object));
    expect(component.event()).toEqual(mockEvent);
    expect(component.summary()).toEqual(mockSummary);
    expect(component.attendances()).toEqual([mockAttendance]);
  });

  it('should search attendance records by query', () => {
    component.searchTerm = 'Jane';
    component.onSearch();

    expect(component.query.search).toBe('Jane');
    expect(component.query.pageNumber).toBe(1);
    expect(attendanceServiceMock.getByEventId).toHaveBeenCalledWith('event-1', expect.objectContaining({
      search: 'Jane',
    }));
  });

  it('should toggle sort direction and reload', () => {
    expect(component.query.sortDescending).toBe(true);
    component.toggleSortDirection();
    expect(component.query.sortDescending).toBe(false);
    expect(attendanceServiceMock.getByEventId).toHaveBeenCalled();
  });

  it('should navigate between pages', () => {
    component.goToPage(2);
    expect(component.query.pageNumber).toBe(2);
    expect(attendanceServiceMock.getByEventId).toHaveBeenCalled();
  });
});
