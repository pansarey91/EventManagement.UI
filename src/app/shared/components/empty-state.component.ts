import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="empty-state">
      <div class="empty-state-icon" aria-hidden="true">{{ icon() }}</div>
      <h3 class="empty-state-title">{{ title() }}</h3>
      <p class="empty-state-desc">{{ message() }}</p>

      <div class="empty-state-actions">
        @if (actionRoute()) {
          <a [routerLink]="actionRoute()" class="btn btn-primary btn-sm">
            {{ actionLabel() }}
          </a>
        } @else if (actionLabel()) {
          <button type="button" class="btn btn-primary btn-sm" (click)="action.emit()">
            {{ actionLabel() }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .empty-state-actions {
      display: flex;
      justify-content: center;
      gap: var(--space-2);
    }
  `],
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input<string>('No Data Found');
  readonly message = input<string>('There are no items to display right now.');
  readonly actionLabel = input<string | null>(null);
  readonly actionRoute = input<string | null>(null);
  readonly action = output<void>();
}
