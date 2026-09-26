import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganizerDashboardComponent } from './organizer-dashboard.component';
import { OrganizerDashboardService } from '../../core/services/organizer-dashboard.service';
import {
  OrganizerDashboardDto,
  EventAnalyticsListDto,
  RegistrationReportDto,
  RevenueReportDto,
  EventStatus
} from '../../core/models';

describe('OrganizerDashboardComponent', () => {
  let component: OrganizerDashboardComponent;
  let fixture: ComponentFixture<OrganizerDashboardComponent>;
  let dashboardServiceMock: any;

  const mockDashboard: OrganizerDashboardDto = {
    totalEvents: 5,
    draftEvents: 1,
    publishedEvents: 3,
    ongoingEvents: 0,
    completedEvents: 1,
    cancelledEvents: 0,
    upcomingEvents: 2,
    totalRegistrations: 120,
    confirmedRegistrations: 110,
    pendingRegistrations: 5,
    cancelledRegistrations: 5,
    totalTicketsSold: 110,
    remainingTicketInventory: 50,
    totalRevenue: 5500,
    successfulPayments: 110,
    pendingPayments: 0,
    failedPayments: 0,
    totalAttendance: 85,
    attendanceRate: 77.27,
    averageRating: 4.8,
    totalReviews: 25,
    topEvents: [],
    recentRegistrations: [
      {
        registrationId: 'reg-1',
        registrationNumber: 'REG-001',
        eventId: 'evt-1',
        eventName: 'Angular Summit',
        attendeeName: 'Alice Smith',
        attendeeEmail: 'alice@example.com',
        quantity: 1,
        totalAmount: 50,
        status: 1,
        registeredAt: '2026-03-01T10:00:00Z'
      }
    ],
    recentPayments: [
      {
        paymentId: 'pay-1',
        registrationId: 'reg-1',
        eventId: 'evt-1',
        eventName: 'Angular Summit',
        amount: 50,
        status: 1,
        paymentMethod: 'CreditCard',
        transactionId: 'TXN-101',
        paidAt: '2026-03-01T10:05:00Z',
        createdAt: '2026-03-01T10:05:00Z'
      }
    ],
    recentCheckIns: [
      {
        attendanceId: 'chk-1',
        eventId: 'evt-1',
        eventName: 'Angular Summit',
        ticketNumber: 'TCK-001',
        attendeeName: 'Alice Smith',
        checkedInAt: '2026-03-01T11:00:00Z'
      }
    ]
  };

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 10);
  const futureIso = futureDate.toISOString();

  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);
  const pastIso = pastDate.toISOString();

  const mockEvents: EventAnalyticsListDto[] = [
    {
      eventId: 'evt-1',
      eventName: 'Angular Summit',
      categoryName: 'Tech',
      venueName: 'Grand Hall',
      startDateTime: futureIso,
      endDateTime: futureIso,
      status: EventStatus.Published,
      maxCapacity: 100,
      registrationCount: 90,
      confirmedRegistrations: 80,
      attendanceCount: 0,
      attendanceRate: 0,
      revenue: 4000,
      averageRating: 4.9,
      totalFeedbackCount: 15
    },
    {
      eventId: 'evt-2',
      eventName: 'Past AI Workshop',
      categoryName: 'Workshop',
      venueName: 'Room B',
      startDateTime: pastIso,
      endDateTime: pastIso,
      status: EventStatus.Completed,
      maxCapacity: 50,
      registrationCount: 40,
      confirmedRegistrations: 38,
      attendanceCount: 35,
      attendanceRate: 92.1,
      revenue: 1500,
      averageRating: 4.5,
      totalFeedbackCount: 10
    },
    {
      eventId: 'evt-3',
      eventName: 'Cancelled Meetup',
      categoryName: 'Tech',
      venueName: 'Online',
      startDateTime: futureIso,
      endDateTime: futureIso,
      status: EventStatus.Cancelled,
      maxCapacity: 20,
      registrationCount: 5,
      confirmedRegistrations: 0,
      attendanceCount: 0,
      attendanceRate: 0,
      revenue: 0,
      averageRating: 0,
      totalFeedbackCount: 0
    }
  ];

  const mockRegistrationReport: RegistrationReportDto = {
    totalRegistrations: 120,
    confirmedRegistrations: 110,
    pendingRegistrations: 5,
    cancelledRegistrations: 5,
    events: [],
    timeline: [
      {
        date: '2026-03-01',
        totalRegistrations: 15,
        confirmedRegistrations: 14
      },
      {
        date: '2026-03-02',
        totalRegistrations: 20,
        confirmedRegistrations: 18
      }
    ]
  };

  const mockRevenueReport: RevenueReportDto = {
    totalRevenue: 5500,
    successfulPaymentCount: 110,
    pendingPaymentCount: 0,
    failedPaymentCount: 0,
    events: [],
    timeline: [
      {
        date: '2026-03-01',
        amount: 750,
        transactionCount: 15
      },
      {
        date: '2026-03-02',
        amount: 1000,
        transactionCount: 20
      }
    ]
  };

  beforeEach(async () => {
    dashboardServiceMock = {
      getOrganizerDashboard: vi.fn().mockReturnValue(of(mockDashboard)),
      getEventsAnalytics: vi.fn().mockReturnValue(of(mockEvents)),
      getRegistrationReport: vi.fn().mockReturnValue(of(mockRegistrationReport)),
      getRevenueReport: vi.fn().mockReturnValue(of(mockRevenueReport))
    };

    await TestBed.configureTestingModule({
      imports: [OrganizerDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: OrganizerDashboardService, useValue: dashboardServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load dashboard data on init', () => {
    expect(component).toBeTruthy();
    expect(dashboardServiceMock.getOrganizerDashboard).toHaveBeenCalled();
    expect(dashboardServiceMock.getEventsAnalytics).toHaveBeenCalled();
    expect(dashboardServiceMock.getRegistrationReport).toHaveBeenCalled();
    expect(dashboardServiceMock.getRevenueReport).toHaveBeenCalled();

    expect(component.dashboard()).toEqual(mockDashboard);
    expect(component.eventsAnalytics().length).toBe(3);
    expect(component.registrationReport()).toEqual(mockRegistrationReport);
    expect(component.revenueReport()).toEqual(mockRevenueReport);
    expect(component.loading()).toBe(false);
  });

  it('should compute upcomingEvents excluding past and cancelled events', () => {
    const upcoming = component.upcomingEvents();
    expect(upcoming.length).toBe(1);
    expect(upcoming[0].eventId).toBe('evt-1');
    expect(upcoming[0].eventName).toBe('Angular Summit');
  });

  it('should filter events in filteredEventAnalytics based on search term', () => {
    expect(component.filteredEventAnalytics().length).toBe(3);

    component.eventSearchTerm.set('angular');
    expect(component.filteredEventAnalytics().length).toBe(1);
    expect(component.filteredEventAnalytics()[0].eventName).toBe('Angular Summit');

    component.eventSearchTerm.set('Room B');
    expect(component.filteredEventAnalytics().length).toBe(1);
    expect(component.filteredEventAnalytics()[0].venueName).toBe('Room B');

    component.eventSearchTerm.set('non-matching term');
    expect(component.filteredEventAnalytics().length).toBe(0);
  });

  it('should compute occupancy percentage properly', () => {
    const rate = component.getOccupancyPercentage(mockEvents[0]);
    expect(rate).toBe(80);

    const zeroCapacity = component.getOccupancyPercentage({ ...mockEvents[0], maxCapacity: 0 });
    expect(zeroCapacity).toBe(0);
  });

  it('should map registration trend data correctly', () => {
    const trend = component.registrationTrendData();
    expect(trend.length).toBe(2);
    expect(trend[0].value).toBe(15);
    expect(trend[0].secondaryValue).toBe(14);
  });

  it('should map revenue trend data correctly', () => {
    const trend = component.revenueTrendData();
    expect(trend.length).toBe(2);
    expect(trend[0].value).toBe(750);
    expect(trend[0].secondaryValue).toBe(15);
  });

  it('should switch presets and reload data', () => {
    component.setPreset('7d');
    expect(component.selectedPreset()).toBe('7d');
    expect(dashboardServiceMock.getOrganizerDashboard).toHaveBeenCalledTimes(2);

    component.setPreset('30d');
    expect(component.selectedPreset()).toBe('30d');

    component.setPreset('90d');
    expect(component.selectedPreset()).toBe('90d');

    component.setPreset('year');
    expect(component.selectedPreset()).toBe('year');

    component.setPreset('all');
    expect(component.selectedPreset()).toBe('all');
  });

  it('should handle custom date range changes', () => {
    component.onCustomDateChange('2026-01-01', '2026-03-01');
    expect(component.customStartDate()).toBe('2026-01-01');
    expect(component.customEndDate()).toBe('2026-03-01');
    expect(dashboardServiceMock.getOrganizerDashboard).toHaveBeenCalledWith('2026-01-01', '2026-03-01');
  });

  it('should handle error when dashboard data fails to load', () => {
    dashboardServiceMock.getOrganizerDashboard.mockReturnValue(
      throwError(() => new Error('Forbidden organizer access'))
    );
    component.loadAllDashboardData();
    expect(component.error()).toBe('Forbidden organizer access');
    expect(component.loading()).toBe(false);
  });

  it('should return appropriate status labels', () => {
    expect(component.getStatusLabel(EventStatus.Draft)).toBe('Draft');
    expect(component.getStatusLabel(EventStatus.Published)).toBe('Published');
    expect(component.getStatusLabel(EventStatus.Ongoing)).toBe('Ongoing');
    expect(component.getStatusLabel(EventStatus.Completed)).toBe('Completed');
    expect(component.getStatusLabel(EventStatus.Cancelled)).toBe('Cancelled');
  });
});
