import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto, NotificationType } from '../../core/models';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  const mockNotification: NotificationDto = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Registration Confirmed',
    message: 'You have registered for TechConf.',
    type: NotificationType.RegistrationConfirmed,
    isRead: false,
    readAt: null,
    relatedEntityType: 'Registration',
    relatedEntityId: 'reg-99',
    createdAt: new Date().toISOString()
  };

  const mockAuthService = {
    isAuthenticated: signal<boolean>(true),
    currentUser: signal<any>({ firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com' }),
    roles: signal<string[]>(['Attendee']),
    isAdmin: signal<boolean>(false),
    isOrganizer: signal<boolean>(false),
    isStaff: signal<boolean>(false),
    userFullName: signal<string>('Alice Smith'),
    logout: vi.fn()
  };

  const mockNotificationService = {
    unreadCount: signal<number>(2),
    recentNotifications: signal<NotificationDto[]>([mockNotification]),
    loading: signal<boolean>(false),
    error: signal<string | null>(null),
    loadRecent: vi.fn().mockReturnValue(of({ items: [mockNotification], totalCount: 1 })),
    markAsRead: vi.fn().mockReturnValue(of({ ...mockNotification, isRead: true })),
    markAllAsRead: vi.fn().mockReturnValue(of({ updatedCount: 2, message: 'All read' })),
    getNotificationIcon: (type: NotificationType) => '🎟️',
    getNotificationNavigationUrl: (n: NotificationDto) => `/my-registrations/${n.relatedEntityId}`
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create header component', () => {
    expect(component).toBeTruthy();
  });

  it('should display notification badge with unread count when > 0', () => {
    const badge = fixture.nativeElement.querySelector('.notification-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent.trim()).toBe('2');
  });

  it('should display "99+" badge when unread count exceeds 99', () => {
    mockNotificationService.unreadCount.set(120);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.notification-badge');
    expect(badge.textContent.trim()).toBe('99+');
  });

  it('should hide notification badge when unread count is 0', () => {
    mockNotificationService.unreadCount.set(0);
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector('.notification-badge');
    expect(badge).toBeFalsy();
  });

  it('should open notification dropdown on toggle and call loadRecent', () => {
    expect(component.notificationsOpen()).toBe(false);

    component.toggleNotifications();
    expect(component.notificationsOpen()).toBe(true);
    expect(mockNotificationService.loadRecent).toHaveBeenCalledWith(5);

    fixture.detectChanges();
    const dropdown = fixture.nativeElement.querySelector('.notifications-dropdown');
    expect(dropdown).toBeTruthy();
  });

  it('should call markAllAsRead when "Mark all read" button is clicked', () => {
    mockNotificationService.unreadCount.set(2);
    component.toggleNotifications();
    fixture.detectChanges();

    const markAllBtn = fixture.nativeElement.querySelector('.mark-all-btn');
    expect(markAllBtn).toBeTruthy();

    markAllBtn.click();
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
  });

  it('should handle notification click, mark as read, close dropdown, and navigate', () => {
    component.notificationsOpen.set(true);
    component.onNotificationClick(mockNotification);

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(component.notificationsOpen()).toBe(false);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/my-registrations/reg-99');
  });

  it('should close dropdowns on escape key', () => {
    component.notificationsOpen.set(true);
    component.onEscape();
    expect(component.notificationsOpen()).toBe(false);
  });
});
