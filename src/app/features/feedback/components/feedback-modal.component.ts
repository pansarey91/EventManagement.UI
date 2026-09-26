import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../../core/services/feedback.service';
import {
  FeedbackDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  ApiError,
} from '../../../core/models';
import { RatingStarsComponent } from './rating-stars.component';

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RatingStarsComponent],
  template: `
    <div
      class="modal-backdrop"
      (click)="onBackdropClick($event)"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
    >
      <div class="modal-dialog card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 id="feedback-modal-title" class="modal-title">
              {{ isEditMode() ? 'Edit Your Review' : 'Leave Feedback' }}
            </h2>
            @if (eventName) {
              <p class="modal-subtitle">{{ eventName }}</p>
            }
          </div>
          <button
            type="button"
            class="modal-close-btn"
            (click)="closeModal()"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form (ngSubmit)="submitFeedback()" #feedbackForm="ngForm">
          <div class="modal-body">
            @if (errorMessage()) {
              <div class="alert alert-danger mb-4" role="alert">
                <span class="alert-icon">⚠️</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <!-- Star Rating Input -->
            <div class="form-group mb-4">
              <label class="form-label required">Overall Rating</label>
              <div class="rating-input-wrapper">
                <app-rating-stars
                  [rating]="rating()"
                  [readonly]="false"
                  size="lg"
                  (ratingChange)="onRatingSelected($event)"
                />
                <span class="rating-hint">{{ getRatingText(rating()) }}</span>
              </div>
              @if (ratingError()) {
                <div class="form-error">Please select a star rating (1 to 5 stars).</div>
              }
            </div>

            <!-- Comment Input -->
            <div class="form-group mb-4">
              <div class="label-with-counter">
                <label for="feedback-comment" class="form-label">
                  Your Review <span class="text-muted">(optional)</span>
                </label>
                <span class="char-counter" [class.text-danger]="comment().length > 1000">
                  {{ comment().length }} / 1000
                </span>
              </div>
              <textarea
                id="feedback-comment"
                name="comment"
                class="form-control"
                rows="4"
                maxlength="1000"
                placeholder="What did you enjoy most about the event? Any suggestions for future organizers?"
                [(ngModel)]="commentValue"
                [disabled]="isSubmitting()"
              ></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="closeModal()"
              [disabled]="isSubmitting()"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              [disabled]="isSubmitting() || rating() === 0"
            >
              @if (isSubmitting()) {
                <span class="spinner-inline" aria-hidden="true"></span>
                <span>Saving...</span>
              } @else {
                <span>{{ isEditMode() ? 'Update Review' : 'Submit Review' }}</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4, 1rem);
      animation: fadeIn 0.15s ease-out;
    }

    .modal-dialog {
      width: 100%;
      max-width: 520px;
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-xl, 1rem);
      box-shadow: var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
      border: 1px solid var(--color-border, #e5e7eb);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.2s ease-out;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-5, 1.25rem) var(--space-6, 1.5rem);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-gray-900, #111827);
      margin: 0;
    }

    .modal-subtitle {
      font-size: 0.875rem;
      color: var(--color-gray-500, #6b7280);
      margin: 0.25rem 0 0 0;
    }

    .modal-close-btn {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: var(--color-gray-400, #9ca3af);
      cursor: pointer;
      padding: 0.25rem;
      border-radius: var(--radius-md, 0.375rem);
      line-height: 1;
      transition: color 0.15s ease;
    }

    .modal-close-btn:hover {
      color: var(--color-gray-700, #374151);
    }

    .modal-body {
      padding: var(--space-6, 1.5rem);
    }

    .rating-input-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-4, 1rem);
      margin-top: 0.5rem;
    }

    .rating-hint {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-600, #4b5563);
    }

    .label-with-counter {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .char-counter {
      font-size: 0.75rem;
      color: var(--color-gray-400, #9ca3af);
    }

    .form-label.required::after {
      content: ' *';
      color: var(--color-danger-500, #ef4444);
    }

    .form-error {
      color: var(--color-danger-600, #dc2626);
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    .text-muted {
      color: var(--color-gray-500, #6b7280);
      font-weight: 400;
    }

    .text-danger {
      color: var(--color-danger-600, #dc2626);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-4, 1rem) var(--space-6, 1.5rem);
      background-color: var(--color-gray-50, #f9fafb);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    .spinner-inline {
      display: inline-block;
      width: 1rem;
      height: 1rem;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin-right: 0.5rem;
      vertical-align: middle;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(12px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `],
})
export class FeedbackModalComponent implements OnInit {
  private readonly feedbackService = inject(FeedbackService);

  @Input({ required: true }) eventId!: string;
  @Input() eventName?: string;
  @Input() existingFeedback?: FeedbackDto | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<FeedbackDto>();

  rating = signal<number>(0);
  comment = signal<string>('');
  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  ratingError = signal<boolean>(false);
  isEditMode = signal<boolean>(false);

  get commentValue(): string {
    return this.comment();
  }

  set commentValue(val: string) {
    this.comment.set(val || '');
  }

  ngOnInit(): void {
    if (this.existingFeedback) {
      this.isEditMode.set(true);
      this.rating.set(this.existingFeedback.rating);
      this.comment.set(this.existingFeedback.comment || '');
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (!this.isSubmitting()) {
      this.closeModal();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.isSubmitting()) {
      this.closeModal();
    }
  }

  onRatingSelected(star: number): void {
    this.rating.set(star);
    this.ratingError.set(false);
  }

  getRatingText(rating: number): string {
    switch (rating) {
      case 5:
        return 'Outstanding ⭐⭐⭐⭐⭐';
      case 4:
        return 'Very Good ⭐⭐⭐⭐';
      case 3:
        return 'Average ⭐⭐⭐';
      case 2:
        return 'Poor ⭐⭐';
      case 1:
        return 'Terrible ⭐';
      default:
        return 'Tap a star to rate';
    }
  }

  closeModal(): void {
    this.closed.emit();
  }

  submitFeedback(): void {
    if (this.rating() < 1 || this.rating() > 5) {
      this.ratingError.set(true);
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const commentTrimmed = this.comment().trim() || null;

    if (this.isEditMode() && this.existingFeedback) {
      const updateDto: UpdateFeedbackDto = {
        rating: this.rating(),
        comment: commentTrimmed,
      };

      this.feedbackService.update(this.existingFeedback.id, updateDto).subscribe({
        next: (updated) => {
          this.isSubmitting.set(false);
          this.saved.emit(updated);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.message ||
              err.error?.detail ||
              'Failed to update review. Please try again.'
          );
        },
      });
    } else {
      const createDto: CreateFeedbackDto = {
        eventId: this.eventId,
        rating: this.rating(),
        comment: commentTrimmed,
      };

      this.feedbackService.create(createDto).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.saved.emit(created);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.message ||
              err.error?.detail ||
              'Failed to submit review. Please ensure you are eligible to leave feedback.'
          );
        },
      });
    }
  }
}
