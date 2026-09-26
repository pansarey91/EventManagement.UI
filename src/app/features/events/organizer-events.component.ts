import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventService } from '../../core/services/event.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  EventDto,
  EventStatus,
  EventQueryDto,
  ApiError,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination.component';

export interface ActionModalState {
  isOpen: boolean;
  event: EventDto | null;
  action: 'publish' | 'start' | 'complete' | 'cancel' | 'delete' | null;
  title: string;
  message: string;
  confirmBtnText: string;
  confirmBtnClass: string;
}

@Component({
  selector: 'app-organizer-events',
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
    <div class="organizer-events-container">
      <!-- Header -->
      <header class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">Manage Events</h1>
            <p class="page-subtitle">
              Monitor schedules, control lifecycle status, and manage your hosted events.
            </p>
          </div>
          <a routerLink="/organizer/events/create" class="btn btn-primary btn-add">
            <span class="btn-icon" aria-hidden="true">+</span>
            <span>Create Event</span>
          </a>
        </div>
      </header>

      <!-- Filter / Control Bar -->
      <section class="controls-card card" aria-label="Event management filters">
        <div class="card-body controls-grid">
          <!-- Search -->
          <div class="control-item control-search">
            <label class="control-label">Search</label>
            <app-search-input
              [value]="searchQuery()"
              placeholder="Search events by title or venue..."
              ariaLabel="Search events"
              (searchChange)="onSearchChange($event)"
            ></app-search-input>
          </div>

          <!-- Status Filter -->
          <div class="control-item">
            <label for="status-select" class="control-label">Lifecycle Status</label>
            <select
              id="status-select"
              class="form-select"
              [ngModel]="statusFilter()"
              (ngModelChange)="onStatusChange($event)"
            >
              <option value="">All Statuses</option>
              <option [value]="EventStatus.Draft">Draft</option>
              <option [value]="EventStatus.Published">Published</option>
              <option [value]="EventStatus.Ongoing">Ongoing</option>
              <option [value]="EventStatus.Completed">Completed</option>
              <option [value]="EventStatus.Cancelled">Cancelled</option>
            </select>
          </div>

          <!-- Sort -->
          <div class="control-item">
            <label for="sort-select" class="control-label">Sort By</label>
            <div class="sort-controls">
              <select
                id="sort-select"
                class="form-select"
                [ngModel]="sortBy()"
                (ngModelChange)="onSortByChange($event)"
              >
                <option value="startDateTime">Event Date</option>
                <option value="name">Event Name</option>
                <option value="createdAt">Created Date</option>
                <option value="status">Status</option>
              </select>
              <button
                type="button"
                class="btn btn-secondary sort-toggle-btn"
                (click)="toggleSortDirection()"
                [attr.aria-label]="sortDirection() === 'asc' ? 'Sort ascending' : 'Sort descending'"
                title="Toggle sort direction"
              >
                {{ sortDirection() === 'asc' ? '↑' : '↓' }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Content Area -->
      @if (loading() && events().length === 0) {
        <div class="loading-state-wrapper">
          <app-loading-spinner [message]="'Loading events...'"></app-loading-spinner>
        </div>
      } @else if (error() && events().length === 0) {
        <app-error-state
          [title]="'Unable to load events'"
          [message]="error()!"
          (retry)="loadEvents()"
        ></app-error-state>
      } @else if (events().length === 0) {
        <app-empty-state
          [icon]="'📋'"
          [title]="'No Events Found'"
          [message]="hasActiveFilters() ? 'No events matched your search criteria.' : 'You have not created any events yet. Publish your first event to start accepting registrations.'"
          [actionLabel]="hasActiveFilters() ? 'Clear Filters' : 'Create Event'"
          [actionRoute]="hasActiveFilters() ? null : '/organizer/events/create'"
          (action)="clearFilters()"
        ></app-empty-state>
      } @else {
        <!-- Events Table -->
        <div class="table-card card">
          <div class="table-responsive">
            <table class="data-table" aria-label="Organizer events table">
              <thead>
                <tr>
                  <th scope="col">Event Details</th>
                  <th scope="col">Category</th>
                  <th scope="col">Venue & Dates</th>
                  <th scope="col">Capacity</th>
                  <th scope="col">Status</th>
                  <th scope="col" class="th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (ev of events(); track ev.id) {
                  <tr>
                    <!-- Event Details -->
                    <td class="td-event">
                      <div class="event-cell">
                        <span class="event-name">
                          <a [routerLink]="['/events', ev.id]" class="event-link" title="View Public Page">
                            {{ ev.name }}
                          </a>
                        </span>
                        @if (ev.description) {
                          <span class="event-desc-snippet">{{ ev.description }}</span>
                        }
                      </div>
                    </td>

                    <!-- Category -->
                    <td class="td-category">
                      <span class="category-badge">{{ ev.categoryName || 'Uncategorized' }}</span>
                    </td>

                    <!-- Venue & Dates -->
                    <td class="td-dates">
                      <div class="dates-cell">
                        <strong class="venue-title">{{ ev.venueName || 'Venue TBD' }}</strong>
                        <span class="date-line">
                          📅 {{ ev.startDateTime | date: 'mediumDate' }}
                        </span>
                        <span class="time-line">
                          {{ ev.startDateTime | date: 'shortTime' }} – {{ ev.endDateTime | date: 'shortTime' }}
                        </span>
                      </div>
                    </td>

                    <!-- Capacity -->
                    <td class="td-capacity">
                      <span class="capacity-val">{{ ev.maxCapacity }} max</span>
                    </td>

                    <!-- Status -->
                    <td class="td-status">
                      <span [class]="getStatusBadgeClass(ev.status)">
                        {{ getStatusLabel(ev.status) }}
                      </span>
                    </td>

                    <!-- Actions -->
                    <td class="td-actions">
                      <div class="action-buttons">
                        <!-- View Public Details -->
                        <a
                          [routerLink]="['/events', ev.id]"
                          class="btn btn-outline btn-xs"
                          title="View public event page"
                        >
                          View
                        </a>

                        <!-- Manage Tickets Button -->
                        <a
                          [routerLink]="['/organizer/events', ev.id, 'ticket-types']"
                          class="btn btn-outline btn-xs"
                          title="Configure ticket pricing and tiers"
                        >
                          Tickets
                        </a>

                        <!-- Check-In & Attendance (Published or Ongoing) -->
                        @if (ev.status === EventStatus.Published || ev.status === EventStatus.Ongoing) {
                          <a
                            [routerLink]="['/organizer/events', ev.id, 'check-in']"
                            class="btn btn-primary btn-xs"
                            title="Scan attendee QR tickets"
                          >
                            📷 Check-In
                          </a>
                          <a
                            [routerLink]="['/organizer/events', ev.id, 'attendance']"
                            class="btn btn-outline btn-xs"
                            title="View attendance roster"
                          >
                            📋 Attendance
                          </a>
                        }

                        <!-- Edit Button (allowed if not Completed or Cancelled) -->
                        @if (ev.status === EventStatus.Draft || ev.status === EventStatus.Published) {
                          <a
                            [routerLink]="['/organizer/events', ev.id, 'edit']"
                            class="btn btn-secondary btn-xs"
                            title="Edit event settings"
                          >
                            Edit
                          </a>
                        }

                        <!-- Lifecycle: Publish (Draft only) -->
                        @if (ev.status === EventStatus.Draft) {
                          <button
                            type="button"
                            class="btn btn-success btn-xs"
                            (click)="promptAction(ev, 'publish')"
                            title="Publish event to public directory"
                          >
                            Publish
                          </button>
                        }

                        <!-- Lifecycle: Start (Published only) -->
                        @if (ev.status === EventStatus.Published) {
                          <button
                            type="button"
                            class="btn btn-info btn-xs"
                            (click)="promptAction(ev, 'start')"
                            title="Mark event as Ongoing"
                          >
                            Start
                          </button>
                        }

                        <!-- Lifecycle: Complete (Ongoing only) -->
                        @if (ev.status === EventStatus.Ongoing) {
                          <button
                            type="button"
                            class="btn btn-success btn-xs"
                            (click)="promptAction(ev, 'complete')"
                            title="Mark event as Completed"
                          >
                            Complete
                          </button>
                        }

                        <!-- Lifecycle: Cancel (Published or Ongoing) -->
                        @if (ev.status === EventStatus.Published || ev.status === EventStatus.Ongoing) {
                          <button
                            type="button"
                            class="btn btn-warning btn-xs"
                            (click)="promptAction(ev, 'cancel')"
                            title="Cancel event"
                          >
                            Cancel
                          </button>
                        }

                        <!-- Delete Button (Draft, Published, Cancelled) -->
                        @if (ev.status === EventStatus.Draft || ev.status === EventStatus.Cancelled || ev.status === EventStatus.Published) {
                          <button
                            type="button"
                            class="btn btn-danger btn-xs"
                            (click)="promptAction(ev, 'delete')"
                            title="Delete event"
                          >
                            Delete
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination Controls -->
        <app-pagination
          [pageNumber]="pageNumber()"
          [pageSize]="pageSize()"
          [totalCount]="totalCount()"
          [totalPages]="totalPages()"
          [loading]="loading()"
          [pageSizeOptions]="[5, 10, 20, 50]"
          itemLabel="events"
          ariaLabel="Organizer events pagination"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-pagination>
      }

      <!-- Action Confirmation Modal -->
      @if (actionModal().isOpen) {
        <div class="modal-backdrop" (click)="closeActionModal()">
          <div
            class="modal-dialog card"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'modal-title'"
          >
            <div class="card-header modal-header">
              <h2 id="modal-title" class="modal-title">{{ actionModal().title }}</h2>
              <button
                type="button"
                class="close-btn"
                (click)="closeActionModal()"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div class="card-body modal-body">
              <p class="modal-message">{{ actionModal().message }}</p>
              @if (actionModal().event) {
                <div class="modal-target-box">
                  <strong>Event:</strong> {{ actionModal().event!.name }}
                </div>
              }
            </div>

            <div class="card-footer modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeActionModal()"
                [disabled]="actionLoading()"
              >
                Cancel
              </button>
              <button
                type="button"
                [class]="'btn ' + actionModal().confirmBtnClass"
                (click)="confirmAction()"
                [disabled]="actionLoading()"
              >
                @if (actionLoading()) {
                  <span>Processing...</span>
                } @else {
                  <span>{{ actionModal().confirmBtnText }}</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .organizer-events-container {
      width: 100%;
      max-width: var(--container-max-width);
      margin: 0 auto;
      padding: var(--space-4) 0 var(--space-12);
    }

    .page-header {
      margin-bottom: var(--space-6);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .page-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-2);
    }

    .page-subtitle {
      font-size: var(--font-size-base);
      color: var(--color-gray-600);
      margin: 0;
    }

    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-weight-semibold);
      white-space: nowrap;
    }

    .btn-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    /* Filters Bar */
    .controls-card {
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
      border-radius: var(--radius-lg);
    }

    .controls-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr;
      gap: var(--space-4);
      align-items: end;
    }

    @media (max-width: 768px) {
      .controls-grid {
        grid-template-columns: 1fr;
      }
    }

    .control-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .control-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: var(--space-3);
      font-size: 0.875rem;
      color: var(--color-gray-400);
      pointer-events: none;
    }

    .search-input {
      padding-left: 2.25rem;
    }

    .sort-controls {
      display: flex;
      gap: var(--space-2);
    }

    .sort-toggle-btn {
      padding: var(--space-2) var(--space-3);
      font-size: var(--font-size-sm);
    }

    /* Table */
    .table-card {
      border-radius: var(--radius-lg);
      overflow: hidden;
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: var(--font-size-sm);
    }

    .data-table th {
      background-color: var(--color-gray-50);
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-color);
    }

    .data-table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    .data-table tbody tr:hover {
      background-color: var(--color-gray-50);
    }

    .td-event {
      min-width: 200px;
    }

    .event-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .event-name {
      font-weight: var(--font-weight-semibold);
    }

    .event-link {
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .event-link:hover {
      color: var(--color-primary-600);
      text-decoration: underline;
    }

    .event-desc-snippet {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 250px;
    }

    .category-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      background-color: var(--color-gray-100);
      color: var(--color-gray-800);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
    }

    .dates-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      font-size: var(--font-size-xs);
    }

    .venue-title {
      color: var(--color-gray-800);
    }

    .date-line {
      color: var(--color-primary-700);
    }

    .time-line {
      color: var(--color-gray-500);
    }

    .capacity-val {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      font-weight: var(--font-weight-medium);
    }

    .th-actions {
      text-align: right;
    }

    .td-actions {
      text-align: right;
    }

    .action-buttons {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: var(--font-size-xs);
      border-radius: var(--radius-sm);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--color-gray-700);
    }

    .btn-outline:hover {
      background: var(--color-gray-100);
    }

    .btn-success {
      background-color: var(--color-success-bg);
      color: var(--color-success-text);
      border: 1px solid currentColor;
    }

    .btn-success:hover {
      filter: brightness(0.95);
    }

    .btn-info {
      background-color: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .btn-info:hover {
      background-color: #bae6fd;
    }

    .btn-warning {
      background-color: var(--color-warning-bg);
      color: var(--color-warning-text);
      border: 1px solid currentColor;
    }

    .btn-warning:hover {
      filter: brightness(0.95);
    }

    .btn-danger {
      background-color: var(--color-danger-bg);
      color: var(--color-danger-text);
      border: 1px solid currentColor;
    }

    .btn-danger:hover {
      filter: brightness(0.95);
    }

    /* Badges */
    .badge-draft {
      background-color: #f1f5f9;
      color: #475569;
    }

    .badge-published {
      background-color: #dcfce7;
      color: #166534;
    }

    .badge-ongoing {
      background-color: #e0f2fe;
      color: #0369a1;
    }

    .badge-completed {
      background-color: #f3e8ff;
      color: #6b21a8;
    }

    .badge-cancelled {
      background-color: #fee2e2;
      color: #991b1b;
    }

    /* Pagination */
    .pagination-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .pagination-info {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .current-page-tag {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      font-weight: var(--font-weight-medium);
    }

    /* Modal Backdrop */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
    }

    .modal-dialog {
      width: 100%;
      max-width: 480px;
      box-shadow: var(--shadow-xl);
      border-radius: var(--radius-xl);
      overflow: hidden;
      animation: modalSlide 0.2s ease-out;
    }

    @keyframes modalSlide {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--border-color);
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: var(--color-gray-600);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .modal-message {
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
      margin: 0 0 var(--space-3);
      line-height: 1.5;
    }

    .modal-target-box {
      font-size: var(--font-size-xs);
      background-color: var(--color-gray-50);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      color: var(--color-gray-800);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border-color);
      background-color: var(--color-gray-50);
    }

    .loading-state-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }
  `],
})
export class OrganizerEventsComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly uiFeedback = inject(UiFeedbackService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly EventStatus = EventStatus;

  // Data Signals
  readonly events = signal<EventDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  // Filters
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('');
  readonly sortBy = signal<string>('startDateTime');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');

  // Async States
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly actionLoading = signal<boolean>(false);

  // Action Modal State
  readonly actionModal = signal<ActionModalState>({
    isOpen: false,
    event: null,
    action: null,
    title: '',
    message: '',
    confirmBtnText: 'Confirm',
    confirmBtnClass: 'btn-primary',
  });

  ngOnInit(): void {
    const snapshotParams = this.route.snapshot.queryParamMap;
    this.applyQueryParams(snapshotParams);
    this.loadEvents();

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (this.hasParamsChanged(params)) {
        this.applyQueryParams(params);
        this.loadEvents();
      }
    });
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const status = params.get('status') || '';
    const sort = params.get('sortBy') || 'startDateTime';
    const dir = params.get('sortDir') === 'asc' ? 'asc' : 'desc';

    this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 10 : size);
    this.searchQuery.set(search);
    this.statusFilter.set(status);
    this.sortBy.set(sort);
    this.sortDirection.set(dir);
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const search = params.get('search') || '';
    const status = params.get('status') || '';
    const sort = params.get('sortBy') || 'startDateTime';
    const dir = params.get('sortDir') === 'asc' ? 'asc' : 'desc';

    return (
      page !== this.pageNumber() ||
      size !== this.pageSize() ||
      search !== this.searchQuery() ||
      status !== this.statusFilter() ||
      sort !== this.sortBy() ||
      dir !== this.sortDirection()
    );
  }

  private updateQueryParams(): void {
    const queryParams: Record<string, string | number | boolean | null> = {
      page: this.pageNumber() > 1 ? this.pageNumber() : null,
      pageSize: this.pageSize() !== 10 ? this.pageSize() : null,
      search: this.searchQuery().trim() || null,
      status: this.statusFilter() || null,
      sortBy: this.sortBy() !== 'startDateTime' ? this.sortBy() : null,
      sortDir: this.sortDirection() !== 'desc' ? this.sortDirection() : null,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: EventQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection(),
    };

    if (this.searchQuery().trim()) query.search = this.searchQuery().trim();
    if (this.statusFilter()) query.status = Number(this.statusFilter()) as EventStatus;

    this.eventService.getAll(query).subscribe({
      next: (res) => {
        this.events.set(res.items);
        this.totalCount.set(res.totalCount);
        this.totalPages.set(res.totalPages);
        this.pageNumber.set(res.pageNumber);
        this.hasPreviousPage.set(res.hasPreviousPage);
        this.hasNextPage.set(res.hasNextPage);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to load events.');
        this.loading.set(false);
      },
    });
  }

  onSearchChange(search: string): void {
    this.searchQuery.set(search);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onStatusChange(status: string): void {
    this.statusFilter.set(status);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onSortByChange(sortBy: string): void {
    this.sortBy.set(sortBy);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  toggleSortDirection(): void {
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadEvents();
    }
  }

  onPageSizeChange(size: number): void {
    if (size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadEvents();
    }
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.sortBy.set('startDateTime');
    this.sortDirection.set('desc');
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadEvents();
  }

  hasActiveFilters(): boolean {
    return !!this.searchQuery() || !!this.statusFilter();
  }

  promptAction(
    event: EventDto,
    action: 'publish' | 'start' | 'complete' | 'cancel' | 'delete'
  ): void {
    switch (action) {
      case 'publish':
        this.actionModal.set({
          isOpen: true,
          event,
          action,
          title: 'Publish Event',
          message: 'Are you sure you want to publish this event? It will become publicly visible and open for discovery.',
          confirmBtnText: 'Publish Event',
          confirmBtnClass: 'btn-success',
        });
        break;

      case 'start':
        this.actionModal.set({
          isOpen: true,
          event,
          action,
          title: 'Start Event',
          message: 'Are you ready to mark this event as Ongoing? Attendees will see that the event is currently underway.',
          confirmBtnText: 'Start Event',
          confirmBtnClass: 'btn-info',
        });
        break;

      case 'complete':
        this.actionModal.set({
          isOpen: true,
          event,
          action,
          title: 'Complete Event',
          message: 'Mark this event as Completed? This indicates that all sessions have concluded.',
          confirmBtnText: 'Complete Event',
          confirmBtnClass: 'btn-success',
        });
        break;

      case 'cancel':
        this.actionModal.set({
          isOpen: true,
          event,
          action,
          title: 'Cancel Event',
          message: 'Are you sure you want to cancel this event? New registrations will be halted.',
          confirmBtnText: 'Cancel Event',
          confirmBtnClass: 'btn-warning',
        });
        break;

      case 'delete':
        this.actionModal.set({
          isOpen: true,
          event,
          action,
          title: 'Delete Event',
          message: 'Are you sure you want to permanently delete this event? Please note that events with existing attendee registrations cannot be deleted and must be cancelled instead.',
          confirmBtnText: 'Delete Event',
          confirmBtnClass: 'btn-danger',
        });
        break;
    }
  }

  closeActionModal(): void {
    this.actionModal.set({
      isOpen: false,
      event: null,
      action: null,
      title: '',
      message: '',
      confirmBtnText: 'Confirm',
      confirmBtnClass: 'btn-primary',
    });
  }

  confirmAction(): void {
    const state = this.actionModal();
    if (!state.event || !state.action) return;

    this.actionLoading.set(true);
    const eventId = state.event.id;
    const eventName = state.event.name;

    switch (state.action) {
      case 'publish':
        this.eventService.publish(eventId).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.closeActionModal();
            this.uiFeedback.showSuccess(`Event "${eventName}" published successfully!`);
            this.loadEvents();
          },
          error: (err: ApiError) => {
            this.actionLoading.set(false);
            this.uiFeedback.showError(err.message || 'Failed to publish event.');
          },
        });
        break;

      case 'start':
        this.eventService.start(eventId).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.closeActionModal();
            this.uiFeedback.showSuccess(`Event "${eventName}" is now ongoing.`);
            this.loadEvents();
          },
          error: (err: ApiError) => {
            this.actionLoading.set(false);
            this.uiFeedback.showError(err.message || 'Failed to start event.');
          },
        });
        break;

      case 'complete':
        this.eventService.complete(eventId).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.closeActionModal();
            this.uiFeedback.showSuccess(`Event "${eventName}" marked as completed.`);
            this.loadEvents();
          },
          error: (err: ApiError) => {
            this.actionLoading.set(false);
            this.uiFeedback.showError(err.message || 'Failed to complete event.');
          },
        });
        break;

      case 'cancel':
        this.eventService.cancel(eventId).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.closeActionModal();
            this.uiFeedback.showWarning(`Event "${eventName}" has been cancelled.`);
            this.loadEvents();
          },
          error: (err: ApiError) => {
            this.actionLoading.set(false);
            this.uiFeedback.showError(err.message || 'Failed to cancel event.');
          },
        });
        break;

      case 'delete':
        this.eventService.delete(eventId).subscribe({
          next: () => {
            this.actionLoading.set(false);
            this.closeActionModal();
            this.uiFeedback.showSuccess(`Event "${eventName}" has been deleted.`);
            this.loadEvents();
          },
          error: (err: ApiError) => {
            this.actionLoading.set(false);
            this.uiFeedback.showError(err.message || 'Failed to delete event.');
          },
        });
        break;
    }
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

  getStatusBadgeClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.Draft: return 'badge badge-draft';
      case EventStatus.Published: return 'badge badge-published';
      case EventStatus.Ongoing: return 'badge badge-ongoing';
      case EventStatus.Completed: return 'badge badge-completed';
      case EventStatus.Cancelled: return 'badge badge-cancelled';
      default: return 'badge badge-secondary';
    }
  }
}

