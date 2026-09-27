import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminDashboardService } from '../../core/services/admin-dashboard.service';
import { EventService } from '../../core/services/event.service';
import {
  RevenueReportDto,
  RegistrationReportDto,
  AttendanceReportDto,
  EventDto,
  ApiError,
} from '../../core/models';
import { TrendChartComponent, TrendDataPoint } from '../dashboard/components/trend-chart.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

export type ReportType = 'revenue' | 'registrations' | 'attendance';
export type DatePreset = 'all' | '7d' | '30d' | '90d' | 'year' | 'custom';

@Component({
  selector: 'app-platform-reports',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DecimalPipe,
    FormsModule,
    TrendChartComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="reports-container">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Platform Reports & Analytics</h1>
            <p class="page-subtitle">
              Comprehensive financial breakdown, registration velocity, and verified attendance rates.
            </p>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="btn btn-outline-secondary btn-sm"
              [disabled]="loading()"
              (click)="loadActiveReport()"
              aria-label="Refresh report data"
            >
              <span class="btn-icon" aria-hidden="true">🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Report Type Navigation Tabs -->
      <section class="report-nav-tabs" aria-label="Select report type" role="tablist">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeReport() === 'revenue'"
          (click)="setActiveReport('revenue')"
          role="tab"
          [attr.aria-selected]="activeReport() === 'revenue'"
          aria-controls="report-panel-revenue"
        >
          <span class="tab-icon" aria-hidden="true">💰</span>
          <span>Revenue Report</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeReport() === 'registrations'"
          (click)="setActiveReport('registrations')"
          role="tab"
          [attr.aria-selected]="activeReport() === 'registrations'"
          aria-controls="report-panel-registrations"
        >
          <span class="tab-icon" aria-hidden="true">📝</span>
          <span>Registration Breakdown</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeReport() === 'attendance'"
          (click)="setActiveReport('attendance')"
          role="tab"
          [attr.aria-selected]="activeReport() === 'attendance'"
          aria-controls="report-panel-attendance"
        >
          <span class="tab-icon" aria-hidden="true">🎟️</span>
          <span>Attendance & Check-Ins</span>
        </button>
      </section>

      <!-- Filters & Controls Bar -->
      <section class="controls-card" aria-label="Report Filters and Parameters">
        <div class="controls-row">
          <!-- Date Presets -->
          <div class="filter-group">
            <span class="filter-label">Date Range</span>
            <div class="preset-pill-group" role="group" aria-label="Date range presets">
              <button
                type="button"
                class="preset-pill"
                [class.active]="selectedPreset() === 'all'"
                (click)="setPreset('all')"
              >
                All Time
              </button>
              <button
                type="button"
                class="preset-pill"
                [class.active]="selectedPreset() === '7d'"
                (click)="setPreset('7d')"
              >
                7 Days
              </button>
              <button
                type="button"
                class="preset-pill"
                [class.active]="selectedPreset() === '30d'"
                (click)="setPreset('30d')"
              >
                30 Days
              </button>
              <button
                type="button"
                class="preset-pill"
                [class.active]="selectedPreset() === '90d'"
                (click)="setPreset('90d')"
              >
                90 Days
              </button>
              <button
                type="button"
                class="preset-pill"
                [class.active]="selectedPreset() === 'year'"
                (click)="setPreset('year')"
              >
                This Year
              </button>
              <button
                type="button"
                class="preset-pill"
                [class.active]="selectedPreset() === 'custom'"
                (click)="setPreset('custom')"
              >
                Custom Range
              </button>
            </div>
          </div>

          <!-- Event Filter Selector -->
          <div class="filter-group event-selector-group">
            <label for="event-filter" class="filter-label">Event Scope</label>
            <select
              id="event-filter"
              class="form-select event-select"
              [value]="selectedEventId()"
              (change)="onEventChange($event)"
              aria-label="Filter report by event"
            >
              <option value="">All Platform Events (System Scope)</option>
              @for (ev of events(); track ev.id) {
                <option [value]="ev.id">{{ ev.name }}</option>
              }
            </select>
          </div>
        </div>

        <!-- Custom Date Range Row -->
        @if (selectedPreset() === 'custom') {
          <div class="custom-dates-row">
            <div class="custom-date-item">
              <label for="custom-start-date" class="date-input-label">Start Date</label>
              <input
                id="custom-start-date"
                type="date"
                class="form-control"
                [value]="startDate()"
                (change)="onStartDateChange($event)"
                aria-label="Report start date"
              />
            </div>
            <div class="custom-date-item">
              <label for="custom-end-date" class="date-input-label">End Date</label>
              <input
                id="custom-end-date"
                type="date"
                class="form-control"
                [value]="endDate()"
                (change)="onEndDateChange($event)"
                aria-label="Report end date"
              />
            </div>
          </div>
        }

        <!-- Date Validation Error -->
        @if (dateValidationError()) {
          <div class="date-validation-alert" role="alert">
            <span class="alert-icon" aria-hidden="true">⚠️</span>
            <span>{{ dateValidationError() }}</span>
          </div>
        }
      </section>

      <!-- Main Report Content -->
      @if (loading()) {
        <div class="loading-state-wrapper" aria-busy="true" aria-label="Generating report">
          <app-loading-spinner [message]="'Compiling ' + activeReportTitle() + '...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to load ' + activeReportTitle()"
          [message]="error()!"
          (retry)="loadActiveReport()"
        ></app-error-state>
      } @else {
        <!-- VIEW A: REVENUE REPORT -->
        @if (activeReport() === 'revenue') {
          <div id="report-panel-revenue" role="tabpanel" aria-labelledby="revenue-tab">
            <!-- Revenue KPI Summary Cards -->
            <div class="kpi-grid">
              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-green-subtle">
                  <span class="kpi-icon" aria-hidden="true">💵</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Total Revenue</span>
                  <span class="kpi-num text-success">
                    {{ revenueReport()?.totalRevenue ?? 0 | currency:'USD':'symbol':'1.2-2' }}
                  </span>
                  <span class="kpi-meta">Gross ticket sales volume</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-blue-subtle">
                  <span class="kpi-icon" aria-hidden="true">✅</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Successful Payments</span>
                  <span class="kpi-num">{{ revenueReport()?.successfulPaymentCount ?? 0 }}</span>
                  <span class="kpi-meta">Completed transactions</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-yellow-subtle">
                  <span class="kpi-icon" aria-hidden="true">⏳</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Pending Payments</span>
                  <span class="kpi-num text-warning">{{ revenueReport()?.pendingPaymentCount ?? 0 }}</span>
                  <span class="kpi-meta">Awaiting payment settlement</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-red-subtle">
                  <span class="kpi-icon" aria-hidden="true">❌</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Failed Payments</span>
                  <span class="kpi-num text-danger">{{ revenueReport()?.failedPaymentCount ?? 0 }}</span>
                  <span class="kpi-meta">Declined or aborted attempts</span>
                </div>
              </div>
            </div>

            <!-- Revenue Timeline Chart -->
            <div class="chart-section">
              <app-trend-chart
                title="Revenue & Transaction Trend"
                [data]="revenueChartData()"
                primaryLabel="Revenue ($)"
                secondaryLabel="Transactions"
                valuePrefix="$"
                chartColor="var(--color-primary-600, #4f46e5)"
                secondaryColor="var(--color-success, #10b981)"
              ></app-trend-chart>
            </div>

            <!-- Event-Level Revenue Breakdown Table -->
            <div class="table-card card">
              <div class="table-header">
                <h2 class="table-heading">Event Revenue Breakdown</h2>
                <span class="table-badge">{{ revenueReport()?.events?.length ?? 0 }} events</span>
              </div>
              <div class="table-container">
                <table class="table" aria-label="Event-Level Revenue Breakdown">
                  <thead>
                    <tr>
                      <th scope="col" style="width: 45%;">Event Name</th>
                      <th scope="col" style="width: 25%; text-align: center;">Completed Payments</th>
                      <th scope="col" style="width: 30%; text-align: right;">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ev of revenueReport()?.events; track ev.eventId) {
                      <tr>
                        <td class="event-name-cell">
                          <span class="event-icon" aria-hidden="true">🎪</span>
                          <span class="event-name">{{ ev.eventName }}</span>
                        </td>
                        <td style="text-align: center;">
                          <span class="badge badge-neutral">{{ ev.successfulPaymentCount }}</span>
                        </td>
                        <td style="text-align: right;" class="font-semibold text-success">
                          {{ ev.revenue | currency:'USD':'symbol':'1.2-2' }}
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="3" class="table-empty-row">
                          No revenue activity recorded for the selected parameters.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- VIEW B: REGISTRATION REPORT -->
        @if (activeReport() === 'registrations') {
          <div id="report-panel-registrations" role="tabpanel" aria-labelledby="registrations-tab">
            <!-- Registration KPI Summary Cards -->
            <div class="kpi-grid">
              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-purple-subtle">
                  <span class="kpi-icon" aria-hidden="true">📋</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Total Registrations</span>
                  <span class="kpi-num">{{ registrationReport()?.totalRegistrations ?? 0 }}</span>
                  <span class="kpi-meta">All registration attempts</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-green-subtle">
                  <span class="kpi-icon" aria-hidden="true">✅</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Confirmed Registrations</span>
                  <span class="kpi-num text-success">{{ registrationReport()?.confirmedRegistrations ?? 0 }}</span>
                  <span class="kpi-meta">Active confirmed tickets</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-yellow-subtle">
                  <span class="kpi-icon" aria-hidden="true">⏳</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Pending Registrations</span>
                  <span class="kpi-num text-warning">{{ registrationReport()?.pendingRegistrations ?? 0 }}</span>
                  <span class="kpi-meta">Awaiting payment or action</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-red-subtle">
                  <span class="kpi-icon" aria-hidden="true">🚫</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Cancelled Registrations</span>
                  <span class="kpi-num text-danger">{{ registrationReport()?.cancelledRegistrations ?? 0 }}</span>
                  <span class="kpi-meta">Withdrawn or voided passes</span>
                </div>
              </div>
            </div>

            <!-- Registration Timeline Chart -->
            <div class="chart-section">
              <app-trend-chart
                title="Registration Velocity Trend"
                [data]="registrationChartData()"
                primaryLabel="Total Registrations"
                secondaryLabel="Confirmed"
                chartColor="var(--color-primary-600, #4f46e5)"
                secondaryColor="var(--color-success, #10b981)"
              ></app-trend-chart>
            </div>

            <!-- Event-Level Registration Breakdown Table -->
            <div class="table-card card">
              <div class="table-header">
                <h2 class="table-heading">Event Registration Breakdown</h2>
                <span class="table-badge">{{ registrationReport()?.events?.length ?? 0 }} events</span>
              </div>
              <div class="table-container">
                <table class="table" aria-label="Event-Level Registration Breakdown">
                  <thead>
                    <tr>
                      <th scope="col" style="width: 40%;">Event Name</th>
                      <th scope="col" style="width: 15%; text-align: center;">Total</th>
                      <th scope="col" style="width: 15%; text-align: center;">Confirmed</th>
                      <th scope="col" style="width: 15%; text-align: center;">Pending</th>
                      <th scope="col" style="width: 15%; text-align: center;">Cancelled</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ev of registrationReport()?.events; track ev.eventId) {
                      <tr>
                        <td class="event-name-cell">
                          <span class="event-icon" aria-hidden="true">🎫</span>
                          <span class="event-name">{{ ev.eventName }}</span>
                        </td>
                        <td style="text-align: center;" class="font-semibold">{{ ev.totalRegistrations }}</td>
                        <td style="text-align: center;">
                          <span class="badge badge-success">{{ ev.confirmedRegistrations }}</span>
                        </td>
                        <td style="text-align: center;">
                          <span class="badge badge-warning">{{ ev.pendingRegistrations }}</span>
                        </td>
                        <td style="text-align: center;">
                          <span class="badge badge-danger">{{ ev.cancelledRegistrations }}</span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="table-empty-row">
                          No registrations recorded for the selected parameters.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- VIEW C: ATTENDANCE REPORT -->
        @if (activeReport() === 'attendance') {
          <div id="report-panel-attendance" role="tabpanel" aria-labelledby="attendance-tab">
            <!-- Attendance KPI Summary Cards -->
            <div class="kpi-grid kpi-grid-3">
              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-green-subtle">
                  <span class="kpi-icon" aria-hidden="true">🎟️</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Verified Attendance</span>
                  <span class="kpi-num text-success">{{ attendanceReport()?.totalAttendance ?? 0 }}</span>
                  <span class="kpi-meta">Attendees scanned & checked in</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-blue-subtle">
                  <span class="kpi-icon" aria-hidden="true">🎫</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Confirmed Registrations</span>
                  <span class="kpi-num">{{ attendanceReport()?.totalConfirmedRegistrations ?? 0 }}</span>
                  <span class="kpi-meta">Total tickets expected</span>
                </div>
              </div>

              <div class="kpi-card card">
                <div class="kpi-icon-wrap bg-purple-subtle">
                  <span class="kpi-icon" aria-hidden="true">📊</span>
                </div>
                <div class="kpi-info">
                  <span class="kpi-title">Overall Admittance Rate</span>
                  <span class="kpi-num text-primary">
                    {{ attendanceReport()?.overallAttendanceRate ?? 0 | number:'1.0-1' }}%
                  </span>
                  <span class="kpi-meta">Check-in conversion percentage</span>
                </div>
              </div>
            </div>

            <!-- Event-Level Attendance Breakdown Table -->
            <div class="table-card card">
              <div class="table-header">
                <h2 class="table-heading">Event Attendance & Check-In Roster</h2>
                <span class="table-badge">{{ attendanceReport()?.events?.length ?? 0 }} events</span>
              </div>
              <div class="table-container">
                <table class="table" aria-label="Event-Level Attendance Roster">
                  <thead>
                    <tr>
                      <th scope="col" style="width: 35%;">Event Name</th>
                      <th scope="col" style="width: 15%; text-align: center;">Registrations</th>
                      <th scope="col" style="width: 15%; text-align: center;">Confirmed</th>
                      <th scope="col" style="width: 15%; text-align: center;">Checked In</th>
                      <th scope="col" style="width: 20%; text-align: right;">Admittance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ev of attendanceReport()?.events; track ev.eventId) {
                      <tr>
                        <td class="event-name-cell">
                          <span class="event-icon" aria-hidden="true">🏛️</span>
                          <span class="event-name">{{ ev.eventName }}</span>
                        </td>
                        <td style="text-align: center;">{{ ev.totalRegistrations }}</td>
                        <td style="text-align: center;">{{ ev.confirmedRegistrations }}</td>
                        <td style="text-align: center;" class="font-semibold text-success">
                          {{ ev.attendanceCount }}
                        </td>
                        <td style="text-align: right;">
                          <div class="rate-cell">
                            <div class="rate-bar-wrap" aria-hidden="true">
                              <div
                                class="rate-bar"
                                [style.width.%]="ev.attendanceRate > 100 ? 100 : ev.attendanceRate"
                              ></div>
                            </div>
                            <span class="rate-num font-semibold">
                              {{ ev.attendanceRate | number:'1.0-1' }}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="5" class="table-empty-row">
                          No attendance or check-in data recorded for the selected parameters.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .reports-container {
      padding: var(--space-6) 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
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

    .btn-icon {
      margin-right: var(--space-1);
    }

    /* Report Navigation Tabs */
    .report-nav-tabs {
      display: flex;
      gap: var(--space-2);
      border-bottom: 2px solid var(--border-color);
      margin-bottom: var(--space-6);
      overflow-x: auto;
      padding-bottom: 2px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: none;
      border: none;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .tab-btn:hover {
      color: var(--color-gray-900);
      background-color: var(--color-gray-50);
      border-radius: var(--radius-md) var(--radius-md) 0 0;
    }

    .tab-btn.active {
      color: var(--color-primary-600, #4f46e5);
      border-bottom-color: var(--color-primary-600, #4f46e5);
      font-weight: var(--font-weight-semibold);
    }

    .tab-icon {
      font-size: 1.1rem;
    }

    /* Controls Bar */
    .controls-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .controls-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-4);
      align-items: flex-end;
      justify-content: space-between;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .filter-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
    }

    .preset-pill-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      background-color: var(--color-gray-100);
      padding: 3px;
      border-radius: var(--radius-md);
    }

    .preset-pill {
      background: none;
      border: none;
      padding: var(--space-1) var(--space-3);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .preset-pill:hover {
      color: var(--color-gray-900);
    }

    .preset-pill.active {
      background-color: #ffffff;
      color: var(--color-gray-900);
      font-weight: var(--font-weight-semibold);
      box-shadow: var(--shadow-sm);
    }

    .event-selector-group {
      flex: 1;
      min-width: 240px;
      max-width: 400px;
    }

    .event-select {
      width: 100%;
    }

    .custom-dates-row {
      display: flex;
      gap: var(--space-4);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px dashed var(--border-color);
      flex-wrap: wrap;
    }

    .custom-date-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex: 1;
      min-width: 160px;
    }

    .date-input-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      font-weight: var(--font-weight-medium);
    }

    .date-validation-alert {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-top: var(--space-3);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      background-color: var(--color-error-bg, #fef2f2);
      border: 1px solid var(--color-error-border, #fecaca);
      color: var(--color-error-text, #b91c1c);
    }

    /* KPI Cards Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .kpi-grid-3 {
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    }

    .kpi-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background-color: var(--bg-surface);
      box-shadow: var(--shadow-sm);
    }

    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon {
      font-size: 1.35rem;
    }

    .bg-green-subtle { background-color: #ecfdf5; }
    .bg-blue-subtle { background-color: #eff6ff; }
    .bg-yellow-subtle { background-color: #fffbeb; }
    .bg-red-subtle { background-color: #fef2f2; }
    .bg-purple-subtle { background-color: #f5f3ff; }

    .kpi-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .kpi-title {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .kpi-num {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      line-height: 1.25;
      margin: 2px 0;
    }

    .kpi-meta {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .text-success { color: var(--color-success, #16a34a); }
    .text-warning { color: var(--color-warning, #d97706); }
    .text-danger { color: var(--color-error, #dc2626); }
    .text-primary { color: var(--color-primary-600, #4f46e5); }

    /* Chart Section */
    .chart-section {
      margin-bottom: var(--space-6);
    }

    /* Table Styles */
    .table-card {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background-color: var(--bg-surface);
      box-shadow: var(--shadow-sm);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border-bottom: 1px solid var(--border-color);
      background-color: var(--color-gray-50);
    }

    .table-heading {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .table-badge {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      background-color: #ffffff;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }

    .table-container {
      overflow-x: auto;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);
    }

    .table th {
      background-color: var(--color-gray-50);
      color: var(--color-gray-600);
      font-weight: var(--font-weight-semibold);
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
      color: var(--color-gray-800);
    }

    .table tbody tr:last-child td {
      border-bottom: none;
    }

    .table tbody tr:hover {
      background-color: var(--color-gray-50);
    }

    .event-name-cell {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-weight-medium);
    }

    .event-icon {
      font-size: 1rem;
    }

    .event-name {
      color: var(--color-gray-900);
    }

    .table-empty-row {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--color-gray-500);
      font-style: italic;
    }

    /* Badges */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .badge-neutral {
      background-color: var(--color-gray-100);
      color: var(--color-gray-700);
    }

    .badge-success {
      background-color: #ecfdf5;
      color: #065f46;
    }

    .badge-warning {
      background-color: #fffbeb;
      color: #92400e;
    }

    .badge-danger {
      background-color: #fef2f2;
      color: #991b1b;
    }

    /* Admittance Rate Bar */
    .rate-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .rate-bar-wrap {
      width: 80px;
      height: 8px;
      background-color: var(--color-gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .rate-bar {
      height: 100%;
      background-color: var(--color-primary-600, #4f46e5);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .rate-num {
      min-width: 44px;
      text-align: right;
    }

    .loading-state-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .controls-row {
        flex-direction: column;
        align-items: stretch;
      }

      .event-selector-group {
        max-width: 100%;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .rate-bar-wrap {
        display: none;
      }
    }
  `],
})
export class PlatformReportsComponent implements OnInit {
  private readonly adminService = inject(AdminDashboardService);
  private readonly eventService = inject(EventService);

  // Active Report Tab
  readonly activeReport = signal<ReportType>('revenue');

  // Filter States
  readonly selectedPreset = signal<DatePreset>('all');
  readonly startDate = signal<string>('');
  readonly endDate = signal<string>('');
  readonly selectedEventId = signal<string>('');
  readonly dateValidationError = signal<string | null>(null);

  // Async States
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Event Dropdown Options
  readonly events = signal<EventDto[]>([]);

  // Report Data
  readonly revenueReport = signal<RevenueReportDto | null>(null);
  readonly registrationReport = signal<RegistrationReportDto | null>(null);
  readonly attendanceReport = signal<AttendanceReportDto | null>(null);

  // Chart Computations for TrendChartComponent
  readonly revenueChartData = computed<TrendDataPoint[]>(() => {
    const report = this.revenueReport();
    if (!report || !report.timeline || report.timeline.length === 0) return [];
    return report.timeline.map((item) => ({
      label: this.formatDateLabel(item.date),
      value: item.amount,
      secondaryValue: item.transactionCount,
    }));
  });

  readonly registrationChartData = computed<TrendDataPoint[]>(() => {
    const report = this.registrationReport();
    if (!report || !report.timeline || report.timeline.length === 0) return [];
    return report.timeline.map((item) => ({
      label: this.formatDateLabel(item.date),
      value: item.totalRegistrations,
      secondaryValue: item.confirmedRegistrations,
    }));
  });

  ngOnInit(): void {
    this.loadEvents();
    this.loadActiveReport();
  }

  loadEvents(): void {
    this.eventService.getAll({ pageSize: 100, sortBy: 'name', sortDirection: 'asc' }).subscribe({
      next: (res) => this.events.set(res.items),
      error: () => this.events.set([]),
    });
  }

  activeReportTitle(): string {
    switch (this.activeReport()) {
      case 'revenue':
        return 'Revenue Report';
      case 'registrations':
        return 'Registration Report';
      case 'attendance':
        return 'Attendance Report';
    }
  }

  setActiveReport(reportType: ReportType): void {
    if (this.activeReport() === reportType) return;
    this.activeReport.set(reportType);

    // If report data is not yet loaded for this tab, or filters changed, load it
    const hasData =
      (reportType === 'revenue' && this.revenueReport() !== null) ||
      (reportType === 'registrations' && this.registrationReport() !== null) ||
      (reportType === 'attendance' && this.attendanceReport() !== null);

    if (!hasData) {
      this.loadActiveReport();
    }
  }

  setPreset(preset: DatePreset): void {
    this.selectedPreset.set(preset);
    this.dateValidationError.set(null);

    const today = new Date();
    let start = '';
    let end = '';

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
      // Leave custom dates as is or initialize if empty
      start = this.startDate();
      end = this.endDate();
    }

    this.startDate.set(start);
    this.endDate.set(end);

    // Invalidate cached reports across tabs on filter change
    this.clearCachedReports();
    this.loadActiveReport();
  }

  onStartDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.startDate.set(val);
    this.validateAndReloadCustomDates();
  }

  onEndDateChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.endDate.set(val);
    this.validateAndReloadCustomDates();
  }

  private validateAndReloadCustomDates(): void {
    const start = this.startDate();
    const end = this.endDate();

    if (start && end && start > end) {
      this.dateValidationError.set('Start date cannot be after end date.');
      return;
    }

    this.dateValidationError.set(null);
    this.clearCachedReports();
    this.loadActiveReport();
  }

  onEventChange(event: Event): void {
    const eventId = (event.target as HTMLSelectElement).value;
    this.selectedEventId.set(eventId);
    this.clearCachedReports();
    this.loadActiveReport();
  }

  private clearCachedReports(): void {
    this.revenueReport.set(null);
    this.registrationReport.set(null);
    this.attendanceReport.set(null);
  }

  loadActiveReport(): void {
    if (this.dateValidationError()) return;

    this.loading.set(true);
    this.error.set(null);

    const start = this.startDate() || undefined;
    const end = this.endDate() || undefined;
    const eventId = this.selectedEventId() || undefined;

    const currentTab = this.activeReport();

    if (currentTab === 'revenue') {
      this.adminService.getRevenueReport(start, end, eventId).subscribe({
        next: (data) => {
          this.revenueReport.set(data);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message || 'Failed to retrieve revenue report.');
          this.loading.set(false);
        },
      });
    } else if (currentTab === 'registrations') {
      this.adminService.getRegistrationReport(start, end, eventId).subscribe({
        next: (data) => {
          this.registrationReport.set(data);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message || 'Failed to retrieve registration report.');
          this.loading.set(false);
        },
      });
    } else if (currentTab === 'attendance') {
      this.adminService.getAttendanceReport(start, end, eventId).subscribe({
        next: (data) => {
          this.attendanceReport.set(data);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err.message || 'Failed to retrieve attendance report.');
          this.loading.set(false);
        },
      });
    }
  }

  private formatDateLabel(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : `${d.getMonth() + 1}/${d.getDate()}`;
    } catch {
      return dateStr;
    }
  }
}
