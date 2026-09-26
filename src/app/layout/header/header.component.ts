import { Component, ElementRef, HostListener, inject, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationDto } from '../../core/models';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RelativeTimePipe],
  template: `
    <header class="site-header">
      <div class="header-inner">
        <div class="header-left">
          <!-- Sidebar Drawer Toggle -->
          <button
            type="button"
            class="sidebar-toggle-btn"
            aria-label="Toggle navigation sidebar"
            aria-controls="app-sidebar"
            (click)="toggleSidebar.emit()"
          >
            <span class="hamburger-icon" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>

          <!-- Brand Logo -->
          <a routerLink="/" class="brand" aria-label="EventSync Home">
            <span class="brand-icon" aria-hidden="true">📅</span>
            <span class="brand-name">EventSync</span>
          </a>
        </div>

        <!-- Top Navigation (Desktop fast links) -->
        <nav class="desktop-nav" aria-label="Quick Navigation">
          <a routerLink="/events" routerLinkActive="active" class="top-nav-link">
            Browse Events
          </a>
          @if (authService.isOrganizer() || authService.isAdmin()) {
            <a routerLink="/organizer/dashboard" routerLinkActive="active" class="top-nav-link">
              Organizer Hub
            </a>
          }
          @if (authService.isAdmin()) {
            <a routerLink="/admin/dashboard" routerLinkActive="active" class="top-nav-link">
              Admin Center
            </a>
          }
          @if (authService.isStaff() && !authService.isOrganizer() && !authService.isAdmin()) {
            <a routerLink="/organizer/check-in" routerLinkActive="active" class="top-nav-link">
              Check-In Scanner
            </a>
          }
        </nav>

        <!-- Header Actions: Notifications & Account -->
        <div class="header-actions">
          @if (authService.isAuthenticated()) {
            <!-- Notification Bell & Dropdown -->
            <div class="notification-wrapper">
              <button
                type="button"
                class="icon-btn"
                [attr.aria-label]="notificationService.unreadCount() > 0 
                  ? 'View notifications, ' + notificationService.unreadCount() + ' unread' 
                  : 'View notifications'"
                [attr.aria-expanded]="notificationsOpen()"
                (click)="toggleNotifications()"
              >
                <span class="bell-icon" aria-hidden="true">🔔</span>
                @if (notificationService.unreadCount() > 0) {
                  <span class="notification-badge" aria-hidden="true">
                    {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
                  </span>
                }
              </button>

              @if (notificationsOpen()) {
                <div class="dropdown-panel notifications-dropdown" role="region" aria-label="Notifications panel">
                  <div class="panel-header">
                    <div class="panel-header-left">
                      <span class="panel-title">Notifications</span>
                      @if (notificationService.unreadCount() > 0) {
                        <span class="badge badge-published badge-xs">
                          {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }} Unread
                        </span>
                      }
                    </div>
                    @if (notificationService.unreadCount() > 0) {
                      <button
                        type="button"
                        class="mark-all-btn"
                        (click)="markAllAsRead($event)"
                        title="Mark all as read"
                      >
                        Mark all read
                      </button>
                    }
                  </div>
                  <div class="notifications-list">
                    @if (notificationService.recentNotifications().length === 0) {
                      <div class="empty-notifications">
                        <span class="empty-icon" aria-hidden="true">🔔</span>
                        <p>No notifications yet</p>
                      </div>
                    } @else {
                      @for (notif of notificationService.recentNotifications(); track notif.id) {
                        <div
                          class="notification-item"
                          [class.unread]="!notif.isRead"
                          (click)="onNotificationClick(notif)"
                          role="button"
                          tabindex="0"
                          (keydown.enter)="onNotificationClick(notif)"
                          (keydown.space)="onNotificationClick(notif); $event.preventDefault()"
                        >
                          <span class="notif-icon" aria-hidden="true">
                            {{ notificationService.getNotificationIcon(notif.type) }}
                          </span>
                          <div class="notif-body">
                            <p class="notif-title">{{ notif.title }}</p>
                            <p class="notif-text">{{ notif.message }}</p>
                            <span class="notif-time">{{ notif.createdAt | relativeTime }}</span>
                          </div>
                        </div>
                      }
                    }
                  </div>
                  <div class="panel-footer">
                    <a routerLink="/notifications" (click)="closeDropdowns()" class="view-all-link">
                      View all notifications &rarr;
                    </a>
                  </div>
                </div>
              }
            </div>

            <!-- User Account Dropdown -->
            <div class="account-menu-wrapper">
              <button
                type="button"
                class="user-avatar-btn"
                [attr.aria-expanded]="accountMenuOpen()"
                aria-haspopup="true"
                aria-label="User account menu"
                (click)="toggleAccountMenu()"
              >
                <span class="avatar-circle" aria-hidden="true">
                  {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
                </span>
                <span class="user-display-name">{{ authService.currentUser()?.firstName }}</span>
                <span class="chevron" aria-hidden="true">▾</span>
              </button>

              @if (accountMenuOpen()) {
                <div class="dropdown-panel account-dropdown" role="menu" aria-label="User Options">
                  <div class="user-summary">
                    <span class="user-name">{{ authService.userFullName() }}</span>
                    <span class="user-email">{{ authService.currentUser()?.email }}</span>
                    <div class="user-roles">
                      @for (role of authService.roles(); track role) {
                        <span class="badge badge-published badge-xs">{{ role }}</span>
                      }
                    </div>
                  </div>

                  <div class="menu-divider" role="separator"></div>

                  <nav class="account-links">
                    <a routerLink="/profile" role="menuitem" (click)="closeDropdowns()" class="menu-item">
                      <span aria-hidden="true">👤</span>
                      <span>Profile Details</span>
                    </a>
                    <a routerLink="/my-registrations" role="menuitem" (click)="closeDropdowns()" class="menu-item">
                      <span aria-hidden="true">📝</span>
                      <span>My Registrations</span>
                    </a>
                    <a routerLink="/my-tickets" role="menuitem" (click)="closeDropdowns()" class="menu-item">
                      <span aria-hidden="true">🎟️</span>
                      <span>My Tickets</span>
                    </a>
                    <a routerLink="/my-feedback" role="menuitem" (click)="closeDropdowns()" class="menu-item">
                      <span aria-hidden="true">⭐</span>
                      <span>My Reviews</span>
                    </a>
                  </nav>

                  <div class="menu-divider" role="separator"></div>

                  <div class="menu-footer">
                    <button type="button" class="sign-out-btn" role="menuitem" (click)="signOut()">
                      <span aria-hidden="true">🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="auth-actions">
              <a routerLink="/login" class="btn btn-sm btn-secondary">Sign In</a>
              <a routerLink="/register" class="btn btn-sm btn-primary">Sign Up</a>
            </div>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .site-header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border-color);
      height: var(--header-height);
      position: sticky;
      top: 0;
      z-index: 1020;
      width: 100%;
    }

    .header-inner {
      height: 100%;
      padding: 0 var(--space-4);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .sidebar-toggle-btn {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-gray-700);
    }

    .sidebar-toggle-btn:hover {
      background-color: var(--color-gray-100);
      color: var(--color-gray-900);
    }

    .hamburger-icon {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 16px;
    }

    .hamburger-icon span {
      display: block;
      height: 2px;
      background-color: currentColor;
      border-radius: 1px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      text-decoration: none;
      color: var(--color-gray-900);
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-base);
    }

    .brand-icon {
      font-size: 1.25rem;
    }

    .desktop-nav {
      display: none;
      align-items: center;
      gap: var(--space-4);
    }

    .top-nav-link {
      color: var(--color-gray-600);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      transition: color 0.15s ease;
    }

    .top-nav-link:hover,
    .top-nav-link.active {
      color: var(--color-primary-600);
      text-decoration: none;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .icon-btn {
      position: relative;
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-gray-700);
    }

    .icon-btn:hover {
      background-color: var(--color-gray-100);
    }

    .bell-icon {
      font-size: 1rem;
    }

    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background-color: var(--color-error-accent);
      color: #ffffff;
      font-size: 10px;
      font-weight: var(--font-weight-bold);
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .notification-wrapper,
    .account-menu-wrapper {
      position: relative;
    }

    .user-avatar-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      background: none;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      padding: 3px var(--space-2) 3px 3px;
      cursor: pointer;
      color: var(--color-gray-800);
      font-family: inherit;
    }

    .user-avatar-btn:hover {
      background-color: var(--color-gray-50);
    }

    .avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary-600);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
    }

    .user-display-name {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      display: none;
    }

    .chevron {
      font-size: 10px;
      color: var(--color-gray-500);
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + var(--space-2));
      right: 0;
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: 1060;
      animation: fadeIn 0.15s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .notifications-dropdown {
      width: 320px;
      max-width: calc(100vw - 32px);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .panel-header-left {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .mark-all-btn {
      background: none;
      border: none;
      color: var(--color-primary-600);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }

    .mark-all-btn:hover {
      background-color: var(--color-primary-50);
      text-decoration: underline;
    }

    .panel-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-800);
    }

    .notifications-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s ease;
    }

    .notification-item:hover {
      background-color: var(--color-gray-50);
    }

    .notification-item:last-child {
      border-bottom: none;
    }

    .notification-item.unread {
      background-color: var(--color-primary-50);
    }

    .notif-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .notif-body {
      flex: 1;
      min-width: 0;
    }

    .notif-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0 0 2px 0;
    }

    .notif-text {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin: 0 0 4px 0;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notif-time {
      font-size: 10px;
      color: var(--color-gray-500);
    }

    .empty-notifications {
      padding: var(--space-6) var(--space-4);
      text-align: center;
      color: var(--color-gray-500);
    }

    .empty-icon {
      font-size: 1.75rem;
      display: block;
      margin-bottom: var(--space-2);
      opacity: 0.6;
    }

    .empty-notifications p {
      font-size: var(--font-size-xs);
      margin: 0;
    }

    .panel-footer {
      padding: var(--space-2) var(--space-4);
      border-top: 1px solid var(--border-color);
      text-align: center;
      background-color: var(--color-gray-50);
      border-bottom-left-radius: var(--radius-lg);
      border-bottom-right-radius: var(--radius-lg);
    }

    .view-all-link {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary-600);
      text-decoration: none;
      display: block;
      padding: var(--space-1);
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    .account-dropdown {
      width: 240px;
    }

    .user-summary {
      padding: var(--space-3) var(--space-4);
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
    }

    .user-email {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-roles {
      display: flex;
      gap: 4px;
      margin-top: var(--space-1);
    }

    .menu-divider {
      height: 1px;
      background-color: var(--border-color);
    }

    .account-links {
      padding: var(--space-1) 0;
      display: flex;
      flex-direction: column;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-4);
      color: var(--color-gray-700);
      text-decoration: none;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      transition: background-color 0.15s ease;
    }

    .menu-item:hover {
      background-color: var(--color-gray-100);
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .menu-footer {
      padding: var(--space-2) var(--space-3);
    }

    .sign-out-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border: none;
      background: none;
      color: var(--color-error-text);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: background-color 0.15s ease;
    }

    .sign-out-btn:hover {
      background-color: var(--color-error-bg);
    }

    .auth-actions {
      display: flex;
      gap: var(--space-2);
    }

    .badge-xs {
      font-size: 10px;
      padding: 2px 6px;
    }

    @media (min-width: 640px) {
      .user-display-name {
        display: inline;
      }
    }

    @media (min-width: 1024px) {
      .desktop-nav {
        display: flex;
      }
    }
  `],
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef);

  readonly toggleSidebar = output<void>();

  readonly notificationsOpen = signal<boolean>(false);
  readonly accountMenuOpen = signal<boolean>(false);

  toggleNotifications(): void {
    const opening = !this.notificationsOpen();
    this.notificationsOpen.set(opening);
    this.accountMenuOpen.set(false);
    if (opening) {
      this.notificationService.loadRecent(5).subscribe({ error: () => {} });
    }
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen.update((v) => !v);
    this.notificationsOpen.set(false);
  }

  closeDropdowns(): void {
    this.notificationsOpen.set(false);
    this.accountMenuOpen.set(false);
  }

  onNotificationClick(notif: NotificationDto): void {
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.id).subscribe({ error: () => {} });
    }
    this.closeDropdowns();
    const navUrl = this.notificationService.getNotificationNavigationUrl(notif);
    if (navUrl) {
      this.router.navigateByUrl(navUrl);
    }
  }

  markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllAsRead().subscribe({ error: () => {} });
  }

  signOut(): void {
    this.closeDropdowns();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdowns();
    }
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    this.closeDropdowns();
  }
}
