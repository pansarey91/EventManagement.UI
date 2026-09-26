import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RegistrationService } from '../../core/services/registration.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  PublicEventDetailsDto,
  PublicTicketTypeDto,
  RegistrationDto,
  RegistrationStatus,
  getRegistrationStatusLabel,
  getRegistrationStatusBadgeClass,
} from '../../core/models';

@Component({
  selector: 'app-register-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-dialog">
        <!-- Modal Header -->
        <header class="modal-header">
          <div>
            <h2 id="modal-title" class="modal-title">
              {{ successResult() ? 'Registration Confirmed!' : 'Register for Event' }}
            </h2>
            <p class="modal-subtitle">{{ event.name }}</p>
          </div>
          <button
            type="button"
            class="modal-close"
            (click)="closeModal()"
            aria-label="Close dialog"
            [disabled]="isSubmitting()"
          >
            ✕
          </button>
        </header>

        <!-- Modal Body -->
        <div class="modal-body">
          <!-- SUCCESS VIEW -->
          @if (successResult(); as reg) {
            <div class="success-container">
              <div class="success-icon" aria-hidden="true">🎉</div>
              <h3 class="success-heading">You are registered!</h3>
              <p class="success-desc">
                Your registration has been securely processed. A record has been added to your account.
              </p>

              <div class="reg-summary-card">
                <div class="summary-row">
                  <span class="summary-label">Registration No:</span>
                  <span class="summary-val reg-number">{{ reg.registrationNumber }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Status:</span>
                  <span class="badge" [ngClass]="getStatusBadge(reg.status)">
                    {{ getStatusText(reg.status) }}
                  </span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Event:</span>
                  <span class="summary-val">{{ event.name }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Ticket Type:</span>
                  <span class="summary-val">{{ reg.ticketTypeName || selectedTicket()?.name }}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Quantity:</span>
                  <span class="summary-val">{{ reg.quantity }} ticket{{ reg.quantity > 1 ? 's' : '' }}</span>
                </div>
                <div class="summary-row total-row">
                  <span class="summary-label">Total Amount:</span>
                  <span class="summary-val total-amount">
                    {{ reg.totalAmount > 0 ? (reg.totalAmount | currency) : 'Free Admission' }}
                  </span>
                </div>
              </div>

              @if (reg.totalAmount > 0) {
                <div class="info-alert">
                  <span class="alert-icon" aria-hidden="true">ℹ️</span>
                  <div>
                    <strong>Payment Pending:</strong>
                    <span> Your registration reservation is secured. Please complete payment to confirm your booking and receive your official pass.</span>
                  </div>
                </div>
              } @else {
                <div class="info-alert success-theme">
                  <span class="alert-icon" aria-hidden="true">✅</span>
                  <div>
                    <strong>Free Admission Confirmed:</strong>
                    <span> No payment is required for this ticket tier.</span>
                  </div>
                </div>
              }

              <div class="modal-footer success-footer">
                @if (reg.totalAmount > 0 && reg.status === RegistrationStatus.Pending) {
                  <a
                    [routerLink]="['/registrations', reg.id, 'payment']"
                    class="btn btn-primary"
                    (click)="closeModal()"
                  >
                    💳 Proceed to Payment
                  </a>
                }
                <a
                  [routerLink]="['/my-registrations', reg.id]"
                  [class]="reg.totalAmount > 0 && reg.status === RegistrationStatus.Pending ? 'btn btn-secondary' : 'btn btn-primary'"
                  (click)="closeModal()"
                >
                  View Registration Details
                </a>
                <a
                  routerLink="/my-registrations"
                  class="btn btn-outline"
                  (click)="closeModal()"
                >
                  All My Registrations
                </a>
                <button
                  type="button"
                  class="btn btn-outline"
                  (click)="closeModal()"
                >
                  Done
                </button>
              </div>
            </div>
          } @else {
            <!-- BOOKING FORM -->
            @if (submitError()) {
              <div class="error-alert" role="alert">
                <span class="alert-icon" aria-hidden="true">⚠️</span>
                <div class="alert-content">
                  <strong>Registration Error:</strong>
                  <span> {{ submitError() }}</span>
                </div>
              </div>
            }

            <!-- Event Details Pill -->
            <div class="event-meta-banner">
              <div class="meta-item">
                <span class="meta-label">Date & Time:</span>
                <span class="meta-value">{{ event.startDateTime | date: 'medium' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Venue:</span>
                <span class="meta-value">{{ event.venueName || 'Online / TBA' }}</span>
              </div>
            </div>

            <!-- Step 1: Select Ticket Tier -->
            <fieldset class="form-section">
              <legend class="section-heading">1. Select Ticket Tier</legend>
              
              @if (availableTicketTypes().length === 0) {
                <div class="no-tickets-warning">
                  <p>There are currently no active tickets available for purchase for this event.</p>
                </div>
              } @else {
                <div class="ticket-radio-group" role="radiogroup" aria-label="Ticket tier options">
                  @for (ticket of availableTicketTypes(); track ticket.id) {
                    <label
                      class="ticket-option-card"
                      [class.selected]="selectedTicketTypeId() === ticket.id"
                      [class.disabled]="ticket.availableQuantity <= 0"
                    >
                      <input
                        type="radio"
                        name="ticketType"
                        [value]="ticket.id"
                        [checked]="selectedTicketTypeId() === ticket.id"
                        [disabled]="ticket.availableQuantity <= 0"
                        (change)="selectTicket(ticket)"
                        class="ticket-radio-input"
                      />
                      <div class="ticket-option-details">
                        <div class="ticket-option-head">
                          <span class="ticket-name">{{ ticket.name }}</span>
                          <span class="ticket-price">
                            {{ ticket.price > 0 ? (ticket.price | currency) : 'Free' }}
                          </span>
                        </div>
                        @if (ticket.description) {
                          <p class="ticket-desc">{{ ticket.description }}</p>
                        }
                        <div class="ticket-option-footer">
                          <span class="stock-badge">
                            {{ ticket.availableQuantity }} seat{{ ticket.availableQuantity > 1 ? 's' : '' }} remaining
                          </span>
                        </div>
                      </div>
                    </label>
                  }
                </div>
              }
            </fieldset>

            <!-- Step 2: Select Quantity -->
            @if (selectedTicket()) {
              <fieldset class="form-section">
                <legend class="section-heading">2. Select Quantity</legend>
                <div class="quantity-controls">
                  <div class="stepper">
                    <button
                      type="button"
                      class="stepper-btn"
                      (click)="decreaseQuantity()"
                      [disabled]="quantity() <= 1 || isSubmitting()"
                      aria-label="Decrease ticket quantity"
                    >
                      −
                    </button>
                    <span class="stepper-value" aria-live="polite" aria-atomic="true">
                      {{ quantity() }}
                    </span>
                    <button
                      type="button"
                      class="stepper-btn"
                      (click)="increaseQuantity()"
                      [disabled]="quantity() >= maxQuantity() || isSubmitting()"
                      aria-label="Increase ticket quantity"
                    >
                      +
                    </button>
                  </div>
                  <span class="quantity-limit-hint">
                    (Max {{ maxQuantity() }} per registration based on remaining availability)
                  </span>
                </div>
              </fieldset>

              <!-- Step 3: Estimated Summary -->
              <section class="summary-section" aria-label="Estimated booking summary">
                <div class="summary-box">
                  <div class="summary-line">
                    <span>Selected Ticket:</span>
                    <strong>{{ selectedTicket()?.name }}</strong>
                  </div>
                  <div class="summary-line">
                    <span>Unit Price:</span>
                    <span>{{ selectedTicket()?.price ? (selectedTicket()!.price | currency) : 'Free' }}</span>
                  </div>
                  <div class="summary-line">
                    <span>Quantity:</span>
                    <span>{{ quantity() }}</span>
                  </div>
                  <hr class="summary-divider" />
                  <div class="summary-line total">
                    <span>Estimated Total:</span>
                    <strong class="total-price">
                      {{ estimatedTotal() > 0 ? (estimatedTotal() | currency) : 'Free' }}
                    </strong>
                  </div>
                </div>
                <p class="summary-disclaimer">
                  * Final pricing and inventory reduction are verified authoritatively by the server upon submission.
                </p>
              </section>
            }

            <!-- Modal Actions -->
            <footer class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeModal()"
                [disabled]="isSubmitting()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-primary"
                (click)="submitRegistration()"
                [disabled]="!canSubmit() || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="spinner-small" aria-hidden="true"></span>
                  Processing Registration...
                } @else {
                  Confirm Registration
                }
              </button>
            </footer>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      overflow-y: auto;
    }

    .modal-dialog {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 580px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: modalSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-4);
      background: var(--color-gray-50);
    }

    .modal-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-1);
    }

    .modal-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    .modal-close {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: var(--color-gray-400);
      cursor: pointer;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      line-height: 1;
      transition: color 0.15s, background 0.15s;
    }

    .modal-close:hover:not(:disabled) {
      color: var(--color-gray-700);
      background: var(--color-gray-200);
    }

    .modal-body {
      padding: var(--space-6);
      overflow-y: auto;
      flex: 1;
    }

    .event-meta-banner {
      background: var(--color-primary-50);
      border: 1px solid var(--color-primary-100);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .meta-item {
      display: flex;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
    }

    .meta-label {
      font-weight: var(--font-weight-semibold);
      color: var(--color-primary-800);
    }

    .meta-value {
      color: var(--color-primary-700);
    }

    .form-section {
      border: none;
      padding: 0;
      margin: 0 0 var(--space-5);
    }

    .section-heading {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-600);
      margin-bottom: var(--space-3);
      padding: 0;
    }

    .ticket-radio-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .ticket-option-card {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      background: var(--bg-surface);
      transition: all 0.15s ease;
    }

    .ticket-option-card:hover:not(.disabled) {
      border-color: var(--color-primary-500);
      background: var(--color-gray-50);
    }

    .ticket-option-card.selected {
      border-color: var(--color-primary-600);
      background: var(--color-primary-50);
    }

    .ticket-option-card.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--color-gray-100);
    }

    .ticket-radio-input {
      margin-top: var(--space-1);
      accent-color: var(--color-primary-600);
    }

    .ticket-option-details {
      flex: 1;
    }

    .ticket-option-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-1);
    }

    .ticket-name {
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-900);
    }

    .ticket-price {
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-600);
      font-size: var(--font-size-base);
    }

    .ticket-desc {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin: 0 0 var(--space-2);
    }

    .stock-badge {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-600);
    }

    .quantity-controls {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .stepper-btn {
      background: var(--color-gray-100);
      border: none;
      width: 40px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: bold;
      color: var(--color-gray-700);
      cursor: pointer;
      transition: background 0.15s;
    }

    .stepper-btn:hover:not(:disabled) {
      background: var(--color-gray-200);
    }

    .stepper-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .stepper-value {
      width: 48px;
      text-align: center;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-base);
      color: var(--color-gray-900);
    }

    .quantity-limit-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .summary-section {
      margin-top: var(--space-5);
    }

    .summary-box {
      background: var(--color-gray-50);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
    }

    .summary-divider {
      border: none;
      border-top: 1px dashed var(--border-color);
      margin: var(--space-2) 0;
    }

    .summary-line.total {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
    }

    .total-price {
      color: var(--color-primary-600);
      font-size: var(--font-size-lg);
    }

    .summary-disclaimer {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
      margin: var(--space-2) 0 0;
      font-style: italic;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .error-alert {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
    }

    .no-tickets-warning {
      background: var(--color-warning-bg);
      border: 1px solid var(--color-warning-border);
      color: var(--color-warning-text);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-sm);
    }

    /* SUCCESS STYLES */
    .success-container {
      text-align: center;
      padding: var(--space-2) 0;
    }

    .success-icon {
      font-size: 3rem;
      margin-bottom: var(--space-2);
    }

    .success-heading {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-2);
    }

    .success-desc {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0 0 var(--space-5);
    }

    .reg-summary-card {
      background: var(--color-gray-50);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-4);
      text-align: left;
      margin-bottom: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .summary-label {
      color: var(--color-gray-600);
    }

    .summary-val {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-900);
    }

    .reg-number {
      font-family: var(--font-family-mono);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-700);
    }

    .total-row {
      border-top: 1px solid var(--border-color);
      padding-top: var(--space-2);
      margin-top: var(--space-1);
    }

    .total-amount {
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-600);
      font-size: var(--font-size-base);
    }

    .info-alert {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      text-align: left;
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
      background: var(--color-info-bg);
      border: 1px solid var(--color-info-border);
      color: var(--color-info-text);
    }

    .info-alert.success-theme {
      background: var(--color-success-bg);
      border-color: var(--color-success-border);
      color: var(--color-success-text);
    }

    .success-footer {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-3);
    }

    .spinner-small {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid currentColor;
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
  `],
})
export class RegisterModalComponent implements OnInit {
  @Input({ required: true }) event!: PublicEventDetailsDto;
  @Output() closed = new EventEmitter<void>();
  @Output() registered = new EventEmitter<RegistrationDto>();

  private readonly registrationService = inject(RegistrationService);
  private readonly uiFeedbackService = inject(UiFeedbackService);

  readonly RegistrationStatus = RegistrationStatus;

  readonly selectedTicketTypeId = signal<string>('');
  readonly quantity = signal<number>(1);
  readonly isSubmitting = signal<boolean>(false);
  readonly submitError = signal<string | null>(null);
  readonly successResult = signal<RegistrationDto | null>(null);

  readonly availableTicketTypes = computed(() => {
    return (this.event.ticketTypes || []).filter(
      (t) => t.isAvailable && t.availableQuantity > 0
    );
  });

  readonly selectedTicket = computed(() => {
    return this.availableTicketTypes().find((t) => t.id === this.selectedTicketTypeId()) || null;
  });

  readonly maxQuantity = computed(() => {
    const ticket = this.selectedTicket();
    if (!ticket) return 1;
    // Bounded by available stock up to max 10 per order
    return Math.min(ticket.availableQuantity, 10);
  });

  readonly estimatedTotal = computed(() => {
    const ticket = this.selectedTicket();
    if (!ticket) return 0;
    return ticket.price * this.quantity();
  });

  readonly canSubmit = computed(() => {
    return (
      !this.isSubmitting() &&
      this.selectedTicket() !== null &&
      this.quantity() >= 1 &&
      this.quantity() <= this.maxQuantity()
    );
  });

  ngOnInit(): void {
    const available = this.availableTicketTypes();
    if (available.length > 0) {
      this.selectedTicketTypeId.set(available[0].id);
    }
  }

  selectTicket(ticket: PublicTicketTypeDto): void {
    if (ticket.availableQuantity <= 0) return;
    this.selectedTicketTypeId.set(ticket.id);
    if (this.quantity() > ticket.availableQuantity) {
      this.quantity.set(Math.min(ticket.availableQuantity, 10));
    }
    this.submitError.set(null);
  }

  increaseQuantity(): void {
    if (this.quantity() < this.maxQuantity()) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  submitRegistration(): void {
    const ticket = this.selectedTicket();
    if (!ticket || !this.canSubmit()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    this.registrationService
      .create({
        eventId: this.event.id,
        ticketTypeId: ticket.id,
        quantity: this.quantity(),
      })
      .subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.successResult.set(created);
          this.registered.emit(created);
          this.uiFeedbackService.showSuccess('Registration completed successfully!');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const errorMsg =
            err.error?.message ||
            err.error?.detail ||
            err.message ||
            'Unable to complete registration. Please verify ticket availability and try again.';
          this.submitError.set(errorMsg);
        },
      });
  }

  closeModal(): void {
    if (this.isSubmitting()) return;
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeModal();
  }

  getStatusText(status: RegistrationStatus): string {
    return getRegistrationStatusLabel(status);
  }

  getStatusBadge(status: RegistrationStatus): string {
    return getRegistrationStatusBadgeClass(status);
  }
}
