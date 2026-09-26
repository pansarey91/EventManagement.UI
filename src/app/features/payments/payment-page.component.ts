import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RegistrationService } from '../../core/services/registration.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthorizationService } from '../../core/services/authorization.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  RegistrationDto,
  RegistrationStatus,
  PaymentDto,
  PaymentStatus,
  SUPPORTED_PAYMENT_METHODS,
  PaymentMethodOption,
  getPaymentStatusLabel,
  getPaymentStatusBadgeClass,
  getRegistrationStatusLabel,
  getRegistrationStatusBadgeClass,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

@Component({
  selector: 'app-payment-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="container payment-page">
      <nav aria-label="Breadcrumb" class="payment-nav">
        <a [routerLink]="['/my-registrations', registrationId()]" class="back-link">
          <span aria-hidden="true">←</span> Back to Registration
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner [message]="'Loading payment and booking details...'"></app-loading-spinner>
        </div>
      } @else if (pageError()) {
        <app-error-state
          [title]="'Unable to Load Payment'"
          [message]="pageError()!"
          (retry)="loadData()"
        ></app-error-state>
      } @else if (registration(); as reg) {
        <header class="payment-header">
          <div class="header-main">
            <h1 class="page-title">Checkout & Payment</h1>
            <p class="header-subtitle">
              Registration Reference:
              <strong class="reg-number">{{ reg.registrationNumber }}</strong>
            </p>
          </div>
          <div class="header-badge">
            <span class="badge" [ngClass]="getRegBadge(reg.status)">
              {{ getRegStatus(reg.status) }}
            </span>
          </div>
        </header>

        <!-- Cancelled Registration Notice -->
        @if (reg.status === RegistrationStatus.Cancelled) {
          <div class="alert alert-danger" role="alert">
            <span class="alert-icon" aria-hidden="true">🚫</span>
            <div>
              <strong>Registration Cancelled:</strong>
              <p>This booking has been cancelled. Payments cannot be initiated or processed for cancelled registrations.</p>
            </div>
          </div>
        } @else if (reg.totalAmount <= 0) {
          <!-- Free Admission Notice -->
          <div class="alert alert-success" role="alert">
            <span class="alert-icon" aria-hidden="true">🎉</span>
            <div>
              <strong>Free Admission:</strong>
              <p>This registration is free. No payment is required. Your registration is already confirmed!</p>
              <div class="mt-3 flex gap-2">
                <a routerLink="/my-tickets" class="btn btn-primary btn-sm">
                  🎟️ View Entry Tickets
                </a>
                <a [routerLink]="['/my-registrations', reg.id]" class="btn btn-secondary btn-sm">
                  View My Registration
                </a>
              </div>
            </div>
          </div>
        } @else {
          <!-- Main Content Layout -->
          <div class="payment-grid">
            <!-- Left Column: Payment Processing State / Selection Form -->
            <main class="payment-action-column">
              <!-- STATE 1: COMPLETED -->
              @if (completedPayment(); as completed) {
                <div class="card status-card card-completed">
                  <div class="status-card-header">
                    <span class="status-big-icon" aria-hidden="true">✅</span>
                    <h2>Payment Confirmed!</h2>
                    <p class="status-subtitle">
                      Your payment of <strong>{{ completed.amount | currency }}</strong> has been verified.
                    </p>
                  </div>

                  <div class="receipt-box">
                    <div class="receipt-row">
                      <span class="receipt-label">Transaction ID:</span>
                      <strong class="receipt-val receipt-mono">{{ completed.transactionId || 'N/A' }}</strong>
                    </div>
                    <div class="receipt-row">
                      <span class="receipt-label">Payment Method:</span>
                      <span class="receipt-val">{{ completed.paymentMethod }}</span>
                    </div>
                    <div class="receipt-row">
                      <span class="receipt-label">Paid On:</span>
                      <span class="receipt-val">{{ completed.paidAt | date: 'medium' }}</span>
                    </div>
                    <div class="receipt-row">
                      <span class="receipt-label">Status:</span>
                      <span class="badge badge-success">Completed</span>
                    </div>
                  </div>

                  <div class="status-card-actions">
                    <a routerLink="/my-tickets" class="btn btn-primary">
                      🎟️ View My Tickets
                    </a>
                    <a [routerLink]="['/my-registrations', reg.id]" class="btn btn-secondary">
                      View Registration Details
                    </a>
                    <a routerLink="/my-registrations" class="btn btn-secondary">
                      All My Bookings
                    </a>
                  </div>
                </div>
              } @else if (pendingPayment(); as pending) {
                <!-- STATE 2: PENDING VERIFICATION -->
                <div class="card status-card card-pending">
                  <div class="status-card-header">
                    <span class="status-big-icon" aria-hidden="true">⏳</span>
                    <h2>Payment Pending Verification</h2>
                    <p class="status-subtitle">
                      Payment request initiated for <strong>{{ pending.amount | currency }}</strong> via
                      <strong>{{ pending.paymentMethod }}</strong>.
                    </p>
                  </div>

                  <!-- Instructions by payment method -->
                  <div class="instruction-box">
                    <h3 class="instruction-title">Instructions to Complete:</h3>
                    @if (pending.paymentMethod === 'UPI') {
                      <div class="method-instruct">
                        <p>1. Open your UPI app (Google Pay, PhonePe, Paytm).</p>
                        <p>2. Send <strong>{{ pending.amount | currency }}</strong> to UPI ID: <code>eventsync&#64;bank</code></p>
                        <p>3. Note reference: <code>{{ reg.registrationNumber }}</code></p>
                        <p>4. Once sent, click <strong>Check Status</strong> below to refresh once verified.</p>
                      </div>
                    } @else if (pending.paymentMethod === 'Bank Transfer') {
                      <div class="method-instruct">
                        <p>1. Transfer <strong>{{ pending.amount | currency }}</strong> via NEFT / RTGS / IMPS.</p>
                        <p>2. Beneficiary Account: <code>100200300400</code> (IFSC: <code>EVNT0001234</code>)</p>
                        <p>3. Mention Reference: <code>{{ reg.registrationNumber }}</code></p>
                        <p>4. The event organizer will confirm receipt.</p>
                      </div>
                    } @else if (pending.paymentMethod === 'Cash') {
                      <div class="method-instruct">
                        <p>Pay <strong>{{ pending.amount | currency }}</strong> in cash at the registration desk upon event arrival.</p>
                        <p>Reference: <code>{{ reg.registrationNumber }}</code></p>
                      </div>
                    } @else {
                      <div class="method-instruct">
                        <p>Payment initiated for <strong>{{ pending.amount | currency }}</strong> via {{ pending.paymentMethod }}.</p>
                        <p>Verification pending confirmation by the event organizer.</p>
                      </div>
                    }
                  </div>

                  <div class="status-card-actions">
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="refreshPaymentStatus()"
                      [disabled]="isRefreshing()"
                    >
                      @if (isRefreshing()) {
                        Checking Status...
                      } @else {
                        🔄 Check Payment Status
                      }
                    </button>
                    <button
                      type="button"
                      class="btn btn-outline"
                      (click)="enableMethodChange()"
                    >
                      Change Payment Method
                    </button>
                  </div>
                </div>
              } @else {
                <!-- STATE 3: INITIATE PAYMENT FORM -->
                <div class="card payment-form-card">
                  <div class="card-header">
                    <h2 class="card-title">Select Payment Method</h2>
                    <p class="card-subtitle">Choose your preferred method to complete this booking.</p>
                  </div>

                  <div class="card-body">
                    @if (actionError()) {
                      <div class="alert alert-danger" role="alert">
                        <span class="alert-icon" aria-hidden="true">⚠️</span>
                        <div>{{ actionError() }}</div>
                      </div>
                    }

                    <fieldset class="methods-group" aria-label="Available payment methods">
                      <legend class="sr-only">Payment Methods</legend>

                      @for (method of paymentMethods; track method.id) {
                        <label
                          class="method-card"
                          [class.selected]="selectedMethod() === method.id"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            [value]="method.id"
                            [checked]="selectedMethod() === method.id"
                            (change)="selectedMethod.set(method.id)"
                            class="method-radio"
                          />
                          <span class="method-icon" aria-hidden="true">{{ method.icon }}</span>
                          <div class="method-info">
                            <span class="method-label">{{ method.label }}</span>
                            <span class="method-desc">{{ method.description }}</span>
                          </div>
                        </label>
                      }
                    </fieldset>

                    <div class="payment-cta-box">
                      <button
                        type="button"
                        class="btn btn-primary btn-block btn-lg"
                        (click)="submitPayment()"
                        [disabled]="isSubmitting() || !selectedMethod()"
                      >
                        @if (isSubmitting()) {
                          <span class="spinner-inline" aria-hidden="true"></span>
                          Processing Payment...
                        } @else {
                          Pay {{ reg.totalAmount | currency }} Securely
                        }
                      </button>
                      <p class="secure-guarantee">
                        🔒 Authoritative Server Billing • Idempotent Processing
                      </p>
                    </div>
                  </div>
                </div>
              }

              <!-- ORGANIZER / ADMIN VERIFICATION PANEL -->
              @if (canVerify() && pendingPayment(); as pendingToVerify) {
                <div class="card organizer-verify-card">
                  <div class="card-header verify-header">
                    <div>
                      <h3 class="verify-title">Organizer / Staff Verification Panel</h3>
                      <p class="verify-subtitle">
                        As an event organizer or platform administrator, you can verify receipt or mark this payment failed.
                      </p>
                    </div>
                    <span class="badge badge-warning">Action Required</span>
                  </div>

                  <div class="card-body">
                    <p class="verify-desc">
                      Current Payment ID: <code>{{ pendingToVerify.id }}</code> &bull;
                      Method: <strong>{{ pendingToVerify.paymentMethod }}</strong> &bull;
                      Amount: <strong>{{ pendingToVerify.amount | currency }}</strong>
                    </p>

                    <div class="verify-actions">
                      <button
                        type="button"
                        class="btn btn-success"
                        (click)="markSuccessful(pendingToVerify.id)"
                        [disabled]="isVerifying()"
                      >
                        @if (isVerifying()) {
                          Confirming...
                        } @else {
                          ✓ Confirm Receipt (Mark Successful)
                        }
                      </button>

                      <button
                        type="button"
                        class="btn btn-danger-outline"
                        (click)="openFailModal(pendingToVerify)"
                        [disabled]="isVerifying()"
                      >
                        ✕ Mark Payment as Failed
                      </button>
                    </div>
                  </div>
                </div>
              }

              <!-- PAYMENT HISTORY / ATTEMPTS -->
              @if (payments().length > 0) {
                <section class="card history-card" aria-labelledby="history-heading">
                  <div class="card-header">
                    <h3 id="history-heading" class="card-title">Payment History</h3>
                  </div>
                  <div class="card-body p-0">
                    <div class="history-list">
                      @for (p of payments(); track p.id) {
                        <div class="history-item">
                          <div class="history-main">
                            <div class="history-head">
                              <span class="badge" [ngClass]="getPayBadge(p.status)">
                                {{ getPayStatus(p.status) }}
                              </span>
                              <strong class="history-amount">{{ p.amount | currency }}</strong>
                            </div>
                            <div class="history-meta">
                              <span>via {{ p.paymentMethod }}</span>
                              <span>&bull;</span>
                              <span>{{ p.createdAt | date: 'medium' }}</span>
                            </div>
                            @if (p.transactionId) {
                              <div class="history-txn">
                                Ref: <code>{{ p.transactionId }}</code>
                              </div>
                            }
                            @if (p.failureReason) {
                              <div class="history-fail-reason">
                                Reason: {{ p.failureReason }}
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </section>
              }
            </main>

            <!-- Right Column: Order Summary Card -->
            <aside class="payment-summary-column" aria-label="Order summary">
              <div class="card summary-card sticky-card">
                <div class="card-header">
                  <h2 class="card-title">Order Summary</h2>
                </div>

                <div class="card-body">
                  <div class="summary-event-info">
                    <h3 class="event-name">{{ reg.eventName || 'Event' }}</h3>
                    <p class="ticket-name">{{ reg.ticketTypeName || 'General Admission' }}</p>
                  </div>

                  <hr class="summary-divider" />

                  <div class="summary-breakdown">
                    <div class="breakdown-row">
                      <span class="label">Quantity:</span>
                      <span class="value">{{ reg.quantity }} ticket{{ reg.quantity > 1 ? 's' : '' }}</span>
                    </div>
                    <div class="breakdown-row">
                      <span class="label">Attendee:</span>
                      <span class="value">{{ reg.userName }}</span>
                    </div>
                    <div class="breakdown-row">
                      <span class="label">Booking Status:</span>
                      <span class="value">
                        <span class="badge" [ngClass]="getRegBadge(reg.status)">
                          {{ getRegStatus(reg.status) }}
                        </span>
                      </span>
                    </div>
                  </div>

                  <hr class="summary-divider" />

                  <div class="summary-total-row">
                    <span class="total-label">Authoritative Total:</span>
                    <strong class="total-value">{{ reg.totalAmount | currency }}</strong>
                  </div>

                  <p class="summary-disclaimer">
                    * The total cost is determined by backend ticket pricing rules and verified during transaction processing.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        }

        <!-- FAIL REASON MODAL -->
        @if (failModalOpen(); as paymentToFail) {
          <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="fail-modal-title">
            <div class="modal-dialog">
              <header class="modal-header">
                <h3 id="fail-modal-title" class="modal-title">Mark Payment Failed</h3>
                <button
                  type="button"
                  class="modal-close"
                  (click)="closeFailModal()"
                  [disabled]="isVerifying()"
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>

              <div class="modal-body">
                <p class="modal-text">
                  Specify the reason why this payment of
                  <strong>{{ selectedPaymentForFail()?.amount | currency }}</strong> could not be verified.
                </p>

                <div class="form-group">
                  <label for="fail-reason-input" class="form-label">Failure Reason:</label>
                  <input
                    id="fail-reason-input"
                    type="text"
                    class="form-control"
                    placeholder="e.g. Transaction declined, UTR mismatch, insufficient funds"
                    [(ngModel)]="failReason"
                    maxlength="500"
                  />
                </div>
              </div>

              <footer class="modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="closeFailModal()"
                  [disabled]="isVerifying()"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn-danger"
                  (click)="confirmFailPayment()"
                  [disabled]="isVerifying() || !failReason.trim()"
                >
                  @if (isVerifying()) {
                    Processing...
                  } @else {
                    Confirm Rejection
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
    .payment-page {
      padding-top: var(--space-4);
      padding-bottom: var(--space-12);
    }

    .payment-nav {
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

    .payment-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
    }

    @media (min-width: 640px) {
      .payment-header {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .header-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: var(--space-1) 0 0;
    }

    .reg-number {
      font-family: var(--font-family-mono);
      color: var(--color-gray-800);
    }

    .alert {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-6);
      line-height: 1.5;
    }

    .alert-icon {
      font-size: 1.25rem;
    }

    .alert-danger {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
    }

    .alert-success {
      background: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      color: var(--color-success-text);
    }

    .payment-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }

    @media (min-width: 900px) {
      .payment-grid {
        grid-template-columns: 1.6fr 1fr;
        align-items: start;
      }
    }

    .payment-action-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    /* Cards */
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

    .card-subtitle {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin: 0.25rem 0 0;
    }

    .card-body {
      padding: var(--space-5);
    }

    /* Status Cards */
    .status-card {
      text-align: center;
      padding: var(--space-6);
      border-radius: var(--radius-lg);
    }

    .card-completed {
      border: 2px solid var(--color-success-border);
      background: #f0fdf4;
    }

    .card-pending {
      border: 2px solid var(--color-warning-border);
      background: #fffbeb;
    }

    .status-big-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: var(--space-3);
    }

    .status-card h2 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-2);
    }

    .status-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
      margin: 0 0 var(--space-5);
    }

    .receipt-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      margin-bottom: var(--space-5);
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .receipt-label {
      color: var(--color-gray-600);
    }

    .receipt-val {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-900);
    }

    .receipt-mono {
      font-family: var(--font-family-mono);
      color: var(--color-primary-700);
    }

    .instruction-box {
      background: #ffffff;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      margin-bottom: var(--space-5);
      text-align: left;
    }

    .instruction-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-2);
    }

    .method-instruct p {
      margin: var(--space-1) 0;
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
    }

    .method-instruct code {
      background: var(--color-gray-100);
      padding: 0.125rem 0.375rem;
      border-radius: var(--radius-sm);
      font-family: var(--font-family-mono);
      color: var(--color-gray-900);
    }

    .status-card-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-3);
    }

    /* Method Selection */
    .methods-group {
      border: none;
      padding: 0;
      margin: 0 0 var(--space-5);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-3);
    }

    .method-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      background: var(--bg-surface);
      transition: all 0.15s ease;
    }

    .method-card:hover {
      border-color: var(--color-primary-400);
      background: var(--color-gray-50);
    }

    .method-card.selected {
      border-color: var(--color-primary-600);
      background: var(--color-primary-50);
    }

    .method-radio {
      accent-color: var(--color-primary-600);
    }

    .method-icon {
      font-size: 1.5rem;
    }

    .method-info {
      display: flex;
      flex-direction: column;
    }

    .method-label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
    }

    .method-desc {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .payment-cta-box {
      margin-top: var(--space-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-block {
      width: 100%;
    }

    .btn-lg {
      padding: var(--space-3) var(--space-6);
      font-size: var(--font-size-base);
    }

    .secure-guarantee {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin: 0;
    }

    /* Verification Panel */
    .organizer-verify-card {
      border: 2px dashed #f59e0b;
      background: #fffdfa;
    }

    .verify-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-3);
      background: #fef3c7;
    }

    .verify-title {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      color: #92400e;
      margin: 0;
    }

    .verify-subtitle {
      font-size: var(--font-size-xs);
      color: #b45309;
      margin: 0.25rem 0 0;
    }

    .verify-desc {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      margin: 0 0 var(--space-4);
    }

    .verify-desc code {
      font-family: var(--font-family-mono);
      background: #f1f5f9;
      padding: 0.125rem 0.25rem;
      border-radius: var(--radius-sm);
    }

    .verify-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }

    .btn-success {
      background: var(--color-success-accent);
      color: #ffffff;
      border: none;
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
    }

    .btn-success:hover:not(:disabled) {
      filter: brightness(0.95);
    }

    .btn-danger-outline {
      background: transparent;
      border: 1px solid var(--color-error-border);
      color: var(--color-error-accent);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      cursor: pointer;
    }

    .btn-danger-outline:hover:not(:disabled) {
      background: var(--color-error-bg);
    }

    /* History */
    .history-card {
      margin-top: var(--space-2);
    }

    .history-list {
      display: flex;
      flex-direction: column;
    }

    .history-item {
      padding: var(--space-3) var(--space-5);
      border-bottom: 1px solid var(--border-color);
    }

    .history-item:last-child {
      border-bottom: none;
    }

    .history-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-1);
    }

    .history-amount {
      font-size: var(--font-size-sm);
      color: var(--color-gray-900);
    }

    .history-meta {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      display: flex;
      gap: var(--space-2);
    }

    .history-txn {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin-top: 0.25rem;
    }

    .history-txn code {
      font-family: var(--font-family-mono);
    }

    .history-fail-reason {
      font-size: var(--font-size-xs);
      color: var(--color-error-accent);
      margin-top: 0.25rem;
      font-style: italic;
    }

    /* Summary Card */
    .summary-card {
      border-radius: var(--radius-lg);
    }

    .sticky-card {
      position: sticky;
      top: var(--space-4);
    }

    .summary-event-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .event-name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .ticket-name {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    .summary-divider {
      border: none;
      border-top: 1px dashed var(--border-color);
      margin: var(--space-4) 0;
    }

    .summary-breakdown {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm);
    }

    .breakdown-row .label {
      color: var(--color-gray-500);
    }

    .breakdown-row .value {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-800);
    }

    .summary-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .total-label {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
    }

    .total-value {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-600);
    }

    .summary-disclaimer {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
      font-style: italic;
      margin: var(--space-4) 0 0;
      line-height: 1.4;
    }

    /* Spinner */
    .spinner-inline {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid #ffffff;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      vertical-align: middle;
      margin-right: var(--space-2);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* Modal Backdrop & Dialog */
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

    .modal-dialog {
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
      font-size: var(--font-size-base);
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
    }

    .modal-body {
      padding: var(--space-5);
    }

    .modal-text {
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
      margin: 0 0 var(--space-4);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .form-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-700);
    }

    .form-control {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
      outline: none;
    }

    .form-control:focus {
      border-color: var(--color-primary-600);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
    }

    .modal-footer {
      padding: var(--space-4) var(--space-5);
      background: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }
  `],
})
export class PaymentPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly registrationService = inject(RegistrationService);
  private readonly paymentService = inject(PaymentService);
  private readonly authzService = inject(AuthorizationService);
  private readonly uiFeedback = inject(UiFeedbackService);

  readonly RegistrationStatus = RegistrationStatus;
  readonly PaymentStatus = PaymentStatus;
  readonly paymentMethods = SUPPORTED_PAYMENT_METHODS;

  readonly registrationId = signal<string>('');
  readonly registration = signal<RegistrationDto | null>(null);
  readonly payments = signal<PaymentDto[]>([]);

  readonly loading = signal<boolean>(false);
  readonly pageError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly selectedMethod = signal<string>(SUPPORTED_PAYMENT_METHODS[0].id);
  readonly isSubmitting = signal<boolean>(false);
  readonly isRefreshing = signal<boolean>(false);
  readonly isVerifying = signal<boolean>(false);

  readonly methodChangeAllowed = signal<boolean>(false);

  readonly failModalOpen = signal<boolean>(false);
  readonly selectedPaymentForFail = signal<PaymentDto | null>(null);
  failReason = '';

  readonly completedPayment = computed(() => {
    return this.payments().find((p) => p.status === PaymentStatus.Completed) || null;
  });

  readonly pendingPayment = computed(() => {
    if (this.completedPayment()) return null;
    if (this.methodChangeAllowed()) return null;
    return this.payments().find((p) => p.status === PaymentStatus.Pending) || null;
  });

  readonly canVerify = computed(() => {
    return this.authzService.isAdmin() || this.authzService.isOrganizer();
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('registrationId');
    if (!id) {
      this.pageError.set('Invalid registration ID.');
      return;
    }
    this.registrationId.set(id);
    this.loadData();
  }

  loadData(): void {
    const id = this.registrationId();
    if (!id) return;

    this.loading.set(true);
    this.pageError.set(null);
    this.actionError.set(null);

    this.registrationService.getById(id).subscribe({
      next: (reg) => {
        this.registration.set(reg);
        this.fetchPayments(id);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.error?.message ||
          err.message ||
          'Unable to load registration. Please ensure you are authorized.';
        this.pageError.set(msg);
      },
    });
  }

  fetchPayments(regId: string, stopSpinner = true): void {
    this.paymentService.getByRegistrationId(regId).subscribe({
      next: (list) => {
        this.payments.set(list || []);
        if (stopSpinner) this.loading.set(false);
        this.isRefreshing.set(false);
      },
      error: () => {
        if (stopSpinner) this.loading.set(false);
        this.isRefreshing.set(false);
      },
    });
  }

  submitPayment(): void {
    const reg = this.registration();
    if (!reg || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.actionError.set(null);
    this.methodChangeAllowed.set(false);

    this.paymentService
      .create({
        registrationId: reg.id,
        paymentMethod: this.selectedMethod(),
      })
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.payments.update((list) => {
            const index = list.findIndex((p) => p.id === created.id);
            if (index >= 0) {
              const copy = [...list];
              copy[index] = created;
              return copy;
            }
            return [created, ...list];
          });
          this.uiFeedback.showSuccess('Payment request initiated. Please follow instructions to complete.');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg =
            err.error?.message ||
            err.message ||
            'Failed to initiate payment. Please try again or select another payment method.';
          this.actionError.set(msg);
          this.uiFeedback.showError(msg);
        },
      });
  }

  refreshPaymentStatus(): void {
    const regId = this.registrationId();
    if (!regId || this.isRefreshing()) return;

    this.isRefreshing.set(true);
    this.registrationService.getById(regId).subscribe({
      next: (updatedReg) => {
        this.registration.set(updatedReg);
        this.fetchPayments(regId, false);
      },
      error: () => {
        this.isRefreshing.set(false);
      },
    });
  }

  enableMethodChange(): void {
    this.methodChangeAllowed.set(true);
  }

  markSuccessful(paymentId: string): void {
    if (this.isVerifying()) return;

    this.isVerifying.set(true);
    this.paymentService.markSuccessful(paymentId).subscribe({
      next: (updatedPayment) => {
        this.isVerifying.set(false);
        this.payments.update((list) =>
          list.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
        );
        this.registration.update((reg) =>
          reg ? { ...reg, status: RegistrationStatus.Confirmed } : null
        );
        this.uiFeedback.showSuccess('Payment verified and marked successful! Registration is confirmed.');
      },
      error: (err) => {
        this.isVerifying.set(false);
        const msg =
          err.error?.message ||
          err.message ||
          'Failed to mark payment as successful.';
        this.uiFeedback.showError(msg);
      },
    });
  }

  openFailModal(payment: PaymentDto): void {
    this.selectedPaymentForFail.set(payment);
    this.failReason = '';
    this.failModalOpen.set(true);
  }

  closeFailModal(): void {
    if (this.isVerifying()) return;
    this.failModalOpen.set(false);
    this.selectedPaymentForFail.set(null);
  }

  confirmFailPayment(): void {
    const target = this.selectedPaymentForFail();
    if (!target || !this.failReason.trim() || this.isVerifying()) return;

    this.isVerifying.set(true);
    this.paymentService
      .markFailed(target.id, { failureReason: this.failReason.trim() })
      .subscribe({
        next: (updatedPayment) => {
          this.isVerifying.set(false);
          this.payments.update((list) =>
            list.map((p) => (p.id === updatedPayment.id ? updatedPayment : p))
          );
          this.closeFailModal();
          this.uiFeedback.showWarning('Payment has been marked as failed.');
        },
        error: (err) => {
          this.isVerifying.set(false);
          const msg =
            err.error?.message ||
            err.message ||
            'Failed to mark payment as failed.';
          this.uiFeedback.showError(msg);
        },
      });
  }

  getRegStatus(status: RegistrationStatus): string {
    return getRegistrationStatusLabel(status);
  }

  getRegBadge(status: RegistrationStatus): string {
    return getRegistrationStatusBadgeClass(status);
  }

  getPayStatus(status: PaymentStatus): string {
    return getPaymentStatusLabel(status);
  }

  getPayBadge(status: PaymentStatus): string {
    return getPaymentStatusBadgeClass(status);
  }
}
