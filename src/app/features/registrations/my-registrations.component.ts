import { Component, OnInit, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RegistrationService } from '../../core/services/registration.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  RegistrationDto,
  RegistrationStatus,
  RegistrationQueryDto,
  getRegistrationStatusLabel,
  getRegistrationStatusBadgeClass,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

type StatusFilter = 'ALL' | RegistrationStatus;

@Component({
  selector: 'app-my-registrations',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PaginationComponent,
    ConfirmDialogComponent,
  ],
  template: `
    <div class="container registrations-page">
      <header class="page-header">
        <div class="header-content">
          <h1>My Event Registrations</h1>
          <p class="header-subtitle">
            Manage your booked tickets, track confirmation status, and view event passes.
          </p>
        </div>
        <div class="header-action">
          <a routerLink="/events" class="btn btn-primary">
            <span>🔍 Discover More Events</span>
          </a>
        </div>
      </header>

      <!-- Filter Tabs -->
      <section class="filter-section" aria-label="Registration status filters">
        <div class="filter-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === 'ALL'"
            [attr.aria-selected]="selectedStatus() === 'ALL'"
            (click)="setStatusFilter('ALL')"
          >
            All Bookings
            <span class="tab-count">{{ registrations().length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === RegistrationStatus.Confirmed"
            [attr.aria-selected]="selectedStatus() === RegistrationStatus.Confirmed"
            (click)="setStatusFilter(RegistrationStatus.Confirmed)"
          >
            Confirmed
            <span class="tab-count">{{ confirmedCount() }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === RegistrationStatus.Pending"
            [attr.aria-selected]="selectedStatus() === RegistrationStatus.Pending"
            (click)="setStatusFilter(RegistrationStatus.Pending)"
          >
            Pending
            <span class="tab-count">{{ pendingCount() }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === RegistrationStatus.Cancelled"
            [attr.aria-selected]="selectedStatus() === RegistrationStatus.Cancelled"
            (click)="setStatusFilter(RegistrationStatus.Cancelled)"
          >
            Cancelled
            <span class="tab-count">{{ cancelledCount() }}</span>
          </button>
        </div>
      </section>

      <!-- Content Area -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner [message]="'Loading your registrations...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to Load Registrations'"
          [message]="error()!"
          (retry)="loadRegistrations()"
        ></app-error-state>
      } @else if (filteredRegistrations().length === 0) {
        @if (selectedStatus() === 'ALL') {
          <app-empty-state
            icon="📝"
            title="No Registrations Found"
            message="You have not registered for any events yet. Explore conferences, meetups, and workshops!"
            actionLabel="Discover Events"
            actionRoute="/events"
          />
        } @else {
          <app-empty-state
            icon="🔍"
            title="No Matching Registrations"
            message="There are no registrations matching the selected status filter."
            actionLabel="View All Bookings"
            (action)="setStatusFilter('ALL')"
          />
        }
      } @else {
        <!-- Registrations Grid / List -->
        <div class="registrations-grid">
          @for (reg of filteredRegistrations(); track reg.id) {
            <article class="registration-card card">
              <div class="card-header reg-card-header">
                <div class="reg-number-wrap">
                  <span class="reg-label">REF:</span>
                  <strong class="reg-number">{{ reg.registrationNumber }}</strong>
                </div>
                <span class="badge" [ngClass]="getStatusBadge(reg.status)">
                  {{ getStatusText(reg.status) }}
                </span>
              </div>

              <div class="card-body reg-card-body">
                <h2 class="event-title">
                  <a [routerLink]="['/events', reg.eventId]" class="event-title-link">
                    {{ reg.eventName || 'Event Details' }}
                  </a>
                </h2>

                <div class="reg-details-grid">
                  <div class="detail-cell">
                    <span class="detail-label">Ticket Tier</span>
                    <span class="detail-value">{{ reg.ticketTypeName || 'Standard' }}</span>
                  </div>
                  <div class="detail-cell">
                    <span class="detail-label">Quantity</span>
                    <span class="detail-value">{{ reg.quantity }} ticket{{ reg.quantity > 1 ? 's' : '' }}</span>
                  </div>
                  <div class="detail-cell">
                    <span class="detail-label">Total Cost</span>
                    <span class="detail-value cost-value">
                      {{ reg.totalAmount > 0 ? (reg.totalAmount | currency) : 'Free Admission' }}
                    </span>
                  </div>
                  <div class="detail-cell">
                    <span class="detail-label">Booked Date</span>
                    <span class="detail-value">{{ reg.registeredAt | date: 'mediumDate' }}</span>
                  </div>
                </div>

                @if (reg.status === RegistrationStatus.Pending) {
                  <div class="pending-notice">
                    <span aria-hidden="true">⏳</span>
                    <span>Payment pending. Complete payment to confirm your booking and receive entry pass.</span>
                  </div>
                }
              </div>

              <div class="card-footer reg-card-footer">
                <div class="card-footer-left">
                  <a [routerLink]="['/my-registrations', reg.id]" class="btn btn-outline btn-sm">
                    View Details
                  </a>
                  @if (reg.status === RegistrationStatus.Pending && reg.totalAmount > 0) {
                    <a [routerLink]="['/registrations', reg.id, 'payment']" class="btn btn-primary btn-sm">
                      💳 Pay Now
                    </a>
                  }
                </div>

                @if (reg.status !== RegistrationStatus.Cancelled) {
                  <button
                    type="button"
                    class="btn btn-danger-outline btn-sm"
                    (click)="openCancelModal(reg)"
                    [disabled]="cancellingId() === reg.id"
                  >
                    Cancel Booking
                  </button>
                } @else {
                  <span class="cancelled-tag">Cancelled</span>
                }
              </div>
            </article>
          }
        </div>

        <!-- Pagination Footer -->
        <app-pagination
          [pageNumber]="pageNumber()"
          [pageSize]="pageSize()"
          [totalCount]="totalCount()"
          [totalPages]="totalPages()"
          [loading]="loading()"
          [pageSizeOptions]="[5, 10, 20]"
          itemLabel="registrations"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        ></app-pagination>
      }

      <!-- Cancellation Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="selectedForCancel() !== null"
        [title]="'Confirm Registration Cancellation'"
        [message]="cancelMessage()"
        [confirmLabel]="'Yes, Cancel Registration'"
        [cancelLabel]="'Keep Registration'"
        [confirmVariant]="'danger'"
        [loading]="cancellingId() !== null"
        (confirmed)="confirmCancellation()"
        (cancelled)="closeCancelModal()"
      />
    </div>
  `,
  styles: [`
    .registrations-page {
      padding-top: var(--space-6);
      padding-bottom: var(--space-12);
    }

    .page-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    @media (min-width: 640px) {
      .page-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .page-header h1 {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-1);
    }

    .header-subtitle {
      font-size: var(--font-size-base);
      color: var(--color-gray-600);
      margin: 0;
    }

    .filter-section {
      margin-bottom: var(--space-6);
    }

    .filter-tabs {
      display: flex;
      gap: var(--space-2);
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
      padding-bottom: var(--space-1);
    }

    .filter-tab {
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      padding: var(--space-2) var(--space-4);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      white-space: nowrap;
      transition: all 0.15s ease;
      margin-bottom: -1px;
    }

    .filter-tab:hover {
      color: var(--color-gray-900);
    }

    .filter-tab.active {
      color: var(--color-primary-600);
      border-bottom-color: var(--color-primary-600);
      font-weight: var(--font-weight-semibold);
    }

    .tab-count {
      background: var(--color-gray-100);
      color: var(--color-gray-700);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
    }

    .filter-tab.active .tab-count {
      background: var(--color-primary-50);
      color: var(--color-primary-700);
    }

    .loading-container {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    .registrations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: var(--space-6);
    }

    .registration-card {
      display: flex;
      flex-direction: column;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .registration-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .reg-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--border-color);
    }

    .reg-number-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-xs);
    }

    .reg-label {
      color: var(--color-gray-500);
      font-weight: var(--font-weight-bold);
    }

    .reg-number {
      font-family: var(--font-family-mono);
      color: var(--color-gray-800);
    }

    .reg-card-body {
      padding: var(--space-5);
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .event-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0;
      line-height: 1.3;
    }

    .event-title-link {
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .event-title-link:hover {
      color: var(--color-primary-600);
      text-decoration: underline;
    }

    .reg-details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
    }

    .detail-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .detail-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .detail-value {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-800);
    }

    .cost-value {
      color: var(--color-primary-700);
    }

    .pending-notice {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-warning-text);
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
    }

    .reg-card-footer {
      padding: var(--space-3) var(--space-5);
      background: var(--bg-surface);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
    }

    .card-footer-left {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-danger-outline {
      background: transparent;
      border: 1px solid var(--color-error-border);
      color: var(--color-error-accent);
      padding: var(--space-1) var(--space-3);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: var(--color-error-bg);
      border-color: var(--color-error-accent);
    }

    .btn-danger-outline:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .cancelled-tag {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
      font-style: italic;
    }

    /* Cancellation Modal */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: var(--space-4);
    }

    .cancel-modal {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
    }

    .modal-header {
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: var(--space-1);
      border-radius: var(--radius-sm);
    }

    .modal-close:hover {
      color: var(--color-gray-700);
    }

    .modal-body {
      padding: var(--space-5);
    }

    .warning-box {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      border-radius: var(--radius-md);
      color: var(--color-error-text);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
    }

    .warning-icon {
      font-size: 1.25rem;
    }

    .cancel-desc {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      line-height: 1.5;
      margin: 0;
    }

    .modal-footer {
      padding: var(--space-4) var(--space-5);
      background: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }
  `],
})
export class MyRegistrationsComponent implements OnInit {
  private readonly registrationService = inject(RegistrationService);
  private readonly uiFeedbackService = inject(UiFeedbackService);
  private readonly route = inject(ActivatedRoute, { optional: true });
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly RegistrationStatus = RegistrationStatus;

