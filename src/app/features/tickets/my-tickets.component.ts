import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import {
  EventTicketDto,
  TicketStatus,
  getTicketStatusLabel,
  getTicketStatusBadgeClass,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';
import { TicketQrModalComponent } from './components/ticket-qr-modal.component';

type TicketFilter = 'ALL' | TicketStatus;

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    TicketQrModalComponent,
  ],
  template: `
    <div class="container tickets-page">
      <header class="page-header">
        <div class="header-content">
          <h1>My Digital Tickets</h1>
          <p class="header-subtitle">
            Access your admission passes, scan entry QR codes, and check event schedules.
          </p>
        </div>
        <div class="header-action">
          <a routerLink="/events" class="btn btn-primary">
            <span>🔍 Discover Events</span>
          </a>
        </div>
      </header>

      <!-- Filter Tabs -->
      <section class="filter-section" aria-label="Ticket status filters">
        <div class="filter-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === 'ALL'"
            [attr.aria-selected]="selectedStatus() === 'ALL'"
            (click)="setStatusFilter('ALL')"
          >
            All Tickets
            <span class="tab-count">{{ tickets().length }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === TicketStatus.Active"
            [attr.aria-selected]="selectedStatus() === TicketStatus.Active"
            (click)="setStatusFilter(TicketStatus.Active)"
          >
            Active Passes
            <span class="tab-count">{{ activeCount() }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === TicketStatus.Used"
            [attr.aria-selected]="selectedStatus() === TicketStatus.Used"
            (click)="setStatusFilter(TicketStatus.Used)"
          >
            Checked-In
            <span class="tab-count">{{ usedCount() }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="filter-tab"
            [class.active]="selectedStatus() === TicketStatus.Cancelled"
            [attr.aria-selected]="selectedStatus() === TicketStatus.Cancelled"
            (click)="setStatusFilter(TicketStatus.Cancelled)"
          >
            Cancelled / Expired
            <span class="tab-count">{{ cancelledCount() }}</span>
          </button>
        </div>
      </section>

      <!-- Content Area -->
      @if (loading()) {
        <div class="loading-container">
          <app-loading-spinner [message]="'Loading your digital tickets...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to Load Tickets'"
          [message]="error()!"
          (retry)="loadTickets()"
        ></app-error-state>
      } @else if (filteredTickets().length === 0) {
        @if (selectedStatus() === 'ALL') {
          <app-empty-state
            icon="🎟️"
            title="No Tickets Available"
            message="You don't have any event tickets yet. Once your registration is confirmed, your admission pass will appear here."
            actionLabel="Discover Events"
            actionRoute="/events"
          />
        } @else {
          <app-empty-state
            icon="🔍"
            title="No Matching Tickets"
            message="There are no tickets matching the selected filter."
            actionLabel="View All Tickets"
            (action)="setStatusFilter('ALL')"
          />
        }
      } @else {
        <!-- Tickets Grid -->
        <div class="tickets-grid">
          @for (ticket of filteredTickets(); track ticket.id) {
            <article class="ticket-card card" [class.ticket-used]="ticket.status === TicketStatus.Used" [class.ticket-cancelled]="ticket.status === TicketStatus.Cancelled">
              <div class="ticket-card-header">
                <div class="ticket-ref-box">
                  <span class="ticket-label">PASS:</span>
                  <strong class="ticket-number">{{ ticket.ticketNumber }}</strong>
                </div>
                <span class="badge" [ngClass]="getStatusBadge(ticket.status)">
                  {{ getStatusText(ticket.status) }}
                </span>
              </div>

              <div class="ticket-card-body">
                <h2 class="event-name">
                  <a [routerLink]="['/events', ticket.eventId]" class="event-link">
                    {{ ticket.eventName || 'Event Pass' }}
                  </a>
                </h2>

                <div class="ticket-meta-grid">
                  <div class="meta-cell">
                    <span class="meta-label">Tier</span>
                    <strong class="meta-val">{{ ticket.ticketTypeName || 'Standard' }}</strong>
                  </div>

                  <div class="meta-cell">
                    <span class="meta-label">Date & Time</span>
                    <span class="meta-val">
                      {{ ticket.eventStartDateTime ? (ticket.eventStartDateTime | date: 'mediumDate') : 'TBA' }}
                    </span>
                  </div>

                  <div class="meta-cell">
                    <span class="meta-label">Venue</span>
                    <span class="meta-val venue-val">
                      {{ ticket.venueName || 'Online / TBA' }}
                    </span>
                  </div>

                  <div class="meta-cell">
                    <span class="meta-label">Attendee</span>
                    <span class="meta-val">{{ ticket.userName || 'Account Holder' }}</span>
                  </div>
                </div>

                @if (ticket.status === TicketStatus.Used) {
                  <div class="notice-box notice-used">
                    <span aria-hidden="true">✅</span>
                    <span>Checked in on {{ ticket.usedAt | date: 'medium' }}</span>
                  </div>
                } @else if (ticket.status === TicketStatus.Cancelled) {
                  <div class="notice-box notice-cancelled">
                    <span aria-hidden="true">🚫</span>
                    <span>This ticket has been cancelled.</span>
                  </div>
                }
              </div>

              <div class="ticket-card-footer">
                <div class="footer-actions">
                  <a [routerLink]="['/tickets', ticket.id]" class="btn btn-outline btn-sm">
                    View Ticket Pass
                  </a>

                  @if (ticket.status === TicketStatus.Active) {
                    <button
                      type="button"
                      class="btn btn-primary btn-sm btn-qr"
                      (click)="openQrModal(ticket)"
                    >
                      📱 Show QR
                    </button>
                  }
                </div>

                @if (ticket.registrationNumber) {
                  <span class="reg-hint">Reg: {{ ticket.registrationNumber }}</span>
                }
              </div>
            </article>
          }
        </div>
      }

      <!-- QR Modal -->
      @if (selectedTicketForQr(); as selected) {
        <app-ticket-qr-modal
          [ticket]="selected"
          (closed)="closeQrModal()"
        ></app-ticket-qr-modal>
      }
    </div>
  `,
  styles: [`
    .tickets-page {
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

    .tickets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: var(--space-6);
    }

    .ticket-card {
      display: flex;
      flex-direction: column;
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      position: relative;
    }

    .ticket-card:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .ticket-used {
      opacity: 0.85;
      background: #fafafa;
    }

    .ticket-cancelled {
      opacity: 0.6;
    }

    .ticket-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--color-gray-50);
      border-bottom: 1px solid var(--border-color);
    }

    .ticket-ref-box {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-xs);
    }

    .ticket-label {
      color: var(--color-gray-500);
      font-weight: var(--font-weight-bold);
    }

    .ticket-number {
      font-family: var(--font-family-mono);
      color: var(--color-gray-800);
    }

    .ticket-card-body {
      padding: var(--space-5);
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .event-name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0;
      line-height: 1.3;
    }

    .event-link {
      color: var(--color-gray-900);
      text-decoration: none;
    }

    .event-link:hover {
      color: var(--color-primary-600);
      text-decoration: underline;
    }

    .ticket-meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
      padding: var(--space-3);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
    }

    .meta-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .meta-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-val {
      font-size: var(--font-size-sm);
      color: var(--color-gray-800);
    }

    .venue-val {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notice-box {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-sm);
    }

    .notice-used {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .notice-cancelled {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
    }

    .ticket-card-footer {
      padding: var(--space-3) var(--space-5);
      background: var(--bg-surface);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--space-2);
    }

    .footer-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-qr {
      background: var(--color-primary-600);
      color: #ffffff;
      border: none;
    }

    .btn-qr:hover {
      background: var(--color-primary-700);
    }

    .reg-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-400);
      font-family: var(--font-family-mono);
    }
  `],
})
export class MyTicketsComponent implements OnInit {
  private readonly ticketService = inject(TicketService);

