import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PlatformReportsComponent } from './platform-reports.component';
import { AdminDashboardService } from '../../core/services/admin-dashboard.service';
import { EventService } from '../../core/services/event.service';
import {
  RevenueReportDto,
  RegistrationReportDto,
  AttendanceReportDto,
  PagedResultDto,
  EventDto,
} from '../../core/models';

describe('PlatformReportsComponent', () => {
  let component: PlatformReportsComponent;
  let fixture: ComponentFixture<PlatformReportsComponent>;
  let adminServiceMock: any;
  let eventServiceMock: any;

  const mockRevenueReport: RevenueReportDto = {
    totalRevenue: 2200,
    successfulPaymentCount: 2,
    pendingPaymentCount: 1,
    failedPaymentCount: 0,
    events: [
      {
        eventId: 'ev-1',
        eventName: 'DevCon 2026',
        successfulPaymentCount: 2,
        revenue: 2200,
      },
    ],
    timeline: [
      {
        date: '2026-09-10T00:00:00',
        amount: 1100,
        transactionCount: 1,
      },
      {
        date: '2026-09-26T00:00:00',
        amount: 1100,
        transactionCount: 1,
      },
    ],
  };

  const mockRegistrationReport: RegistrationReportDto = {
    totalRegistrations: 3,
    confirmedRegistrations: 1,
    pendingRegistrations: 0,
    cancelledRegistrations: 2,
    events: [
      {
        eventId: 'ev-1',
        eventName: 'DevCon 2026',
        totalRegistrations: 3,
        confirmedRegistrations: 1,
        pendingRegistrations: 0,
        cancelledRegistrations: 2,
      },
    ],
    timeline: [
      {
        date: '2026-09-10T00:00:00',
        totalRegistrations: 2,
        confirmedRegistrations: 0,
      },
      {
        date: '2026-09-26T00:00:00',
        totalRegistrations: 1,
        confirmedRegistrations: 1,
      },
    ],
  };

  const mockAttendanceReport: AttendanceReportDto = {
    totalAttendance: 1,
    totalConfirmedRegistrations: 1,
    overallAttendanceRate: 100,
    events: [
      {
        eventId: 'ev-1',
        eventName: 'DevCon 2026',
        totalRegistrations: 3,
        confirmedRegistrations: 1,
        attendanceCount: 1,
        attendanceRate: 100,
      },
    ],
  };

  const mockEventsPagedResult: PagedResultDto<EventDto> = {
    items: [
      {
        id: 'ev-1',
        name: 'DevCon 2026',
        description: 'Developer Conference',
        startDateTime: '2026-10-01T09:00:00Z',
        endDateTime: '2026-10-02T18:00:00Z',
        venueId: 'v-1',
        categoryId: 'c-1',
        organizerId: 'org-1',
        maxCapacity: 500,
        status: 1 as any,
        createdAt: '2026-01-01T10:00:00Z',
      },
    ],
    pageNumber: 1,
    pageSize: 100,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    adminServiceMock = {
      getRevenueReport: vi.fn().mockReturnValue(of(mockRevenueReport)),
      getRegistrationReport: vi.fn().mockReturnValue(of(mockRegistrationReport)),
      getAttendanceReport: vi.fn().mockReturnValue(of(mockAttendanceReport)),
    };

    eventServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockEventsPagedResult)),
    };

    await TestBed.configureTestingModule({
      imports: [PlatformReportsComponent],
      providers: [
        { provide: AdminDashboardService, useValue: adminServiceMock },
        { provide: EventService, useValue: eventServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlatformReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load events and default revenue report', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getAll).toHaveBeenCalled();
    expect(component.events().length).toBe(1);
    expect(adminServiceMock.getRevenueReport).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(component.revenueReport()).toEqual(mockRevenueReport);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should compute revenue trend chart data correctly', () => {
    const chartData = component.revenueChartData();
    expect(chartData.length).toBe(2);
    expect(chartData[0].value).toBe(1100);
    expect(chartData[0].secondaryValue).toBe(1);
    expect(chartData[1].value).toBe(1100);
  });

  it('should switch to registration report tab and fetch registration data', () => {
    component.setActiveReport('registrations');

    expect(component.activeReport()).toBe('registrations');
    expect(adminServiceMock.getRegistrationReport).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(component.registrationReport()).toEqual(mockRegistrationReport);

    const chartData = component.registrationChartData();
    expect(chartData.length).toBe(2);
    expect(chartData[0].value).toBe(2);
    expect(chartData[0].secondaryValue).toBe(0);
  });

  it('should switch to attendance report tab and fetch attendance data', () => {
    component.setActiveReport('attendance');

    expect(component.activeReport()).toBe('attendance');
    expect(adminServiceMock.getAttendanceReport).toHaveBeenCalledWith(undefined, undefined, undefined);
    expect(component.attendanceReport()).toEqual(mockAttendanceReport);
    expect(component.attendanceReport()?.overallAttendanceRate).toBe(100);
  });

  it('should apply 7-day date preset filter and reload report', () => {
    component.setPreset('7d');

    expect(component.selectedPreset()).toBe('7d');
    expect(component.startDate()).toBeTruthy();
    expect(component.endDate()).toBeTruthy();
    expect(adminServiceMock.getRevenueReport).toHaveBeenCalledWith(
      component.startDate(),
      component.endDate(),
      undefined
    );
  });

  it('should apply 30-day date preset filter and reload report', () => {
    component.setPreset('30d');

    expect(component.selectedPreset()).toBe('30d');
    expect(component.startDate()).toBeTruthy();
    expect(component.endDate()).toBeTruthy();
    expect(adminServiceMock.getRevenueReport).toHaveBeenCalledWith(
      component.startDate(),
      component.endDate(),
      undefined
    );
  });

  it('should apply event scope filter and reload report', () => {
    const event = { target: { value: 'ev-1' } } as unknown as Event;
    component.onEventChange(event);

    expect(component.selectedEventId()).toBe('ev-1');
    expect(adminServiceMock.getRevenueReport).toHaveBeenCalledWith(undefined, undefined, 'ev-1');
  });

  it('should validate custom date range and show error when startDate > endDate', () => {
    component.selectedPreset.set('custom');
    component.startDate.set('2026-10-15');

    const changeEvent = { target: { value: '2026-10-01' } } as unknown as Event;
    component.onEndDateChange(changeEvent);

    expect(component.dateValidationError()).toBe('Start date cannot be after end date.');
    // Should NOT make an API call with invalid date range
    adminServiceMock.getRevenueReport.mockClear();
    component.loadActiveReport();
    expect(adminServiceMock.getRevenueReport).not.toHaveBeenCalled();
  });

  it('should reload report when valid custom date range is entered', () => {
    component.selectedPreset.set('custom');
    component.startDate.set('2026-09-01');

    const changeEvent = { target: { value: '2026-09-30' } } as unknown as Event;
    component.onEndDateChange(changeEvent);

    expect(component.dateValidationError()).toBeNull();
    expect(adminServiceMock.getRevenueReport).toHaveBeenCalledWith('2026-09-01', '2026-09-30', undefined);
  });

  it('should handle API error when report retrieval fails', () => {
    adminServiceMock.getRevenueReport.mockReturnValue(
      throwError(() => ({ message: 'Server unavailable.' }))
    );

    component.loadActiveReport();

    expect(component.error()).toBe('Server unavailable.');
    expect(component.loading()).toBe(false);
  });

  it('should retry report loading after error', () => {
    adminServiceMock.getRevenueReport.mockReturnValue(of(mockRevenueReport));
    component.error.set('Previous error');

    component.loadActiveReport();

    expect(component.error()).toBeNull();
    expect(component.revenueReport()).toEqual(mockRevenueReport);
  });

  it('should handle empty report data with zero revenue without error', () => {
    const emptyReport: RevenueReportDto = {
      totalRevenue: 0,
      successfulPaymentCount: 0,
      pendingPaymentCount: 0,
      failedPaymentCount: 0,
      events: [],
      timeline: [],
    };
    adminServiceMock.getRevenueReport.mockReturnValue(of(emptyReport));

    component.loadActiveReport();

    expect(component.revenueReport()?.totalRevenue).toBe(0);
    expect(component.revenueChartData().length).toBe(0);
    expect(component.error()).toBeNull();
  });

  it('should return correct report title', () => {
    component.activeReport.set('revenue');
    expect(component.activeReportTitle()).toBe('Revenue Report');

    component.activeReport.set('registrations');
    expect(component.activeReportTitle()).toBe('Registration Report');

    component.activeReport.set('attendance');
    expect(component.activeReportTitle()).toBe('Attendance Report');
  });
});
