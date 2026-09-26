import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminDashboardService } from '../../core/services/admin-dashboard.service';
import { AdminDashboardDto } from '../../core/models';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let adminServiceMock: any;

  const mockAdminDashboard: AdminDashboardDto = {
    totalUsers: 250,
    activeUsers: 240,
    inactiveUsers: 10,
    newUsersInPeriod: 35,
    usersByRole: [
      { roleName: 'Attendee', count: 200 },
      { roleName: 'Organizer', count: 45 },
      { roleName: 'Admin', count: 5 }
    ],
    recentUsers: [
      {
        userId: 'usr-1',
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        roles: ['Attendee'],
        isActive: true,
        createdAt: '2026-03-01T10:00:00Z'
      }
    ],
    totalEvents: 30,
    draftEvents: 5,
    publishedEvents: 20,
    ongoingEvents: 1,
    completedEvents: 4,
    cancelledEvents: 0,
    upcomingEvents: 15,
    eventsByCategory: [
      { categoryId: 'cat-1', categoryName: 'Technology', eventCount: 18, registrationCount: 450 },
      { categoryId: 'cat-2', categoryName: 'Design', eventCount: 12, registrationCount: 200 }
    ],
    topOrganizers: [
      {
        organizerId: 'org-1',
        organizerName: 'Tech Corp',
        organizerEmail: 'contact@techcorp.com',
        eventCount: 8,
        totalRevenue: 25000,
        totalRegistrations: 600
      }
    ],
    totalRegistrations: 650,
    confirmedRegistrations: 600,
    pendingRegistrations: 30,
    cancelledRegistrations: 20,
    totalTicketsSold: 600,
    availableTicketInventory: 400,
    totalEventTickets: 600,
    activeTickets: 500,
    usedTickets: 100,
    cancelledTickets: 0,
    ticketCheckInRate: 16.67,
    totalRevenue: 30000,
    successfulPayments: 600,
    pendingPayments: 30,
    failedPayments: 10,
    refundedPayments: 2,
    refundedAmount: 100,
    totalAttendance: 100,
    overallAttendanceRate: 16.67,
    totalFeedback: 50,
    averageRating: 4.8,
    ratingDistribution: [
      { rating: 5, count: 42 },
      { rating: 4, count: 6 },
      { rating: 3, count: 2 }
    ],
    recentFeedbacks: [
      {
        feedbackId: 'fb-1',
        eventId: 'evt-1',
        eventName: 'Global Summit',
        attendeeName: 'Jane Doe',
        rating: 5,
        comment: 'Brilliant organization!',
        createdAt: '2026-03-01T12:00:00Z'
      }
    ],
    topEvents: [
      {
        eventId: 'evt-1',
        eventName: 'Global Summit',
        registrationCount: 200,
        revenue: 10000,
        attendanceCount: 80
      }
    ],
    recentRegistrations: [
      {
        registrationId: 'reg-1',
        registrationNumber: 'REG-ADM-001',
        eventId: 'evt-1',
        eventName: 'Global Summit',
        attendeeName: 'Jane Doe',
        attendeeEmail: 'jane@example.com',
        quantity: 2,
        totalAmount: 100,
        status: 2,
        registeredAt: '2026-03-01T10:00:00Z'
      }
    ],
    recentPayments: [
      {
        paymentId: 'pay-1',
        registrationId: 'reg-1',
        eventId: 'evt-1',
        eventName: 'Global Summit',
        amount: 100,
        status: 2,
        paymentMethod: 'Card',
        transactionId: 'TXN-999',
        paidAt: '2026-03-01T10:05:00Z',
        createdAt: '2026-03-01T10:05:00Z'
      }
    ],
    recentCheckIns: [
      {
        attendanceId: 'chk-1',
        eventId: 'evt-1',
        eventName: 'Global Summit',
        ticketNumber: 'TKT-001',
        attendeeName: 'Jane Doe',
        checkedInAt: '2026-03-01T11:00:00Z'
      }
    ],
    dailyRegistrationTrends: [
      { date: '2026-03-01', totalRegistrations: 10, confirmedRegistrations: 9 }
    ],
    dailyRevenueTrends: [
      { date: '2026-03-01', amount: 500, transactionCount: 10 }
    ]
  };

  beforeEach(async () => {
    adminServiceMock = {
      getAdminDashboard: vi.fn().mockReturnValue(of(mockAdminDashboard)),
      getOverview: vi.fn().mockReturnValue(of({ totalEvents: 30 })),
      getTopEvents: vi.fn().mockReturnValue(of(mockAdminDashboard.topEvents))
    };

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AdminDashboardService, useValue: adminServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load admin dashboard data on init', () => {
    expect(component).toBeTruthy();
    expect(adminServiceMock.getAdminDashboard).toHaveBeenCalledWith(undefined, undefined);
    expect(component.dashboard()).toEqual(mockAdminDashboard);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
  });

  it('should render platform KPI cards correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const kpiValues = compiled.querySelectorAll('.kpi-value');

    // Total Users
    expect(kpiValues[0].textContent).toContain('250');
    // Total Events
    expect(kpiValues[1].textContent).toContain('30');
    // Total Registrations
    expect(kpiValues[2].textContent).toContain('650');
    // Tickets Issued
    expect(kpiValues[3].textContent).toContain('600');
    // Revenue
    expect(kpiValues[4].textContent).toContain('$30,000.00');
    // Attendance
    expect(kpiValues[5].textContent).toContain('100');
    // Feedback Rating
    expect(kpiValues[6].textContent).toContain('4.8');
  });

  it('should filter dashboard data by preset date ranges', () => {
    component.setPreset('7d');
    expect(component.selectedPreset()).toBe('7d');
    expect(adminServiceMock.getAdminDashboard).toHaveBeenCalledTimes(2);

    component.setPreset('30d');
    expect(component.selectedPreset()).toBe('30d');
    expect(adminServiceMock.getAdminDashboard).toHaveBeenCalledTimes(3);

    component.setPreset('year');
    expect(component.selectedPreset()).toBe('year');
    expect(adminServiceMock.getAdminDashboard).toHaveBeenCalledTimes(4);

    component.setPreset('all');
    expect(component.selectedPreset()).toBe('all');
    expect(adminServiceMock.getAdminDashboard).toHaveBeenCalledWith(undefined, undefined);
  });

  it('should support custom date range changes', () => {
    component.setPreset('custom');
    expect(component.selectedPreset()).toBe('custom');

    component.onCustomDateChange('2026-01-01', '2026-03-31');
    expect(component.customStartDate()).toBe('2026-01-01');
    expect(component.customEndDate()).toBe('2026-03-31');
    expect(adminServiceMock.getAdminDashboard).toHaveBeenCalledWith('2026-01-01', '2026-03-31');
  });

  it('should switch trend tabs between registrations and revenue', () => {
    expect(component.activeTrendTab()).toBe('registrations');
    expect(component.registrationTrendData().length).toBe(1);

    component.activeTrendTab.set('revenue');
    expect(component.activeTrendTab()).toBe('revenue');
    expect(component.revenueTrendData().length).toBe(1);
    expect(component.revenueTrendData()[0].value).toBe(500);
  });

  it('should switch activity audit tabs', () => {
    expect(component.activeActivityTab()).toBe('users');

    component.activeActivityTab.set('registrations');
    expect(component.activeActivityTab()).toBe('registrations');

    component.activeActivityTab.set('payments');
    expect(component.activeActivityTab()).toBe('payments');

    component.activeActivityTab.set('checkins');
    expect(component.activeActivityTab()).toBe('checkins');

    component.activeActivityTab.set('feedback');
    expect(component.activeActivityTab()).toBe('feedback');
  });

  it('should compute breakdown percentages accurately', () => {
    // Role percentage: 200 / 250 = 80%
    expect(component.getRolePercentage(200)).toBe(80);

    // Category percentage: 18 / 30 = 60%
    expect(component.getCategoryPercentage(18)).toBe(60);

    // Rating count and percentage: 42 / 50 = 84%
    expect(component.getRatingCount(5)).toBe(42);
    expect(component.getRatingPercentage(42)).toBe(84);
  });

  it('should handle API error state and allow retry', () => {
    adminServiceMock.getAdminDashboard.mockReturnValue(
      throwError(() => ({ message: 'Network connection failed' }))
    );

    component.loadDashboardData();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Network connection failed');

    // Simulate retry with successful response
    adminServiceMock.getAdminDashboard.mockReturnValue(of(mockAdminDashboard));
    component.loadDashboardData();
    expect(component.error()).toBeNull();
    expect(component.dashboard()).toEqual(mockAdminDashboard);
  });

  it('should handle empty platform state gracefully', () => {
    const emptyDashboard: AdminDashboardDto = {
      ...mockAdminDashboard,
      totalUsers: 0,
      totalEvents: 0,
      totalRegistrations: 0,
      totalRevenue: 0
    };

    adminServiceMock.getAdminDashboard.mockReturnValue(of(emptyDashboard));
    component.loadDashboardData();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-empty-state')).toBeTruthy();
  });

  it('should never expose or display password hashes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.innerHTML).not.toContain('passwordHash');
    expect(compiled.innerHTML).not.toContain('PasswordHash');
  });
});
