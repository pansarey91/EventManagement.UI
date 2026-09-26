import { Component, inject } from '@angular/core';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  template: `
    <div class="alerts-container" aria-live="polite" aria-atomic="true">
      @for (alert of feedbackService.alerts(); track alert.id) {
        <div class="alert alert-{{ alert.type }}" role="alert">
          <div class="alert-content">
            @if (alert.title) {
              <strong>{{ alert.title }}: </strong>
            }
            <span>{{ alert.message }}</span>
          </div>
          <button
            type="button"
            class="alert-close"
            aria-label="Dismiss notification"
            (click)="feedbackService.dismissAlert(alert.id)"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .alert-content {
      flex: 1;
    }
  `],
})
export class AlertsComponent {
  readonly feedbackService = inject(UiFeedbackService);
}
