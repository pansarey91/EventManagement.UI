import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthorizationService } from '../../core/services/authorization.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container forbidden-container">
      <div class="card forbidden-card" role="region" aria-labelledby="forbidden-heading">
        <div class="card-body text-center">
          <div class="forbidden-icon" aria-hidden="true">🛡️</div>
          <span class="status-code">403 Forbidden</span>
          <h1 id="forbidden-heading">Access Denied</h1>
          <p class="description">
            You do not have the required permissions or roles to view this page.
            If you believe this is an error, please contact your event or platform administrator.
          </p>

          <div class="action-buttons">
            <a routerLink="/events" class="btn btn-primary">
              <span aria-hidden="true">📅</span>
              <span>Browse Events</span>
            </a>

            @if (auth.isAdmin()) {
              <a routerLink="/admin/dashboard" class="btn btn-outline">
                <span aria-hidden="true">⚙️</span>
                <span>Admin Center</span>
              </a>
            } @else if (auth.isOrganizer()) {
              <a routerLink="/organizer/dashboard" class="btn btn-outline">
                <span aria-hidden="true">📊</span>
                <span>Organizer Hub</span>
              </a>
            }

            <a routerLink="/profile" class="btn btn-secondary">
              <span aria-hidden="true">👤</span>
              <span>My Profile</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forbidden-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 65vh;
      padding: var(--space-6) var(--space-4);
    }

    .forbidden-card {
      max-width: 520px;
      width: 100%;
      padding: var(--space-6);
      box-shadow: var(--shadow-md);
    }

    .forbidden-icon {
      font-size: 3.5rem;
      margin-bottom: var(--space-3);
    }

    .status-code {
      display: inline-block;
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-error-accent);
      background-color: var(--color-error-bg);
      border: 1px solid var(--color-error-border);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      margin-bottom: var(--space-2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    h1 {
      font-size: var(--font-size-2xl);
      margin-bottom: var(--space-2);
      color: var(--color-gray-900);
    }

    .description {
      color: var(--color-gray-600);
      font-size: var(--font-size-sm);
      line-height: 1.5;
      margin-bottom: var(--space-6);
    }

    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-3);
    }

    .action-buttons .btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }

    @media (max-width: 480px) {
      .action-buttons {
        flex-direction: column;
      }

      .action-buttons .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `],
})
export class ForbiddenComponent {
  readonly auth = inject(AuthorizationService);
}
