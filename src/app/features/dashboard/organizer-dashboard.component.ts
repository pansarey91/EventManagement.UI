import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrganizerDashboardService } from '../../core/services/organizer-dashboard.service';
import {
  OrganizerDashboardDto,
  EventAnalyticsListDto,
  RegistrationReportDto,
  RevenueReportDto,
  EventStatus,
  DailyRegistrationTrendDto,
  DailyRevenueTrendDto
} from '../../core/models';
import { TrendChartComponent, TrendDataPoint } from './components/trend-chart.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

export type DateRangePreset = 'all' | '7d' | '30d' | '90d' | 'year' | 'custom';
export type TrendTab = 'registrations' | 'revenue';
export type ActivityTab = 'registrations' | 'payments' | 'checkins';

@Component({
  selector: 'app-organizer-dashboard',
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
      <!-- Dashboard Page Header -->
      <header class="dashboard-header">
        <div class="header-info">
          <h1 class="page-title">Organizer Command Center</h1>
          <p class="page-subtitle">
            Authoritative operational performance, revenue metrics, attendance, and attendee analytics.
          </p>
        </div>

        <div class="header-actions">
          <a routerLink="/organizer/events/create" class="btn btn-primary btn-sm">
            ➕ Create Event
          </a>
          <a routerLink="/organizer/events" class="btn btn-secondary btn-sm">
            📋 Manage Events
          </a>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            [disabled]="loading()"
            (click)="loadAllDashboardData()"
            aria-label="Refresh dashboard data"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      <!-- Date Range Controls Bar -->
      <section class="date-filter-bar card" aria-label="Dashboard Date Filters">
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
              <label for="start-date" class="date-label">From:</label>
              <input
                id="start-date"
                type="date"
                class="form-input date-input"
                [ngModel]="customStartDate()"
                (ngModelChange)="onCustomDateChange($event, customEndDate())"
              />
            </div>
            <div class="input-item">
              <label for="end-date" class="date-label">To:</label>
              <input
                id="end-date"
                type="date"
                class="form-input date-input"
                [ngModel]="customEndDate()"
                (ngModelChange)="onCustomDateChange(customStartDate(), $event)"
              />
            </div>
          </div>
        }
      </section>

      <!-- Main Content / Loading / Error / Empty States -->
      @if (loading()) {
        <div class="loading-wrapper">
          <app-loading-spinner [message]="'Aggregating organizer analytics...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to Load Organizer Dashboard'"
          [message]="error()!"
          (retry)="loadAllDashboardData()"
        ></app-error-state>
      } @else if (!dashboard() || dashboard()!.totalEvents === 0) {
        <app-empty-state
          icon="📅"
          title="No Events Found"
          message="You have not created any events yet. Create your first event to start accepting registrations, issuing tickets, and monitoring revenue!"
          actionLabel="Create Event"
          actionRoute="/organizer/events/create"
        ></app-empty-state>
      } @else {
        <!-- 6 KPI Summary Cards Grid -->
        <section class="kpi-grid" aria-label="Key Performance Indicators">
          <!-- 1. Events KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Total Events</span>
                <span class="kpi-icon" aria-hidden="true">📅</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalEvents ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-primary" title="Upcoming events">
                  {{ dashboard()?.upcomingEvents ?? 0 }} Upcoming
                </span>
                <span class="sub-pill" title="Published events">
                  {{ dashboard()?.publishedEvents ?? 0 }} Published
                </span>
                <span class="sub-pill" title="Draft events">
                  {{ dashboard()?.draftEvents ?? 0 }} Draft
                </span>
              </div>
            </div>
          </div>

          <!-- 2. Registrations KPI -->
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

          <!-- 3. Tickets Sold KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Tickets Issued / Sold</span>
                <span class="kpi-icon" aria-hidden="true">🎟️</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalTicketsSold ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill" title="Remaining ticket inventory">
                  {{ dashboard()?.remainingTicketInventory ?? 0 }} Available in stock
                </span>
              </div>
            </div>
          </div>

          <!-- 4. Revenue KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Collected Revenue</span>
                <span class="kpi-icon" aria-hidden="true">💳</span>
              </div>
              <div class="kpi-value text-success">
                {{ dashboard()?.totalRevenue | currency:'USD':'symbol':'1.2-2' }}
              </div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-success" title="Completed payments">
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
              </div>
            </div>
          </div>

          <!-- 5. Attendance KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Check-Ins / Attendance</span>
                <span class="kpi-icon" aria-hidden="true">✅</span>
              </div>
              <div class="kpi-value">{{ dashboard()?.totalAttendance ?? 0 }}</div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill pill-primary" title="Overall Check-in rate percentage">
                  {{ dashboard()?.attendanceRate | number:'1.1-1' }}% Check-in Rate
                </span>
                <span class="sub-pill text-muted">
                  of {{ dashboard()?.confirmedRegistrations ?? 0 }} confirmed
                </span>
              </div>
            </div>
          </div>

          <!-- 6. Attendee Feedback KPI -->
          <div class="kpi-card card">
            <div class="card-body">
              <div class="kpi-top">
                <span class="kpi-label">Attendee Rating</span>
                <span class="kpi-icon" aria-hidden="true">⭐</span>
              </div>
              <div class="kpi-value">
                @if ((dashboard()?.totalReviews ?? 0) > 0) {
                  {{ dashboard()?.averageRating | number:'1.1-1' }} <span class="rating-scale">/ 5.0</span>
                } @else {
                  <span class="no-rating">No reviews</span>
                }
              </div>
              <div class="kpi-sub-breakdown">
                <span class="sub-pill">
                  {{ dashboard()?.totalReviews ?? 0 }} Reviews recorded
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Interactive Trend Section (Charts) -->
        <section class="dashboard-section" aria-label="Activity Trends">
          <div class="section-tabs-header">
            <h2 class="section-heading">Activity & Trends Over Time</h2>
            <div class="trend-tabs" role="tablist">
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTrendTab() === 'registrations'"
                (click)="activeTrendTab.set('registrations')"
              >
                📝 Daily Registrations
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTrendTab() === 'revenue'"
                (click)="activeTrendTab.set('revenue')"
              >
                💳 Daily Revenue
              </button>
            </div>
          </div>

          @if (activeTrendTab() === 'registrations') {
            <app-trend-chart
              title="Daily Registrations Trend"
              [data]="registrationTrendData()"
              primaryLabel="Total Registrations"
              secondaryLabel="Confirmed"
              color="var(--color-primary-600, #2563eb)"
            />
          } @else {
            <app-trend-chart
              title="Daily Collected Revenue Trend"
              [data]="revenueTrendData()"
              valuePrefix="$"
              primaryLabel="Revenue Amount"
              secondaryLabel="Completed Transactions"
              color="var(--color-success-600, #16a34a)"
            />
          }
        </section>

        <!-- Upcoming Events Needing Attention -->
        <section class="dashboard-section" aria-label="Upcoming Events">
          <div class="section-header">
            <h2 class="section-heading">Upcoming Events</h2>
            <a routerLink="/organizer/events" class="view-all-link">View all events &rarr;</a>
          </div>

          @if (upcomingEvents().length === 0) {
            <div class="info-box card">
              <p>No upcoming events currently scheduled. Schedule new events to expand attendee reach.</p>
              <a routerLink="/organizer/events/create" class="btn btn-sm btn-primary">Create Event</a>
            </div>
          } @else {
            <div class="upcoming-grid">
              @for (evt of upcomingEvents(); track evt.eventId) {
                <article class="upcoming-card card">
                  <div class="upcoming-card-header">
                    <div>
                      <h3 class="upcoming-event-name">
                        <a [routerLink]="['/events', evt.eventId]">{{ evt.eventName }}</a>
                      </h3>
                      <span class="upcoming-event-venue text-muted">
                        📍 {{ evt.venueName || 'Online / To be announced' }}
                      </span>
                    </div>
                    <span class="badge badge-published badge-xs">{{ getStatusLabel(evt.status) }}</span>
                  </div>

                  <div class="upcoming-date">
                    🗓️ {{ evt.startDateTime | date:'mediumDate' }} • {{ evt.startDateTime | date:'shortTime' }}
                  </div>

                  <!-- Capacity bar -->
                  <div class="capacity-stat">
                    <div class="capacity-labels">
                      <span class="text-xs text-muted">Capacity Occupancy</span>
                      <span class="text-xs font-semibold">
                        {{ evt.confirmedRegistrations }} / {{ evt.maxCapacity }} ({{ getOccupancyPercentage(evt) }}%)
                      </span>
                    </div>
                    <div class="progress-bar-bg" aria-hidden="true">
                      <div
                        class="progress-bar-fill"
                        [style.width.%]="getOccupancyPercentage(evt)"
                        [class.progress-danger]="getOccupancyPercentage(evt) >= 90"
                      ></div>
                    </div>
                  </div>

                  <div class="upcoming-card-footer">
                    <span class="text-xs text-muted">
                      Revenue: <strong class="text-success">{{ evt.revenue | currency:'USD':'symbol':'1.0-0' }}</strong>
                    </span>
                    <div class="card-footer-actions">
                      <a [routerLink]="['/organizer/events', evt.eventId, 'ticket-types']" class="btn btn-xs btn-outline">
                        Tickets
                      </a>
                      <a [routerLink]="['/organizer/check-in']" [queryParams]="{ eventId: evt.eventId }" class="btn btn-xs btn-outline">
                        Scanner
                      </a>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <!-- Event Performance Table -->
        <section class="dashboard-section" aria-label="Event Performance">
          <div class="section-header">
            <h2 class="section-heading">Event Performance Overview</h2>
            <div class="table-search-box">
              <input
                type="search"
                class="form-input input-sm"
                placeholder="Filter by name, venue, category..."
                [ngModel]="eventSearchTerm()"
                (ngModelChange)="eventSearchTerm.set($event)"
                aria-label="Filter events table"
              />
            </div>
          </div>

          <div class="table-responsive card">
            <table class="performance-table" aria-label="Event Performance Statistics">
              <thead>
                <tr>
                  <th scope="col">Event & Category</th>
                  <th scope="col">Venue</th>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col" class="text-right">Capacity</th>
                  <th scope="col" class="text-right">Registrations</th>
                  <th scope="col" class="text-right">Attendance</th>
                  <th scope="col" class="text-right">Revenue</th>
                  <th scope="col" class="text-right">Rating</th>
                  <th scope="col" class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @if (filteredEventAnalytics().length === 0) {
                  <tr>
                    <td colspan="10" class="text-center py-6 text-muted">
                      No matching events found.
                    </td>
                  </tr>
                } @else {
                  @for (e of filteredEventAnalytics(); track e.eventId) {
                    <tr>
                      <td>
                        <div class="event-cell-name">
                          <a [routerLink]="['/events', e.eventId]" class="font-semibold text-primary">
                            {{ e.eventName }}
                          </a>
                          @if (e.categoryName) {
                            <span class="category-badge">{{ e.categoryName }}</span>
                          }
                        </div>
                      </td>
                      <td class="text-muted text-xs">{{ e.venueName || 'Online' }}</td>
                      <td class="text-xs whitespace-nowrap">{{ e.startDateTime | date:'MMM d, y' }}</td>
                      <td>
                        <span class="badge badge-published badge-xs">
                          {{ getStatusLabel(e.status) }}
                        </span>
                      </td>
                      <td class="text-right text-xs">
                        {{ e.confirmedRegistrations }} / {{ e.maxCapacity }}
                        <div class="text-muted font-normal text-2xs">
                          {{ getOccupancyPercentage(e) }}%
                        </div>
                      </td>
                      <td class="text-right font-medium">
                        {{ e.confirmedRegistrations }}
                        <span class="text-muted text-xs font-normal">({{ e.registrationCount }})</span>
                      </td>
                      <td class="text-right text-xs">
                        {{ e.attendanceCount }}
                        <div class="text-muted font-normal text-2xs">
                          {{ e.attendanceRate | number:'1.0-0' }}%
                        </div>
                      </td>
                      <td class="text-right font-semibold text-success">
                        {{ e.revenue | currency:'USD':'symbol':'1.0-0' }}
                      </td>
                      <td class="text-right text-xs">
                        @if (e.totalFeedbackCount > 0) {
                          <span>⭐ {{ e.averageRating | number:'1.1-1' }}</span>
                          <div class="text-muted text-2xs">({{ e.totalFeedbackCount }})</div>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td class="text-center">
                        <div class="action-buttons-cell">
                          <a
                            [routerLink]="['/organizer/events', e.eventId, 'ticket-types']"
                            class="btn btn-xs btn-outline"
                            title="Manage Tickets"
                          >
                            🎟️
                          </a>
                          <a
                            [routerLink]="['/organizer/check-in']"
                            [queryParams]="{ eventId: e.eventId }"
                            class="btn btn-xs btn-outline"
                            title="Check-in Scanner"
                          >
                            📱
                          </a>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Recent Activity Feeds (Registrations, Payments, Check-Ins) -->
        <section class="dashboard-section" aria-label="Recent Operational Activity">
          <div class="section-tabs-header">
            <h2 class="section-heading">Recent Operational Activity</h2>
            <div class="trend-tabs" role="tablist">
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeActivityTab() === 'registrations'"
                (click)="activeActivityTab.set('registrations')"
              >
                📝 Registrations ({{ dashboard()?.recentRegistrations?.length || 0 }})
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeActivityTab() === 'payments'"
                (click)="activeActivityTab.set('payments')"
              >
                💳 Payments ({{ dashboard()?.recentPayments?.length || 0 }})
              </button>
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeActivityTab() === 'checkins'"
                (click)="activeActivityTab.set('checkins')"
              >
                ✅ Check-Ins ({{ dashboard()?.recentCheckIns?.length || 0 }})
              </button>
            </div>
          </div>

          <div class="card activity-panel">
            @if (activeActivityTab() === 'registrations') {
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
                            <div class="text-muted text-xs">{{ r.attendeeEmail }}</div>
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
            } @else {
              @if ((dashboard()?.recentCheckIns?.length || 0) === 0) {
                <div class="empty-tab-text">No recent check-ins.</div>
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

    .date-input {
      font-size: var(--font-size-xs);
      padding: 4px 8px;
      height: 30px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    @media (min-width: 640px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .kpi-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .kpi-card {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      transition: box-shadow 0.15s ease;
    }

    .kpi-card:hover {
      box-shadow: var(--shadow-sm);
    }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-2);
    }

    .kpi-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: var(--font-weight-semibold);
    }

    .kpi-icon {
      font-size: 1.25rem;
    }

    .kpi-value {
      font-size: 1.75rem;
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin-bottom: var(--space-2);
      line-height: 1.2;
    }

    .kpi-sub-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .sub-pill {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
      background-color: var(--color-gray-100);
      color: var(--color-gray-700);
    }

    .pill-primary {
      background-color: #eff6ff;
      color: var(--color-primary-700);
    }

    .pill-success {
      background-color: #f0fdf4;
      color: var(--color-success-700);
    }

    .pill-warning {
      background-color: #fffbeb;
      color: #b45309;
    }

    .pill-danger {
      background-color: #fef2f2;
      color: var(--color-error-text);
    }

    .text-success {
      color: var(--color-success-700, #15803d);
    }

    .rating-scale {
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
      font-weight: normal;
    }

    .no-rating {
      font-size: var(--font-size-base);
      color: var(--color-gray-500);
      font-weight: normal;
    }

    .dashboard-section {
      margin-bottom: var(--space-8);
    }

    .section-header, .section-tabs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
      gap: var(--space-2);
      flex-wrap: wrap;
    }

    .section-heading {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .trend-tabs {
      display: flex;
      background-color: var(--color-gray-100);
      padding: 2px;
      border-radius: var(--radius-md);
      gap: 2px;
    }

    .tab-btn {
      padding: var(--space-1) var(--space-3);
      border: none;
      background: transparent;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
      cursor: pointer;
    }

    .tab-btn.active {
      background-color: #ffffff;
      color: var(--color-gray-900);
      box-shadow: var(--shadow-sm);
    }

    .view-all-link {
      font-size: var(--font-size-xs);
      color: var(--color-primary-600);
      text-decoration: none;
      font-weight: var(--font-weight-medium);
    }

    .view-all-link:hover {
      text-decoration: underline;
    }

    .upcoming-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: var(--space-4);
    }

    @media (min-width: 768px) {
      .upcoming-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .upcoming-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .upcoming-card {
      padding: var(--space-4);
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .upcoming-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2);
    }

    .upcoming-event-name {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      margin: 0 0 2px;
    }

    .upcoming-event-name a {
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .upcoming-event-name a:hover {
      color: var(--color-primary-600);
    }

    .upcoming-event-venue {
      font-size: 11px;
    }

    .upcoming-date {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
    }

    .capacity-stat {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .capacity-labels {
      display: flex;
      justify-content: space-between;
    }

    .progress-bar-bg {
      height: 6px;
      background-color: var(--color-gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background-color: var(--color-primary-600);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .progress-danger {
      background-color: var(--color-error-accent, #dc2626);
    }

    .upcoming-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: var(--space-2);
      border-top: 1px solid var(--border-color);
    }

    .card-footer-actions {
      display: flex;
      gap: var(--space-1);
    }

    .performance-table, .activity-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-xs);
    }

    .performance-table th,
    .performance-table td,
    .activity-table th,
    .activity-table td {
      padding: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .performance-table th,
    .activity-table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-700);
      font-weight: var(--font-weight-semibold);
      white-space: nowrap;
    }

    .event-cell-name {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .category-badge {
      font-size: 10px;
      color: var(--color-gray-500);
    }

    .text-2xs {
      font-size: 10px;
    }

    .whitespace-nowrap {
      white-space: nowrap;
    }

    .action-buttons-cell {
      display: flex;
      justify-content: center;
      gap: 4px;
    }

    .table-search-box {
      min-width: 220px;
    }

    .activity-panel {
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-2);
    }

    .empty-tab-text {
      padding: var(--space-6);
      text-align: center;
      color: var(--color-gray-500);
      font-size: var(--font-size-xs);
    }

    .info-box {
      padding: var(--space-6);
      text-align: center;
      background-color: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      color: var(--color-gray-600);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .loading-wrapper {
      display: flex;
      justify-content: center;
      padding: var(--space-12);
    }
  `]
})
export class OrganizerDashboardComponent implements OnInit {
  private readonly dashboardService = inject(OrganizerDashboardService);

  readonly dashboard = signal<OrganizerDashboardDto | null>(null);
  readonly eventsAnalytics = signal<EventAnalyticsListDto[]>([]);
  readonly registrationReport = signal<RegistrationReportDto | null>(null);
  readonly revenueReport = signal<RevenueReportDto | null>(null);

  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  // Filters & State
  readonly selectedPreset = signal<DateRangePreset>('all');
  readonly customStartDate = signal<string>('');
  readonly customEndDate = signal<string>('');
  readonly activeTrendTab = signal<TrendTab>('registrations');
  readonly activeActivityTab = signal<ActivityTab>('registrations');
  readonly eventSearchTerm = signal<string>('');

  ngOnInit(): void {
    this.loadAllDashboardData();
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
      // Keep existing custom dates
      start = this.customStartDate() || undefined;
      end = this.customEndDate() || undefined;
    }

    this.customStartDate.set(start || '');
    this.customEndDate.set(end || '');
    this.loadAllDashboardData(start, end);
  }

  onCustomDateChange(start: string, end: string): void {
    this.customStartDate.set(start);
    this.customEndDate.set(end);
    if (start && end) {
      this.loadAllDashboardData(start, end);
    }
  }

  loadAllDashboardData(startDate?: string, endDate?: string): void {
    this.loading.set(true);
    this.error.set(null);

    // Call summary, events, and report endpoints concurrently
    this.dashboardService.getOrganizerDashboard(startDate, endDate).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load dashboard data. Please check authorization.');
        this.loading.set(false);
      }
    });

    this.dashboardService.getEventsAnalytics(startDate, endDate).subscribe({
      next: (events) => {
        this.eventsAnalytics.set(events);
      },
      error: () => {}
    });

    this.dashboardService.getRegistrationReport(startDate, endDate).subscribe({
      next: (report) => {
        this.registrationReport.set(report);
      },
      error: () => {}
    });

    this.dashboardService.getRevenueReport(startDate, endDate).subscribe({
      next: (report) => {
        this.revenueReport.set(report);
      },
      error: () => {}
    });
  }

  readonly registrationTrendData = computed<TrendDataPoint[]>(() => {
    const timeline = this.registrationReport()?.timeline || [];
    return timeline.map((t: DailyRegistrationTrendDto) => ({
      label: this.formatDateLabel(t.date),
      value: t.totalRegistrations,
      secondaryValue: t.confirmedRegistrations
    }));
  });

  readonly revenueTrendData = computed<TrendDataPoint[]>(() => {
    const timeline = this.revenueReport()?.timeline || [];
    return timeline.map((t: DailyRevenueTrendDto) => ({
      label: this.formatDateLabel(t.date),
      value: t.amount,
      secondaryValue: t.transactionCount
    }));
  });

  readonly upcomingEvents = computed<EventAnalyticsListDto[]>(() => {
    const events = this.eventsAnalytics();
    const now = new Date();
    return events
      .filter((e) => e.status !== EventStatus.Cancelled && new Date(e.startDateTime) > now)
      .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
      .slice(0, 6);
  });

  readonly filteredEventAnalytics = computed<EventAnalyticsListDto[]>(() => {
    const events = this.eventsAnalytics();
    const search = this.eventSearchTerm().toLowerCase().trim();
    if (!search) return events;

    return events.filter(
      (e) =>
        e.eventName.toLowerCase().includes(search) ||
        (e.categoryName && e.categoryName.toLowerCase().includes(search)) ||
        (e.venueName && e.venueName.toLowerCase().includes(search))
    );
  });

  getOccupancyPercentage(evt: EventAnalyticsListDto): number {
    if (!evt.maxCapacity || evt.maxCapacity <= 0) return 0;
    return Math.min(100, Math.round((evt.confirmedRegistrations / evt.maxCapacity) * 100));
  }

  getStatusLabel(status: EventStatus): string {
    switch (status) {
      case EventStatus.Draft: return 'Draft';
      case EventStatus.Published: return 'Published';
      case EventStatus.Ongoing: return 'Ongoing';
      case EventStatus.Completed: return 'Completed';
      case EventStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  private formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : `${d.getMonth() + 1}/${d.getDate()}`;
  }
}
