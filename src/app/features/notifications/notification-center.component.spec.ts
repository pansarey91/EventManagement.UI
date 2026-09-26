import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { NotificationCenterComponent } from './notification-center.component';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto, NotificationType, PagedResultDto } from '../../core/models';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let router: Router;

  const mockNotification1: NotificationDto = {
    id: 'notif-1',
    userId: 'user-1',
    title: 'Registration Confirmed',
    message: 'Your registration for DevFest 2026 is confirmed.',
    type: NotificationType.RegistrationConfirmed,
    isRead: false,
    readAt: null,
    relatedEntityType: 'Registration',
    relatedEntityId: 'reg-1',
    createdAt: new Date().toISOString()
  };

  const mockNotification2: NotificationDto = {
    id: 'notif-2',
    userId: 'user-1',
    title: 'Payment Successful',
    message: 'Your payment of $99 was processed.',
    type: NotificationType.PaymentSuccessful,
    isRead: true,
    readAt: new Date().toISOString(),
    relatedEntityType: 'Payment',
    relatedEntityId: 'pay-1',
    createdAt: new Date().toISOString()
  };

  const mockPagedResult: PagedResultDto<NotificationDto> = {
    items: [mockNotification1, mockNotification2],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false
  };

  let mockNotificationService: any;

  beforeEach(async () => {
    mockNotificationService = {
      unreadCount: signal<number>(1),
      recentNotifications: signal<NotificationDto[]>([mockNotification1]),
      loading: signal<boolean>(false),
      error: signal<string | null>(null),
      getNotifications: vi.fn().mockReturnValue(of(mockPagedResult)),
      markAsRead: vi.fn().mockReturnValue(of({ ...mockNotification1, isRead: true })),
      markAllAsRead: vi.fn().mockReturnValue(of({ updatedCount: 1, message: 'All read' })),
      deleteNotification: vi.fn().mockReturnValue(of(undefined)),
      refreshUnreadCount: vi.fn(),
      getNotificationIcon: vi.fn().mockReturnValue('🎟️'),
      getNotificationNavigationUrl: vi.fn().mockImplementation((n: NotificationDto) => {
        if (n.relatedEntityType === 'Registration') return `/my-registrations/${n.relatedEntityId}`;
        if (n.relatedEntityType === 'Payment') return `/registrations/${n.relatedEntityId}/payment`;
        return null;
      })
    };

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [
        provideRouter([]),
        { provide: NotificationService, useValue: mockNotificationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture.detectChanges();
  });

  it('should create the notification center and load notifications on init', () => {
    expect(component).toBeTruthy();
    expect(mockNotificationService.getNotifications).toHaveBeenCalled();
    expect(component.notifications().length).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('should filter by unread status', () => {
    component.setUnreadFilter('unread');
    expect(component.unreadFilter()).toBe('unread');
    expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(expect.objectContaining({ isRead: false }));
  });

  it('should filter by type', () => {
    component.setTypeFilter(NotificationType.PaymentSuccessful);
    expect(component.typeFilter()).toBe(NotificationType.PaymentSuccessful);
    expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.PaymentSuccessful })
    );
  });

  it('should search notifications on search term change', () => {
    component.onSearchChange('DevFest');
    expect(component.searchTerm()).toBe('DevFest');
    expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'DevFest', pageNumber: 1 })
    );
  });

  it('should reset filters when resetFilters() is called', () => {
    component.setUnreadFilter('unread');
    component.setTypeFilter(NotificationType.PaymentSuccessful);
    component.onSearchChange('DevFest');

    component.resetFilters();

    expect(component.unreadFilter()).toBe('all');
    expect(component.typeFilter()).toBe('all');
    expect(component.searchTerm()).toBe('');
  });

  it('should mark an individual notification as read', () => {
    component.markAsRead(mockNotification1);
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(component.notifications()[0].isRead).toBe(true);
  });

  it('should mark all notifications as read', () => {
    component.markAllAsRead();
    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    expect(component.notifications().every((n) => n.isRead)).toBe(true);
  });

  it('should delete a notification', () => {
    component.deleteNotification(mockNotification1);
    expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('notif-1');
    expect(component.notifications().length).toBe(1);
    expect(component.notifications()[0].id).toBe('notif-2');
  });

  it('should navigate to entity on button click and mark as read if unread', () => {
    component.navigateToEntity(mockNotification1);
    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('notif-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/my-registrations/reg-1');
  });

  it('should calculate pagination range accurately', () => {
    expect(component.paginationRangeStart()).toBe(1);
    expect(component.paginationRangeEnd()).toBe(2);

    component.totalCount.set(0);
    expect(component.paginationRangeStart()).toBe(0);
    expect(component.paginationRangeEnd()).toBe(0);
  });

  it('should handle API errors gracefully', () => {
    mockNotificationService.getNotifications.mockReturnValue(throwError(() => new Error('Server connection error')));
    component.loadNotifications();

    expect(component.error()).toBe('Server connection error');
    expect(component.loading()).toBe(false);
  });
});
