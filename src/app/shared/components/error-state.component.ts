import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="card error-state-card" role="alert">
      <div class="card-body error-state-body">
        <div class="error-icon" aria-hidden="true">⚠️</div>
        <h3 class="error-title">{{ title() }}</h3>
        <p class="error-message">{{ message() }}</p>

        @if (correlationId()) {
          <div class="error-trace-wrapper">
            <span class="trace-label">Reference ID:</span>
            <code class="trace-id">{{ correlationId() }}</code>
          </div>
        }

        @if (retryable()) {
          <div class="error-actions">
            <button type="button" class="btn btn-secondary btn-sm" (click)="retry.emit()">
              ↻ Try Again
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .error-state-card {
      border-color: var(--color-error-border);
      background-color: var(--color-error-bg);
      text-align: center;
      margin: var(--space-4) 0;
    }

    .error-state-body {
      padding: var(--space-6);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .error-icon {
      font-size: 2rem;
      margin-bottom: var(--space-2);
    }

    .error-title {
      color: var(--color-error-text);
      font-size: var(--font-size-lg);
      margin-bottom: var(--space-2);
    }

    .error-message {
      color: var(--color-gray-700);
      font-size: var(--font-size-sm);
      max-width: 480px;
      margin-bottom: var(--space-4);
    }

    .error-actions {
      display: flex;
      gap: var(--space-2);
    }

    .error-trace-wrapper {
      margin-bottom: var(--space-4);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-gray-500, #64748b);
      background-color: rgba(0, 0, 0, 0.04);
      padding: 3px 8px;
      border-radius: var(--radius-sm, 4px);
    }

    .trace-id {
      font-family: monospace;
      color: var(--color-gray-700, #334155);
      background: none;
      padding: 0;
    }
  `],
})
export class ErrorStateComponent {
  readonly title = input<string>('An Error Occurred');
  readonly message = input<string>('We were unable to complete your request. Please try again later.');
  readonly correlationId = input<string | null>(null);
  readonly retryable = input<boolean>(true);
  readonly retry = output<void>();
}
