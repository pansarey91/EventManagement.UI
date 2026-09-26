import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FeedbackService } from '../../core/services/feedback.service';
import { FeedbackDto } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';
import { RatingStarsComponent } from './components/rating-stars.component';
import { FeedbackModalComponent } from './components/feedback-modal.component';

@Component({
  selector: 'app-my-feedback',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    RatingStarsComponent,
    FeedbackModalComponent,
  ],
  template: `
    <div class="feedback-page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">My Reviews & Feedback</h1>
          <p class="page-subtitle">View and manage the ratings and reviews you've shared for events.</p>
        </div>
      </header>

      @if (loading()) {
        <div class="loading-wrapper">
          <app-loading-spinner [message]="'Loading your reviews...'"></app-loading-spinner>
        </div>
      } @else if (error()) {
        <app-error-state
          [title]="'Unable to Load Reviews'"
          [message]="error()!"
          (retry)="loadMyFeedbacks()"
        ></app-error-state>
      } @else if (feedbacks().length === 0) {
        <div class="empty-state card">
          <div class="empty-icon" aria-hidden="true">⭐</div>
          <h2 class="empty-title">No Reviews Yet</h2>
          <p class="empty-message">
            You haven't submitted any event reviews yet. After attending an event, share your experience to help organizers and fellow attendees!
          </p>
          <div class="empty-actions">
            <a routerLink="/events" class="btn btn-primary">Discover Events</a>
            <a routerLink="/tickets/my-tickets" class="btn btn-secondary">My Tickets</a>
          </div>
        </div>
      } @else {
        <div class="reviews-grid">
          @for (feed of feedbacks(); track feed.id) {
            <article class="review-card card">
              <div class="card-body">
                <div class="review-header">
                  <div class="review-event-info">
                    <h2 class="event-title">
                      <a [routerLink]="['/events', feed.eventId]" class="event-link">
                        {{ feed.eventName || 'Event Details' }}
                      </a>
                    </h2>
                    <span class="review-date">
                      Reviewed on {{ feed.createdAt | date: 'mediumDate' }}
                      @if (feed.updatedAt) {
                        <span class="edited-badge">(edited)</span>
                      }
                    </span>
                  </div>
                  <div class="review-rating-badge">
                    <app-rating-stars
                      [rating]="feed.rating"
                      [readonly]="true"
                      size="sm"
                    />
                    <span class="rating-number">{{ feed.rating }} / 5</span>
                  </div>
                </div>

                @if (feed.comment) {
                  <p class="review-comment">{{ feed.comment }}</p>
                } @else {
                  <p class="no-comment-text">Rating only provided (no written comment).</p>
                }

                <div class="review-actions">
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-primary"
                    (click)="openEditModal(feed)"
                  >
                    ✏️ Edit Review
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm btn-outline-danger"
                    (click)="confirmDelete(feed)"
                    [disabled]="deletingId() === feed.id"
                  >
                    @if (deletingId() === feed.id) {
                      <span>Deleting...</span>
                    } @else {
                      <span>🗑️ Delete</span>
                    }
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }

      @if (editingFeedback(); as feed) {
        <app-feedback-modal
          [eventId]="feed.eventId"
          [eventName]="feed.eventName || undefined"
          [existingFeedback]="feed"
          (closed)="closeEditModal()"
          (saved)="onFeedbackUpdated($event)"
        />
      }
    </div>
  `,
  styles: [`
    .feedback-page-container {
      width: 100%;
      max-width: var(--container-max-width, 1200px);
      margin: 0 auto;
      padding: var(--space-6, 1.5rem) var(--space-4, 1rem) var(--space-12, 3rem);
    }

    .page-header {
      margin-bottom: var(--space-8, 2rem);
    }

    .page-title {
      font-size: 1.875rem;
      font-weight: 800;
      color: var(--color-gray-900, #111827);
      margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
      font-size: 1rem;
      color: var(--color-gray-600, #4b5563);
      margin: 0;
    }

    .loading-wrapper {
      padding: var(--space-12, 3rem) 0;
      display: flex;
      justify-content: center;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12, 3rem) var(--space-6, 1.5rem);
      max-width: 540px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: var(--space-4, 1rem);
    }

    .empty-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-gray-900, #111827);
      margin: 0 0 0.5rem 0;
    }

    .empty-message {
      color: var(--color-gray-600, #4b5563);
      line-height: 1.5;
      margin-bottom: var(--space-6, 1.5rem);
    }

    .empty-actions {
      display: flex;
      gap: var(--space-3, 0.75rem);
      justify-content: center;
    }

    .reviews-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-4, 1rem);
    }

    .review-card {
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-lg, 0.75rem);
      border: 1px solid var(--color-border, #e5e7eb);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      transition: box-shadow 0.15s ease;
    }

    .review-card:hover {
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    }

    .card-body {
      padding: var(--space-5, 1.25rem);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3, 0.75rem);
    }

    .event-title {
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0 0 0.25rem 0;
    }

    .event-link {
      color: var(--color-primary-600, #2563eb);
      text-decoration: none;
    }

    .event-link:hover {
      text-decoration: underline;
    }

    .review-date {
      font-size: 0.8125rem;
      color: var(--color-gray-500, #6b7280);
    }

    .edited-badge {
      font-style: italic;
      margin-left: 0.25rem;
    }

    .review-rating-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background-color: var(--color-gray-50, #f9fafb);
      padding: 0.25rem 0.625rem;
      border-radius: var(--radius-full, 9999px);
      border: 1px solid var(--color-gray-200, #e5e7eb);
    }

    .rating-number {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-gray-800, #1f2937);
    }

    .review-comment {
      font-size: 0.9375rem;
      line-height: 1.5;
      color: var(--color-gray-700, #374151);
      margin: 0 0 var(--space-4, 1rem) 0;
      white-space: pre-line;
    }

    .no-comment-text {
      font-size: 0.875rem;
      font-style: italic;
      color: var(--color-gray-400, #9ca3af);
      margin: 0 0 var(--space-4, 1rem) 0;
    }

    .review-actions {
      display: flex;
      gap: var(--space-3, 0.75rem);
      padding-top: var(--space-3, 0.75rem);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .btn-sm {
      padding: 0.25rem 0.625rem;
      font-size: 0.8125rem;
    }

    .btn-outline-primary {
      background: transparent;
      border: 1px solid var(--color-primary-600, #2563eb);
      color: var(--color-primary-600, #2563eb);
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
    }

    .btn-outline-primary:hover {
      background-color: var(--color-primary-50, #eff6ff);
    }

    .btn-outline-danger {
      background: transparent;
      border: 1px solid var(--color-danger-500, #ef4444);
      color: var(--color-danger-600, #dc2626);
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
    }

    .btn-outline-danger:hover {
      background-color: var(--color-danger-50, #fef2f2);
    }
  `],
})
export class MyFeedbackComponent implements OnInit {
  private readonly feedbackService = inject(FeedbackService);

