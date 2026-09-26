import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto, NotificationType, NotificationQueryDto } from '../../core/models';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RelativeTimePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="notifications-page-container">
      <header class="page-header">
        <div class="page-header-title">
          <h1 class="page-title">Notification Center</h1>
          <p class="page-subtitle">
            Stay updated with your event registrations, payments, tickets, and platform notices.
          </p>
        </div>
        <div class="page-header-actions">
          @if (notificationService.unreadCount() > 0) {
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              [disabled]="loading() || actionInProgress() !== null"
              (click)="markAllAsRead()"
            >
              ✓ Mark all as read
            </button>
          }
          <button
            type="button"
            class="btn btn-outline btn-sm"
            [disabled]="loading()"
            (click)="loadNotifications()"
            aria-label="Refresh notifications"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      <!-- Filter Controls Bar -->
      <section class="filter-bar card" aria-label="Notification Filters">
        <div class="filter-group-status" role="tablist" aria-label="Read status filter">
          <button
            type="button"
            class="filter-tab"
            role="tab"
            [class.active]="unreadFilter() === 'all'"
            [attr.aria-selected]="unreadFilter() === 'all'"
            (click)="setUnreadFilter('all')"
          >
            All
          </button>
          <button
            type="button"
            class="filter-tab"
            role="tab"
            [class.active]="unreadFilter() === 'unread'"
            [attr.aria-selected]="unreadFilter() === 'unread'"
            (click)="setUnreadFilter('unread')"
          >
            Unread
            @if (notificationService.unreadCount() > 0) {
              <span class="tab-badge">{{ notificationService.unreadCount() }}</span>
            }
          </button>
          <button
            type="button"
            class="filter-tab"
            role="tab"
            [class.active]="unreadFilter() === 'read'"
            [attr.aria-selected]="unreadFilter() === 'read'"
            (click)="setUnreadFilter('read')"
          >
            Read
          </button>
        </div>

        <div class="filter-controls-right">
          <!-- Type Filter -->
          <div class="filter-item">
            <label for="type-select" class="sr-only">Filter by type</label>
            <select
              id="type-select"
              class="form-select select-sm"
              [ngModel]="typeFilter()"
              (ngModelChange)="setTypeFilter($event)"
            >
              <option value="all">All Categories</option>
              <option [value]="NotificationType.RegistrationConfirmed">Registration Confirmed</option>
              <option [value]="NotificationType.RegistrationCancelled">Registration Cancelled</option>
              <option [value]="NotificationType.PaymentSuccessful">Payment Successful</option>
              <option [value]="NotificationType.PaymentFailed">Payment Failed</option>
              <option [value]="NotificationType.EventPublished">Event Published</option>
              <option [value]="NotificationType.EventCancelled">Event Cancelled</option>
              <option [value]="NotificationType.EventReminder">Event Reminder</option>
              <option [value]="NotificationType.TicketGenerated">Ticket Generated</option>
              <option [value]="NotificationType.CheckInConfirmed">Check-In Confirmed</option>
              <option [value]="NotificationType.System">System</option>
            </select>
          </div>

          <!-- Search Input -->
          <div class="filter-item search-input-wrapper">
            <input
              type="search"
              class="form-input input-sm"
              placeholder="Search notifications..."
              [ngModel]="searchTerm()"
              (ngModelChange)="onSearchChange($event)"
              aria-label="Search notifications"
            />
            @if (searchTerm()) {
              <button
                type="button"
                class="search-clear-btn"
                (click)="onSearchChange('')"
                aria-label="Clear search"
              >
                ✕
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Main Content Area -->
      @if (loading()) {
        <div class="loading-wrapper">
          <app-loading-spinner [message]="'Loading notifications...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to Load Notifications'"
          [message]="error()!"
          (retry)="loadNotifications()"
        ></app-error-state>
      } @else if (notifications().length === 0) {
        <app-empty-state
          [icon]="emptyIcon"
          [title]="emptyTitle"
          [message]="emptyMessage"
          [actionLabel]="hasActiveFilters ? 'Reset Filters' : null"
          (action)="resetFilters()"
        ></app-empty-state>
      } @else {
        <!-- Notification Cards List -->
        <div class="notifications-list" role="feed" aria-label="Notifications feed">
          @for (notif of notifications(); track notif.id) {
            <article
              class="notification-card card"
              [class.unread]="!notif.isRead"
              [class.processing]="actionInProgress() === notif.id"
            >
              <div class="notification-icon-col">
                <span class="type-icon" aria-hidden="true">
                  {{ notificationService.getNotificationIcon(notif.type) }}
                </span>
                @if (!notif.isRead) {
                  <span class="unread-dot" title="Unread notification" aria-label="Unread"></span>
                }
              </div>

              <div class="notification-main">
                <div class="notification-header-row">
                  <h2 class="notification-title">{{ notif.title }}</h2>
                  <div class="notification-meta">
                    <span
                      class="notification-time"
                      [title]="notif.createdAt | date: 'medium'"
                    >
                      {{ notif.createdAt | relativeTime }}
                    </span>
                  </div>
                </div>

                <p class="notification-message">{{ notif.message }}</p>

                <div class="notification-footer">
                  @if (getEntityButtonLabel(notif); as buttonLabel) {
                    <button
                      type="button"
                      class="btn btn-xs btn-primary"
                      (click)="navigateToEntity(notif)"
                    >
                      {{ buttonLabel }} &rarr;
                    </button>
                  }

                  <div class="notification-actions">
                    @if (!notif.isRead) {
                      <button
                        type="button"
                        class="btn-text"
                        [disabled]="actionInProgress() === notif.id"
                        (click)="markAsRead(notif)"
                      >
                        Mark as read
                      </button>
                    }
                    <button
                      type="button"
                      class="btn-text btn-delete"
                      [disabled]="actionInProgress() === notif.id"
                      (click)="deleteNotification(notif)"
                      aria-label="Delete notification"
                      title="Delete notification"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>

        <!-- Pagination Controls -->
        <footer class="pagination-bar" aria-label="Notifications pagination">
          <div class="pagination-info">
            Showing {{ paginationRangeStart() }} - {{ paginationRangeEnd() }} of {{ totalCount() }}
          </div>

          <div class="pagination-actions">
            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="!hasPreviousPage() || loading()"
              (click)="goToPage(pageNumber() - 1)"
              aria-label="Previous page"
            >
              &larr; Previous
            </button>
            <span class="page-indicator">
              Page {{ pageNumber() }} of {{ totalPages() || 1 }}
            </span>
            <button
              type="button"
              class="btn btn-outline btn-sm"
              [disabled]="!hasNextPage() || loading()"
              (click)="goToPage(pageNumber() + 1)"
              aria-label="Next page"
            >
              Next &rarr;
            </button>
          </div>
        </footer>
      }
    </div>
  `,
  styles: [`
    .notifications-page-container {
      max-width: 900px;
      margin: 0 auto;
      padding: var(--space-4) var(--space-4) var(--space-8);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
    }

    .page-header-title {
      flex: 1;
      min-width: 260px;
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-1);
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    .page-header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-4);
      gap: var(--space-3);
      flex-wrap: wrap;
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    .filter-group-status {
      display: flex;
      background-color: var(--color-gray-100);
      padding: 3px;
      border-radius: var(--radius-md);
      gap: 2px;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-1) var(--space-3);
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-tab.active {
      background-color: #ffffff;
      color: var(--color-gray-900);
      box-shadow: var(--shadow-sm);
    }

    .tab-badge {
      background-color: var(--color-primary-600);
      color: #ffffff;
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      padding: 1px 5px;
      border-radius: var(--radius-full);
    }

    .filter-controls-right {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      justify-content: flex-end;
      min-width: 240px;
    }

    .select-sm, .input-sm {
      padding: var(--space-1) var(--space-2);
      font-size: var(--font-size-xs);
      height: 32px;
    }

    .search-input-wrapper {
      position: relative;
      min-width: 180px;
      max-width: 240px;
      flex: 1;
    }

    .search-clear-btn {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 11px;
      color: var(--color-gray-400);
      cursor: pointer;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
    }

    .notification-card {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background-color: #ffffff;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .notification-card:hover {
      box-shadow: var(--shadow-sm);
    }

    .notification-card.unread {
      border-left: 4px solid var(--color-primary-600);
      background-color: #fafcff;
    }

    .notification-card.processing {
      opacity: 0.6;
      pointer-events: none;
    }

    .notification-icon-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      flex-shrink: 0;
      padding-top: 2px;
    }

    .type-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary-600);
    }

    .notification-main {
      flex: 1;
      min-width: 0;
    }

    .notification-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .notification-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .notification-time {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      white-space: nowrap;
    }

    .notification-message {
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
      margin: 0 0 var(--space-3);
      line-height: 1.5;
    }

    .notification-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .notification-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-left: auto;
    }

    .btn-text {
      background: none;
      border: none;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary-600);
      cursor: pointer;
      padding: 0;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    .btn-delete {
      color: var(--color-error-text);
    }

    .btn-xs {
      padding: 3px 8px;
      font-size: 11px;
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      padding: var(--space-8);
    }

    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3) 0;
      flex-wrap: wrap;
    }

    .pagination-info {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    }

    .pagination-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .page-indicator {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      font-weight: var(--font-weight-medium);
    }
  `]
})
export class NotificationCenterComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly NotificationType = NotificationType;

  readonly notifications = signal<NotificationDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly actionInProgress = signal<string | null>(null);

  // Filters & Pagination
  readonly unreadFilter = signal<'all' | 'unread' | 'read'>('all');
  readonly typeFilter = signal<number | 'all'>('all');
  readonly searchTerm = signal<string>('');
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(1);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: NotificationQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: 'createdAt',
      sortDirection: 'desc'
    };

    if (this.unreadFilter() === 'unread') {
      query.isRead = false;
    } else if (this.unreadFilter() === 'read') {
      query.isRead = true;
    }

    if (this.typeFilter() !== 'all') {
      query.type = Number(this.typeFilter());
    }

    if (this.searchTerm().trim()) {
      query.search = this.searchTerm().trim();
    }

    this.notificationService.getNotifications(query).subscribe({
      next: (result) => {
        this.notifications.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.hasPreviousPage.set(result.hasPreviousPage);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load notifications. Please try again.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.pageNumber.set(1);
    this.loadNotifications();
  }

  setUnreadFilter(filter: 'all' | 'unread' | 'read'): void {
    this.unreadFilter.set(filter);
    this.pageNumber.set(1);
    this.loadNotifications();
  }

  setTypeFilter(type: string | number): void {
    this.typeFilter.set(type === 'all' ? 'all' : Number(type));
    this.pageNumber.set(1);
    this.loadNotifications();
  }

  resetFilters(): void {
    this.unreadFilter.set('all');
    this.typeFilter.set('all');
    this.searchTerm.set('');
    this.pageNumber.set(1);
    this.loadNotifications();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.pageNumber.set(page);
    this.loadNotifications();
  }

  markAsRead(notification: NotificationDto): void {
    this.actionInProgress.set(notification.id);
    this.notificationService.markAsRead(notification.id).subscribe({
      next: (updated) => {
        this.notifications.update((list) =>
          list.map((n) => (n.id === notification.id ? { ...n, isRead: true, readAt: updated.readAt } : n))
        );
        this.actionInProgress.set(null);
      },
      error: () => {
        this.actionInProgress.set(null);
      }
    });
  }

  markAllAsRead(): void {
    this.actionInProgress.set('all');
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
        this.actionInProgress.set(null);
        if (this.unreadFilter() === 'unread') {
          this.loadNotifications();
        }
      },
      error: () => {
        this.actionInProgress.set(null);
      }
    });
  }

  deleteNotification(notification: NotificationDto): void {
    this.actionInProgress.set(notification.id);
    this.notificationService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications.update((list) => list.filter((n) => n.id !== notification.id));
        this.totalCount.update((count) => Math.max(0, count - 1));
        this.actionInProgress.set(null);
      },
      error: () => {
        this.actionInProgress.set(null);
      }
    });
  }

  navigateToEntity(notification: NotificationDto): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
    const navUrl = this.notificationService.getNotificationNavigationUrl(notification);
    if (navUrl) {
      this.router.navigateByUrl(navUrl);
    }
  }

  getEntityButtonLabel(notification: NotificationDto): string | null {
    if (!notification.relatedEntityType || !notification.relatedEntityId) {
      return null;
    }
    const type = notification.relatedEntityType.toLowerCase();
    switch (type) {
      case 'registration':
        return 'View Registration';
      case 'event':
        return 'View Event';
      case 'payment':
        return 'View Payment';
      case 'ticket':
        return 'View Ticket';
      default:
        return 'View Details';
    }
  }

  paginationRangeStart(): number {
    if (this.totalCount() === 0) return 0;
    return (this.pageNumber() - 1) * this.pageSize() + 1;
  }

  paginationRangeEnd(): number {
    return Math.min(this.pageNumber() * this.pageSize(), this.totalCount());
  }

  get emptyIcon(): string {
    return this.unreadFilter() === 'unread' ? '🎉' : '🔔';
  }

  get emptyTitle(): string {
    return this.unreadFilter() === 'unread' ? 'All caught up!' : 'No Notifications';
  }

  get emptyMessage(): string {
    return this.unreadFilter() === 'unread'
      ? 'There are no unread notifications for your account.'
      : 'You have no notifications matching your current filters.';
  }

  get hasActiveFilters(): boolean {
    return this.unreadFilter() !== 'all' || this.typeFilter() !== 'all' || !!this.searchTerm();
  }
}