  readonly registrations = signal<RegistrationDto[]>([]);
  readonly totalCount = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly hasPreviousPage = signal<boolean>(false);
  readonly hasNextPage = signal<boolean>(false);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<StatusFilter>('ALL');

  readonly selectedForCancel = signal<RegistrationDto | null>(null);
  readonly cancellingId = signal<string | null>(null);

  readonly cancelMessage = computed(() => {
    const target = this.selectedForCancel();
    if (!target) return '';
    return `Are you sure you want to cancel your registration for "${target.eventName || 'this event'}" (${target.registrationNumber})? This will immediately release your ${target.quantity} ticket(s) back to the public pool so other attendees can register.`;
  });

  readonly confirmedCount = computed(() => {
    return this.registrations().filter((r) => r.status === RegistrationStatus.Confirmed).length;
  });

  readonly pendingCount = computed(() => {
    return this.registrations().filter((r) => r.status === RegistrationStatus.Pending).length;
  });

  readonly cancelledCount = computed(() => {
    return this.registrations().filter((r) => r.status === RegistrationStatus.Cancelled).length;
  });

  readonly filteredRegistrations = computed(() => {
    const status = this.selectedStatus();
    if (status === 'ALL') {
      return this.registrations();
    }
    return this.registrations().filter((r) => r.status === status);
  });