  feedbacks = signal<FeedbackDto[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  editingFeedback = signal<FeedbackDto | null>(null);
  deletingId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMyFeedbacks();
  }

  loadMyFeedbacks(): void {
    this.loading.set(true);
    this.error.set(null);

    this.feedbackService.getMyFeedback().subscribe({
      next: (items) => {
        this.feedbacks.set(items || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(
          err.error?.message || 'Failed to load your reviews. Please try again.'
        );
        this.loading.set(false);
      },
    });
  }

  openEditModal(feed: FeedbackDto): void {
    this.editingFeedback.set(feed);
  }

  closeEditModal(): void {
    this.editingFeedback.set(null);
  }

  onFeedbackUpdated(updated: FeedbackDto): void {
    this.feedbacks.update((list) =>
      list.map((item) => (item.id === updated.id ? updated : item))
    );
    this.closeEditModal();
  }

  confirmDelete(feed: FeedbackDto): void {
    const confirmed = window.confirm(
      `Are you sure you want to delete your review for "${feed.eventName || 'this event'}"?`
    );
    if (!confirmed) return;

    this.deletingId.set(feed.id);
    this.feedbackService.delete(feed.id).subscribe({
      next: () => {
        this.feedbacks.update((list) => list.filter((item) => item.id !== feed.id));
        this.deletingId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        alert('Failed to delete review. Please try again.');
      },
    });
  }
}
