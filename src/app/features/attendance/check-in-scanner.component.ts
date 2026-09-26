import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttendanceService } from '../../core/services/attendance.service';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import {
  AttendanceDto,
  AttendanceSummaryDto,
  CheckInResult,
  EventDto,
  EventStatus,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

@Component({
  selector: 'app-check-in-scanner',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="container scanner-page">
      <!-- Breadcrumb & Top Bar -->
      <nav aria-label="Breadcrumb" class="page-nav">
        <a routerLink="/organizer/dashboard" class="back-link">
          <span aria-hidden="true">←</span> Organizer Hub
        </a>
        @if (selectedEvent()) {
          <span class="nav-separator">/</span>
          <span class="nav-current">{{ selectedEvent()!.name }}</span>
        }
      </nav>

      <!-- Event Picker (when no eventId specified in URL) -->
      @if (!selectedEventId() && !loadingEvent()) {
        <section class="event-picker-card card" aria-label="Select an event for check-in">
          <div class="card-header">
            <h1>Select Event for Check-In</h1>
            <p class="subtitle">Choose an active or upcoming event to begin scanning attendee tickets.</p>
          </div>

          <div class="card-body">
            @if (loadingEventsList()) {
              <app-loading-spinner [message]="'Loading your events...'"></app-loading-spinner>
            } @else if (eventsList().length === 0) {
              <div class="empty-events">
                <p>No active or published events found for check-in.</p>
                <a routerLink="/organizer/events/create" class="btn btn-primary btn-sm">Create an Event</a>
              </div>
            } @else {
              <div class="event-selection-grid">
                @for (ev of eventsList(); track ev.id) {
                  <div class="event-select-card" (click)="selectEvent(ev)">
                    <div class="ev-info">
                      <strong class="ev-title">{{ ev.name }}</strong>
                      <span class="ev-date">{{ ev.startDateTime | date: 'medium' }}</span>
                      <span class="ev-venue">{{ ev.venueName || 'Venue TBA' }}</span>
                    </div>
                    <button type="button" class="btn btn-primary btn-sm">
                      Open Scanner →
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </section>
      } @else if (loadingEvent()) {
        <div class="loading-wrap">
          <app-loading-spinner [message]="'Loading event scanner context...'"></app-loading-spinner>
        </div>
      } @else if (eventError()) {
        <app-error-state
          [title]="'Event Scanner Error'"
          [message]="eventError()!"
          (retry)="loadEventContext(selectedEventId()!)"
        ></app-error-state>
      } @else if (selectedEvent(); as currentEv) {
        <!-- Event Header & Summary Bar -->
        <header class="scanner-header">
          <div class="header-main">
            <div class="event-badges">
              <span class="badge badge-published">Live Check-In</span>
              <span class="event-time-hint">{{ currentEv.startDateTime | date: 'mediumDate' }}</span>
            </div>
            <h1 class="scanner-event-title">{{ currentEv.name }}</h1>
            <span class="scanner-venue">{{ currentEv.venueName || 'Venue TBA' }}</span>
          </div>

          <!-- Quick Navigation Actions -->
          <div class="header-actions">
            <a
              [routerLink]="['/organizer/events', currentEv.id, 'attendance']"
              class="btn btn-secondary btn-sm"
            >
              📋 Attendance Roster
            </a>
            @if (!routeHasEventId) {
              <button
                type="button"
                class="btn btn-outline btn-sm"
                (click)="clearSelectedEvent()"
              >
                Switch Event
              </button>
            }
          </div>
        </header>

        <!-- Attendance Stats Counters -->
        @if (summary(); as stats) {
          <section class="summary-stats-bar" aria-label="Check-in progress">
            <div class="stat-box">
              <span class="stat-label">Checked In</span>
              <strong class="stat-number color-success">{{ stats.checkedInCount }}</strong>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="stat-box">
              <span class="stat-label">Remaining</span>
              <strong class="stat-number color-warning">{{ stats.remainingCount }}</strong>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="stat-box">
              <span class="stat-label">Total Issued</span>
              <strong class="stat-number">{{ stats.totalTickets }}</strong>
            </div>
            <div class="stat-divider" aria-hidden="true"></div>
            <div class="stat-box">
              <span class="stat-label">Turnout Rate</span>
              <strong class="stat-number">{{ stats.checkInPercentage }}%</strong>
            </div>
          </section>
        }

        <!-- Scanner & Verification Workspace -->
        <div class="scanner-workspace">
          <!-- Left Column: Camera Viewfinder & Manual Entry -->
          <div class="scanner-column">
            <!-- Camera Viewfinder Card -->
            <div class="viewfinder-card card">
              <div class="viewfinder-box" [class.paused]="isProcessing()">
                <video
                  #videoElement
                  autoplay
                  playsinline
                  muted
                  class="scanner-video"
                  [class.hidden]="!cameraActive()"
                ></video>

                @if (!cameraActive() && !cameraError()) {
                  <div class="camera-placeholder">
                    <span class="cam-icon" aria-hidden="true">📷</span>
                    <p>Camera is currently inactive.</p>
                    <button
                      type="button"
                      class="btn btn-primary btn-sm"
                      (click)="startCamera()"
                    >
                      Start Camera Scanner
                    </button>
                  </div>
                }

                @if (cameraError()) {
                  <div class="camera-error-banner" role="alert">
                    <span aria-hidden="true">⚠️</span>
                    <div>
                      <strong>Camera Unavailable:</strong>
                      <p>{{ cameraError() }}</p>
                      <span class="hint">You can still enter ticket codes manually below.</span>
                    </div>
                  </div>
                }

                @if (cameraActive()) {
                  <div class="viewfinder-overlay" aria-hidden="true">
                    <div class="scan-target-box">
                      <span class="corner top-left"></span>
                      <span class="corner top-right"></span>
                      <span class="corner bottom-left"></span>
                      <span class="corner bottom-right"></span>
                      <span class="scan-laser"></span>
                    </div>
                  </div>
                }

                @if (isProcessing()) {
                  <div class="processing-overlay" aria-live="polite">
                    <span class="spinner-inline" aria-hidden="true"></span>
                    <span>Verifying admission pass...</span>
                  </div>
                }
              </div>

              <!-- Viewfinder Controls -->
              @if (cameraActive()) {
                <div class="viewfinder-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-xs"
                    (click)="stopCamera()"
                  >
                    Turn Off Camera
                  </button>
                </div>
              }
            </div>

            <!-- Manual Ticket / Token Entry Card -->
            <div class="card manual-card">
              <div class="card-header">
                <h3>Manual Code Lookup</h3>
                <span class="card-hint">Barcode gun or manual keyboard input</span>
              </div>
              <div class="card-body">
                <form (ngSubmit)="submitManualCode()" class="manual-form">
                  <div class="input-row">
                    <input
                      type="text"
                      class="form-control"
                      placeholder="Enter Ticket # (e.g. TKT-20261015-...) or QR token"
                      [(ngModel)]="manualCode"
                      name="manualCode"
                      [disabled]="isProcessing()"
                      autocomplete="off"
                      aria-label="Ticket number or QR code string"
                    />
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="!manualCode.trim() || isProcessing()"
                    >
                      Check In
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Right Column: Last Scan Result & Live Session Feed -->
          <div class="results-column">
            <!-- Scan Result Display -->
            @if (lastResult(); as res) {
              <div
                class="result-card card"
                [ngClass]="getResultCardClass(res.statusType)"
                role="status"
                aria-live="assertive"
              >
                <div class="result-header">
                  <span class="result-icon" aria-hidden="true">
                    {{ res.success ? '✅' : '🚫' }}
                  </span>
                  <div>
                    <h2 class="result-title">
                      {{ res.success ? 'Admission Confirmed!' : 'Check-In Rejected' }}
                    </h2>
                    <span class="result-subtitle">{{ res.message }}</span>
                  </div>
                </div>

                @if (res.attendance; as att) {
                  <div class="result-details">
                    <div class="detail-row">
                      <span class="label">Attendee Name:</span>
                      <strong class="val highlight">{{ att.userName || 'Unknown Attendee' }}</strong>
                    </div>
                    <div class="detail-row">
                      <span class="label">Ticket Number:</span>
                      <span class="val mono">{{ att.ticketNumber || 'N/A' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Booking Ref:</span>
                      <span class="val mono">{{ att.registrationNumber || 'N/A' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Checked In At:</span>
                      <span class="val">{{ att.checkedInAt | date: 'mediumTime' }}</span>
                    </div>
                  </div>
                }

                <div class="result-actions">
                  <button
                    type="button"
                    class="btn btn-primary"
                    (click)="dismissResultAndReady()"
                    autofocus
                  >
                    Scan Next Ticket →
                  </button>
                </div>
              </div>
            } @else {
              <!-- Idle Scanner Guidance Card -->
              <div class="idle-guide-card card">
                <div class="guide-content">
                  <span class="guide-icon" aria-hidden="true">🎯</span>
                  <h3>Ready for Scanner Input</h3>
                  <p>Point device camera at the attendee's QR ticket pass, or type their ticket code to check them in.</p>
                </div>
              </div>
            }

            <!-- Recent Session Check-Ins Card -->
            <div class="card recent-card">
              <div class="card-header">
                <h3>Session Activity</h3>
                <span class="badge badge-published badge-xs">{{ recentCheckIns().length }} checked in</span>
              </div>
              <div class="card-body recent-body">
                @if (recentCheckIns().length === 0) {
                  <p class="empty-recent">No tickets scanned in this session yet.</p>
                } @else {
                  <ul class="recent-list" aria-label="Recent check-ins in this session">
                    @for (item of recentCheckIns(); track item.id) {
                      <li class="recent-item">
                        <div class="item-primary">
                          <strong class="item-name">{{ item.userName || 'Attendee' }}</strong>
                          <span class="item-code mono">{{ item.ticketNumber }}</span>
                        </div>
                        <span class="item-time">{{ item.checkedInAt | date: 'shortTime' }}</span>
                      </li>
                    }
                  </ul>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .scanner-page {
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
      font-weight: var(--font-weight-medium);
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

    /* Event Picker */
    .event-picker-card {
      max-width: 800px;
      margin: var(--space-6) auto;
    }

    .subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin-top: var(--space-1);
    }

    .event-selection-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .event-select-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .event-select-card:hover {
      border-color: var(--color-primary-500);
      background: var(--color-gray-50);
    }

    .ev-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .ev-title {
      font-size: var(--font-size-base);
      color: var(--color-gray-900);
    }

    .ev-date, .ev-venue {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    }

    /* Scanner Header */
    .scanner-header {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }

    @media (min-width: 640px) {
      .scanner-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: flex-start;
      }
    }

    .event-badges {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .event-time-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .scanner-event-title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      margin: 0;
      color: var(--color-gray-900);
    }

    .scanner-venue {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
    }

    .header-actions {
      display: flex;
      gap: var(--space-2);
      align-items: center;
    }

    /* Stats Bar */
    .summary-stats-bar {
      display: flex;
      align-items: center;
      justify-content: space-around;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-500);
    }

    .stat-number {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
    }

    .stat-divider {
      width: 1px;
      height: 36px;
      background: var(--border-color);
    }

    .color-success { color: #16a34a !important; }
    .color-warning { color: #d97706 !important; }

    /* Workspace Layout */
    .scanner-workspace {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--space-6);
    }

    @media (min-width: 900px) {
      .scanner-workspace {
        grid-template-columns: 1.1fr 0.9fr;
      }
    }

    /* Viewfinder */
    .viewfinder-card {
      overflow: hidden;
    }

    .viewfinder-box {
      position: relative;
      width: 100%;
      height: 320px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .scanner-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .scanner-video.hidden {
      display: none;
    }

    .camera-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      color: #94a3b8;
      padding: var(--space-4);
      text-align: center;
    }

    .cam-icon {
      font-size: 2.5rem;
    }

    .camera-error-banner {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-4);
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.4);
      border-radius: var(--radius-md);
      color: #fca5a5;
      font-size: var(--font-size-sm);
      max-width: 90%;
    }

    .hint {
      font-size: var(--font-size-xs);
      color: #e2e8f0;
      display: block;
      margin-top: 0.25rem;
    }

    /* Viewfinder Box & Laser Overlay */
    .viewfinder-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .scan-target-box {
      position: relative;
      width: 200px;
      height: 200px;
      border: 2px dashed rgba(255, 255, 255, 0.4);
      border-radius: var(--radius-md);
    }

    .corner {
      position: absolute;
      width: 18px;
      height: 18px;
      border-color: #38bdf8;
      border-style: solid;
    }

    .top-left { top: -2px; left: -2px; border-width: 3px 0 0 3px; }
    .top-right { top: -2px; right: -2px; border-width: 3px 3px 0 0; }
    .bottom-left { bottom: -2px; left: -2px; border-width: 0 0 3px 3px; }
    .bottom-right { bottom: -2px; right: -2px; border-width: 0 3px 3px 0; }

    .scan-laser {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #38bdf8;
      box-shadow: 0 0 8px #38bdf8;
      animation: scanLaser 2s linear infinite alternate;
    }

    @keyframes scanLaser {
      0% { top: 5%; }
      100% { top: 95%; }
    }

    .processing-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.75);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .viewfinder-actions {
      padding: var(--space-2) var(--space-4);
      background: var(--color-gray-50);
      display: flex;
      justify-content: flex-end;
      border-top: 1px solid var(--border-color);
    }

    /* Manual Entry Form */
    .manual-card {
      margin-top: var(--space-4);
    }

    .card-hint {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      font-weight: normal;
    }

    .input-row {
      display: flex;
      gap: var(--space-2);
    }

    .input-row input {
      flex: 1;
    }

    /* Results Column */
    .result-card {
      padding: var(--space-5);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
      border-left: 6px solid;
    }

    .result-card.success-result {
      background: #f0fdf4;
      border-color: #22c55e;
    }

    .result-card.duplicate-result {
      background: #fffbeb;
      border-color: #f59e0b;
    }

    .result-card.error-result {
      background: #fef2f2;
      border-color: #ef4444;
    }

    .result-header {
      display: flex;
      gap: var(--space-3);
      align-items: flex-start;
      margin-bottom: var(--space-4);
    }

    .result-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .result-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      margin: 0;
      color: var(--color-gray-900);
    }

    .result-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-700);
    }

    .result-details {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      padding: var(--space-3) 0;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      margin-bottom: var(--space-4);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--font-size-sm);
    }

    .detail-row .label {
      color: var(--color-gray-600);
    }

    .detail-row .val {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-900);
    }

    .detail-row .highlight {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-800);
    }

    .mono {
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
    }

    .result-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Idle Card */
    .idle-guide-card {
      padding: var(--space-8);
      text-align: center;
      margin-bottom: var(--space-4);
      background: var(--color-gray-50);
      border: 2px dashed var(--border-color);
    }

    .guide-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: var(--space-2);
    }

    .idle-guide-card h3 {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-800);
      margin-bottom: var(--space-1);
    }

    .idle-guide-card p {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      max-width: 320px;
      margin: 0 auto;
    }

    /* Recent Session List */
    .recent-card {
      max-height: 280px;
      display: flex;
      flex-direction: column;
    }

    .recent-body {
      overflow-y: auto;
      padding: var(--space-2) var(--space-4);
    }

    .empty-recent {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-align: center;
      padding: var(--space-4) 0;
    }

    .recent-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .recent-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-2) 0;
      border-bottom: 1px solid var(--border-color);
      font-size: var(--font-size-xs);
    }

    .recent-item:last-child {
      border-bottom: none;
    }

    .item-primary {
      display: flex;
      flex-direction: column;
    }

    .item-name {
      color: var(--color-gray-900);
    }

    .item-code {
      color: var(--color-gray-500);
      font-size: 0.7rem;
    }

    .item-time {
      color: var(--color-gray-400);
    }
  `],
})
export class CheckInScannerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly attendanceService = inject(AttendanceService);
  private readonly eventService = inject(EventService);
  private readonly authService = inject(AuthService);

  readonly videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoElement');

  readonly selectedEventId = signal<string | null>(null);
  readonly selectedEvent = signal<EventDto | null>(null);
  readonly loadingEvent = signal<boolean>(false);
  readonly eventError = signal<string | null>(null);

  readonly eventsList = signal<EventDto[]>([]);
  readonly loadingEventsList = signal<boolean>(false);

  readonly summary = signal<AttendanceSummaryDto | null>(null);
  readonly isProcessing = signal<boolean>(false);
  readonly lastResult = signal<CheckInResult | null>(null);
  readonly recentCheckIns = signal<AttendanceDto[]>([]);

  readonly cameraActive = signal<boolean>(false);
  readonly cameraError = signal<string | null>(null);

  manualCode = '';
  routeHasEventId = false;

  private mediaStream: MediaStream | null = null;
  private scanAnimationId: number | null = null;
  private lastScannedToken: string | null = null;
  private lastScannedAt = 0;
  private readonly DEBOUNCE_MS = 2500;

  ngOnInit(): void {
    const eventIdParam = this.route.snapshot.paramMap.get('eventId');
    if (eventIdParam) {
      this.routeHasEventId = true;
      this.selectedEventId.set(eventIdParam);
      this.loadEventContext(eventIdParam);
    } else {
      this.loadActiveEventsForSelection();
    }
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  loadActiveEventsForSelection(): void {
    this.loadingEventsList.set(true);
    this.eventService.getAll({ status: EventStatus.Published, pageSize: 50 }).subscribe({
      next: (paged) => {
        this.eventsList.set(paged.items);
        this.loadingEventsList.set(false);
      },
      error: () => {
        this.loadingEventsList.set(false);
      },
    });
  }

  selectEvent(event: EventDto): void {
    this.selectedEventId.set(event.id);
    this.selectedEvent.set(event);
    this.loadEventSummary(event.id);
  }

  clearSelectedEvent(): void {
    this.stopCamera();
    this.selectedEventId.set(null);
    this.selectedEvent.set(null);
    this.summary.set(null);
    this.lastResult.set(null);
    this.loadActiveEventsForSelection();
  }

  loadEventContext(eventId: string): void {
    this.loadingEvent.set(true);
    this.eventError.set(null);

    this.eventService.getById(eventId).subscribe({
      next: (ev) => {
        this.selectedEvent.set(ev);
        this.loadingEvent.set(false);
        this.loadEventSummary(eventId);
      },
      error: (err) => {
        this.loadingEvent.set(false);
        this.eventError.set(err.error?.message || 'Unable to load event details.');
      },
    });
  }

  loadEventSummary(eventId: string): void {
    this.attendanceService.getSummary(eventId).subscribe({
      next: (sum) => this.summary.set(sum),
      error: () => {
        // Silent fail or default summary
      },
    });
  }

  // Camera Management & Frame Polling
  async startCamera(): Promise<void> {
    this.cameraError.set(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.cameraError.set('Camera access is not supported by your browser.');
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      const video = this.videoRef()?.nativeElement;
      if (video) {
        video.srcObject = this.mediaStream;
        await video.play();
        this.cameraActive.set(true);
        this.startDetectionLoop();
      }
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Unable to access camera. Please enter ticket code manually.';
      this.cameraError.set(msg);
      this.cameraActive.set(false);
    }
  }

  stopCamera(): void {
    if (this.scanAnimationId) {
      cancelAnimationFrame(this.scanAnimationId);
      this.scanAnimationId = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.cameraActive.set(false);
  }

  private startDetectionLoop(): void {
    const windowWithDetector = window as any;
    if (!('BarcodeDetector' in windowWithDetector)) {
      // Native BarcodeDetector not available in this browser
      return;
    }

    try {
      const barcodeDetector = new windowWithDetector.BarcodeDetector({
        formats: ['qr_code'],
      });

      const detectFrame = async () => {
        if (!this.cameraActive()) return;

        const video = this.videoRef()?.nativeElement;
        if (
          video &&
          video.readyState === video.HAVE_ENOUGH_DATA &&
          !this.isProcessing()
        ) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0) {
              const rawValue = barcodes[0].rawValue?.trim();
              if (rawValue) {
                this.onBarcodeDetected(rawValue);
              }
            }
          } catch {
            // Frame decode dropped, continue
          }
        }

        if (this.cameraActive()) {
          this.scanAnimationId = requestAnimationFrame(detectFrame);
        }
      };

      this.scanAnimationId = requestAnimationFrame(detectFrame);
    } catch {
      // Native BarcodeDetector instantiation failed
    }
  }

  private onBarcodeDetected(code: string): void {
    const now = Date.now();
    // Debounce protection: ignore duplicate detection within debounce window
    if (code === this.lastScannedToken && now - this.lastScannedAt < this.DEBOUNCE_MS) {
      return;
    }

    this.lastScannedToken = code;
    this.lastScannedAt = now;
    this.executeCheckIn(code);
  }

  submitManualCode(): void {
    const code = this.manualCode.trim();
    if (!code) return;

    this.manualCode = '';
    this.executeCheckIn(code);
  }

  executeCheckIn(code: string): void {
    const eventId = this.selectedEventId();
    if (!eventId) return;

    this.isProcessing.set(true);

    const isTicketNumber = code.toUpperCase().startsWith('TKT-') || code.toUpperCase().startsWith('TCK-');

    const dto = isTicketNumber
      ? { eventId, ticketNumber: code }
      : { eventId, qrToken: code };

    this.attendanceService.checkIn(dto).subscribe({
      next: (attendance) => {
        this.isProcessing.set(false);
        this.lastResult.set({
          success: true,
          message: `Ticket successfully checked in for ${attendance.userName || 'Attendee'}.`,
          attendance,
          statusType: 'success',
          scannedCode: code,
          timestamp: new Date(),
        });

        // Prepend to recent check-ins list
        this.recentCheckIns.update((list) => [attendance, ...list.slice(0, 4)]);

        // Increment summary locally
        this.summary.update((s) => {
          if (!s) return s;
          const checked = s.checkedInCount + 1;
          const remaining = Math.max(0, s.totalTickets - checked);
          const pct = s.totalTickets > 0 ? Math.round((checked / s.totalTickets) * 1000) / 10 : 0;
          return {
            ...s,
            checkedInCount: checked,
            remainingCount: remaining,
            checkInPercentage: pct,
          };
        });
      },
      error: (err) => {
        this.isProcessing.set(false);
        const errorMsg: string = err.error?.message || err.message || 'Check-in failed.';

        let statusType: CheckInResult['statusType'] = 'error';
        if (errorMsg.toLowerCase().includes('already')) {
          statusType = 'duplicate';
        } else if (errorMsg.toLowerCase().includes('different event')) {
          statusType = 'wrong_event';
        } else if (errorMsg.toLowerCase().includes('permission') || err.status === 403) {
          statusType = 'unauthorized';
        } else if (errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('invalid')) {
          statusType = 'invalid';
        }

        this.lastResult.set({
          success: false,
          message: errorMsg,
          statusType,
          scannedCode: code,
          timestamp: new Date(),
        });
      },
    });
  }

  dismissResultAndReady(): void {
    this.lastResult.set(null);
  }

  getResultCardClass(statusType: CheckInResult['statusType']): string {
    if (statusType === 'success') return 'success-result';
    if (statusType === 'duplicate') return 'duplicate-result';
    return 'error-result';
  }
}
