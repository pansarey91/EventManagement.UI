import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RegistrationService } from '../../core/services/registration.service';
import { PaymentService } from '../../core/services/payment.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  RegistrationDto,
  RegistrationStatus,
  PaymentDto,
  PaymentStatus,
  getRegistrationStatusLabel,
  getRegistrationStatusBadgeClass,
  getPaymentStatusLabel,
  getPaymentStatusBadgeClass,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

@Component({
  selector: 'app-registration-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="container registration-detail-page">
      <nav aria-label="Breadcrumb" class="detail-nav">
        <a routerLink="/my-registrations" class="back-link">
          <span aria-hidden="true">←</span> Back to My Registrations
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner [message]="'Loading registration details...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Registration Not Found'"
          [message]="error()!"
          (retry)="loadRegistration()"
        ></app-error-state>
      } @else if (registration(); as reg) {
        <!-- Page Header -->
        <header class="reg-header">
          <div class="reg-header-main">
            <div class="reg-badge-row">
              <span class="badge" [ngClass]="getStatusBadge(reg.status)">
                {{ getStatusText(reg.status) }}
              </span>
              <span class="reg-date-hint">Booked on {{ reg.registeredAt | date: 'mediumDate' }}</span>
            </div>
            <h1 class="reg-title">Booking #{{ reg.registrationNumber }}</h1>
          </div>

          <div class="reg-header-actions">
            <a [routerLink]="['/events', reg.eventId]" class="btn btn-secondary">
              View Event Page
            </a>
            @if (reg.status === RegistrationStatus.Confirmed) {
              <a routerLink="/my-tickets" class="btn btn-primary">
                🎟️ View Entry Tickets
              </a>
            }
            @if (reg.status === RegistrationStatus.Pending && reg.totalAmount > 0) {
              <a [routerLink]="['/registrations', reg.id, 'payment']" class="btn btn-primary">
                💳 Proceed to Payment
              </a>
            }
            @if (reg.status !== RegistrationStatus.Cancelled) {
              <button
                type="button"
                class="btn btn-danger-outline"
                (click)="openCancelModal()"
                [disabled]="isCancelling()"
              >
                Cancel Booking
              </button>
            }
          </div>
        </header>

        <!-- Status Notice Banner -->
        @if (reg.status === RegistrationStatus.Pending) {
          <div class="status-banner banner-pending">
            <span class="banner-icon" aria-hidden="true">⏳</span>
            <div>
              <strong>Payment Pending:</strong>
              <span> Your reservation is recorded. Please complete payment to receive your official admission pass.</span>
            </div>
          </div>
        } @else if (reg.status === RegistrationStatus.Confirmed) {
          <div class="status-banner banner-confirmed">
            <span class="banner-icon" aria-hidden="true">✅</span>
            <div>
              <strong>Admission Confirmed:</strong>
              <span> Your registration is active and confirmed. Present your booking reference upon arrival.</span>
            </div>
          </div>
        } @else if (reg.status === RegistrationStatus.Cancelled) {
          <div class="status-banner banner-cancelled">
            <span class="banner-icon" aria-hidden="true">🚫</span>
            <div>
              <strong>Booking Cancelled:</strong>
              <span> This registration has been cancelled. Released tickets were restored to available inventory.</span>
            </div>
          </div>
        }

        <!-- Details Grid -->
        <div class="details-layout">
          <!-- Event Overview Card -->
          <section class="card detail-card" aria-labelledby="event-heading">
            <div class="card-header">
              <h2 id="event-heading" class="card-title">Event Information</h2>
            </div>
            <div class="card-body">
              <div class="info-group">
                <span class="info-label">Event Name</span>
                <strong class="info-value event-name">
                  <a [routerLink]="['/events', reg.eventId]">{{ reg.eventName || 'Event Details' }}</a>
                </strong>
              </div>

              <div class="info-group">
                <span class="info-label">Attendee Name</span>
                <span class="info-value">{{ reg.userName || 'Account Holder' }}</span>
              </div>

              @if (reg.userEmail) {
                <div class="info-group">
                  <span class="info-label">Attendee Email</span>
                  <span class="info-value">{{ reg.userEmail }}</span>
                </div>
              }

              <div class="info-group">
                <span class="info-label">Registration Date & Time</span>
                <span class="info-value">{{ reg.registeredAt | date: 'medium' }}</span>
              </div>
            </div>
          </section>

          <!-- Ticket & Financial Breakdown Card -->
          <section class="card detail-card" aria-labelledby="ticket-heading">
            <div class="card-header">
              <h2 id="ticket-heading" class="card-title">Ticket & Billing Breakdown</h2>
            </div>
            <div class="card-body">
              <div class="breakdown-table">
                <div class="table-row head">
                  <span>Item</span>
                  <span class="text-center">Qty</span>
                  <span class="text-right">Amount</span>
                </div>
                <div class="table-row">
                  <div>
                    <strong>{{ reg.ticketTypeName || 'Standard Ticket' }}</strong>
                    <div class="item-sub">Admission Pass</div>
                  </div>
                  <span class="text-center">{{ reg.quantity }}</span>
                  <span class="text-right">
                    {{ reg.totalAmount > 0 ? (reg.totalAmount | currency) : 'Free' }}
                  </span>
                </div>
                <div class="table-row total">
                  <strong>Total Authoritative Cost</strong>
                  <span></span>
                  <strong class="text-right total-cost">
                    {{ reg.totalAmount > 0 ? (reg.totalAmount | currency) : 'Free Admission' }}
                  </strong>
                </div>
              </div>

              <p class="billing-note">
                * All inventory deductions and financial totals are calculated and maintained securely by the server.
              </p>
            </div>
          </section>

          <!-- Payment Information Card -->
          <section class="card detail-card" aria-labelledby="payment-heading">
            <div class="card-header">
              <h2 id="payment-heading" class="card-title">Payment & Transactions</h2>
            </div>
            <div class="card-body">
              @if (payments().length === 0) {
                <div class="no-payments">
                  <p class="text-muted">No payment transactions recorded yet.</p>
                  @if (reg.status === RegistrationStatus.Pending && reg.totalAmount > 0) {
                    <a [routerLink]="['/registrations', reg.id, 'payment']" class="btn btn-primary btn-sm mt-3">
                      💳 Make Payment Now
                    </a>
                  }
                </div>
              } @else {
                <div class="payments-list">
                  @for (pay of payments(); track pay.id) {
                    <div class="payment-item">
                      <div class="pay-head">
                        <span class="badge" [ngClass]="getPayBadge(pay.status)">
                          {{ getPayStatus(pay.status) }}
                        </span>
                        <strong class="pay-amount">{{ pay.amount | currency }}</strong>
                      </div>
                      <div class="pay-meta">
                        <span>via {{ pay.paymentMethod }}</span>
                        <span>&bull;</span>
                        <span>{{ pay.createdAt | date: 'medium' }}</span>
                      </div>
                      @if (pay.transactionId) {
                        <div class="pay-txn">
                          <span>Ref: <code>{{ pay.transactionId }}</code></span>
                        </div>
                      }
                      @if (pay.failureReason) {
                        <div class="pay-fail-reason">
                          <span>Reason: {{ pay.failureReason }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                @if (reg.status === RegistrationStatus.Pending && reg.totalAmount > 0) {
                  <div class="mt-4">
                    <a [routerLink]="['/registrations', reg.id, 'payment']" class="btn btn-primary btn-sm">
                      Go to Payment Checkout
                    </a>
                  </div>
                }
              }
            </div>
          </section>
        </div>

        <!-- Cancellation Modal -->
        @if (isCancelModalOpen()) {
          <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
            <div class="modal-dialog cancel-modal">
              <header class="modal-header">
                <h2 id="cancel-modal-title" class="modal-title">Cancel Event Registration</h2>
                <button
                  type="button"
                  class="modal-close"
                  (click)="closeCancelModal()"
                  [disabled]="isCancelling()"
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>

              <div class="modal-body">
                <div class="warning-box">
                  <span class="warning-icon" aria-hidden="true">⚠️</span>
                  <p>
                    Are you sure you want to cancel booking
                    <strong>{{ reg.registrationNumber }}</strong>?
                  </p>
                </div>

                <p class="cancel-desc">
                  This action is permanent. Your <strong>{{ reg.quantity }}</strong> ticket{{ reg.quantity > 1 ? 's' : '' }} will be immediately restored to the event's public inventory.
                </p>
              </div>

              <footer class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="closeCancelModal()"
                  [disabled]="isCancelling()"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  (click)="confirmCancellation()"
                  [disabled]="isCancelling()"
                >
                  @if (isCancelling()) {
                    Cancelling...
                  } @else {
                    Confirm Cancellation
                  }
                </button>
              </footer>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .registration-detail-page {
      padding-top: var(--space-4);
      padding-bottom: var(--space-12);
    }

    .detail-nav {
      margin-bottom: var(--space-4);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary-600);
      text-decoration: none;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .loading-container {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    .reg-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    @media (min-width: 640px) {
      .reg-header {
        flex-direction: row;
        align-items: flex-start;
        justify-content: space-between;
      }
    }

    .reg-badge-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-2);
    }

    .reg-date-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .reg-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      font-family: var(--font-family-mono);
      margin: 0;
    }

    .reg-header-actions {
      display: flex;
      gap: var(--space-3);
      align-items: center;
    }

    .btn-danger-outline {
      background: transparent;
      border: 1px solid var(--color-error-border);
      color: var(--color-error-accent);
      padding: var(--space-2) var(--space-4);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: var(--color-error-bg);
      border-color: var(--color-error-accent);
    }

    .status-banner {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-6);
      line-height: 1.5;
    }

    .banner-pending {
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      color: var(--color-warning-text);
    }

    .banner-confirmed {
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      color: var(--color-success-text);
    }

    .banner-cancelled {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
    }

    .banner-icon {
      font-size: 1.25rem;
    }

    .details-layout {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: var(--space-6);
    }

    .detail-card {
      border-radius: var(--radius-lg);
    }

    .card-header {
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-color);
      background: var(--color-gray-50);
    }

    .card-title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .card-body {
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .info-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .info-value {
      font-size: var(--font-size-sm);
      color: var(--color-gray-800);
    }

    .event-name a {
      color: var(--color-primary-600);
      text-decoration: none;
      font-size: var(--font-size-base);
    }

    .event-name a:hover {
      text-decoration: underline;
    }

    .breakdown-table {
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .table-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      padding: var(--space-3) var(--space-4);
      font-size: var(--font-size-sm);
      align-items: center;
      border-bottom: 1px solid var(--border-color);
    }

    .table-row:last-child {
      border-bottom: none;
    }

    .table-row.head {
      background: var(--color-gray-50);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-700);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
    }

    .table-row.total {
      background: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
    }

    .item-sub {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .total-cost {
      color: var(--color-primary-600);
      font-size: var(--font-size-base);
    }

    .billing-note {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
      font-style: italic;
      margin: 0;
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

    .payment-item {
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border-color);
    }

    .payment-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .pay-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-1);
    }

    .pay-amount {
      font-size: var(--font-size-sm);
      color: var(--color-gray-900);
    }

    .pay-meta {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      display: flex;
      gap: var(--space-2);
    }

    .pay-txn {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin-top: 0.25rem;
    }

    .pay-txn code {
      font-family: var(--font-family-mono);
      background: var(--color-gray-100);
      padding: 0.125rem 0.25rem;
      border-radius: var(--radius-sm);
    }

    .pay-fail-reason {
      font-size: var(--font-size-xs);
      color: var(--color-error-accent);
      margin-top: 0.25rem;
      font-style: italic;
    }

    .text-muted {
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
      margin: 0;
    }
  `],
})
export class RegistrationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registrationService = inject(RegistrationService);
  private readonly paymentService = inject(PaymentService);
  private readonly uiFeedbackService = inject(UiFeedbackService);

  readonly RegistrationStatus = RegistrationStatus;
  readonly PaymentStatus = PaymentStatus;

  readonly registration = signal<RegistrationDto | null>(null);
  readonly payments = signal<PaymentDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isCancelModalOpen = signal<boolean>(false);
  readonly isCancelling = signal<boolean>(false);

  ngOnInit(): void {
    this.loadRegistration();
  }

  loadRegistration(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Invalid registration ID.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.registrationService.getById(id).subscribe({
      next: (data) => {
        this.registration.set(data);
        this.loading.set(false);
        this.loadPayments(id);
      },
      error: (err) => {
        const msg =
          err.error?.message ||
          err.message ||
          'Registration not found or you do not have permission to view it.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  loadPayments(registrationId: string): void {
    this.paymentService.getByRegistrationId(registrationId).subscribe({
      next: (data) => {
        this.payments.set(data || []);
      },
      error: () => {
        // Silently fail if payments cannot be loaded; non-critical for registration viewing
      },
    });
  }

  openCancelModal(): void {
    this.isCancelModalOpen.set(true);
  }

  closeCancelModal(): void {
    if (this.isCancelling()) return;
    this.isCancelModalOpen.set(false);
  }

  confirmCancellation(): void {
    const reg = this.registration();
    if (!reg) return;

    this.isCancelling.set(true);

    this.registrationService.cancel(reg.id).subscribe({
      next: (updated) => {
        this.registration.set(updated);
        this.isCancelling.set(false);
        this.isCancelModalOpen.set(false);
        this.uiFeedbackService.showSuccess(
          `Registration ${updated.registrationNumber} was cancelled.`
        );
      },
      error: (err) => {
        this.isCancelling.set(false);
        const msg =
          err.error?.message ||
          err.message ||
          'Failed to cancel registration.';
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

  getPayStatus(status: PaymentStatus): string {
    return getPaymentStatusLabel(status);
  }

  getPayBadge(status: PaymentStatus): string {
    return getPaymentStatusBadgeClass(status);
  }
}