  readonly TicketStatus = TicketStatus;

  readonly tickets = signal<EventTicketDto[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<TicketFilter>('ALL');

  readonly selectedTicketForQr = signal<EventTicketDto | null>(null);

  readonly activeCount = computed(() => {
    return this.tickets().filter((t) => t.status === TicketStatus.Active).length;
  });

  readonly usedCount = computed(() => {
    return this.tickets().filter((t) => t.status === TicketStatus.Used).length;
  });

  readonly cancelledCount = computed(() => {
    return this.tickets().filter(
      (t) => t.status === TicketStatus.Cancelled || t.status === TicketStatus.Expired
    ).length;
  });

  readonly filteredTickets = computed(() => {
    const status = this.selectedStatus();
    if (status === 'ALL') {
      return this.tickets();
    }
    if (status === TicketStatus.Cancelled) {
      return this.tickets().filter(
        (t) => t.status === TicketStatus.Cancelled || t.status === TicketStatus.Expired
      );
    }
    return this.tickets().filter((t) => t.status === status);
  });

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ticketService.getMyTickets().subscribe({
      next: (list) => {
        this.tickets.set(list || []);
        this.loading.set(false);
      },
      error: (err) => {
        const msg =
          err.error?.message ||
          err.message ||
          'Failed to load your event tickets. Please try again.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(status: TicketFilter): void {
    this.selectedStatus.set(status);
  }

  openQrModal(ticket: EventTicketDto): void {
    this.selectedTicketForQr.set(ticket);
  }

  closeQrModal(): void {
    this.selectedTicketForQr.set(null);
  }

  getStatusText(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  getStatusBadge(status: TicketStatus): string {
    return getTicketStatusBadgeClass(status);
  }
}
