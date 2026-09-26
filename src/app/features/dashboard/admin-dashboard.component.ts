import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService } from '../../core/services/admin-dashboard.service';
import {
  AdminDashboardDto,
  DailyRegistrationTrendDto,
  DailyRevenueTrendDto
} from '../../core/models';
import { TrendChartComponent, TrendDataPoint } from './components/trend-chart.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | 'year' | 'custom';
export type AdminTrendTab = 'registrations' | 'revenue';
export type AdminActivityTab = 'users' | 'registrations' | 'payments' | 'checkins' | 'feedback';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    TrendChartComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="dashboard-page-container">
      <!-- Admin Header -->
      <header class="dashboard-header">
        <div class="header-info">
          <div class="title-row">
            <h1 class="page-title">Platform Administration Center</h1>
            <span class="badge badge-completed badge-sm">Platform Scope</span>
          </div>
          <p class="page-subtitle">
            System-wide operational oversight, platform revenue, user governance, and administrative intelligence.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/admin/users" class="btn btn-outline btn-sm">
            👥 Users
          </a>
          <a routerLink="/admin/roles" class="btn btn-outline btn-sm">
            🔑 Roles
          </a>
          <a routerLink="/admin/categories" class="btn btn-outline btn-sm">
            🏷️ Categories
          </a>
          <a routerLink="/admin/venues" class="btn btn-outline btn-sm">
            📍 Venues
          </a>
          <a routerLink="/admin/reports" class="btn btn-outline btn-sm">
            📑 Reports
          </a>
          <button
            type="button"
            class="btn btn-primary btn-sm"
            [disabled]="loading()"
            (click)="loadDashboardData()"
            aria-label="Refresh admin dashboard data"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      <!-- Date Range Controls Bar -->
      <section class="date-filter-bar card" aria-label="Administrative Date Range Filter">
        <div class="preset-group" role="tablist" aria-label="Date range presets">
          <button
            type="button"
            class="preset-btn"
            [class.active]="selectedPreset() === 'all'"
            (click)="setPreset('all')"
          >
            All Time
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="selectedPreset() === '7d'"
            (click)="setPreset('7d')"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="selectedPreset() === '30d'"
            (click)="setPreset('30d')"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="selectedPreset() === '90d'"
            (click)="setPreset('90d')"
          >
            Last 90 Days
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="selectedPreset() === 'year'"
            (click)="setPreset('year')"
          >
            This Year
          </button>
          <button
            type="button"
            class="preset-btn"
            [class.active]="selectedPreset() === 'custom'"
            (click)="setPreset('custom')"
          >
            Custom Range
          </button>
        </div>

        @if (selectedPreset() === 'custom') {
          <div class="custom-date-inputs">
            <div class="input-item">
              <label for="custom-start-date" class="date-label">From:</label>
              <input
                id="custom-start-date"
                type="date"
                class="form-input input-sm"
                [ngModel]="customStartDate()"
                (ngModelChange)="onCustomDateChange($event, customEndDate())"
              />
            </div>
            <div class="input-item">
              <label for="custom-end-date" class="date-label">To:</label>
              <input
                id="custom-end-date"
                type="date"
                class="form-input input-sm"
                [ngModel]="customEndDate()"
                (ngModelChange)="onCustomDateChange(customStartDate(), $event)"
              />
            </div>
          </div>
        }
      </section>

      <!-- Main Content Area -->
      @if (loading()) {
        <div class="loading-wrapper" aria-busy="true" aria-label="Loading admin dashboard metrics">
          <app-loading-spinner [message]="'Gathering platform-wide metrics...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to Load Admin Dashboard'"
          [message]="error()!"
          (retry)="loadDashboardData()"
        ></app-error-state>
      } @else if (!dashboard() || (dashboard()!.totalUsers === 0 && dashboard()!.totalEvents === 0)) {
        <app-empty-state
          icon="🛡️"
          title="Platform Database Empty"
          message="No users or events exist in the database yet. As events and users are registered, metrics will appear here."
          actionLabel="Refresh Data"
          (action)="loadDashboardData()"
        ></app-empty-state>
      } @else {
        <!-- 7 Platform KPI Cards Grid -->
        <section class="kpi-grid" aria-label="Platform Key Performance Indicators">
          <!-- 1. Users KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Platform Users</span>
                <span class="kpi-icon" aria-hidden="true">👥</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalUsers ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-success" title="Active users">
                  {{ dashboard()?.activeUsers ?? 0 }} Active
                </span>
                <span class="sub-pill text-muted" title="Inactive users">
                  {{ dashboard()?.inactiveUsers ?? 0 }} Inactive
                </span>
                @if (selectedPreset() !== 'all') {
                  <span class="sub-pill pill-primary" title="New users joined in period">
                    +{{ dashboard()?.newUsersInPeriod ?? 0 }} New
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- 2. Events KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Platform Events</span>
                <span class="kpi-icon" aria-hidden="true">📅</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalEvents ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-primary" title="Upcoming events">
                  {{ dashboard()?.upcomingEvents ?? 0 }} Upcoming
                </span>
                <span class="sub-pill" title="Published events">
                  {{ dashboard()?.publishedEvents ?? 0 }} Live
                </span>
                <span class="sub-pill text-muted" title="Draft events">
                  {{ dashboard()?.draftEvents ?? 0 }} Draft
                </span>
              </div>
            </div>
          </div>

          <!-- 3. Registrations KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Registrations</span>
                <span class="kpi-icon" aria-hidden="true">📝</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalRegistrations ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-success" title="Confirmed registrations">
                  {{ dashboard()?.confirmedRegistrations ?? 0 }} Confirmed
                </span>
                <span class="sub-pill pill-warning" title="Pending registrations">
                  {{ dashboard()?.pendingRegistrations ?? 0 }} Pending
                </span>
                <span class="sub-pill text-muted" title="Cancelled registrations">
                  {{ dashboard()?.cancelledRegistrations ?? 0 }} Cancelled
                </span>
              </div>
            </div>
          </div>

          <!-- 4. Tickets KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Tickets Issued</span>
                <span class="kpi-icon" aria-hidden="true">🎟️</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalTicketsSold ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-success" title="Tickets checked in / used">
                  {{ dashboard()?.usedTickets ?? 0 }} Used ({{ dashboard()?.ticketCheckInRate ?? 0 }}%)
                </span>
                <span class="sub-pill" title="Available stock inventory">
                  {{ dashboard()?.availableTicketInventory ?? 0 }} In Stock
                </span>
              </div>
            </div>
          </div>

          <!-- 5. Revenue KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Platform Revenue</span>
                <span class="kpi-icon" aria-hidden="true">💳</span>
              </div>
              <div class="kpi-value text-success">
                {{ dashboard()?.totalRevenue | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-success" title="Successful payments">
                  {{ dashboard()?.successfulPayments ?? 0 }} Paid
                </span>
                @if ((dashboard()?.pendingPayments ?? 0) > 0) {
                  <span class="sub-pill pill-warning" title="Pending payments">
                    {{ dashboard()?.pendingPayments }} Pending
                  </span>
                }
                @if ((dashboard()?.failedPayments ?? 0) > 0) {
                  <span class="sub-pill pill-danger" title="Failed payments">
                    {{ dashboard()?.failedPayments }} Failed
                  </span>
                }
                @if ((dashboard()?.refundedPayments ?? 0) > 0) {
                  <span class="sub-pill text-muted" title="Refunded payments">
                    {{ dashboard()?.refundedPayments }} Refunded
                  </span>
                }
              </div>
            </div>
          </div>

          <!-- 6. Attendance KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Check-Ins Recorded</span>
                <span class="kpi-icon" aria-hidden="true">✅</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalAttendance ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-primary" title="Overall platform attendance rate">
                  {{ dashboard()?.overallAttendanceRate ?? 0 }}% Admittance Rate
                </span>
              </div>
            </div>
          </div>

          <!-- 7. Feedback KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Platform Ratings</span>
                <span class="kpi-icon" aria-hidden="true">⭐</span>
              </div>
              <div class="kpi-value">
                {{ dashboard()?.averageRating ?? 0 }} <span class="text-sm font-normal text-muted">/ 5.0</span>
              </div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-warning" title="Total verified attendee reviews">
                  {{ dashboard()?.totalFeedback ?? 0 }} Total Reviews
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Trend Visualizations Section -->
        <section class="dashboard-section" aria-label="Platform Trend Analysis">
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-heading">Platform Trends</h2>
              <span class="section-subtext">Historical registration growth and financial volume</span>
            </div>

            <div class="tab-pill-group" role="tablist" aria-label="Select trend metric">
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeTrendTab() === 'registrations'"
                (click)="activeTrendTab.set('registrations')"
                role="tab"
                [attr.aria-selected]="activeTrendTab() === 'registrations'"
              >
                📝 Registration Growth
              </button>
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeTrendTab() === 'revenue'"
                (click)="activeTrendTab.set('revenue')"
                role="tab"
                [attr.aria-selected]="activeTrendTab() === 'revenue'"
              >
                💳 Revenue Velocity
              </button>
            </div>
          </div>

          @if (activeTrendTab() === 'registrations') {
            <app-trend-chart
              [title]="'Platform Registration Volume'"
              [data]="registrationTrendData()"
              [primaryLabel]="'Total Registrations'"
              [secondaryLabel]="'Confirmed'"
              [color]="'var(--color-primary-600, #2563eb)'"
            ></app-trend-chart>
          } @else {
            <app-trend-chart
              [title]="'Platform Revenue Timeline ($)'"
              [data]="revenueTrendData()"
              [valuePrefix]="'$'"
              [primaryLabel]="'Gross Revenue'"
              [secondaryLabel]="'Transactions'"
              [color]="'var(--color-success-600, #16a34a)'"
            ></app-trend-chart>
          }
        </section>

        <!-- Platform Breakdown Panels Grid (2-column layout) -->
        <div class="grid grid-cols-1 grid-cols-lg-2 analytics-panels-grid">
          <!-- 1. Users by Role -->
          <div class="panel-card card">
            <div class="card-body">
              <div class="panel-card-header">
                <h3 class="panel-title">👥 Users by Role</h3>
                <span class="text-xs text-muted">{{ dashboard()?.usersByRole?.length || 0 }} Roles</span>
              </div>
              @if ((dashboard()?.usersByRole?.length || 0) === 0) {
                <div class="empty-panel-text">No role distribution data.</div>
              } @else {
                <div class="role-list">
                  @for (r of dashboard()?.usersByRole; track r.roleName) {
                    <div class="role-item">
                      <div class="role-meta">
                        <span class="font-medium">{{ r.roleName }}</span>
                        <span class="text-xs text-muted">{{ r.count }} users</span>
                      </div>
                      <div class="progress-bar-bg" aria-hidden="true">
                        <div
                          class="progress-bar-fill"
                          [style.width.%]="getRolePercentage(r.count)"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- 2. Events by Category -->
          <div class="panel-card card">
            <div class="card-body">
              <div class="panel-card-header">
                <h3 class="panel-title">🏷️ Events by Category</h3>
                <span class="text-xs text-muted">{{ dashboard()?.eventsByCategory?.length || 0 }} Categories</span>
              </div>
              @if ((dashboard()?.eventsByCategory?.length || 0) === 0) {
                <div class="empty-panel-text">No category statistics recorded.</div>
              } @else {
                <div class="category-list">
                  @for (c of dashboard()?.eventsByCategory; track c.categoryId) {
                    <div class="category-item">
                      <div class="category-meta">
                        <span class="font-medium">{{ c.categoryName }}</span>
                        <span class="text-xs text-muted">{{ c.eventCount }} events • {{ c.registrationCount }} registrations</span>
                      </div>
                      <div class="progress-bar-bg" aria-hidden="true">
                        <div
                          class="progress-bar-fill fill-category"
                          [style.width.%]="getCategoryPercentage(c.eventCount)"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- 3. Feedback Rating Distribution -->
          <div class="panel-card card">
            <div class="card-body">
              <div class="panel-card-header">
                <h3 class="panel-title">⭐ Rating Distribution</h3>
                <span class="text-xs text-muted">Average: {{ dashboard()?.averageRating ?? 0 }} / 5.0</span>
              </div>
              @if ((dashboard()?.totalFeedback || 0) === 0) {
                <div class="empty-panel-text">No attendee feedback submitted yet.</div>
              } @else {
                <div class="rating-list">
                  @for (star of [5, 4, 3, 2, 1]; track star) {
                    <div class="rating-row">
                      <span class="rating-label">{{ star }} ★</span>
                      <div class="progress-bar-bg" aria-hidden="true">
                        <div
                          class="progress-bar-fill fill-star"
                          [style.width.%]="getRatingPercentage(getRatingCount(star))"
                        ></div>
                      </div>
                      <span class="rating-count">{{ getRatingCount(star) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- 4. Top Organizers -->
          <div class="panel-card card">
            <div class="card-body">
              <div class="panel-card-header">
                <h3 class="panel-title">👑 Top Organizers</h3>
                <span class="text-xs text-muted">By Revenue & Activity</span>
              </div>
              @if ((dashboard()?.topOrganizers?.length || 0) === 0) {
                <div class="empty-panel-text">No organizer activity recorded.</div>
              } @else {
                <div class="table-responsive">
                  <table class="compact-table">
                    <thead>
                      <tr>
                        <th>Organizer</th>
                        <th class="text-right">Events</th>
                        <th class="text-right">Attendees</th>
                        <th class="text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (org of dashboard()?.topOrganizers; track org.organizerId) {
                        <tr>
                          <td>
                            <strong>{{ org.organizerName }}</strong>
                            <div class="text-muted text-2xs">{{ org.organizerEmail }}</div>
                          </td>
                          <td class="text-right text-xs">{{ org.eventCount }}</td>
                          <td class="text-right text-xs">{{ org.totalRegistrations }}</td>
                          <td class="text-right text-xs font-semibold text-success">
                            {{ org.totalRevenue | currency:'USD':'symbol':'1.0-0' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Top Performing Events System-Wide -->
        <section class="dashboard-section" aria-label="Top Performing Events">
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-heading">🏆 Top Performing Events System-Wide</h2>
              <span class="section-subtext">Highest platform attendance and revenue generation</span>
            </div>
          </div>

          @if ((dashboard()?.topEvents?.length || 0) === 0) {
            <div class="card p-6 text-center text-muted">No top events available.</div>
          } @else {
            <div class="grid grid-cols-1 grid-cols-sm-2 grid-cols-lg-3 top-events-grid">
              @for (evt of dashboard()?.topEvents; track evt.eventId; let i = $index) {
                <article class="top-event-card card">
                  <div class="card-body">
                    <div class="event-rank-badge">#{{ i + 1 }}</div>
                    <h3 class="top-event-name" [title]="evt.eventName">{{ evt.eventName }}</h3>
                    <div class="top-event-stats">
                      <div class="stat-item">
                        <span class="stat-label">Registrations</span>
                        <span class="stat-num">{{ evt.registrationCount }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Admitted</span>
                        <span class="stat-num">{{ evt.attendanceCount }}</span>
                      </div>
                      <div class="stat-item">
                        <span class="stat-label">Revenue</span>
                        <span class="stat-num text-success">{{ evt.revenue | currency:'USD':'symbol':'1.0-0' }}</span>
                      </div>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <!-- Platform Activity Streams (Tabbed Interface) -->
        <section class="dashboard-section" aria-label="Platform Activity Audit">
          <div class="section-header">
            <div class="section-title-wrap">
              <h2 class="section-heading">Live Platform Activity</h2>
              <span class="section-subtext">Authoritative operational audit stream</span>
            </div>

            <div class="tab-pill-group" role="tablist" aria-label="Select audit stream">
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeActivityTab() === 'users'"
                (click)="activeActivityTab.set('users')"
                role="tab"
                [attr.aria-selected]="activeActivityTab() === 'users'"
              >
                👥 Users
              </button>
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeActivityTab() === 'registrations'"
                (click)="activeActivityTab.set('registrations')"
                role="tab"
                [attr.aria-selected]="activeActivityTab() === 'registrations'"
              >
                📝 Registrations
              </button>
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeActivityTab() === 'payments'"
                (click)="activeActivityTab.set('payments')"
                role="tab"
                [attr.aria-selected]="activeActivityTab() === 'payments'"
              >
                💳 Payments
              </button>
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeActivityTab() === 'checkins'"
                (click)="activeActivityTab.set('checkins')"
                role="tab"
                [attr.aria-selected]="activeActivityTab() === 'checkins'"
              >
                ✅ Check-ins
              </button>
              <button
                type="button"
                class="tab-pill"
                [class.active]="activeActivityTab() === 'feedback'"
                (click)="activeActivityTab.set('feedback')"
                role="tab"
                [attr.aria-selected]="activeActivityTab() === 'feedback'"
              >
                ⭐ Feedback
              </button>
            </div>
          </div>

          <div class="activity-panel">
            @if (activeActivityTab() === 'users') {
              @if ((dashboard()?.recentUsers?.length || 0) === 0) {
                <div class="empty-tab-text">No recent user records.</div>
              } @else {
                <div class="table-responsive">
                  <table class="activity-table">
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email</th>
                        <th>Assigned Roles</th>
                        <th>Status</th>
                        <th>Registered Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (u of dashboard()?.recentUsers; track u.userId) {
                        <tr>
                          <td><strong>{{ u.fullName }}</strong></td>
                          <td class="text-xs text-muted">{{ u.email }}</td>
                          <td>
                            @for (role of u.roles; track role) {
                              <span class="badge badge-published badge-xs mr-1">{{ role }}</span>
                            }
                          </td>
                          <td>
                            <span class="badge badge-xs" [class.badge-confirmed]="u.isActive" [class.badge-cancelled]="!u.isActive">
                              {{ u.isActive ? 'Active' : 'Inactive' }}
                            </span>
                          </td>
                          <td class="text-xs text-muted">{{ u.createdAt | date:'mediumDate' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            } @else if (activeActivityTab() === 'registrations') {
              @if ((dashboard()?.recentRegistrations?.length || 0) === 0) {
                <div class="empty-tab-text">No recent registrations.</div>
              } @else {
                <div class="table-responsive">
                  <table class="activity-table">
                    <thead>
                      <tr>
                        <th>Registration #</th>
                        <th>Attendee</th>
                        <th>Event</th>
                        <th>Tickets</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (r of dashboard()?.recentRegistrations; track r.registrationId) {
                        <tr>
                          <td class="font-mono text-xs">{{ r.registrationNumber }}</td>
                          <td>
                            <strong>{{ r.attendeeName }}</strong>
                            <div class="text-muted text-2xs">{{ r.attendeeEmail }}</div>
                          </td>
                          <td class="text-xs">{{ r.eventName }}</td>
                          <td class="text-xs">{{ r.quantity }} ticket(s)</td>
                          <td>
                            <span class="badge badge-published badge-xs">{{ r.status }}</span>
                          </td>
                          <td class="text-xs text-muted">{{ r.registeredAt | date:'mediumDate' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            } @else if (activeActivityTab() === 'payments') {
              @if ((dashboard()?.recentPayments?.length || 0) === 0) {
                <div class="empty-tab-text">No recent payments.</div>
              } @else {
                <div class="table-responsive">
                  <table class="activity-table">
                    <thead>
                      <tr>
                        <th>Event</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (p of dashboard()?.recentPayments; track p.paymentId) {
                        <tr>
                          <td class="text-xs">{{ p.eventName }}</td>
                          <td class="font-semibold text-success">{{ p.amount | currency:'USD':'symbol':'1.2-2' }}</td>
                          <td class="text-xs">{{ p.paymentMethod }}</td>
                          <td>
                            <span class="badge badge-published badge-xs">{{ p.status }}</span>
                          </td>
                          <td class="text-xs text-muted">{{ p.createdAt | date:'mediumDate' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            } @else if (activeActivityTab() === 'checkins') {
              @if ((dashboard()?.recentCheckIns?.length || 0) === 0) {
                <div class="empty-tab-text">No recent check-ins recorded.</div>
              } @else {
                <div class="table-responsive">
                  <table class="activity-table">
                    <thead>
                      <tr>
                        <th>Attendee</th>
                        <th>Event</th>
                        <th>Ticket #</th>
                        <th>Checked-In At</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (c of dashboard()?.recentCheckIns; track c.attendanceId) {
                        <tr>
                          <td><strong>{{ c.attendeeName }}</strong></td>
                          <td class="text-xs">{{ c.eventName }}</td>
                          <td class="font-mono text-xs">{{ c.ticketNumber }}</td>
                          <td class="text-xs text-muted">{{ c.checkedInAt | date:'medium' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            } @else {
              @if ((dashboard()?.recentFeedbacks?.length || 0) === 0) {
                <div class="empty-tab-text">No recent reviews submitted.</div>
              } @else {
                <div class="table-responsive">
                  <table class="activity-table">
                    <thead>
                      <tr>
                        <th>Attendee</th>
                        <th>Event</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (f of dashboard()?.recentFeedbacks; track f.feedbackId) {
                        <tr>
                          <td><strong>{{ f.attendeeName }}</strong></td>
                          <td class="text-xs">{{ f.eventName }}</td>
                          <td class="text-xs font-semibold text-warning">
                            {{ f.rating }} ★
                          </td>
                          <td class="text-xs comment-cell">
                            {{ f.comment || '(No comment provided)' }}
                          </td>
                          <td class="text-xs text-muted whitespace-nowrap">{{ f.createdAt | date:'mediumDate' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard-page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-4) var(--space-4) var(--space-8);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      margin-bottom: var(--space-5);
      flex-wrap: wrap;
    }

    .header-info {
      flex: 1;
      min-width: 280px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
      flex-wrap: wrap;
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .page-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .date-filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-6);
      gap: var(--space-3);
      flex-wrap: wrap;
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    .preset-group {
      display: flex;
      background-color: var(--color-gray-100);
      padding: 3px;
      border-radius: var(--radius-md);
      gap: 2px;
      flex-wrap: wrap;
    }

    .preset-btn {
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

    .preset-btn.active {
      background-color: #ffffff;
      color: var(--color-gray-900);
      box-shadow: var(--shadow-sm);
    }

    .custom-date-inputs {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .input-item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .date-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .kpi-card {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      border-left: 4px solid var(--color-primary-600, #2563eb);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-1);
    }

    .kpi-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .kpi-icon {
      font-size: 1.25rem;
    }

    .kpi-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin-bottom: var(--space-2);
      line-height: 1.2;
    }

    .kpi-sub-breakdown {
      display: flex;
      gap: var(--space-1);
      flex-wrap: wrap;
      align-items: center;
    }

    .sub-pill {
      font-size: 11px;
      padding: 1px 6px;
      border-radius: var(--radius-full);
      background-color: var(--color-gray-100);
      color: var(--color-gray-700);
    }

    .pill-success {
      background-color: #dcfce7;
      color: #15803d;
    }

    .pill-primary {
      background-color: #dbeafe;
      color: #1d4ed8;
    }

    .pill-warning {
      background-color: #fef3c7;
      color: #b45309;
    }

    .pill-danger {
      background-color: #fee2e2;
      color: #b91c1c;
    }

    .dashboard-section {
      margin-bottom: var(--space-8);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .section-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .section-heading {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .section-subtext {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .tab-pill-group {
      display: flex;
      background-color: var(--color-gray-100);
      padding: 3px;
      border-radius: var(--radius-md);
      gap: 2px;
      flex-wrap: wrap;
    }

    .tab-pill {
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

    .tab-pill.active {
      background-color: #ffffff;
      color: var(--color-gray-900);
      box-shadow: var(--shadow-sm);
    }

    .analytics-panels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .panel-card {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }

    .panel-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--border-color);
    }

    .panel-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-800);
      margin: 0;
    }

    .role-list,
    .category-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .role-item,
    .category-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .role-meta,
    .category-meta {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
    }

    .progress-bar-bg {
      height: 6px;
      background-color: var(--color-gray-100);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: var(--color-primary-600, #2563eb);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .fill-category {
      background-color: #8b5cf6;
    }

    .fill-star {
      background-color: #f59e0b;
    }

    .rating-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .rating-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
    }

    .rating-label {
      width: 32px;
      font-weight: 500;
      color: var(--color-gray-700);
    }

    .rating-row .progress-bar-bg {
      flex: 1;
    }

    .rating-count {
      width: 24px;
      text-align: right;
      color: var(--color-gray-500);
      font-size: 11px;
    }

    .compact-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-xs);
    }

    .compact-table th,
    .compact-table td {
      padding: var(--space-2) var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .compact-table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-600);
      font-weight: var(--font-weight-semibold);
    }

    .top-events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: var(--space-4);
    }

    .top-event-card {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      position: relative;
      overflow: hidden;
    }

    .event-rank-badge {
      position: absolute;
      top: 10px;
      right: 12px;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-600);
      background-color: var(--color-primary-50, #eff6ff);
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }

    .top-event-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-3);
      padding-right: 36px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .top-event-stats {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid var(--border-color);
      padding-top: var(--space-2);
      gap: var(--space-1);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-label {
      font-size: 10px;
      color: var(--color-gray-500);
      text-transform: uppercase;
    }

    .stat-num {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
    }

    .activity-panel {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-2);
    }

    .activity-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-xs);
    }

    .activity-table th,
    .activity-table td {
      padding: var(--space-3);
      border-bottom: 1px solid var(--border-color);
      text-align: left;
    }

    .activity-table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-600);
      font-weight: var(--font-weight-semibold);
    }

    .empty-panel-text,
    .empty-tab-text {
      padding: var(--space-6);
      text-align: center;
      color: var(--color-gray-500);
      font-size: var(--font-size-xs);
    }

    .comment-cell {
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-2xs {
      font-size: 10px;
    }

    .mr-1 {
      margin-right: 4px;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      padding: var(--space-12);
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminDashboardService);

  readonly dashboard = signal<AdminDashboardDto | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Filters & State
  readonly selectedPreset = signal<DateRangePreset>('all');
  readonly customStartDate = signal<string>('');
  readonly customEndDate = signal<string>('');
  readonly activeTrendTab = signal<AdminTrendTab>('registrations');
  readonly activeActivityTab = signal<AdminActivityTab>('users');

  ngOnInit(): void {
    this.loadDashboardData();
  }

  setPreset(preset: DateRangePreset): void {
    this.selectedPreset.set(preset);

    const today = new Date();
    let start: string | undefined;
    let end: string | undefined;

    if (preset === '7d') {
      const d = new Date();
      d.setDate(today.getDate() - 7);
      start = d.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (preset === '30d') {
      const d = new Date();
      d.setDate(today.getDate() - 30);
      start = d.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (preset === '90d') {
      const d = new Date();
      d.setDate(today.getDate() - 90);
      start = d.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (preset === 'year') {
      const d = new Date(today.getFullYear(), 0, 1);
      start = d.toISOString().split('T')[0];
      end = today.toISOString().split('T')[0];
    } else if (preset === 'custom') {
      start = this.customStartDate() || undefined;
      end = this.customEndDate() || undefined;
    }

    this.customStartDate.set(start || '');
    this.customEndDate.set(end || '');
    this.loadDashboardData(start, end);
  }

  onCustomDateChange(start: string, end: string): void {
    this.customStartDate.set(start);
    this.customEndDate.set(end);
    if (start && end) {
      this.loadDashboardData(start, end);
    }
  }

  loadDashboardData(startDate?: string, endDate?: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getAdminDashboard(startDate, endDate).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load platform admin dashboard data.');
        this.loading.set(false);
      }
    });
  }

  readonly registrationTrendData = computed<TrendDataPoint[]>(() => {
    const timeline = this.dashboard()?.dailyRegistrationTrends || [];
    return timeline.map((t: DailyRegistrationTrendDto) => ({
      label: this.formatDateLabel(t.date),
      value: t.totalRegistrations,
      secondaryValue: t.confirmedRegistrations
    }));
  });

  readonly revenueTrendData = computed<TrendDataPoint[]>(() => {
    const timeline = this.dashboard()?.dailyRevenueTrends || [];
    return timeline.map((t: DailyRevenueTrendDto) => ({
      label: this.formatDateLabel(t.date),
      value: t.amount,
      secondaryValue: t.transactionCount
    }));
  });

  getRolePercentage(count: number): number {
    const total = this.dashboard()?.totalUsers || 1;
    return Math.min(100, Math.round((count / total) * 100));
  }

  getCategoryPercentage(eventCount: number): number {
    const total = this.dashboard()?.totalEvents || 1;
    return Math.min(100, Math.round((eventCount / total) * 100));
  }

  getRatingCount(rating: number): number {
    const distribution = this.dashboard()?.ratingDistribution || [];
    const item = distribution.find((d) => d.rating === rating);
    return item ? item.count : 0;
  }

  getRatingPercentage(count: number): number {
    const total = this.dashboard()?.totalFeedback || 1;
    return Math.min(100, Math.round((count / total) * 100));
  }

  private formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : `${d.getMonth() + 1}/${d.getDate()}`;
  }
}
