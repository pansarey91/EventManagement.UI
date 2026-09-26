import {
  Component,
  HostListener,
  input,
  output,
  ElementRef,
  viewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div
        class="confirm-backdrop"
        (click)="onBackdropClick($event)"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
      >
        <div class="confirm-dialog card" (click)="$event.stopPropagation()">
          <header class="confirm-header">
            <div class="confirm-icon" aria-hidden="true">
              @if (confirmVariant() === 'danger') {
                ⚠️
              } @else if (confirmVariant() === 'warning') {
                ⚡
              } @else {
                ❓
              }
            </div>
            <h2 id="confirm-dialog-title" class="confirm-title">{{ title() }}</h2>
            <button
              type="button"
              class="confirm-close-btn"
              (click)="onCancel()"
              [disabled]="loading()"
              aria-label="Close dialog"
            >
              ✕
            </button>
          </header>

          <div class="confirm-body">
            <p id="confirm-dialog-desc" class="confirm-message">{{ message() }}</p>
          </div>

          <footer class="confirm-footer">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              (click)="onCancel()"
              [disabled]="loading()"
            >
              {{ cancelLabel() }}
            </button>

            <button
              #confirmButton
              type="button"
              class="btn btn-sm"
              [ngClass]="getButtonClass()"
              (click)="onConfirm()"
              [disabled]="loading()"
              [attr.aria-busy]="loading()"
            >
              @if (loading()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                <span>Processing...</span>
              } @else {
                {{ confirmLabel() }}
              }
            </button>
          </footer>
        </div>
      </div>
    }
  `,
  styles: [`
    .confirm-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1050;
      padding: var(--space-4);
      animation: fadeIn 0.15s ease-out;
    }

    .confirm-dialog {
      width: 100%;
      max-width: 440px;
      background: var(--color-white, #ffffff);
      border-radius: var(--radius-lg, 12px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      animation: scaleUp 0.15s ease-out;
    }

    .confirm-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-gray-100, #f1f5f9);
    }

    .confirm-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .confirm-title {
      flex: 1;
      font-size: var(--font-size-base, 1rem);
      font-weight: var(--font-weight-bold, 700);
      color: var(--color-gray-900, #0f172a);
      margin: 0;
    }

    .confirm-close-btn {
      background: none;
      border: none;
      font-size: 1.125rem;
      color: var(--color-gray-400, #94a3b8);
      cursor: pointer;
      padding: var(--space-1);
      border-radius: var(--radius-sm);
      line-height: 1;
    }

    .confirm-close-btn:hover:not(:disabled) {
      color: var(--color-gray-700, #334155);
    }

    .confirm-body {
      padding: var(--space-6);
    }

    .confirm-message {
      margin: 0;
      color: var(--color-gray-600, #475569);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: 1.5;
    }

    .confirm-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-6);
      background-color: var(--color-gray-50, #f8fafc);
      border-top: 1px solid var(--color-gray-100, #f1f5f9);
    }

    .btn-spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: #ffffff;
      animation: spin 0.8s linear infinite;
      margin-right: 6px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `],
})
export class ConfirmDialogComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('Confirm Action');
  readonly message = input<string>('Are you sure you want to proceed? This action cannot be undone.');
  readonly confirmLabel = input<string>('Confirm');
  readonly cancelLabel = input<string>('Cancel');
  readonly confirmVariant = input<'danger' | 'warning' | 'primary'>('danger');
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly confirmButton = viewChild<ElementRef<HTMLButtonElement>>('confirmButton');

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        // Focus the confirm button when opened
        setTimeout(() => this.confirmButton()?.nativeElement?.focus(), 50);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && !this.loading()) {
      this.onCancel();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('confirm-backdrop') && !this.loading()) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    if (!this.loading()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.loading()) {
      this.cancelled.emit();
    }
  }

  getButtonClass(): string {
    switch (this.confirmVariant()) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'primary':
      default:
        return 'btn-primary';
    }
  }
}
