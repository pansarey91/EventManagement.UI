import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { TicketService } from '../../../core/services/ticket.service';
import {
  EventTicketDto,
  TicketStatus,
  getTicketStatusLabel,
  getTicketStatusBadgeClass,
} from '../../../core/models';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';

@Component({
  selector: 'app-ticket-qr-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, LoadingSpinnerComponent],
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-modal-title"
    >
      <div class="modal-dialog qr-modal-dialog">
        <header class="modal-header">
          <div>
            <h2 id="qr-modal-title" class="modal-title">Event Admission Pass</h2>
            <p class="ticket-code-label">
              Ticket Ref: <code>{{ ticket.ticketNumber }}</code>
            </p>
          </div>
          <button
            type="button"
            class="modal-close"
            (click)="closeModal()"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </header>

        <div class="modal-body">
          <!-- QR Code Display Area -->
          <div class="qr-container">
            @if (loading()) {
              <div class="qr-loading">
                <app-loading-spinner [message]="'Generating secure QR pass...'"></app-loading-spinner>
              </div>
            } @else if (error()) {
              <div class="qr-error" role="alert">
                <span class="error-icon" aria-hidden="true">⚠️</span>
                <p>{{ error() }}</p>
                <button type="button" class="btn btn-secondary btn-sm" (click)="loadQrCode()">
                  Retry
                </button>
              </div>
            } @else if (qrSafeUrl()) {
              <div class="qr-wrapper">
                <img
                  [src]="qrSafeUrl()"
                  [alt]="'QR code for ticket ' + ticket.ticketNumber"
                  class="qr-image"
                />
              </div>
              <p class="qr-instruction">
                📱 Present this digital QR code to event staff at the entry check-in station.
              </p>
            }
          </div>

          <!-- Ticket Summary Details -->
          <div class="ticket-info-card">
            <div class="info-row">
              <span class="info-label">Event:</span>
              <strong class="info-value">{{ ticket.eventName || 'Event Entry' }}</strong>
            </div>

            @if (ticket.eventStartDateTime) {
              <div class="info-row">
                <span class="info-label">Date & Time:</span>
                <span class="info-value">{{ ticket.eventStartDateTime | date: 'medium' }}</span>
              </div>
            }

            @if (ticket.venueName) {
              <div class="info-row">
                <span class="info-label">Venue:</span>
                <span class="info-value">{{ ticket.venueName }}</span>
              </div>
            }

            <div class="info-row">
              <span class="info-label">Tier:</span>
              <span class="info-value">{{ ticket.ticketTypeName || 'Standard' }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Attendee:</span>
              <span class="info-value">{{ ticket.userName || 'Ticket Holder' }}</span>
            </div>

            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="badge" [ngClass]="getStatusBadge(ticket.status)">
                {{ getStatusText(ticket.status) }}
              </span>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="closeModal()">
            Close
          </button>
        </footer>
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
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: var(--space-4);
      overflow-y: auto;
    }

    .qr-modal-dialog {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      width: 100%;
      max-width: 440px;
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
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: var(--color-gray-50);
    }

    .modal-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0;
    }

    .ticket-code-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin: 0.25rem 0 0;
    }

    .ticket-code-label code {
      font-family: var(--font-family-mono);
      color: var(--color-primary-700);
      font-weight: var(--font-weight-bold);
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

    .qr-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: var(--space-5);
    }

    .qr-loading {
      min-height: 220px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-error {
      text-align: center;
      padding: var(--space-4);
      background: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      border-radius: var(--radius-md);
      color: var(--color-error-text);
      font-size: var(--font-size-sm);
    }

    .error-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: var(--space-2);
    }

    .qr-wrapper {
      background: #ffffff;
      padding: var(--space-4);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .qr-image {
      width: 220px;
      height: 220px;
      object-fit: contain;
      image-rendering: pixelated;
    }

    .qr-instruction {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      text-align: center;
      margin: 0;
      line-height: 1.4;
      max-width: 320px;
    }

    .ticket-info-card {
      background: var(--color-gray-50);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: var(--font-size-sm);
      gap: var(--space-2);
    }

    .info-label {
      color: var(--color-gray-500);
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .info-value {
      color: var(--color-gray-900);
      font-weight: var(--font-weight-medium);
      text-align: right;
    }

    .modal-footer {
      padding: var(--space-3) var(--space-5);
      background: var(--color-gray-50);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
    }
  `],
})
export class TicketQrModalComponent implements OnInit, OnDestroy {
  @Input({ required: true }) ticket!: EventTicketDto;
  @Output() closed = new EventEmitter<void>();

  private readonly ticketService = inject(TicketService);
  private readonly sanitizer = inject(DomSanitizer);

  private rawObjectUrl: string | null = null;
  readonly qrSafeUrl = signal<SafeUrl | null>(null);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadQrCode();
  }

  ngOnDestroy(): void {
    this.cleanupUrl();
  }

  loadQrCode(): void {
    this.loading.set(true);
    this.error.set(null);
    this.cleanupUrl();

    this.ticketService.getQrCodeBlob(this.ticket.id).subscribe({
      next: (blob) => {
        this.rawObjectUrl = URL.createObjectURL(blob);
        this.qrSafeUrl.set(this.sanitizer.bypassSecurityTrustUrl(this.rawObjectUrl));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Failed to generate entry QR code. Please try again.');
      },
    });
  }

  private cleanupUrl(): void {
    if (this.rawObjectUrl) {
      URL.revokeObjectURL(this.rawObjectUrl);
      this.rawObjectUrl = null;
    }
    this.qrSafeUrl.set(null);
  }

  closeModal(): void {
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

  getStatusText(status: TicketStatus): string {
    return getTicketStatusLabel(status);
  }

  getStatusBadge(status: TicketStatus): string {
    return getTicketStatusBadgeClass(status);
  }
}
