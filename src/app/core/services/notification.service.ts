import { Injectable, inject, signal, effect, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subscription, timer, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NotificationDto,
  NotificationQueryDto,
  NotificationType,
  PagedResultDto,
  UnreadCountDto,
  MarkAllAsReadResultDto
} from '../models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiBaseUrl}/notifications`;

  readonly unreadCount = signal<number>(0);
  readonly recentNotifications = signal<NotificationDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  private pollingSubscription?: Subscription;
  private readonly pollIntervalMs = 60000;

  constructor() {
    // React to auth status changes
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth) {
        this.refreshUnreadCount();
        this.loadRecent(5).subscribe({ error: () => {} });
        this.startPolling();
      } else {
        this.stopPolling();
        this.clearState();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  startPolling(): void {
    this.stopPolling();
    this.pollingSubscription = timer(this.pollIntervalMs, this.pollIntervalMs).pipe(
      tap(() => {
        if (this.authService.isAuthenticated()) {
          this.refreshUnreadCount();
        }
      })
    ).subscribe();
  }

  stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  clearState(): void {
    this.unreadCount.set(0);
    this.recentNotifications.set([]);
    this.loading.set(false);
    this.error.set(null);
  }

  refreshUnreadCount(): void {
    if (!this.authService.isAuthenticated()) return;
    this.getUnreadCount().subscribe({
      next: (res) => this.unreadCount.set(res.unreadCount),
      error: () => {} // Silent fail on background count check
    });
  }

  getUnreadCount(): Observable<UnreadCountDto> {
    return this.http.get<UnreadCountDto>(`${this.apiUrl}/unread-count`).pipe(
      tap((res) => this.unreadCount.set(res.unreadCount))
    );
  }

  getNotifications(query?: NotificationQueryDto): Observable<PagedResultDto<NotificationDto>> {
    let params = new HttpParams();
    if (query) {
      if (query.pageNumber !== undefined) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize !== undefined) params = params.set('pageSize', query.pageSize.toString());
      if (query.isRead !== undefined) params = params.set('isRead', query.isRead.toString());
      if (query.type !== undefined) params = params.set('type', query.type.toString());
      if (query.fromDate) params = params.set('fromDate', query.fromDate);
      if (query.toDate) params = params.set('toDate', query.toDate);
      if (query.search?.trim()) params = params.set('search', query.search.trim());
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);
      if (query.sortDescending !== undefined) params = params.set('sortDescending', query.sortDescending.toString());
    }

    return this.http.get<PagedResultDto<NotificationDto>>(this.apiUrl, { params });
  }

  loadRecent(limit: number = 5): Observable<PagedResultDto<NotificationDto>> {
    return this.getNotifications({ pageNumber: 1, pageSize: limit, sortBy: 'createdAt', sortDirection: 'desc' }).pipe(
      tap((res) => {
        this.recentNotifications.set(res.items);
      })
    );
  }

  getById(id: string): Observable<NotificationDto> {
    return this.http.get<NotificationDto>(`${this.apiUrl}/${id}`);
  }

  markAsRead(id: string): Observable<NotificationDto> {
    return this.http.put<NotificationDto>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap((updated) => {
        this.unreadCount.update((count) => Math.max(0, count - 1));
        this.recentNotifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, isRead: true, readAt: updated.readAt || new Date().toISOString() } : n))
        );
      })
    );
  }

  markAllAsRead(): Observable<MarkAllAsReadResultDto> {
    return this.http.put<MarkAllAsReadResultDto>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCount.set(0);
        this.recentNotifications.update((list) =>
          list.map((n) => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
        );
      })
    );
  }

  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const item = this.recentNotifications().find((n) => n.id === id);
        if (item && !item.isRead) {
          this.unreadCount.update((count) => Math.max(0, count - 1));
        }
        this.recentNotifications.update((list) => list.filter((n) => n.id !== id));
      })
    );
  }

  getNotificationIcon(type: NotificationType): string {
    switch (type) {
      case NotificationType.RegistrationConfirmed:
        return '🎟️';
      case NotificationType.RegistrationCancelled:
        return '🚫';
      case NotificationType.PaymentSuccessful:
        return '💳';
      case NotificationType.PaymentFailed:
        return '⚠️';
      case NotificationType.EventPublished:
        return '📢';
      case NotificationType.EventCancelled:
        return '❌';
      case NotificationType.EventReminder:
        return '⏰';
      case NotificationType.TicketGenerated:
        return '🎫';
      case NotificationType.CheckInConfirmed:
        return '✅';
      case NotificationType.System:
      default:
        return 'ℹ️';
    }
  }

  getNotificationNavigationUrl(notification: NotificationDto): string | null {
    if (!notification.relatedEntityType || !notification.relatedEntityId) {
      return null;
    }
    const type = notification.relatedEntityType.toLowerCase();
    switch (type) {
      case 'registration':
        return `/my-registrations/${notification.relatedEntityId}`;
      case 'event':
        return `/events/${notification.relatedEntityId}`;
      case 'payment':
        return `/registrations/${notification.relatedEntityId}/payment`;
      case 'ticket':
        return `/tickets/${notification.relatedEntityId}`;
      default:
        return null;
    }
  }
}
