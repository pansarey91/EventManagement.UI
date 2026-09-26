import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventFeedbackSummaryDto } from '../../../core/models';
import { RatingStarsComponent } from './rating-stars.component';

@Component({
  selector: 'app-feedback-summary-card',
  standalone: true,
  imports: [CommonModule, RatingStarsComponent],
  template: `
    <div class="summary-card card">
      <div class="card-body">
        <div class="summary-grid">
          <!-- Left Column: Overall Score -->
          <div class="overall-score-section">
            <div class="score-number">{{ summary.averageRating | number: '1.1-1' }}</div>
            <app-rating-stars
              [rating]="summary.averageRating"
              [readonly]="true"
              size="lg"
            />
            <div class="score-meta">
              {{ summary.totalFeedback }} {{ summary.totalFeedback === 1 ? 'review' : 'reviews' }}
            </div>
          </div>

          <!-- Right Column: Rating Distribution Bars -->
          <div class="distribution-section">
            <div class="distribution-header">
              <span class="distribution-title">Rating Breakdown</span>
              @if (selectedRating !== null && selectedRating !== undefined) {
                <button
                  type="button"
                  class="btn-clear-filter"
                  (click)="onSelectRating(null)"
                >
                  Clear filter ({{ selectedRating }}★)
                </button>
              }
            </div>

            <div class="distribution-bars">
              @for (stars of [5, 4, 3, 2, 1]; track stars) {
                @let count = getStarCount(stars);
                @let pct = getPercentage(count);
                <button
                  type="button"
                  class="dist-row"
                  [class.selected]="selectedRating === stars"
                  (click)="onSelectRating(stars)"
                  [attr.aria-label]="stars + ' stars: ' + count + ' reviews (' + pct + '%)'"
                >
                  <span class="dist-label">{{ stars }} ★</span>
                  <div class="progress-track">
                    <div
                      class="progress-fill"
                      [style.width.%]="pct"
                    ></div>
                  </div>
                  <span class="dist-count">{{ count }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-lg, 0.75rem);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      border: 1px solid var(--color-border, #e5e7eb);
      margin-bottom: var(--space-6, 1.5rem);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: var(--space-8, 2rem);
      align-items: center;
    }

    @media (max-width: 640px) {
      .summary-grid {
        grid-template-columns: 1fr;
        text-align: center;
        gap: var(--space-6, 1.5rem);
      }
    }

    .overall-score-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-4, 1rem);
      border-right: 1px solid var(--color-border, #e5e7eb);
    }

    @media (max-width: 640px) {
      .overall-score-section {
        border-right: none;
        border-bottom: 1px solid var(--color-border, #e5e7eb);
        padding-bottom: var(--space-6, 1.5rem);
      }
    }

    .score-number {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      color: var(--color-gray-900, #111827);
      margin-bottom: var(--space-2, 0.5rem);
    }

    .score-meta {
      font-size: 0.875rem;
      color: var(--color-gray-500, #6b7280);
      margin-top: var(--space-2, 0.5rem);
    }

    .distribution-section {
      flex: 1;
    }

    .distribution-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3, 0.75rem);
    }

    .distribution-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700, #374151);
    }

    .btn-clear-filter {
      background: none;
      border: none;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-primary-600, #2563eb);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm, 0.25rem);
    }

    .btn-clear-filter:hover {
      text-decoration: underline;
    }

    .distribution-bars {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .dist-row {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      background: none;
      border: 1px solid transparent;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      text-align: left;
      font: inherit;
      width: 100%;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    .dist-row:hover {
      background-color: var(--color-gray-50, #f9fafb);
    }

    .dist-row.selected {
      background-color: var(--color-primary-50, #eff6ff);
      border-color: var(--color-primary-300, #93c5fd);
    }

    .dist-label {
      width: 32px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-700, #374151);
      white-space: nowrap;
    }

    .progress-track {
      flex: 1;
      height: 10px;
      background-color: var(--color-gray-200, #e5e7eb);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--color-warning-500, #f59e0b);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .dist-row.selected .progress-fill {
      background-color: var(--color-primary-600, #2563eb);
    }

    .dist-count {
      width: 36px;
      text-align: right;
      font-size: 0.8125rem;
      color: var(--color-gray-500, #6b7280);
    }
  `],
})
export class FeedbackSummaryCardComponent {
  @Input({ required: true }) summary!: EventFeedbackSummaryDto;
  @Input() selectedRating: number | null = null;
  @Output() filterByRating = new EventEmitter<number | null>();

  getStarCount(star: number): number {
    if (!this.summary?.ratingDistribution) return 0;
    const dist = this.summary.ratingDistribution as any;
    return dist[star] ?? dist[star.toString()] ?? 0;
  }

  getPercentage(count: number): number {
    if (!this.summary?.totalFeedback || this.summary.totalFeedback <= 0) return 0;
    return Math.round((count / this.summary.totalFeedback) * 100);
  }

  onSelectRating(rating: number | null): void {
    if (this.selectedRating === rating) {
      this.selectedRating = null;
    } else {
      this.selectedRating = rating;
    }
    this.filterByRating.emit(this.selectedRating);
  }
}
