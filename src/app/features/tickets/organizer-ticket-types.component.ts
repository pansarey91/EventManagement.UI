import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { TicketTypeService } from '../../core/services/ticket-type.service';
import { EventService } from '../../core/services/event.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  TicketTypeDto,
  CreateTicketTypeDto,
  UpdateTicketTypeDto,
  EventDto,
  EventStatus,
  ApiError,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-organizer-ticket-types',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
  ],
  template: `
    <div class="ticket-types-container">
      <!-- Breadcrumb Navigation -->
      <nav aria-label="Breadcrumb" class="page-nav">
        <a routerLink="/organizer/events" class="back-link">
          <span aria-hidden="true">←</span> Back to Manage Events
        </a>
      </nav>

      <!-- Event Header / Context Card -->
      @if (loadingEvent()) {
        <div class="loading-wrapper">
          <app-loading-spinner [message]="'Loading event details...'"></app-loading-spinner>
        </div>
      } @else if (event()) {
        @let ev = event()!;
        <header class="event-context-card card">
          <div class="card-body event-context-body">
            <div class="event-meta">
              <div class="event-header-row">
                <span [class]="getEventStatusBadgeClass(ev.status)">
                  {{ getEventStatusLabel(ev.status) }}
                </span>
                <span class="venue-pill">🏛️ {{ ev.venueName || 'Venue TBD' }}</span>
              </div>
              <h1 class="page-title">{{ ev.name }} — Ticket Types</h1>
              <p class="event-dates">
                📅 {{ ev.startDateTime | date: 'fullDate' }} ({{ ev.startDateTime | date: 'shortTime' }} – {{ ev.endDateTime | date: 'shortTime' }})
              </p>
            </div>

            <!-- Capacity Summary Badge Box -->
            <div class="capacity-stats">
              <div class="stat-box">
                <span class="stat-label">Event Capacity</span>
                <span class="stat-val">{{ ev.maxCapacity }}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Allocated Tickets</span>
                <span class="stat-val" [class.text-danger]="allocatedTickets() > ev.maxCapacity">
                  {{ allocatedTickets() }}
                </span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Remaining Space</span>
                <span class="stat-val" [class.text-warning]="remainingCapacity() <= 0">
                  {{ remainingCapacity() }}
                </span>
              </div>
            </div>
          </div>

          <!-- Lifecycle Alert if Event Completed or Cancelled -->
          @if (isEventClosed()) {
            <div class="alert alert-warning lifecycle-alert" role="alert">
              ⚠️ This event is <strong>{{ getEventStatusLabel(ev.status) }}</strong>. Adding or modifying ticket types is restricted.
            </div>
          }
        </header>

        <!-- Actions Bar -->
        <div class="actions-bar">
          <div class="actions-summary">
            <h2>Configured Tiers ({{ ticketTypes().length }})</h2>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-add"
            (click)="openCreateModal()"
            [disabled]="isEventClosed()"
            title="Add a new ticket tier"
          >
            <span class="btn-icon" aria-hidden="true">+</span>
            <span>Add Ticket Type</span>
          </button>
        </div>

        <!-- Ticket Types List Area -->
        @if (loadingTickets() && ticketTypes().length === 0) {
          <div class="loading-wrapper">
            <app-loading-spinner [message]="'Loading ticket tiers...'"></app-loading-spinner>
          </div>
        } @else if (error()) {
          <app-error-state
            [title]="'Unable to load ticket types'"
            [message]="error()!"
            (retry)="loadTicketTypes()"
          ></app-error-state>
        } @else if (ticketTypes().length === 0) {
          <app-empty-state
            [icon]="'🎟️'"
            [title]="'No Ticket Types Configured'"
            [message]="'You have not defined any ticket types for this event yet. Create your first ticket tier to enable pricing and capacity allocation.'"
            [actionLabel]="isEventClosed() ? null : 'Add Ticket Type'"
            (action)="openCreateModal()"
          ></app-empty-state>
        } @else {
          <!-- Ticket Types Cards Grid -->
          <div class="tickets-grid">
            @for (ticket of ticketTypes(); track ticket.id) {
              <article class="ticket-card card" [class.card-inactive]="!ticket.isActive">
                <div class="card-body ticket-card-body">
                  <!-- Header: Name & Status -->
                  <div class="ticket-card-header">
                    <div class="title-and-status">
                      <h3 class="ticket-name">{{ ticket.name }}</h3>
                      <span
                        class="badge"
                        [class.badge-active]="ticket.isActive"
                        [class.badge-inactive]="!ticket.isActive"
                      >
                        {{ ticket.isActive ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                    <div class="ticket-price-tag">
                      @if (ticket.price > 0) {
                        <span class="price-num">{{ ticket.price | currency }}</span>
                      } @else {
                        <span class="price-free">Free</span>
                      }
                    </div>
                  </div>

                  @if (ticket.description) {
                    <p class="ticket-desc">{{ ticket.description }}</p>
                  }

                  <!-- Quantities & Inventory Progress -->
                  <div class="inventory-section">
                    <div class="inventory-labels">
                      <span>Available: <strong>{{ ticket.availableQuantity }}</strong></span>
                      <span>Total: <strong>{{ ticket.totalQuantity }}</strong></span>
                    </div>
                    <div class="progress-bar-bg" role="progressbar" [attr.aria-valuenow]="getSoldTickets(ticket)" [attr.aria-valuemin]="0" [attr.aria-valuemax]="ticket.totalQuantity">
                      <div
                        class="progress-bar-fill"
                        [style.width.%]="getSoldPercentage(ticket)"
                      ></div>
                    </div>
                    <div class="sold-caption">
                      {{ getSoldTickets(ticket) }} tickets reserved / sold ({{ getSoldPercentage(ticket) }}%)
                    </div>
                  </div>

                  <!-- Sale Window -->
                  <div class="sale-window">
                    <span class="sale-icon" aria-hidden="true">⏱️</span>
                    <div class="sale-text">
                      @if (ticket.saleStartDate && ticket.saleEndDate) {
                        <span>Sale: {{ ticket.saleStartDate | date: 'mediumDate' }} – {{ ticket.saleEndDate | date: 'mediumDate' }}</span>
                      } @else if (ticket.saleStartDate) {
                        <span>Sale starts: {{ ticket.saleStartDate | date: 'mediumDate' }}</span>
                      } @else if (ticket.saleEndDate) {
                        <span>Sale ends: {{ ticket.saleEndDate | date: 'mediumDate' }}</span>
                      } @else {
                        <span>Always on sale until event start</span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Footer Actions -->
                <footer class="card-footer ticket-card-footer">
                  <div class="footer-actions">
                    <!-- Toggle Active/Inactive -->
                    <button
                      type="button"
                      class="btn btn-outline btn-xs"
                      (click)="toggleActiveStatus(ticket)"
                      [disabled]="isEventClosed() || actionLoading()"
                      [title]="ticket.isActive ? 'Deactivate ticket type' : 'Activate ticket type'"
                    >
                      {{ ticket.isActive ? 'Deactivate' : 'Activate' }}
                    </button>

                    <!-- Edit Ticket -->
                    <button
                      type="button"
                      class="btn btn-secondary btn-xs"
                      (click)="openEditModal(ticket)"
                      [disabled]="isEventClosed() || actionLoading()"
                      title="Edit ticket tier details"
                    >
                      Edit
                    </button>

                    <!-- Delete Ticket -->
                    <button
                      type="button"
                      class="btn btn-danger btn-xs"
                      (click)="promptDelete(ticket)"
                      [disabled]="isEventClosed() || actionLoading()"
                      title="Delete ticket type"
                    >
                      Delete
                    </button>
                  </div>
                </footer>
              </article>
            }
          </div>
        }
      }

      <!-- Create / Edit Ticket Type Modal -->
      @if (formModalOpen()) {
        <div class="modal-backdrop" (click)="closeFormModal()">
          <div
            class="modal-dialog card"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'ticket-modal-title'"
          >
            <div class="card-header modal-header">
              <h2 id="ticket-modal-title" class="modal-title">
                {{ editingTicketId() ? 'Edit Ticket Type' : 'Create Ticket Type' }}
              </h2>
              <button
                type="button"
                class="close-btn"
                (click)="closeFormModal()"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <form [formGroup]="ticketForm" (ngSubmit)="onFormSubmit()" novalidate>
              <div class="card-body modal-body form-grid">
                <!-- Global Server Error in Modal -->
                @if (formServerError()) {
                  <div class="alert alert-danger" role="alert">
                    {{ formServerError() }}
                  </div>
                }

                <!-- Ticket Name -->
                <div class="form-group">
                  <label for="ticket-name" class="form-label required">Tier Name</label>
                  <input
                    id="ticket-name"
                    type="text"
                    class="form-control"
                    formControlName="name"
                    placeholder="e.g. VIP Access, General Admission, Early Bird"
                    [class.is-invalid]="hasError('name')"
                  />
                  @if (hasError('name', 'required')) {
                    <span class="error-msg">Tier name is required.</span>
                  }
                  @if (hasError('name', 'minlength')) {
                    <span class="error-msg">Name must be at least 2 characters.</span>
                  }
                  @if (hasError('name', 'maxlength')) {
                    <span class="error-msg">Name cannot exceed 100 characters.</span>
                  }
                </div>

                <!-- Description -->
                <div class="form-group">
                  <label for="ticket-desc" class="form-label">Description / Perks</label>
                  <textarea
                    id="ticket-desc"
                    class="form-control"
                    formControlName="description"
                    rows="2"
                    placeholder="What's included? (e.g. Complimentary lunch, front row seats)"
                    [class.is-invalid]="hasError('description')"
                  ></textarea>
                </div>

                <!-- Price and Total Quantity Row -->
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="ticket-price" class="form-label required">Price</label>
                    <div class="input-prefix-wrapper">
                      <input
                        id="ticket-price"
                        type="number"
                        step="0.01"
                        min="0"
                        class="form-control"
                        formControlName="price"
                        placeholder="0.00"
                        [class.is-invalid]="hasError('price')"
                      />
                    </div>
                    <span class="form-hint">Enter 0 for free admission tiers.</span>
                    @if (hasError('price', 'required')) {
                      <span class="error-msg">Price is required.</span>
                    }
                    @if (hasError('price', 'min')) {
                      <span class="error-msg">Price cannot be negative.</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="ticket-quantity" class="form-label required">Total Quantity</label>
                    <input
                      id="ticket-quantity"
                      type="number"
                      min="1"
                      class="form-control"
                      formControlName="totalQuantity"
                      placeholder="e.g. 50"
                      [class.is-invalid]="hasError('totalQuantity') || ticketForm.errors?.['exceedsEventCapacity'] || ticketForm.errors?.['belowConsumed']"
                    />
                    @if (hasError('totalQuantity', 'required')) {
                      <span class="error-msg">Quantity is required.</span>
                    }
                    @if (hasError('totalQuantity', 'min')) {
                      <span class="error-msg">Quantity must be at least 1.</span>
                    }
                    @if (ticketForm.errors?.['exceedsEventCapacity']) {
                      <span class="error-msg">
                        Exceeds event capacity limit (Max allowed for this tier: {{ ticketForm.errors?.['exceedsEventCapacity'].maxAllowed }}).
                      </span>
                    }
                    @if (ticketForm.errors?.['belowConsumed']) {
                      <span class="error-msg">
                        Cannot reduce quantity below already reserved/sold count ({{ ticketForm.errors?.['belowConsumed'].minAllowed }}).
                      </span>
                    }
                  </div>
                </div>

                <!-- Capacity Allocation Helper Info -->
                <div class="capacity-hint-box">
                  <span>🏛️ Event Max Capacity: <strong>{{ event()?.maxCapacity }}</strong></span>
                  <span>Available for allocation: <strong>{{ getAvailableForAllocation() }}</strong></span>
                </div>

                <!-- Sale Start and End Dates -->
                <div class="form-row-2">
                  <div class="form-group">
                    <label for="sale-start" class="form-label">Sale Start Date</label>
                    <input
                      id="sale-start"
                      type="datetime-local"
                      class="form-control"
                      formControlName="saleStartDate"
                      [class.is-invalid]="ticketForm.errors?.['startAfterEventStart']"
                    />
                    @if (ticketForm.errors?.['startAfterEventStart']) {
                      <span class="error-msg">Sale start cannot be after event start time.</span>
                    }
                  </div>

                  <div class="form-group">
                    <label for="sale-end" class="form-label">Sale End Date</label>
                    <input
                      id="sale-end"
                      type="datetime-local"
                      class="form-control"
                      formControlName="saleEndDate"
                      [class.is-invalid]="ticketForm.errors?.['endBeforeStart'] || ticketForm.errors?.['endAfterEventStart']"
                    />
                    @if (ticketForm.errors?.['endBeforeStart']) {
                      <span class="error-msg">Sale end must be later than sale start date.</span>
                    }
                    @if (ticketForm.errors?.['endAfterEventStart']) {
                      <span class="error-msg">Sale end cannot be after event start time.</span>
                    }
                  </div>
                </div>

                <!-- Active Toggle Checkbox -->
                <div class="checkbox-group">
                  <label class="checkbox-label" for="is-active">
                    <input
                      id="is-active"
                      type="checkbox"
                      formControlName="isActive"
                    />
                    <span>Active tier (attendees will be able to register when tickets go live)</span>
                  </label>
                </div>
              </div>

              <div class="card-footer modal-footer">
                <button
                  type="button"
                  class="btn btn-secondary"
                  (click)="closeFormModal()"
                  [disabled]="submitting()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="submitting() || (ticketForm.touched && ticketForm.invalid)"
                >
                  @if (submitting()) {
                    <span>Saving...</span>
                  } @else {
                    <span>{{ editingTicketId() ? 'Save Changes' : 'Create Ticket Type' }}</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (deleteModalOpen()) {
        <div class="modal-backdrop" (click)="closeDeleteModal()">
          <div
            class="modal-dialog card"
            (click)="$event.stopPropagation()"
            role="dialog"
            aria-modal="true"
            [attr.aria-labelledby]="'delete-modal-title'"
          >
            <div class="card-header modal-header">
              <h2 id="delete-modal-title" class="modal-title">Delete Ticket Type</h2>
              <button
                type="button"
                class="close-btn"
                (click)="closeDeleteModal()"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div class="card-body modal-body">
              <p class="modal-message">
                Are you sure you want to permanently delete ticket tier <strong>"{{ ticketToDelete()?.name }}"</strong>?
              </p>
              <div class="alert alert-warning" role="alert">
                ℹ️ Note: If any attendee has already registered or reserved this ticket type, deletion will be rejected by the server to safeguard booking integrity. In that case, consider deactivating the tier instead.
              </div>
            </div>

            <div class="card-footer modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                (click)="closeDeleteModal()"
                [disabled]="actionLoading()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="btn btn-danger"
                (click)="confirmDelete()"
                [disabled]="actionLoading()"
              >
                @if (actionLoading()) {
                  <span>Deleting...</span>
                } @else {
                  <span>Confirm Delete</span>
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .ticket-types-container {
      width: 100%;
      max-width: var(--container-max-width);
      margin: 0 auto;
      padding: var(--space-4) 0 var(--space-12);
    }

    .page-nav {
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

    /* Event Context Card */
    .event-context-card {
      margin-bottom: var(--space-8);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      border-top: 4px solid var(--color-primary-600);
    }

    .event-context-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6) var(--space-8);
      flex-wrap: wrap;
      gap: var(--space-6);
    }

    .event-meta {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .event-header-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .venue-pill {
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      background-color: var(--color-gray-100);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      font-weight: var(--font-weight-medium);
    }

    .page-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .event-dates {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    /* Capacity Stats Box */
    .capacity-stats {
      display: flex;
      gap: var(--space-4);
      background-color: var(--color-gray-50);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0 var(--space-3);
    }

    .stat-box:not(:last-child) {
      border-right: 1px solid var(--border-color);
    }

    .stat-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-500);
      margin-bottom: 0.25rem;
    }

    .stat-val {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
    }

    .text-danger {
      color: var(--color-danger-text) !important;
    }

    .text-warning {
      color: var(--color-warning-text) !important;
    }

    .lifecycle-alert {
      margin: 0;
      border-radius: 0;
      border-left: none;
      border-right: none;
      border-bottom: none;
      font-size: var(--font-size-sm);
    }

    /* Actions Bar */
    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .actions-summary h2 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: var(--font-weight-semibold);
    }

    .btn-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    /* Tickets Grid */
    .tickets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .ticket-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
      border: 1px solid var(--border-color);
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .ticket-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
    }

    .card-inactive {
      opacity: 0.75;
      border-style: dashed;
      background-color: var(--color-gray-50);
    }

    .ticket-card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: var(--space-5);
      gap: var(--space-4);
    }

    .ticket-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-2);
    }

    .title-and-status {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .ticket-name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .badge-active {
      background-color: var(--color-success-bg);
      color: var(--color-success-text);
      font-size: var(--font-size-xs);
    }

    .badge-inactive {
      background-color: var(--color-gray-200);
      color: var(--color-gray-700);
      font-size: var(--font-size-xs);
    }

    .ticket-price-tag {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-700);
    }

    .price-free {
      color: var(--color-success-text);
    }

    .ticket-desc {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin: 0;
      line-height: 1.5;
    }

    /* Inventory Section */
    .inventory-section {
      background-color: var(--color-gray-50);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .inventory-labels {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
    }

    .progress-bar-bg {
      height: 6px;
      width: 100%;
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

    .sold-caption {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-align: right;
    }

    /* Sale Window */
    .sale-window {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      padding-top: var(--space-2);
      border-top: 1px solid var(--border-color);
    }

    .sale-icon {
      font-size: 1rem;
    }

    /* Card Footer Actions */
    .ticket-card-footer {
      padding: var(--space-3) var(--space-5);
      border-top: 1px solid var(--border-color);
      background-color: var(--color-gray-50);
    }

    .footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
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
      background-color: var(--color-gray-100);
    }

    /* Modal */
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
      max-width: 540px;
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
    }

    .close-btn:hover {
      color: var(--color-gray-600);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border-color);
      background-color: var(--color-gray-50);
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    @media (max-width: 500px) {
      .form-row-2 {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .form-label {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
    }

    .form-label.required::after {
      content: ' *';
      color: var(--color-danger-text);
    }

    .form-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .capacity-hint-box {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-xs);
      background-color: var(--color-primary-50);
      color: var(--color-primary-800);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      margin-top: -0.5rem;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
      margin-top: var(--space-2);
    }

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      color: var(--color-gray-800);
      cursor: pointer;
    }

    .error-msg {
      font-size: var(--font-size-xs);
      color: var(--color-danger-text);
    }

    .is-invalid {
      border-color: var(--color-danger-border) !important;
    }

    .loading-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    /* Badges */
    .badge-draft { background-color: #f1f5f9; color: #475569; }
    .badge-published { background-color: #dcfce7; color: #166534; }
    .badge-ongoing { background-color: #e0f2fe; color: #0369a1; }
    .badge-completed { background-color: #f3e8ff; color: #6b21a8; }
    .badge-cancelled { background-color: #fee2e2; color: #991b1b; }
  `],
})
export class OrganizerTicketTypesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketTypeService = inject(TicketTypeService);
  private readonly eventService = inject(EventService);
  private readonly fb = inject(FormBuilder);
  private readonly uiFeedback = inject(UiFeedbackService);

  readonly EventStatus = EventStatus;

  readonly eventId = signal<string>('');
  readonly event = signal<EventDto | null>(null);
  readonly ticketTypes = signal<TicketTypeDto[]>([]);

  readonly loadingEvent = signal<boolean>(false);
  readonly loadingTickets = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly actionLoading = signal<boolean>(false);

  // Modal Signals
  readonly formModalOpen = signal<boolean>(false);
  readonly editingTicketId = signal<string | null>(null);
  readonly submitting = signal<boolean>(false);
  readonly formServerError = signal<string | null>(null);

  readonly deleteModalOpen = signal<boolean>(false);
  readonly ticketToDelete = signal<TicketTypeDto | null>(null);

  // Computed properties
  readonly allocatedTickets = computed(() => {
    return this.ticketTypes().reduce((sum, t) => sum + t.totalQuantity, 0);
  });

  readonly remainingCapacity = computed(() => {
    const ev = this.event();
    if (!ev) return 0;
    return Math.max(0, ev.maxCapacity - this.allocatedTickets());
  });

  readonly isEventClosed = computed(() => {
    const ev = this.event();
    if (!ev) return false;
    return ev.status === EventStatus.Completed || ev.status === EventStatus.Cancelled;
  });

  ticketForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('eventId');
    if (id) {
      this.eventId.set(id);
      this.loadEvent();
      this.loadTicketTypes();
    } else {
      this.error.set('No event specified.');
    }
  }

  initForm(): void {
    this.ticketForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        description: ['', [Validators.maxLength(1000)]],
        price: [0, [Validators.required, Validators.min(0), Validators.max(1000000)]],
        totalQuantity: [10, [Validators.required, Validators.min(1)]],
        saleStartDate: [''],
        saleEndDate: [''],
        isActive: [true],
      },
      {
        validators: [this.validateTicketForm.bind(this)],
      }
    );
  }

  loadEvent(): void {
    this.loadingEvent.set(true);
    this.eventService.getById(this.eventId()).subscribe({
      next: (ev) => {
        this.event.set(ev);
        this.loadingEvent.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to load event details.');
        this.loadingEvent.set(false);
      },
    });
  }

  loadTicketTypes(): void {
    this.loadingTickets.set(true);
    this.error.set(null);

    this.ticketTypeService.getByEventId(this.eventId()).subscribe({
      next: (data) => {
        this.ticketTypes.set(data);
        this.loadingTickets.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Failed to load ticket tiers.');
        this.loadingTickets.set(false);
      },
    });
  }

  openCreateModal(): void {
    if (this.isEventClosed()) return;
    this.editingTicketId.set(null);
    this.formServerError.set(null);

    const defaultQuantity = Math.min(50, this.remainingCapacity() > 0 ? this.remainingCapacity() : 10);

    this.ticketForm.reset({
      name: '',
      description: '',
      price: 0,
      totalQuantity: defaultQuantity,
      saleStartDate: '',
      saleEndDate: '',
      isActive: true,
    });

    this.formModalOpen.set(true);
  }

  openEditModal(ticket: TicketTypeDto): void {
    if (this.isEventClosed()) return;
    this.editingTicketId.set(ticket.id);
    this.formServerError.set(null);

    this.ticketForm.reset({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price,
      totalQuantity: ticket.totalQuantity,
      saleStartDate: this.toDatetimeLocal(ticket.saleStartDate),
      saleEndDate: this.toDatetimeLocal(ticket.saleEndDate),
      isActive: ticket.isActive,
    });

    this.formModalOpen.set(true);
  }

  closeFormModal(): void {
    this.formModalOpen.set(false);
    this.editingTicketId.set(null);
    this.formServerError.set(null);
  }

  onFormSubmit(): void {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.formServerError.set(null);

    const formValues = this.ticketForm.value;
    const startIso = this.formatDateForApi(formValues.saleStartDate);
    const endIso = this.formatDateForApi(formValues.saleEndDate);

    if (this.editingTicketId()) {
      const updateDto: UpdateTicketTypeDto = {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || null,
        price: Number(formValues.price),
        totalQuantity: Number(formValues.totalQuantity),
        saleStartDate: startIso,
        saleEndDate: endIso,
        isActive: Boolean(formValues.isActive),
      };

      this.ticketTypeService.update(this.editingTicketId()!, updateDto).subscribe({
        next: (updated) => {
          this.submitting.set(false);
          this.closeFormModal();
          this.uiFeedback.showSuccess(`Ticket tier "${updated.name}" updated successfully!`);
          this.loadTicketTypes();
        },
        error: (err: ApiError) => {
          this.submitting.set(false);
          this.formServerError.set(err.message || 'Failed to update ticket tier.');
        },
      });
    } else {
      const createDto: CreateTicketTypeDto = {
        eventId: this.eventId(),
        name: formValues.name.trim(),
        description: formValues.description?.trim() || null,
        price: Number(formValues.price),
        totalQuantity: Number(formValues.totalQuantity),
        saleStartDate: startIso,
        saleEndDate: endIso,
        isActive: Boolean(formValues.isActive),
      };

      this.ticketTypeService.create(createDto).subscribe({
        next: (created) => {
          this.submitting.set(false);
          this.closeFormModal();
          this.uiFeedback.showSuccess(`Ticket tier "${created.name}" created successfully!`);
          this.loadTicketTypes();
        },
        error: (err: ApiError) => {
          this.submitting.set(false);
          this.formServerError.set(err.message || 'Failed to create ticket tier.');
        },
      });
    }
  }

  toggleActiveStatus(ticket: TicketTypeDto): void {
    if (this.isEventClosed()) return;
    this.actionLoading.set(true);

    this.ticketTypeService.toggleStatus(ticket).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        const actionWord = res.isActive ? 'activated' : 'deactivated';
        this.uiFeedback.showSuccess(`Ticket tier "${res.name}" ${actionWord}.`);
        this.loadTicketTypes();
      },
      error: (err: ApiError) => {
        this.actionLoading.set(false);
        this.uiFeedback.showError(err.message || 'Failed to change ticket tier status.');
      },
    });
  }

  promptDelete(ticket: TicketTypeDto): void {
    if (this.isEventClosed()) return;
    this.ticketToDelete.set(ticket);
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.ticketToDelete.set(null);
  }

  confirmDelete(): void {
    const ticket = this.ticketToDelete();
    if (!ticket) return;

    this.actionLoading.set(true);
    this.ticketTypeService.delete(ticket.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.closeDeleteModal();
        this.uiFeedback.showSuccess(`Ticket tier "${ticket.name}" was deleted.`);
        this.loadTicketTypes();
      },
      error: (err: ApiError) => {
        this.actionLoading.set(false);
        this.uiFeedback.showError(err.message || 'Failed to delete ticket tier.');
      },
    });
  }

  validateTicketForm(control: AbstractControl): ValidationErrors | null {
    const startVal = control.get('saleStartDate')?.value;
    const endVal = control.get('saleEndDate')?.value;
    const quantity = Number(control.get('totalQuantity')?.value || 0);
    const ev = this.event();

    const errors: ValidationErrors = {};

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let eventStartDate: Date | null = null;

    if (ev?.startDateTime) {
      eventStartDate = new Date(ev.startDateTime);
    }

    if (startVal && endVal) {
      startDate = new Date(startVal);
      endDate = new Date(endVal);

      if (endDate <= startDate) {
        errors['endBeforeStart'] = true;
      }
    }

    if (startVal && eventStartDate) {
      if (!startDate) startDate = new Date(startVal);
      if (startDate > eventStartDate) {
        errors['startAfterEventStart'] = true;
      }
    }

    if (endVal && eventStartDate) {
      if (!endDate) endDate = new Date(endVal);
      if (endDate > eventStartDate) {
        errors['endAfterEventStart'] = true;
      }
    }

    // Capacity checks
    if (ev && quantity > 0) {
      const currentEditingId = this.editingTicketId();
      const otherTicketsTotal = this.ticketTypes()
        .filter((t) => t.id !== currentEditingId)
        .reduce((sum, t) => sum + t.totalQuantity, 0);

      const maxAllowed = ev.maxCapacity - otherTicketsTotal;
      if (quantity > maxAllowed) {
        errors['exceedsEventCapacity'] = { maxAllowed };
      }

      if (currentEditingId) {
        const editingTicket = this.ticketTypes().find((t) => t.id === currentEditingId);
        if (editingTicket) {
          const consumed = editingTicket.totalQuantity - editingTicket.availableQuantity;
          if (quantity < consumed) {
            errors['belowConsumed'] = { minAllowed: consumed };
          }
        }
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  hasError(field: string, errorKey?: string): boolean {
    const ctrl = this.ticketForm.get(field);
    if (!ctrl) return false;
    if (errorKey) {
      return ctrl.hasError(errorKey) && (ctrl.dirty || ctrl.touched);
    }
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  getSoldTickets(ticket: TicketTypeDto): number {
    return Math.max(0, ticket.totalQuantity - ticket.availableQuantity);
  }

  getSoldPercentage(ticket: TicketTypeDto): number {
    if (ticket.totalQuantity <= 0) return 0;
    const sold = this.getSoldTickets(ticket);
    return Math.min(100, Math.round((sold / ticket.totalQuantity) * 100));
  }

  getAvailableForAllocation(): number {
    const ev = this.event();
    if (!ev) return 0;
    const currentEditingId = this.editingTicketId();
    const otherTicketsTotal = this.ticketTypes()
      .filter((t) => t.id !== currentEditingId)
      .reduce((sum, t) => sum + t.totalQuantity, 0);
    return Math.max(0, ev.maxCapacity - otherTicketsTotal);
  }

  getEventStatusLabel(status: EventStatus): string {
    switch (status) {
      case EventStatus.Draft: return 'Draft';
      case EventStatus.Published: return 'Published';
      case EventStatus.Ongoing: return 'Ongoing';
      case EventStatus.Completed: return 'Completed';
      case EventStatus.Cancelled: return 'Cancelled';
      default: return 'Unknown';
    }
  }

  getEventStatusBadgeClass(status: EventStatus): string {
    switch (status) {
      case EventStatus.Draft: return 'badge badge-draft';
      case EventStatus.Published: return 'badge badge-published';
      case EventStatus.Ongoing: return 'badge badge-ongoing';
      case EventStatus.Completed: return 'badge badge-completed';
      case EventStatus.Cancelled: return 'badge badge-cancelled';
      default: return 'badge badge-secondary';
    }
  }

  private formatDateForApi(value?: string | null): string | null {
    if (!value) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    if (trimmed.length === 16 && trimmed.includes('T')) {
      return `${trimmed}:00`;
    }
    return trimmed;
  }

  private toDatetimeLocal(isoString?: string | null): string {
    if (!isoString) return '';
    if (isoString.includes('T') && !isoString.endsWith('Z') && !isoString.includes('+')) {
      return isoString.substring(0, 16);
    }
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
