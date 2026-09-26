import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  template: `
    @if (overlay()) {
      <div class="loading-overlay" role="status" aria-live="polite" [attr.aria-busy]="true">
        <div class="spinner-container">
          <div class="spinner spinner-lg" aria-hidden="true"></div>
          @if (message()) {
            <p class="loading-text">{{ message() }}</p>
          }
        </div>
      </div>
    } @else {
      <div class="loading-inline" role="status" aria-live="polite" [attr.aria-busy]="true">
        <div class="spinner" aria-hidden="true"></div>
        @if (message()) {
          <span class="loading-text">{{ message() }}</span>
        }
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(2px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-container {
      background: var(--bg-surface);
      padding: var(--space-6) var(--space-8);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    .loading-inline {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) 0;
    }

    .spinner-lg {
      width: 2.5rem;
      height: 2.5rem;
      border-width: 3px;
    }

    .loading-text {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-gray-700);
      margin: 0;
    }
  `],
})
export class LoadingSpinnerComponent {
  readonly overlay = input<boolean>(false);
  readonly message = input<string | null>(null);
}
