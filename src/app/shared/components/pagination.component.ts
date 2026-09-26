import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (totalCount() > 0) {
      <nav class="pagination-container" [attr.aria-label]="ariaLabel()">
        <!-- Summary Info -->
        <div class="pagination-info" role="status" aria-live="polite">
          Showing <strong>{{ startIndex() }}</strong> to <strong>{{ endIndex() }}</strong> of <strong>{{ totalCount() }}</strong> {{ itemLabel() }}
        </div>

        <div class="pagination-actions">
          <!-- Page Size Selector -->
          @if (showPageSizeSelector() && pageSizeOptions().length > 0) {
            <div class="page-size-wrapper">
              <label for="page-size-select" class="page-size-label">Per page:</label>
              <select
                id="page-size-select"
                class="form-select page-size-select"
                [value]="pageSize()"
                (change)="onPageSizeSelect($event)"
                [disabled]="loading()"
                aria-label="Select number of items per page"
              >
                @for (opt of pageSizeOptions(); track opt) {
                  <option [value]="opt">{{ opt }}</option>
                }
              </select>
            </div>
          }

          <!-- Page Controls -->
          <div class="pagination-controls">
            <!-- First Page Button -->
            @if (showFirstLast() && totalPages() > 5) {
              <button
                type="button"
                class="btn btn-secondary btn-sm nav-btn"
                [disabled]="!hasPreviousPage() || loading()"
                (click)="goToPage(1)"
                aria-label="First page"
                title="Go to first page"
              >
                «
              </button>
            }

            <!-- Previous Page Button -->
            <button
              type="button"
              class="btn btn-secondary btn-sm nav-btn"
              [disabled]="!hasPreviousPage() || loading()"
              (click)="goToPage(pageNumber() - 1)"
              aria-label="Previous page"
              title="Go to previous page"
            >
              ← Prev
            </button>

            <!-- Page Number Pills -->
            <div class="page-numbers" role="group" aria-label="Page selection">
              @for (p of visiblePages(); track p) {
                <button
                  type="button"
                  class="page-num-btn"
                  [class.active]="p === pageNumber()"
                  [disabled]="loading()"
                  (click)="goToPage(p)"
                  [attr.aria-current]="p === pageNumber() ? 'page' : null"
                  [attr.aria-label]="'Page ' + p"
                >
                  {{ p }}
                </button>
              }
            </div>

            <!-- Next Page Button -->
            <button
              type="button"
              class="btn btn-secondary btn-sm nav-btn"
              [disabled]="!hasNextPage() || loading()"
              (click)="goToPage(pageNumber() + 1)"
              aria-label="Next page"
              title="Go to next page"
            >
              Next →
            </button>

            <!-- Last Page Button -->
            @if (showFirstLast() && totalPages() > 5) {
              <button
                type="button"
                class="btn btn-secondary btn-sm nav-btn"
                [disabled]="!hasNextPage() || loading()"
                (click)="goToPage(totalPages())"
                aria-label="Last page"
                title="Go to last page"
              >
                »
              </button>
            }
          </div>
        </div>
      </nav>
    }
  `,
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      background-color: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      flex-wrap: wrap;
      gap: var(--space-3);
      width: 100%;
      box-sizing: border-box;
    }

    .pagination-info {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
    }

    .pagination-info strong {
      color: var(--color-gray-900);
    }

    .pagination-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .page-size-wrapper {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .page-size-label {
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      margin: 0;
    }

    .page-size-select {
      font-size: var(--font-size-xs);
      padding: var(--space-1) var(--space-2);
      height: 2rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: #ffffff;
      color: var(--color-gray-800);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: var(--space-1);
    }

    .nav-btn {
      padding: 0 var(--space-3);
      height: 2rem;
      font-size: var(--font-size-xs);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .page-numbers {
      display: flex;
      gap: var(--space-1);
    }

    .page-num-btn {
      min-width: 2rem;
      height: 2rem;
      padding: 0 var(--space-2);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background-color: #ffffff;
      font-size: var(--font-size-xs);
      color: var(--color-gray-700);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .page-num-btn:hover:not(.active):not(:disabled) {
      background-color: var(--color-gray-100);
    }

    .page-num-btn.active {
      background-color: var(--color-primary-600);
      color: #ffffff;
      border-color: var(--color-primary-600);
      font-weight: var(--font-weight-semibold);
    }

    .page-num-btn:disabled,
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 640px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
      }
      .pagination-actions {
        justify-content: space-between;
      }
    }
  `],
})
export class PaginationComponent {
  readonly pageNumber = input<number>(1);
  readonly pageSize = input<number>(10);
  readonly totalCount = input<number>(0);
  readonly totalPages = input<number>(0);
  readonly loading = input<boolean>(false);
  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50]);
  readonly showPageSizeSelector = input<boolean>(true);
  readonly showFirstLast = input<boolean>(true);
  readonly itemLabel = input<string>('items');
  readonly ariaLabel = input<string>('Pagination navigation');

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly startIndex = computed(() => {
    if (this.totalCount() === 0) return 0;
    return (this.pageNumber() - 1) * this.pageSize() + 1;
  });

  readonly endIndex = computed(() => {
    return Math.min(this.pageNumber() * this.pageSize(), this.totalCount());
  });

  readonly hasPreviousPage = computed(() => {
    return this.pageNumber() > 1;
  });

  readonly hasNextPage = computed(() => {
    return this.pageNumber() < this.totalPages();
  });

  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.pageNumber();
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.pageNumber() && !this.loading()) {
      this.pageChange.emit(page);
    }
  }

  onPageSizeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newSize = parseInt(target.value, 10);
    if (!isNaN(newSize) && newSize !== this.pageSize() && !this.loading()) {
      this.pageSizeChange.emit(newSize);
    }
  }
}