  ngOnInit(): void {
    if (this.route) {
      const snapshotParams = this.route.snapshot.queryParamMap;
      this.applyQueryParams(snapshotParams);

      this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
        if (this.hasParamsChanged(params)) {
          this.applyQueryParams(params);
          this.loadRegistrations();
        }
      });
    }

    this.loadRegistrations();
  }

  private applyQueryParams(params: { get(name: string): string | null }): void {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const statusParam = params.get('status');
    let status: StatusFilter = 'ALL';
    if (statusParam === '1' || statusParam === 'Pending') {
      status = RegistrationStatus.Pending;
    } else if (statusParam === '2' || statusParam === 'Confirmed') {
      status = RegistrationStatus.Confirmed;
    } else if (statusParam === '3' || statusParam === 'Cancelled') {
      status = RegistrationStatus.Cancelled;
    }

    this.pageNumber.set(isNaN(page) || page < 1 ? 1 : page);
    this.pageSize.set(isNaN(size) || size < 1 ? 10 : size);
    this.selectedStatus.set(status);
  }

  private hasParamsChanged(params: { get(name: string): string | null }): boolean {
    const page = parseInt(params.get('page') || '1', 10);
    const size = parseInt(params.get('pageSize') || '10', 10);
    const statusParam = params.get('status');
    let status: StatusFilter = 'ALL';
    if (statusParam === '1' || statusParam === 'Pending') {
      status = RegistrationStatus.Pending;
    } else if (statusParam === '2' || statusParam === 'Confirmed') {
      status = RegistrationStatus.Confirmed;
    } else if (statusParam === '3' || statusParam === 'Cancelled') {
      status = RegistrationStatus.Cancelled;
    }

    return (
      page !== this.pageNumber() ||
      size !== this.pageSize() ||
      status !== this.selectedStatus()
    );
  }

  private updateQueryParams(): void {
    if (!this.router || !this.route) return;

    let statusParamVal: string | null = null;
    if (this.selectedStatus() === RegistrationStatus.Pending) statusParamVal = 'Pending';
    else if (this.selectedStatus() === RegistrationStatus.Confirmed) statusParamVal = 'Confirmed';
    else if (this.selectedStatus() === RegistrationStatus.Cancelled) statusParamVal = 'Cancelled';

    const queryParams: Record<string, string | number | boolean | null> = {
      page: this.pageNumber() > 1 ? this.pageNumber() : null,
      pageSize: this.pageSize() !== 10 ? this.pageSize() : null,
      status: statusParamVal,
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
    });
  }

  loadRegistrations(): void {
    this.loading.set(true);
    this.error.set(null);

    const query: RegistrationQueryDto = {
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      sortBy: 'registeredAt',
      sortDirection: 'desc',
    };

    if (this.selectedStatus() !== 'ALL') {
      query.status = this.selectedStatus() as RegistrationStatus;
    }

    this.registrationService.getAll(query).subscribe({
      next: (result) => {
        this.registrations.set(result.items || []);
        this.totalCount.set(result.totalCount ?? (result.items ? result.items.length : 0));
        this.totalPages.set(result.totalPages ?? Math.ceil(this.totalCount() / this.pageSize()));
        this.pageNumber.set(result.pageNumber ?? this.pageNumber());
        this.pageSize.set(result.pageSize ?? this.pageSize());
        this.hasPreviousPage.set(result.hasPreviousPage ?? (this.pageNumber() > 1));
        this.hasNextPage.set(result.hasNextPage ?? (this.pageNumber() < this.totalPages()));
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err.error?.message ||
          err.message ||
          'Failed to load your event registrations. Please try again.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(status: StatusFilter): void {
    this.selectedStatus.set(status);
    this.pageNumber.set(1);
    this.updateQueryParams();
    this.loadRegistrations();
  }

  onPageSizeChange(event: Event | number): void {
    const size = typeof event === 'number' ? event : parseInt((event.target as HTMLSelectElement).value, 10);
    if (!isNaN(size) && size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.pageNumber.set(1);
      this.updateQueryParams();
      this.loadRegistrations();
    }
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber()) {
      this.pageNumber.set(page);
      this.updateQueryParams();
      this.loadRegistrations();
    }
  }

  openCancelModal(reg: RegistrationDto): void {
    this.selectedForCancel.set(reg);
  }

  closeCancelModal(): void {
    if (this.cancellingId() !== null) return;
    this.selectedForCancel.set(null);
  }

  confirmCancellation(): void {
    const target = this.selectedForCancel();
    if (!target) return;

    this.cancellingId.set(target.id);

    this.registrationService.cancel(target.id).subscribe({
      next: (updated) => {
        this.registrations.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item))
        );
        this.cancellingId.set(null);
        this.selectedForCancel.set(null);
        this.uiFeedbackService.showSuccess(
          `Registration ${updated.registrationNumber} cancelled successfully.`
        );
      },
      error: (err) => {
        this.cancellingId.set(null);
        const msg =
          err.error?.message ||
          err.message ||
          'Unable to cancel this registration. Please contact support.';
        this.uiFeedbackService.showError(msg);
      },
    });
  }

  getStatusText(status: RegistrationStatus): string {
    return getRegistrationStatusLabel(status);
  }

  getStatusBadge(status: RegistrationStatus): string {
    return getRegistrationStatusBadgeClass(status);
  }
}
