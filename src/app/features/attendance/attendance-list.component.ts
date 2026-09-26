import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AttendanceService } from '../../core/services/attendance.service';
import { EventService } from '../../core/services/event.service';
import {
  AttendanceDto,
  AttendanceQueryDto,
  AttendanceSummaryDto,
  EventDto,
  PagedResultDto,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    SearchInputComponent,
    PaginationComponent,
  ],
  template: `
    <div class="container attendance-page">
      <!-- Breadcrumb Nav -->
      <nav aria-label="Breadcrumb" class="page-nav">
        <a routerLink="/organizer/dashboard" class="back-link">
          <span aria-hidden="true">←</span> Organizer Hub
        </a>
        <span class="nav-separator">/</span>
        @if (event()) {
          <a [routerLink]="['/events', event()!.id]" class="back-link">{{ event()!.name }}</a>
          <span class="nav-separator">/</span>
        }
        <span class="nav-current">Attendance Roster</span>
      </nav>

      @if (loadingEvent()) {
        <div class="loading-wrap">
          <app-loading-spinner [message]="'Loading event attendance...'"></app-loading-spinner>
        </div>
      } @else if (eventError()) {
        <app-error-state
          [title]="'Unable to Load Attendance'"
          [message]="eventError()!"
          (retry)="loadData()"
        ></app-error-state>
      } @else if (event(); as currentEv) {
        <!-- Page Header -->
        <header class="page-header">
          <div class="header-main">
            <div class="event-meta-line">
              <span class="badge badge-published">Official Roster</span>
              <span class="event-date">{{ currentEv.startDateTime | date: 'mediumDate' }}</span>
            </div>
            <h1>Attendance Roster &mdash; {{ currentEv.name }}</h1>
            <span class="event-venue">{{ currentEv.venueName || 'Online / Venue TBA' }}</span>
          </div>

          <div class="header-actions">
            <a
              [routerLink]="['/organizer/events', currentEv.id, 'check-in']"
              class="btn btn-primary"
            >
              📷 Live QR Scanner
            </a>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              (click)="printRoster()"
            >
              🖨️ Print Roster
            </button>
          </div>
        </header>

        <!-- Summary Metric Cards -->
        @if (summary(); as stats) {
          <section class="metrics-grid" aria-label="Attendance statistics">
            <div class="metric-card">
              <span class="metric-label">Checked-In Attendees</span>
              <div class="metric-value-row">
                <strong class="metric-value color-success">{{ stats.checkedInCount }}</strong>
                <span class="metric-total">/ {{ stats.totalTickets }}</span>
              </div>
              <div class="progress-bar-wrap">
                <div
                  class="progress-bar-fill"
                  [style.width.%]="stats.checkInPercentage"
                ></div>
              </div>
              <span class="metric-hint">{{ stats.checkInPercentage }}% of booked attendees</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">Remaining to Check In</span>
              <strong class="metric-value color-warning">{{ stats.remainingCount }}</strong>
              <span class="metric-hint">Awaiting gate check-in</span>
            </div>

            <div class="metric-card">
              <span class="metric-label">Total Confirmed Passes</span>
              <strong class="metric-value">{{ stats.totalTickets }}</strong>
              <span class="metric-hint">Valid passes issued for event</span>
            </div>
          </section>
        }

        <!-- Search & Filter Controls -->
        <section class="card filter-card" aria-label="Attendance filters">
          <div class="filter-row">
            <div class="search-wrap">
              <app-search-input
                [value]="searchTerm"
                placeholder="Search by attendee name, email, or ticket #..."
                ariaLabel="Search attendance"
                (searchChange)="onSearchChange($event)"
              ></app-search-input>
            </div>

            <div class="filter-actions">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                (click)="toggleSortDirection()"
              >
                Sort: {{ query.sortDescending ? 'Newest First ↓' : 'Oldest First ↑' }}
              </button>
            </div>
          </div>
        </section>

        <!-- Attendance Roster Table -->
        <section class="card table-card" aria-label="Attendee attendance table">
          @if (loadingAttendance()) {
            <div class="table-loading">
              <app-loading-spinner [message]="'Updating attendance roster...'"></app-loading-spinner>
            </div>
          } @else if (attendances().length === 0) {
            <app-empty-state
              [icon]="'📋'"
              [title]="searchTerm ? 'No Matching Records' : 'No Attendees Checked In Yet'"
              [message]="
                searchTerm
                  ? 'No check-in records matched your search query.'
                  : 'Start scanning tickets at the venue entrance using the live scanner.'
              "
              [actionLabel]="searchTerm ? 'Reset Search' : null"
              (action)="clearSearch()"
            ></app-empty-state>
          } @else {
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ticket Code</th>
                    <th>Attendee</th>
                    <th>Booking Ref</th>
                    <th>Checked In At</th>
                    <th>Verified By</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of attendances(); track item.id) {
                    <tr>
                      <td>
                        <strong class="ticket-code mono">{{ item.ticketNumber || 'N/A' }}</strong>
                      </td>
                      <td>
                        <div class="attendee-info">
                          <span class="attendee-name">{{ item.userName || 'Account Holder' }}</span>
                          @if (item.userEmail) {
                            <span class="attendee-email">{{ item.userEmail }}</span>
                          }
                        </div>
                      </td>
                      <td>
                        <span class="mono">{{ item.registrationNumber || 'N/A' }}</span>
                      </td>
                      <td>
                        <span class="checkin-date">{{ item.checkedInAt | date: 'medium' }}</span>
                      </td>
                      <td>
                        <span class="checker-name">{{ item.checkedInByName || 'Staff Member' }}</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination Footer -->
            <app-pagination
              [pageNumber]="currentPage()"
              [pageSize]="pageSize()"
              [totalCount]="totalRecords()"
              [totalPages]="totalPages()"
              [loading]="loadingAttendance()"
              [pageSizeOptions]="[10, 15, 25, 50]"
              itemLabel="attendees"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            ></app-pagination>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .attendance-page {
      padding-top: var(--space-4);
      padding-bottom: var(--space-12);
    }

    .page-nav {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
      font-size: var(--font-size-sm);
    }

    .back-link {
      color: var(--color-primary-600);
      text-decoration: none;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .nav-separator {
      color: var(--color-gray-400);
    }

    .nav-current {
      color: var(--color-gray-600);
      font-weight: var(--font-weight-semibold);
    }

    /* Page Header */
    .page-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    @media (min-width: 640px) {
      .page-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }

    .event-meta-line {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .event-date {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .page-header h1 {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      margin: 0;
      color: var(--color-gray-900);
    }

    .event-venue {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
    }

    .header-actions {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    /* Metrics Cards */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .metric-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .metric-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-500);
    }

    .metric-value-row {
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .metric-value {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
    }

    .metric-total {
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
    }

    .color-success { color: #16a34a !important; }
    .color-warning { color: #d97706 !important; }

    .progress-bar-wrap {
      height: 6px;
      background: var(--color-gray-200);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: #16a34a;
      transition: width 0.3s ease;
    }

    .metric-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    /* Filters */
    .filter-card {
      padding: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .filter-row {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    @media (min-width: 640px) {
      .filter-row {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .search-wrap {
      position: relative;
      flex: 1;
      max-width: 480px;
    }

    .clear-search-btn {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--color-gray-400);
      cursor: pointer;
      font-size: var(--font-size-sm);
    }

    .filter-actions {
      display: flex;
      gap: var(--space-2);
    }

    /* Table */
    .table-card {
      overflow: hidden;
    }

    .table-loading {
      padding: var(--space-12) 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .data-table th {
      background: var(--color-gray-50);
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-600);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      font-size: var(--font-size-sm);
    }

    .attendee-info {
      display: flex;
      flex-direction: column;
    }

    .attendee-name {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-900);
    }

    .attendee-email {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .mono {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
    }

    .ticket-code {
      color: var(--color-primary-700);
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    @media (min-width: 640px) {
      .pagination-bar {
        flex-direction: row;
      }
    }

    .page-info {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .pagination-buttons {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .current-page-badge {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      padding: 0 var(--space-2);
    }

    @media print {
      .header-actions, .filter-card, .pagination-bar, .page-nav {
        display: none !important;
      }
    }
  `],
})
export class AttendanceListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly attendanceService = inject(AttendanceService);
  private readonly eventService = inject(EventService);

  readonly event = signal<EventDto | null>(null);
  readonly loadingEvent = signal<boolean>(true);
  readonly eventError = signal<string | null>(null);

  readonly summary = signal<AttendanceSummaryDto | null>(null);

  readonly attendances = signal<AttendanceDto[]>([]);
  readonly loadingAttendance = signal<boolean>(false);
  readonly totalRecords = signal<number>(0);
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);

  readonly pageSize = signal<number>(15);
  searchTerm = '';

  query: AttendanceQueryDto = {
    pageNumber: 1,
    pageSize: 15,
    sortBy: 'checkedInAt',
    sortDescending: true,
  };

  ngOnInit(): void {
    if (this.route) {
      const snapshotParams = this.route.snapshot.queryParamMap;
      if (snapshotParams) {
        this.applyQueryParams(snapshotParams);
      }

      this.route.queryParamMap?.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        if (this.hasParamsChanged(params)) {
          this.applyQueryParams(params);
          const eventId = this.event()?.id;
          if (eventId) {
            this.loadAttendance(eventId);
          }
        }
      });
    }

    this.loadData();
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '15', 10);
    const search = params.get('search') || '';
    const sortDir = params.get('sortDir');

    this.currentPage.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 15 : size);
    this.searchTerm = search;

    this.query.pageNumber = this.currentPage();
    this.query.pageSize = this.pageSize();
    this.query.search = search.trim() || undefined;
    if (sortDir === 'asc') {
      this.query.sortDescending = false;
    } else if (sortDir === 'desc') {
      this.query.sortDescending = true;
    }
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '15', 10);
    const search = params.get('search') || '';
    const sortDir = params.get('sortDir');
    const sortDescending = sortDir !== 'asc';

    return (
      page !== this.currentPage() ||
      size !== this.pageSize() ||
      search !== this.searchTerm ||
      sortDescending !== this.query.sortDescending
    );
  }

  private updateQueryParams(): void {
    if (!this.router || !this.route) return;

    const queryParams: Record<string, string | number | boolean | null> = {
      page: this.currentPage() > 1 ? this.currentPage() : null,
      pageSize: this.pageSize() !== 15 ? this.pageSize() : null,
      search: this.searchTerm.trim() || null,
      sortDir: !this.query.sortDescending ? 'asc' : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  loadData(): void {
    const eventId = this.route.snapshot.paramMap.get('eventId');
    if (!eventId) {
      this.eventError.set('No event specified.');
      this.loadingEvent.set(false);
      return;
    }

    this.loadingEvent.set(true);
    this.eventError.set(null);

    this.eventService.getById(eventId).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.loadingEvent.set(false);
        this.loadSummary(eventId);
        this.loadAttendance(eventId);
      },
      error: (err) => {
        this.loadingEvent.set(false);
        this.eventError.set(err.error?.message || 'Unable to load event details.');
      },
    });
  }

  loadSummary(eventId: string): void {
    this.attendanceService.getSummary(eventId).subscribe({
      next: (sum) => this.summary.set(sum),
      error: () => {},
    });
  }

  loadAttendance(eventId: string): void {
    this.loadingAttendance.set(true);

    this.attendanceService.getByEventId(eventId, this.query).subscribe({
      next: (paged) => {
        this.attendances.set(paged.items);
        this.totalRecords.set(paged.totalCount);
        this.currentPage.set(paged.pageNumber);
        this.totalPages.set(paged.totalPages);
        this.loadingAttendance.set(false);
      },
      error: () => {
        this.loadingAttendance.set(false);
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.query.search = value.trim() || undefined;
    this.query.pageNumber = 1;
    this.currentPage.set(1);
    this.updateQueryParams();
    const eventId = this.event()?.id;
    if (eventId) {
      this.loadAttendance(eventId);
    }
  }

  onSearch(): void {
    this.onSearchChange(this.searchTerm);
  }

  clearSearch(): void {
    this.onSearchChange('');
  }

  toggleSortDirection(): void {
    this.query.sortDescending = !this.query.sortDescending;
    this.query.pageNumber = 1;
    this.currentPage.set(1);
    this.updateQueryParams();
    const eventId = this.event()?.id;
    if (eventId) {
      this.loadAttendance(eventId);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page !== this.currentPage()) {
      this.query.pageNumber = page;
      this.currentPage.set(page);
      this.updateQueryParams();
      const eventId = this.event()?.id;
      if (eventId) {
        this.loadAttendance(eventId);
      }
    }
  }

  onPageChange(page: number): void {
    this.goToPage(page);
  }

  onPageSizeChange(event: Event | number): void {
    const size = typeof event === 'number' ? event : parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.query.pageSize = size;
      this.query.pageNumber = 1;
      this.currentPage.set(1);
      this.updateQueryParams();
      const eventId = this.event()?.id;
      if (eventId) {
        this.loadAttendance(eventId);
      }
    }
  }

  getEndRecord(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.totalRecords());
  }

  printRoster(): void {
    window.print();
  }
}
