import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TicketService } from '../../core/services/ticket.service';
import {
  EventTicketDto,
  TicketStatus,
  getTicketStatusLabel,
  getTicketStatusBadgeClass,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

@Component({
  selector: 'app-ticket-detail',
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
    <div class="container ticket-detail-page">
      <nav aria-label="Breadcrumb" class="detail-nav no-print">
        <a routerLink="/my-tickets" class="back-link">
          <span aria-hidden="true">←</span> Back to My Tickets
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-container no-print">
          <app-loading-spinner [message]="'Loading your ticket pass...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <div class="no-print">
          <app-error-state
            [title]="'Ticket Not Found'"
            [message]="error()!"
            (retry)="loadTicket()"
          ></app-error-state>
        </div>
      } @else if (ticket(); as tkt) {
        <!-- Action Toolbar -->
        <div class="action-toolbar no-print">
          <button type="button" class="btn btn-secondary btn-sm" (click)="printTicket()">
            🖨️ Print Ticket Pass
          </button>
          <a [routerLink]="['/events', tkt.eventId]" class="btn btn-outline btn-sm">
            View Event Page
          </a>
        </div>

        <!-- Digital Ticket Card / Boarding Pass -->
        <main class="ticket-pass-card" role="region" aria-label="Digital event admission pass">
          <!-- Pass Header -->
          <header class="pass-header">
            <div class="pass-header-info">
              <span class="pass-tagline">OFFICIAL ADMISSION PASS</span>
              <h1 class="pass-event-title">{{ tkt.eventName || 'Event Admission' }}</h1>
            </div>
            <div class="pass-badge-wrap">
              <span class="badge" [ngClass]="getStatusBadge(tkt.status)">
                {{ getStatusText(tkt.status) }}
              </span>
            </div>
          </header>

          <div class="pass-body">
            <!-- Left Side: QR Code Section -->
            <section class="qr-section" aria-label="Entry QR Code">
              <div class="qr-box">
                @if (qrLoading()) {
                  <div class="qr-loading">
                    <span class="spinner-inline" aria-hidden="true"></span>
                    <span>Generating QR...</span>
                  </div>
                } @else if (qrError()) {
                  <div class="qr-fail">
                    <p>{{ qrError() }}</p>
                    <button type="button" class="btn btn-outline btn-xs" (click)="loadQr(tkt.id)">
                      Retry
                    </button>
                  </div>
                } @else if (qrSafeUrl()) {
                  <img
                    [src]="qrSafeUrl()"
                    [alt]="'QR Code for ticket ' + tkt.ticketNumber"
                    class="qr-code-img"
                  />
                }
              </div>

              <div class="qr-label-box">
                <span class="qr-caption">Scan at Venue Entrance</span>
                <strong class="pass-code">{{ tkt.ticketNumber }}</strong>
              </div>
            </section>

            <!-- Right Side: Event, Venue, Attendee, and Tier Details -->
            <section class="details-section" aria-label="Pass Details">
              <div class="meta-block">
                <span class="meta-label">Date & Time</span>
                <strong class="meta-value highlight">
                  {{ tkt.eventStartDateTime ? (tkt.eventStartDateTime | date: 'fullDate') : 'Date TBA' }}
                </strong>
                @if (tkt.eventStartDateTime) {
                  <span class="meta-sub">
                    {{ tkt.eventStartDateTime | date: 'shortTime' }}
                    @if (tkt.eventEndDateTime) {
                      &ndash; {{ tkt.eventEndDateTime | date: 'shortTime' }}
                    }
                  </span>
                }
              </div>

              <div class="meta-block">
                <span class="meta-label">Venue / Location</span>
                <strong class="meta-value">{{ tkt.venueName || 'Online / TBA' }}</strong>
              </div>

              <div class="pass-grid">
                <div class="meta-block">
                  <span class="meta-label">Ticket Tier</span>
                  <strong class="meta-value">{{ tkt.ticketTypeName || 'General Admission' }}</strong>
                </div>

                <div class="meta-block">
                  <span class="meta-label">Tier Price</span>
                  <strong class="meta-value">
                    {{ tkt.ticketPrice > 0 ? (tkt.ticketPrice | currency) : 'Free Admission' }}
                  </strong>
                </div>

                <div class="meta-block">
                  <span class="meta-label">Attendee Name</span>
                  <strong class="meta-value">{{ tkt.userName || 'Account Holder' }}</strong>
                </div>

                <div class="meta-block">
                  <span class="meta-label">Booking Reference</span>
                  <span class="meta-value mono">{{ tkt.registrationNumber || 'N/A' }}</span>
                </div>
              </div>

              @if (tkt.status === TicketStatus.Used) {
                <div class="status-alert alert-used">
                  <span aria-hidden="true">✅</span>
                  <div>
                    <strong>Check-In Confirmed:</strong>
                    <span> Ticket checked in on {{ tkt.usedAt | date: 'medium' }}.</span>
                  </div>
                </div>
              } @else if (tkt.status === TicketStatus.Cancelled) {
                <div class="status-alert alert-cancelled">
                  <span aria-hidden="true">🚫</span>
                  <div>
                    <strong>Ticket Cancelled:</strong>
                    <span> This admission pass is no longer valid for venue entry.</span>
                  </div>
                </div>
              } @else {
                <div class="status-alert alert-active">
                  <span aria-hidden="true">ℹ️</span>
                  <div>
                    <strong>Valid For Admission:</strong>
                    <span> Present this digital or printed pass on event day for badge pickup and check-in.</span>
                  </div>
                </div>
              }
            </section>
          </div>

          <!-- Pass Perforated Divider & Footer -->
          <footer class="pass-footer">
            <div class="perforation" aria-hidden="true"></div>
            <div class="footer-content">
              <span class="footer-note">EventSync Digital Ticket Verification System</span>
              <span class="footer-timestamp">Issued on {{ tkt.createdAt | date: 'mediumDate' }}</span>
            </div>
          </footer>
        </main>
      }
    </div>
  `,
  styles: [`
    .ticket-detail-page {
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

    .action-toolbar {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    .loading-container {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    /* Ticket Pass Card Styling */
    .ticket-pass-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }

    .pass-header {
      background: linear-gradient(135deg, var(--color-primary-800), var(--color-primary-600));
      color: #ffffff;
      padding: var(--space-6) var(--space-8);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    @media (min-width: 640px) {
      .pass-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }

    .pass-tagline {
      font-size: var(--font-size-xs);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      opacity: 0.85;
      font-weight: var(--font-weight-semibold);
      display: block;
      margin-bottom: var(--space-1);
    }

    .pass-event-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      margin: 0;
      line-height: 1.25;
      color: #ffffff;
    }

    .pass-body {
      display: flex;
      flex-direction: column;
      padding: var(--space-6) var(--space-8);
      gap: var(--space-6);
    }

    @media (min-width: 768px) {
      .pass-body {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    /* QR Column */
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-4);
      background: var(--color-gray-50);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      flex-shrink: 0;
    }

    @media (min-width: 768px) {
      .qr-section {
        width: 260px;
      }
    }

    .qr-box {
      background: #ffffff;
      padding: var(--space-3);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 220px;
      height: 220px;
      box-shadow: var(--shadow-sm);
    }

    .qr-code-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      image-rendering: pixelated;
    }

    .qr-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .qr-fail {
      text-align: center;
      font-size: var(--font-size-xs);
      color: var(--color-error-accent);
    }

    .qr-label-box {
      margin-top: var(--space-3);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .qr-caption {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .pass-code {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-sm);
      color: var(--color-gray-800);
    }

    /* Details Column */
    .details-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .meta-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--color-gray-500);
    }

    .meta-value {
      font-size: var(--font-size-base);
      color: var(--color-gray-900);
    }

    .meta-value.highlight {
      color: var(--color-primary-700);
    }

    .meta-sub {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
    }

    .pass-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      padding: var(--space-3) 0;
      border-top: 1px dashed var(--border-color);
      border-bottom: 1px dashed var(--border-color);
    }

    .mono {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-sm);
    }

    .status-alert {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: var(--font-size-xs);
      line-height: 1.5;
    }

    .alert-active {
      background: var(--color-info-bg);
      border: 1px solid var(--color-info-border);
      color: var(--color-info-text);
    }

    .alert-used {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    .alert-cancelled {
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      color: var(--color-error-text);
    }

    /* Pass Footer */
    .pass-footer {
      background: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
      padding: var(--space-3) var(--space-8);
    }

    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    /* Print Stylesheet */
    @media print {
      .no-print {
        display: none !important;
      }

      .ticket-detail-page {
        padding: 0 !important;
      }

      .ticket-pass-card {
        border: 1px solid #333333 !important;
        box-shadow: none !important;
        max-width: 100% !important;
        width: 100% !important;
        page-break-inside: avoid;
      }

      .pass-header {
        background: #1e293b !important;
        color: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .pass-event-title {
        color: #ffffff !important;
      }

      .qr-box {
        border: 2px solid #000000 !important;
      }

      .qr-code-img {
        image-rendering: auto;
      }
    }
  `],
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly ticketService = inject(TicketService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly TicketStatus = TicketStatus;

  readonly ticket = signal<EventTicketDto | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  private rawObjectUrl: string | null = null;
  readonly qrSafeUrl = signal<SafeUrl | null>(null);
  readonly qrLoading = signal<boolean>(false);
  readonly qrError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTicket();
  }

  ngOnDestroy(): void {
    this.cleanupQrUrl();
  }

  loadTicket(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Invalid ticket ID.');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.ticket.set(null);

    this.ticketService.getById(id).subscribe({
      next: (data) => {
        this.ticket.set(data);
        this.loading.set(false);
        this.loadQr(data.id);
      },
      error: (err) => {
        this.loading.set(false);
        const msg =
          err.error?.message ||
          err.message ||
          'Ticket pass not found or you do not have permission to view it.';
        this.error.set(msg);
      },
    });
  }

  loadQr(ticketId: string): void {
    this.qrLoading.set(true);
    this.qrError.set(null);
    this.cleanupQrUrl();

    this.ticketService.getQrCodeBlob(ticketId).subscribe({
      next: (blob) => {
        this.rawObjectUrl = URL.createObjectURL(blob);
        this.qrSafeUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.rawObjectUrl));
        this.qrLoading.set(false);
      },
      error: () => {
        this.qrLoading.set(false);
        this.qrError.set('Unable to load QR image.');
      },
    });
  }

  private cleanupQrUrl(): void {
    if (this.rawObjectUrl) {
      URL.revokeObjectURL(this.rawObjectUrl);
      this.rawObjectUrl = null;
    }
    this.qrSafeUrl.set(null);
  }

  printTicket(): void {
    window.print();
  }

  getStatusText(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  getStatusBadge(status: TicketStatus): string {
    return getTicketStatusBadgeClass(status);
  }
}
