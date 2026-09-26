import { Component, HostListener, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <!-- Backdrop overlay for mobile drawer -->
    @if (isOpen()) {
      <div
        class="sidebar-backdrop"
        aria-hidden="true"
        (click)="close.emit()"
      ></div>
    }

    <aside
      id="app-sidebar"
      class="app-sidebar"
      [class.is-open]="isOpen()"
      aria-label="Application Navigation"
    >
      <div class="sidebar-header">
        <div class="sidebar-brand">
          <span class="brand-icon" aria-hidden="true">📅</span>
          <span class="brand-title">Navigation</span>
        </div>
        <button
          type="button"
          class="sidebar-close-btn"
          aria-label="Close navigation sidebar"
          (click)="close.emit()"
        >
          &times;
        </button>
      </div>

      <nav class="sidebar-nav" aria-label="Role Aware Links">
        <!-- Section 1: General Discovery -->
        <div class="nav-section">
          <span class="nav-section-title">Events</span>
          <ul class="nav-list">
            <li>
              <a
                routerLink="/events"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="onLinkClick()"
                class="nav-link"
              >
                <span class="nav-icon" aria-hidden="true">🔍</span>
                <span>Discover Events</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Section 2: Attendee / User Workspace -->
        @if (authService.isAuthenticated()) {
          <div class="nav-section">
            <span class="nav-section-title">My Account</span>
            <ul class="nav-list">
              <li>
                <a
                  routerLink="/profile"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">👤</span>
                  <span>My Profile</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/my-registrations"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">📝</span>
                  <span>My Registrations</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/my-tickets"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">🎟️</span>
                  <span>My Tickets</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/notifications"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">🔔</span>
                  <span>Notifications</span>
                  @if (notificationService.unreadCount() > 0) {
                    <span class="badge badge-published badge-xs" style="margin-left: auto;">
                      {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
                    </span>
                  }
                </a>
              </li>
              <li>
                <a
                  routerLink="/my-feedback"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">⭐</span>
                  <span>My Reviews</span>
                </a>
              </li>
            </ul>
          </div>
        }

        <!-- Section 3: Organizer Workspace -->
        @if (authService.isOrganizer() || authService.isAdmin()) {
          <div class="nav-section">
            <div class="section-title-wrap">
              <span class="nav-section-title">Organizer Hub</span>
              <span class="badge badge-published badge-xs">Host</span>
            </div>
            <ul class="nav-list">
              <li>
                <a
                  routerLink="/organizer/dashboard"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">📊</span>
                  <span>Dashboard</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/organizer/events"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">📋</span>
                  <span>Manage Events</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/organizer/events/create"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">➕</span>
                  <span>Create Event</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/organizer/check-in"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">✅</span>
                  <span>Check-In Scanner</span>
                </a>
              </li>
            </ul>
          </div>
        }

        <!-- Section 3b: Staff Workspace (if Staff and neither Organizer nor Admin) -->
        @if (authService.isStaff() && !authService.isOrganizer() && !authService.isAdmin()) {
          <div class="nav-section">
            <div class="section-title-wrap">
              <span class="nav-section-title">Staff Operations</span>
              <span class="badge badge-published badge-xs">Staff</span>
            </div>
            <ul class="nav-list">
              <li>
                <a
                  routerLink="/organizer/check-in"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">✅</span>
                  <span>Check-In Scanner</span>
                </a>
              </li>
            </ul>
          </div>
        }

        <!-- Section 4: Administrator Workspace -->
        @if (authService.isAdmin()) {
          <div class="nav-section">
            <div class="section-title-wrap">
              <span class="nav-section-title">Admin Center</span>
              <span class="badge badge-completed badge-xs">Admin</span>
            </div>
            <ul class="nav-list">
              <li>
                <a
                  routerLink="/admin/dashboard"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">🛡️</span>
                  <span>Admin Overview</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin/users"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">👥</span>
                  <span>User Management</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin/roles"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">🔑</span>
                  <span>Role Permissions</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin/categories"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">🏷️</span>
                  <span>Categories</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin/venues"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">🏛️</span>
                  <span>Venues</span>
                </a>
              </li>
              <li>
                <a
                  routerLink="/admin/reports"
                  routerLinkActive="active"
                  (click)="onLinkClick()"
                  class="nav-link"
                >
                  <span class="nav-icon" aria-hidden="true">📈</span>
                  <span>Platform Reports</span>
                </a>
              </li>
            </ul>
          </div>
        }
      </nav>

      <!-- Sidebar footer with user info snippet -->
      @if (authService.isAuthenticated()) {
        <div class="sidebar-user-footer">
          <div class="user-info-snippet">
            <span class="avatar-sm" aria-hidden="true">
              {{ authService.currentUser()?.firstName?.charAt(0) || 'U' }}
            </span>
            <div class="user-meta">
              <span class="name">{{ authService.userFullName() }}</span>
              <span class="role">{{ authService.roles().join(', ') || 'Attendee' }}</span>
            </div>
          </div>
        </div>
      }
    </aside>
  `,
  styles: [`
    .sidebar-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.5);
      z-index: 1040;
      backdrop-filter: blur(1px);
    }

    .app-sidebar {
      position: fixed;
      top: var(--header-height);
      left: 0;
      bottom: 0;
      width: 260px;
      background-color: var(--bg-surface);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: 1050;
      transform: translateX(-100%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      overflow-y: auto;
    }

    .app-sidebar.is-open {
      transform: translateX(0);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-weight-semibold);
      font-size: var(--font-size-sm);
      color: var(--color-gray-800);
    }

    .sidebar-close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      color: var(--color-gray-500);
      padding: var(--space-1);
      line-height: 1;
    }

    .sidebar-close-btn:hover {
      color: var(--color-gray-900);
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--space-4) var(--space-2);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .nav-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .section-title-wrap {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--space-3);
      margin-bottom: var(--space-1);
    }

    .nav-section-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-400);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0 var(--space-3);
    }

    .section-title-wrap .nav-section-title {
      padding: 0;
    }

    .badge-xs {
      font-size: 10px;
      padding: 2px 6px;
    }

    .nav-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      color: var(--color-gray-700);
      text-decoration: none;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .nav-link:hover {
      background-color: var(--color-gray-100);
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .nav-link.active {
      background-color: var(--color-primary-50);
      color: var(--color-primary-700);
      font-weight: var(--font-weight-semibold);
    }

    .nav-icon {
      font-size: 1.1rem;
    }

    .sidebar-user-footer {
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--border-color);
      background-color: var(--color-gray-50);
    }

    .user-info-snippet {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary-600);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-xs);
    }

    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-meta .name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-800);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-meta .role {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Desktop Viewport >= 1024px */
    @media (min-width: 1024px) {
      .app-sidebar {
        transform: translateX(0);
      }

      .sidebar-backdrop,
      .sidebar-close-btn {
        display: none;
      }
    }
  `],
})
export class SidebarComponent {
  readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);

  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close.emit();
    }
  }

  onLinkClick(): void {
    // On touch/mobile screens, close the sidebar after link navigation
    if (window.innerWidth < 1024) {
      this.close.emit();
    }
  }
}
