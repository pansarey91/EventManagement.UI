import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container not-found-container">
      <div class="empty-state">
        <div class="empty-state-icon" aria-hidden="true">🔍</div>
        <h1 class="empty-state-title">Page Not Found (404)</h1>
        <p class="empty-state-desc">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <a routerLink="/events" class="btn btn-primary">Back to Discover Events</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      max-width: 600px;
      padding-top: var(--space-12);
    }
  `],
})
export class NotFoundComponent {}
