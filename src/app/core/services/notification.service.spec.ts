import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { NotificationDto, NotificationType } from '../models';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiBaseUrl}/notifications`;

  const mockNotification: NotificationDto = {
    id: 'n1',
    userId: 'u1',
    title: 'Test Notification',
    message: 'Test Message',
    type: NotificationType.RegistrationConfirmed,
    isRead: false,
    readAt: null,
    relatedEntityType: 'Registration',
    relatedEntityId: 'reg-123',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => false,
            currentUser: () => null
          }
        }
      ]
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.stopPolling();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.unreadCount()).toBe(0);
    expect(service.recentNotifications()).toEqual([]);
  });

  it('should get unread count and update signal', () => {
    service.getUnreadCount().subscribe((res) => {
      expect(res.unreadCount).toBe(5);
    });

    const req = httpMock.expectOne(`${apiUrl}/unread-count`);
    expect(req.request.method).toBe('GET');
    req.flush({ unreadCount: 5 });

    expect(service.unreadCount()).toBe(5);
  });

  it('should fetch notifications with query parameters', () => {
    const mockPaged = {
      items: [mockNotification],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };

    service.getNotifications({ pageNumber: 1, pageSize: 10, isRead: false, search: 'test' }).subscribe((res) => {
      expect(res.items.length).toBe(1);
      expect(res.items[0].id).toBe('n1');
    });

    const req = httpMock.expectOne((r) =>
      r.url === apiUrl &&
      r.params.get('pageNumber') === '1' &&
      r.params.get('pageSize') === '10' &&
      r.params.get('isRead') === 'false' &&
      r.params.get('search') === 'test'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPaged);
  });

  it('should load recent notifications and update signal', () => {
    const mockPaged = {
      items: [mockNotification],
      pageNumber: 1,
      pageSize: 5,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false
    };

    service.loadRecent(5).subscribe();

    const req = httpMock.expectOne((r) => r.url === apiUrl && r.params.get('pageSize') === '5');
    req.flush(mockPaged);

    expect(service.recentNotifications().length).toBe(1);
    expect(service.recentNotifications()[0].id).toBe('n1');
  });

  it('should get notification by id', () => {
    service.getById('n1').subscribe((res) => {
      expect(res.id).toBe('n1');
      expect(res.title).toBe('Test Notification');
    });

    const req = httpMock.expectOne(`${apiUrl}/n1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockNotification);
  });

  it('should mark notification as read and update signals', () => {
    service.unreadCount.set(2);
    service.recentNotifications.set([{ ...mockNotification }]);

    const readNotification: NotificationDto = {
      ...mockNotification,
      isRead: true,
      readAt: new Date().toISOString()
    };

    service.markAsRead('n1').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/n1/read`);
    expect(req.request.method).toBe('PUT');
    req.flush(readNotification);

    expect(service.unreadCount()).toBe(1);
    expect(service.recentNotifications()[0].isRead).toBe(true);
  });

  it('should mark all notifications as read and reset unread count', () => {
    service.unreadCount.set(3);
    service.recentNotifications.set([
      { ...mockNotification, id: 'n1', isRead: false },
      { ...mockNotification, id: 'n2', isRead: false }
    ]);

    service.markAllAsRead().subscribe();

    const req = httpMock.expectOne(`${apiUrl}/read-all`);
    expect(req.request.method).toBe('PUT');
    req.flush({ updatedCount: 2, message: 'All notifications marked as read' });

    expect(service.unreadCount()).toBe(0);
    expect(service.recentNotifications().every((n) => n.isRead)).toBe(true);
  });

  it('should delete notification and update signals', () => {
    service.unreadCount.set(1);
    service.recentNotifications.set([{ ...mockNotification, id: 'n1', isRead: false }]);

    service.deleteNotification('n1').subscribe();

    const req = httpMock.expectOne(`${apiUrl}/n1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(service.unreadCount()).toBe(0);
    expect(service.recentNotifications().length).toBe(0);
  });

  it('should return correct icon for notification type', () => {
    expect(service.getNotificationIcon(NotificationType.RegistrationConfirmed)).toBe('🎟️');
    expect(service.getNotificationIcon(NotificationType.PaymentSuccessful)).toBe('💳');
    expect(service.getNotificationIcon(NotificationType.PaymentFailed)).toBe('⚠️');
    expect(service.getNotificationIcon(NotificationType.TicketGenerated)).toBe('🎫');
    expect(service.getNotificationIcon(NotificationType.EventCancelled)).toBe('❌');
    expect(service.getNotificationIcon(NotificationType.System)).toBe('ℹ️');
  });

  it('should map notification entity type to correct navigation route', () => {
    expect(service.getNotificationNavigationUrl(mockNotification)).toBe('/my-registrations/reg-123');

    const eventNotif: NotificationDto = { ...mockNotification, relatedEntityType: 'Event', relatedEntityId: 'e-1' };
    expect(service.getNotificationNavigationUrl(eventNotif)).toBe('/events/e-1');

    const ticketNotif: NotificationDto = { ...mockNotification, relatedEntityType: 'Ticket', relatedEntityId: 't-1' };
    expect(service.getNotificationNavigationUrl(ticketNotif)).toBe('/tickets/t-1');

    const paymentNotif: NotificationDto = { ...mockNotification, relatedEntityType: 'Payment', relatedEntityId: 'p-1' };
    expect(service.getNotificationNavigationUrl(paymentNotif)).toBe('/registrations/p-1/payment');

    const noEntityNotif: NotificationDto = { ...mockNotification, relatedEntityType: null, relatedEntityId: null };
    expect(service.getNotificationNavigationUrl(noEntityNotif)).toBeNull();
  });

  it('should clear state on clearState()', () => {
    service.unreadCount.set(5);
    service.recentNotifications.set([mockNotification]);
    service.error.set('err');

    service.clearState();

    expect(service.unreadCount()).toBe(0);
    expect(service.recentNotifications()).toEqual([]);
    expect(service.error()).toBeNull();
  });
});
