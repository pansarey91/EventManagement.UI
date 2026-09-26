import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { RegistrationService } from '../../core/services/registration.service';
import {
  PublicEventDetailsDto,
  EventStatus,
  ApiError,
  RegistrationDto,
  RegistrationStatus,
  FeedbackDto,
  EventFeedbackSummaryDto,
} from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { RegisterModalComponent } from '../registrations/register-modal.component';
import { RatingStarsComponent } from '../feedback/components/rating-stars.component';
import { FeedbackSummaryCardComponent } from '../feedback/components/feedback-summary-card.component';
import { FeedbackModalComponent } from '../feedback/components/feedback-modal.component';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    CurrencyPipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    RegisterModalComponent,
    RatingStarsComponent,
    FeedbackSummaryCardComponent,
    FeedbackModalComponent,
  ],
  template: `
    <div class="event-detail-container">
      <nav aria-label="Breadcrumb" class="detail-nav">
        <a routerLink="/events" class="back-link">
          <span aria-hidden="true">←</span> Back to Discover Events
        </a>
      </nav>

      @if (loading()) {
        <div class="loading-wrapper">
          <app-loading-spinner [message]="'Loading event details...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Event Not Available'"
          [message]="error()!"
          (retry)="loadEventDetails()"
        ></app-error-state>
      } @else if (event()) {
        @let ev = event()!;
        <!-- Hero Header -->
        <article class="event-hero card">
          <div class="hero-media-wrapper">
            <div class="hero-fallback">
              <span class="fallback-icon" aria-hidden="true">🎪</span>
            </div>
            @if (ev.bannerImageUrl) {
              <img
                [src]="ev.bannerImageUrl"
                [alt]="ev.name + ' banner'"
                class="hero-image"
                (error)="$any($event.target).style.display = 'none'"
              />
            }
            <div class="hero-overlay"></div>
            <div class="hero-badges">
              @if (ev.categoryName) {
                <span class="badge badge-category">{{ ev.categoryName }}</span>
              }
              <span [class]="getStatusBadgeClass(ev.status)">
                {{ getStatusLabel(ev.status) }}
              </span>
              @if (feedbackSummary() && feedbackSummary()!.totalFeedback > 0) {
                <span class="badge badge-rating">⭐ {{ feedbackSummary()!.averageRating | number: '1.1-1' }} ({{ feedbackSummary()!.totalFeedback }})</span>
              }
            </div>
          </div>

          <div class="hero-content">
            <h1 class="hero-title">{{ ev.name }}</h1>

            <div class="hero-meta-grid">
              <div class="meta-item">
                <span class="meta-icon" aria-hidden="true">📅</span>
                <div class="meta-text">
                  <strong>Date & Time</strong>
                  <span>{{ ev.startDateTime | date: 'fullDate' }}</span>
                  <span class="meta-sub">
                    {{ ev.startDateTime | date: 'shortTime' }} – {{ ev.endDateTime | date: 'shortTime' }}
                  </span>
                </div>
              </div>

              <div class="meta-item">
                <span class="meta-icon" aria-hidden="true">📍</span>
                <div class="meta-text">
                  <strong>Location</strong>
                  <span>{{ ev.venueName || 'Venue TBD' }}</span>
                  @if (ev.venueCity) {
                    <span class="meta-sub">{{ ev.venueCity }}{{ ev.venueState ? ', ' + ev.venueState : '' }}</span>
                  }
                </div>
              </div>

              <div class="meta-item">
                <span class="meta-icon" aria-hidden="true">👤</span>
                <div class="meta-text">
                  <strong>Organized by</strong>
                  <span>{{ ev.organizerName || 'Community Host' }}</span>
                </div>
              </div>

              <div class="meta-item">
                <span class="meta-icon" aria-hidden="true">👥</span>
                <div class="meta-text">
                  <strong>Capacity</strong>
                  <span>{{ ev.availableTicketCount }} available / {{ ev.maxCapacity }} max</span>
                </div>
              </div>

              @if (feedbackSummary() && feedbackSummary()!.totalFeedback > 0) {
                <div class="meta-item">
                  <span class="meta-icon" aria-hidden="true">⭐</span>
                  <div class="meta-text">
                    <strong>Rating</strong>
                    <span>{{ feedbackSummary()!.averageRating | number: '1.1-1' }} / 5.0 ({{ feedbackSummary()!.totalFeedback }} {{ feedbackSummary()!.totalFeedback === 1 ? 'review' : 'reviews' }})</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </article>

        <!-- Main Content Layout -->
        <div class="detail-layout">
          <!-- Left Main Body -->
          <div class="detail-main">
            <!-- Description Section -->
            <section class="card detail-section" aria-labelledby="desc-heading">
              <div class="card-body">
                <h2 id="desc-heading" class="section-title">About this Event</h2>
                <div class="description-content">
                  {{ ev.description || 'No additional description provided by the organizer.' }}
                </div>
              </div>
            </section>

            <!-- Schedule Section -->
            <section class="card detail-section" aria-labelledby="schedule-heading">
              <div class="card-body">
                <h2 id="schedule-heading" class="section-title">Schedule & Program</h2>
                @if (ev.schedules && ev.schedules.length > 0) {
                  <ol class="schedule-timeline">
                    @for (item of ev.schedules; track item.id) {
                      <li class="timeline-item">
                        <div class="timeline-time">
                          <strong>{{ item.startDateTime | date: 'shortTime' }}</strong>
                          <span>{{ item.endDateTime | date: 'shortTime' }}</span>
                        </div>
                        <div class="timeline-content">
                          <h3 class="timeline-title">{{ item.title }}</h3>
                          @if (item.location) {
                            <div class="timeline-location">
                              <span aria-hidden="true">📍</span> {{ item.location }}
                            </div>
                          }
                          @if (item.description) {
                            <p class="timeline-desc">{{ item.description }}</p>
                          }
                        </div>
                      </li>
                    }
                  </ol>
                } @else {
                  <p class="empty-hint">Detailed schedule sessions will be announced closer to the date.</p>
                }
              </div>
            </section>

            <!-- Ticket Tiers Section -->
            <section class="card detail-section" aria-labelledby="tickets-heading">
              <div class="card-body">
                <h2 id="tickets-heading" class="section-title">Admission & Ticket Types</h2>
                @if (ev.ticketTypes && ev.ticketTypes.length > 0) {
                  <div class="ticket-list">
                    @for (ticket of ev.ticketTypes; track ticket.id) {
                      <div class="ticket-item" [class.sold-out]="!ticket.isAvailable || ticket.availableQuantity <= 0">
                        <div class="ticket-info">
                          <div class="ticket-header">
                            <h3 class="ticket-name">{{ ticket.name }}</h3>
                            <span class="ticket-badge" [class.badge-available]="ticket.isAvailable && ticket.availableQuantity > 0" [class.badge-unavailable]="!ticket.isAvailable || ticket.availableQuantity <= 0">
                              {{ ticket.isAvailable && ticket.availableQuantity > 0 ? (ticket.availableQuantity + ' left') : 'Unavailable' }}
                            </span>
                          </div>
                          @if (ticket.description) {
                            <p class="ticket-desc">{{ ticket.description }}</p>
                          }
                          @if (ticket.saleEndDate) {
                            <div class="ticket-dates">
                              Sale closes: {{ ticket.saleEndDate | date: 'mediumDate' }}
                            </div>
                          }
                        </div>
                        <div class="ticket-price-box">
                          @if (ticket.price > 0) {
                            <span class="ticket-price">{{ ticket.price | currency }}</span>
                          } @else {
                            <span class="ticket-price-free">Free</span>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="empty-hint">Standard admission applies. Registration details will be confirmed shortly.</p>
                }
              </div>
            </section>

            <!-- Reviews & Ratings Section -->
            <section class="card detail-section" aria-labelledby="feedback-heading">
              <div class="card-body">
                <div class="section-header-row">
                  <div>
                    <h2 id="feedback-heading" class="section-title">Attendee Reviews & Ratings</h2>
                    <p class="section-subtitle">Real feedback and ratings from verified event attendees.</p>
                  </div>
                  @if (canLeaveFeedback()) {
                    <button
                      type="button"
                      class="btn btn-primary"
                      (click)="openFeedbackModal()"
                    >
                      ⭐ Leave Feedback
                    </button>
                  } @else if (myFeedback()) {
                    <button
                      type="button"
                      class="btn btn-outline-primary"
                      (click)="openFeedbackModal()"
                    >
                      ✏️ Edit Your Feedback
                    </button>
                  }
                </div>

                @if (feedbackSummary(); as summary) {
                  @if (summary.totalFeedback > 0) {
                    <app-feedback-summary-card
                      [summary]="summary"
                      [selectedRating]="feedbackRatingFilter()"
                      (filterByRating)="onFilterByRating($event)"
                    />
                  }
                }

                <!-- Feedback Reviews List -->
                @if (loadingFeedback()) {
                  <div class="feedback-loading">
                    <app-loading-spinner [message]="'Loading reviews...'"></app-loading-spinner>
                  </div>
                } @else if (feedbacks().length === 0) {
                  <div class="empty-feedback-card">
                    <div class="empty-icon-sm">💬</div>
                    <p class="empty-feedback-title">
                      @if (feedbackRatingFilter() !== null) {
                        No reviews found for {{ feedbackRatingFilter() }} stars.
                      } @else {
                        No reviews have been submitted for this event yet.
                      }
                    </p>
                    @if (canLeaveFeedback()) {
                      <p class="empty-feedback-sub">You attended this event! Be the first to share your experience.</p>
                      <button
                        type="button"
                        class="btn btn-primary btn-sm mt-2"
                        (click)="openFeedbackModal()"
                      >
                        ⭐ Write the First Review
                      </button>
                    }
                  </div>
                } @else {
                  <div class="feedback-list">
                    @for (feed of feedbacks(); track feed.id) {
                      <div class="feedback-item" [class.is-own-feedback]="feed.userId === currentUserId()">
                        <div class="feedback-item-header">
                          <div class="feedback-author-info">
                            <span class="author-avatar" aria-hidden="true">👤</span>
                            <div>
                              <div class="author-name-row">
                                <strong class="author-name">{{ feed.userName || 'Verified Attendee' }}</strong>
                                @if (feed.userId === currentUserId()) {
                                  <span class="badge badge-own">Your Review</span>
                                }
                              </div>
                              <span class="feedback-time">
                                {{ feed.createdAt | date: 'mediumDate' }}
                                @if (feed.updatedAt) {
                                  <span class="edited-text">(edited)</span>
                                }
                              </span>
                            </div>
                          </div>

                          <div class="feedback-stars-box">
                            <app-rating-stars
                              [rating]="feed.rating"
                              [readonly]="true"
                              size="sm"
                            />
                            <span class="feedback-rating-val">{{ feed.rating }}★</span>
                          </div>
                        </div>

                        @if (feed.comment) {
                          <p class="feedback-comment-body">{{ feed.comment }}</p>
                        }

                        @if (feed.userId === currentUserId() || isUserAdmin()) {
                          <div class="feedback-item-actions">
                            @if (feed.userId === currentUserId()) {
                              <button
                                type="button"
                                class="btn-action-link"
                                (click)="openFeedbackModal()"
                              >
                                ✏️ Edit
                              </button>
                            }
                            <button
                              type="button"
                              class="btn-action-link text-danger"
                              (click)="deleteFeedback(feed)"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Pagination Controls -->
                  @if (feedbackTotalPages() > 1) {
                    <div class="feedback-pagination">
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        [disabled]="feedbackPage() <= 1"
                        (click)="changeFeedbackPage(feedbackPage() - 1)"
                      >
                        Previous
                      </button>
                      <span class="page-indicator">
                        Page {{ feedbackPage() }} of {{ feedbackTotalPages() }}
                      </span>
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm"
                        [disabled]="feedbackPage() >= feedbackTotalPages()"
                        (click)="changeFeedbackPage(feedbackPage() + 1)"
                      >
                        Next
                      </button>
                    </div>
                  }
                }
              </div>
            </section>
          </div>

          <!-- Right Sidebar -->
          <aside class="detail-sidebar" aria-label="Event summary and actions">
            <!-- Registration & Booking Box -->
            <div class="card sidebar-card highlight-card">
              <div class="card-body">
                <div class="price-header">
                  <span class="price-label">Price</span>
                  @if (ev.minimumTicketPrice != null && ev.minimumTicketPrice > 0) {
                    <div class="price-display">
                      <span class="price-from">From</span>
                      <span class="price-amount">{{ ev.minimumTicketPrice | currency }}</span>
                    </div>
                  } @else {
                    <span class="price-amount free-badge">Free Admission</span>
                  }
                </div>

                <div class="status-summary">
                  @if (ev.isRegistrationOpen) {
                    <div class="status-pill status-open">
                      <span class="status-dot"></span> Registration Open
                    </div>
                  } @else {
                    <div class="status-pill status-closed">
                      <span class="status-dot"></span> Registration Closed
                    </div>
                  }

                  @if (ev.registrationDeadline) {
                    <p class="deadline-note">
                      Deadline: {{ ev.registrationDeadline | date: 'mediumDate' }} ({{ ev.registrationDeadline | date: 'shortTime' }})
                    </p>
                  }
                </div>

                <!-- Registration Action -->
                <div class="action-box">
                  @if (ev.isRegistrationOpen && ev.availableTicketCount > 0) {
                    <button
                      type="button"
                      class="btn btn-primary btn-block btn-lg"
                      (click)="handleRegisterClick()"
                    >
                      Register / Get Tickets
                    </button>
                    @if (!authService.isAuthenticated()) {
                      <p class="phase-notice">Sign in will be requested to complete your booking.</p>
                    }
                  } @else {
                    <button
                      type="button"
                      class="btn btn-secondary btn-block btn-lg"
                      disabled
                    >
                      Registration Closed
                    </button>
                    <p class="phase-notice">This event is currently not accepting new registrations.</p>
                  }
                </div>

                <!-- Organizer / Admin Direct Edit Shortcut -->
                @if (canManageEvent()) {
                  <div class="organizer-actions">
                    <hr class="action-divider" />
                    <a [routerLink]="['/organizer/events', ev.id, 'ticket-types']" class="btn btn-secondary btn-block mb-2">
                      🎟️ Manage Ticket Types
                    </a>
                    <a [routerLink]="['/organizer/events', ev.id, 'edit']" class="btn btn-secondary btn-block">
                      ✏️ Edit This Event
                    </a>
                  </div>
                }
              </div>
            </div>

            <!-- Venue Details Card -->
            <div class="card sidebar-card">
              <div class="card-body">
                <h3 class="sidebar-heading">Venue Location</h3>
                <h4 class="venue-name">{{ ev.venueName || 'To Be Determined' }}</h4>
                @if (ev.venueAddress) {
                  <p class="venue-address">{{ ev.venueAddress }}</p>
                }
                <p class="venue-city">
                  {{ ev.venueCity || '' }}{{ ev.venueState ? ', ' + ev.venueState : '' }}
                  {{ ev.venuePostalCode ? ' ' + ev.venuePostalCode : '' }}
                </p>
                @if (ev.venueCountry) {
                  <p class="venue-country">{{ ev.venueCountry }}</p>
                }
              </div>
            </div>
          </aside>
        </div>
      }

      @if (isRegisterModalOpen() && event(); as currentEvent) {
        <app-register-modal
          [event]="currentEvent"
          (closed)="closeRegisterModal()"
          (registered)="onRegistrationSuccess($event)"
        />
      }

      @if (isFeedbackModalOpen() && event(); as currentEvent) {
        <app-feedback-modal
          [eventId]="currentEvent.id"
          [eventName]="currentEvent.name"
          [existingFeedback]="myFeedback()"
          (closed)="closeFeedbackModal()"
          (saved)="onFeedbackSaved($event)"
        />
      }
    </div>
  `,
  styles: [`
    .event-detail-container {
      width: 100%;
      max-width: var(--container-max-width);
      margin: 0 auto;
      padding: var(--space-4) 0 var(--space-12);
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

    /* Hero Section */
    .event-hero {
      overflow: hidden;
      margin-bottom: var(--space-8);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-md);
    }

    .hero-media-wrapper {
      position: relative;
      height: 320px;
      width: 100%;
      background-color: var(--color-gray-900);
      overflow: hidden;
    }

    .hero-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-700), var(--color-gray-900));
    }

    .hero-fallback .fallback-icon {
      font-size: 5rem;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.2) 60%, transparent 100%);
    }

    .hero-badges {
      position: absolute;
      top: var(--space-4);
      left: var(--space-4);
      display: flex;
      gap: var(--space-2);
      z-index: 2;
    }

    .badge-category {
      background-color: rgba(255, 255, 255, 0.9);
      color: var(--color-gray-900);
      font-weight: var(--font-weight-semibold);
      backdrop-filter: blur(4px);
    }

    .hero-content {
      padding: var(--space-6) var(--space-8);
      background-color: var(--bg-surface);
    }

    .hero-title {
      font-size: var(--font-size-3xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-6);
      line-height: 1.25;
    }

    .hero-meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .meta-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
    }

    .meta-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .meta-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      font-size: var(--font-size-sm);
      color: var(--color-gray-800);
    }

    .meta-text strong {
      font-size: var(--font-size-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-gray-500);
    }

    .meta-sub {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    /* Layout */
    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: var(--space-8);
      align-items: start;
    }

    @media (max-width: 900px) {
      .detail-layout {
        grid-template-columns: 1fr;
      }
    }

    .detail-main {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
    }

    .detail-section {
      border-radius: var(--radius-lg);
    }

    .section-title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-gray-900);
      margin: 0 0 var(--space-4);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }

    .description-content {
      font-size: var(--font-size-base);
      line-height: 1.7;
      color: var(--color-gray-700);
      white-space: pre-line;
    }

    /* Schedule Timeline */
    .schedule-timeline {
      list-style: none;
      padding: 0;
      margin: 0;
      position: relative;
    }

    .timeline-item {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-4) 0;
      border-bottom: 1px solid var(--border-color);
    }

    .timeline-item:last-child {
      border-bottom: none;
    }

    .timeline-time {
      display: flex;
      flex-direction: column;
      min-width: 90px;
      font-size: var(--font-size-sm);
      color: var(--color-primary-700);
    }

    .timeline-time span {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .timeline-content {
      flex: 1;
    }

    .timeline-title {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      margin: 0 0 var(--space-1);
      color: var(--color-gray-900);
    }

    .timeline-location {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin-bottom: var(--space-1);
    }

    .timeline-desc {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
    }

    /* Ticket List */
    .ticket-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .ticket-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background-color: var(--color-gray-50);
      gap: var(--space-4);
    }

    .ticket-item.sold-out {
      opacity: 0.6;
      background-color: var(--color-gray-100);
    }

    .ticket-info {
      flex: 1;
    }

    .ticket-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-1);
    }

    .ticket-name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      margin: 0;
      color: var(--color-gray-900);
    }

    .ticket-badge {
      font-size: var(--font-size-xs);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-full);
      font-weight: var(--font-weight-medium);
    }

    .badge-available {
      background-color: var(--color-success-bg);
      color: var(--color-success-text);
    }

    .badge-unavailable {
      background-color: var(--color-danger-bg);
      color: var(--color-danger-text);
    }

    .ticket-desc {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin: 0 0 var(--space-1);
    }

    .ticket-dates {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .ticket-price-box {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-700);
      white-space: nowrap;
    }

    .ticket-price-free {
      color: var(--color-success-text);
    }

    /* Sidebar */
    .detail-sidebar {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      position: sticky;
      top: var(--space-4);
    }

    .sidebar-card {
      border-radius: var(--radius-lg);
    }

    .highlight-card {
      border-top: 4px solid var(--color-primary-600);
    }

    .price-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: var(--space-4);
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .price-label {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .price-display {
      display: flex;
      align-items: baseline;
      gap: var(--space-1);
    }

    .price-from {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .price-amount {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary-700);
    }

    .free-badge {
      color: var(--color-success-text);
      font-size: var(--font-size-xl);
    }

    .status-summary {
      margin-bottom: var(--space-4);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      margin-bottom: var(--space-2);
    }

    .status-open {
      background-color: var(--color-success-bg);
      color: var(--color-success-text);
    }

    .status-closed {
      background-color: var(--color-warning-bg);
      color: var(--color-warning-text);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .deadline-note {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      margin: 0;
    }

    .btn-block {
      width: 100%;
    }

    .phase-notice {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
      text-align: center;
      margin-top: var(--space-2);
    }

    .organizer-actions {
      margin-top: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .action-divider {
      border: 0;
      border-top: 1px solid var(--border-color);
      margin: var(--space-4) 0;
    }

    .sidebar-heading {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      margin: 0 0 var(--space-3);
      color: var(--color-gray-900);
    }

    .venue-name {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-800);
      margin: 0 0 var(--space-1);
    }

    .venue-address, .venue-city, .venue-country {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0 0 var(--space-1);
    }

    .empty-hint {
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
      font-style: italic;
      margin: 0;
    }

    .loading-wrapper {
      padding: var(--space-12) 0;
      display: flex;
      justify-content: center;
    }

    /* Feedback & Reviews Section */
    .badge-rating {
      background-color: #fef3c7;
      color: #92400e;
      font-weight: var(--font-weight-semibold);
    }

    .section-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
      gap: var(--space-4);
    }

    .section-subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0.25rem 0 0 0;
    }

    .feedback-loading {
      padding: var(--space-8) 0;
      display: flex;
      justify-content: center;
    }

    .empty-feedback-card {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      background-color: var(--color-gray-50);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--color-border);
    }

    .empty-icon-sm {
      font-size: 2rem;
      margin-bottom: var(--space-2);
    }

    .empty-feedback-title {
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
      margin: 0 0 0.25rem 0;
    }

    .empty-feedback-sub {
      font-size: var(--font-size-sm);
      color: var(--color-gray-500);
      margin: 0;
    }

    .feedback-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin-top: var(--space-4);
    }

    .feedback-item {
      padding: var(--space-4);
      background-color: var(--color-gray-50);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      transition: background-color 0.15s ease;
    }

    .feedback-item.is-own-feedback {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
    }

    .feedback-item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-2);
    }

    .feedback-author-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .author-avatar {
      font-size: 1.5rem;
      width: 2.25rem;
      height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-gray-200);
      border-radius: 50%;
    }

    .author-name-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .author-name {
      font-size: var(--font-size-sm);
      color: var(--color-gray-900);
    }

    .badge-own {
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
      background-color: #dcfce7;
      color: #166534;
      border-radius: var(--radius-full);
      font-weight: 600;
    }

    .feedback-time {
      font-size: var(--font-size-xs);
      color: var(--color-gray-500);
    }

    .edited-text {
      font-style: italic;
      margin-left: 0.25rem;
    }

    .feedback-stars-box {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .feedback-rating-val {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-gray-700);
    }

    .feedback-comment-body {
      font-size: var(--font-size-sm);
      line-height: 1.5;
      color: var(--color-gray-700);
      margin: var(--space-2) 0 0 0;
      white-space: pre-line;
    }

    .feedback-item-actions {
      display: flex;
      gap: var(--space-3);
      margin-top: var(--space-3);
      padding-top: var(--space-2);
      border-top: 1px solid rgba(0, 0, 0, 0.05);
    }

    .btn-action-link {
      background: none;
      border: none;
      padding: 0;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      color: var(--color-primary-600);
      cursor: pointer;
    }

    .btn-action-link:hover {
      text-decoration: underline;
    }

    .btn-action-link.text-danger {
      color: var(--color-danger-600);
    }

    .feedback-pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }

    .page-indicator {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
    }
  `],
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventService = inject(EventService);
  private readonly feedbackService = inject(FeedbackService);
  private readonly registrationService = inject(RegistrationService);
  readonly authService = inject(AuthService);

  readonly EventStatus = EventStatus;

  readonly event = signal<PublicEventDetailsDto | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isRegisterModalOpen = signal<boolean>(false);

  // Feedback State
  readonly feedbackSummary = signal<EventFeedbackSummaryDto | null>(null);
  readonly feedbacks = signal<FeedbackDto[]>([]);
  readonly loadingFeedback = signal<boolean>(false);
  readonly myFeedback = signal<FeedbackDto | null>(null);
  readonly isFeedbackModalOpen = signal<boolean>(false);
  readonly feedbackRatingFilter = signal<number | null>(null);
  readonly feedbackPage = signal<number>(1);
  readonly feedbackPageSize = signal<number>(5);
  readonly feedbackTotalPages = signal<number>(1);
  readonly userHasConfirmedRegistration = signal<boolean>(false);

  ngOnInit(): void {
    this.loadEventDetails();
  }

  loadEventDetails(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Invalid event identifier.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.eventService.getPublicDetails(id).subscribe({
      next: (data) => {
        this.event.set(data);
        this.loading.set(false);
        this.loadFeedbackData(data.id);
      },
      error: (err: ApiError) => {
        this.error.set(err.message || 'Event not found or failed to load.');
        this.loading.set(false);
      },
    });
  }

  loadFeedbackData(eventId: string): void {
    // 1. Load aggregate summary
    this.feedbackService.getRatingSummary(eventId).subscribe({
      next: (summary) => this.feedbackSummary.set(summary),
      error: () => this.feedbackSummary.set(null),
    });

    // 2. Load reviews list
    this.loadFeedbackList(eventId);

    // 3. Check authenticated user's feedback & registration eligibility
    if (this.authService.isAuthenticated()) {
      this.feedbackService.getMyFeedbackForEvent(eventId).subscribe({
        next: (feed) => this.myFeedback.set(feed),
        error: () => this.myFeedback.set(null),
      });

      const userId = this.authService.getUserId();
      if (userId) {
        this.registrationService.getByUserId(userId).subscribe({
          next: (regs) => {
            const hasReg = regs?.some(
              (r) => r.eventId === eventId && r.status === RegistrationStatus.Confirmed
            );
            this.userHasConfirmedRegistration.set(!!hasReg);
          },
          error: () => this.userHasConfirmedRegistration.set(false),
        });
      }
    }
  }

  loadFeedbackList(eventId: string): void {
    this.loadingFeedback.set(true);
    this.feedbackService
      .getByEventId(eventId, {
        pageNumber: this.feedbackPage(),
        pageSize: this.feedbackPageSize(),
        rating: this.feedbackRatingFilter() ?? undefined,
        sortBy: 'createdAt',
        sortDescending: true,
      })
      .subscribe({
        next: (paged) => {
          this.feedbacks.set(paged.items || []);
          this.feedbackTotalPages.set(paged.totalPages || 1);
          this.loadingFeedback.set(false);
        },
        error: () => {
          this.feedbacks.set([]);
          this.loadingFeedback.set(false);
        },
      });
  }

  onFilterByRating(rating: number | null): void {
    this.feedbackRatingFilter.set(rating);
    this.feedbackPage.set(1);
    const id = this.event()?.id;
    if (id) {
      this.loadFeedbackList(id);
    }
  }

  changeFeedbackPage(page: number): void {
    this.feedbackPage.set(page);
    const id = this.event()?.id;
    if (id) {
      this.loadFeedbackList(id);
    }
  }

  currentUserId(): string | null {
    return this.authService.getUserId();
  }

  isUserAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isEventConcluded(): boolean {
    const ev = this.event();
    if (!ev) return false;
    if (ev.status === EventStatus.Completed) return true;
    if (ev.endDateTime) {
      return new Date(ev.endDateTime) <= new Date();
    }
    return false;
  }

  canLeaveFeedback(): boolean {
    if (!this.authService.isAuthenticated()) return false;
    if (!this.isEventConcluded()) return false;
    if (this.myFeedback() !== null) return false;
    return this.userHasConfirmedRegistration() || this.isUserAdmin();
  }

  openFeedbackModal(): void {
    this.isFeedbackModalOpen.set(true);
  }

  closeFeedbackModal(): void {
    this.isFeedbackModalOpen.set(false);
  }

  onFeedbackSaved(saved: FeedbackDto): void {
    this.myFeedback.set(saved);
    this.closeFeedbackModal();
    const id = this.event()?.id;
    if (id) {
      this.loadFeedbackData(id);
    }
  }

  deleteFeedback(feed: FeedbackDto): void {
    const confirmed = window.confirm('Are you sure you want to delete this feedback review?');
    if (!confirmed) return;

    this.feedbackService.delete(feed.id).subscribe({
      next: () => {
        if (this.myFeedback()?.id === feed.id) {
          this.myFeedback.set(null);
        }
        const id = this.event()?.id;
        if (id) {
          this.loadFeedbackData(id);
        }
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to delete review. Please try again.');
      },
    });
  }

  canManageEvent(): boolean {
    if (!this.authService.isAuthenticated()) return false;
    if (this.authService.isAdmin()) return true;
    if (this.authService.isOrganizer()) {
      const currentUserId = this.authService.getUserId();
      return this.event()?.organizerId === currentUserId;
    }
    return false;
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

  handleRegisterClick(): void {
    if (!this.authService.isAuthenticated()) {
      const id = this.route.snapshot.paramMap.get('id');
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/events/${id}` } });
      return;
    }
    this.isRegisterModalOpen.set(true);
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen.set(false);
  }

  onRegistrationSuccess(_registration: RegistrationDto): void {
    // Refresh event details to reflect updated ticket availability
    this.loadEventDetails();
  }
}
