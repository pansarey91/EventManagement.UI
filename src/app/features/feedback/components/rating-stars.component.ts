import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-stars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rating-stars-container"
      [class.interactive]="!readonly"
      [class.size-sm]="size === 'sm'"
      [class.size-md]="size === 'md'"
      [class.size-lg]="size === 'lg'"
      [attr.role]="readonly ? 'img' : 'radiogroup'"
      [attr.aria-label]="ariaLabel()"
      (mouseleave)="onMouseLeave()"
    >
      @for (star of stars; track star) {
        @if (readonly) {
          <span
            class="star-icon"
            [class.filled]="isStarFilled(star)"
            [class.half]="isStarHalf(star)"
            aria-hidden="true"
          >
            ★
          </span>
        } @else {
          <button
            type="button"
            class="star-btn"
            [class.active]="isStarActive(star)"
            [class.hovered]="hoveredRating() >= star"
            role="radio"
            [attr.aria-checked]="rating === star"
            [attr.aria-label]="star + ' star' + (star > 1 ? 's' : '')"
            (mouseenter)="onStarHover(star)"
            (focus)="onStarHover(star)"
            (click)="selectRating(star)"
            (keydown)="onKeyDown($event, star)"
          >
            ★
          </button>
        }
      }
    </div>
  `,
  styles: [`
    .rating-stars-container {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
      user-select: none;
    }

    .star-icon {
      color: var(--color-gray-300, #d1d5db);
      line-height: 1;
      display: inline-block;
      transition: color 0.15s ease;
    }

    .star-icon.filled {
      color: var(--color-warning-500, #f59e0b);
    }

    .star-btn {
      background: none;
      border: none;
      padding: 0;
      margin: 0;
      cursor: pointer;
      color: var(--color-gray-300, #d1d5db);
      line-height: 1;
      font-size: inherit;
      transition: color 0.15s ease, transform 0.15s ease;
      outline-offset: 2px;
      border-radius: 2px;
    }

    .interactive .star-btn:hover,
    .interactive .star-btn:focus-visible {
      transform: scale(1.15);
    }

    .interactive .star-btn.active,
    .interactive .star-btn.hovered {
      color: var(--color-warning-500, #f59e0b);
    }

    /* Sizing */
    .size-sm {
      font-size: 0.875rem;
    }
    .size-sm .star-btn {
      font-size: 0.875rem;
    }

    .size-md {
      font-size: 1.25rem;
    }
    .size-md .star-btn {
      font-size: 1.25rem;
    }

    .size-lg {
      font-size: 1.875rem;
    }
    .size-lg .star-btn {
      font-size: 1.875rem;
    }
  `],
})
export class RatingStarsComponent {
  @Input() rating = 0;
  @Input() readonly = true;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Output() ratingChange = new EventEmitter<number>();

  readonly stars = [1, 2, 3, 4, 5];
  hoveredRating = signal<number>(0);

  ariaLabel = computed(() => {
    if (this.readonly) {
      return `Rated ${this.rating.toFixed(1)} out of 5 stars`;
    }
    return 'Select a rating from 1 to 5 stars';
  });

  isStarFilled(star: number): boolean {
    return this.rating >= star;
  }

  isStarHalf(star: number): boolean {
    return this.rating >= star - 0.5 && this.rating < star;
  }

  isStarActive(star: number): boolean {
    const current = this.hoveredRating() > 0 ? this.hoveredRating() : this.rating;
    return current >= star;
  }

  onStarHover(star: number): void {
    if (!this.readonly) {
      this.hoveredRating.set(star);
    }
  }

  onMouseLeave(): void {
    if (!this.readonly) {
      this.hoveredRating.set(0);
    }
  }

  selectRating(star: number): void {
    if (this.readonly) return;
    this.rating = star;
    this.ratingChange.emit(star);
  }

  onKeyDown(event: KeyboardEvent, currentStar: number): void {
    if (this.readonly) return;

    let nextStar: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
      nextStar = Math.min(5, (this.rating || currentStar) + 1);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
      nextStar = Math.max(1, (this.rating || currentStar) - 1);
    } else if (event.key === 'Home') {
      nextStar = 1;
    } else if (event.key === 'End') {
      nextStar = 5;
    } else if (['1', '2', '3', '4', '5'].includes(event.key)) {
      nextStar = parseInt(event.key, 10);
    } else if (event.key === 'Enter' || event.key === ' ') {
      this.selectRating(currentStar);
      event.preventDefault();
      return;
    }

    if (nextStar !== null) {
      this.selectRating(nextStar);
      event.preventDefault();
    }
  }
}
