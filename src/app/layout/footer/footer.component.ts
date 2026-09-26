import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="site-footer">
      <div class="container footer-inner">
        <p class="copyright">
          &copy; {{ currentYear }} EventSync Platform. All rights reserved.
        </p>
        <div class="footer-links">
          <span class="status-indicator" aria-label="API Status">
            <span class="status-dot" aria-hidden="true"></span>
            Backend Phase 0 Ready
          </span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-footer {
      background-color: #ffffff;
      border-top: 1px solid var(--border-color);
      padding: var(--space-6) 0;
      margin-top: auto;
    }

    .footer-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      text-align: center;
    }

    .copyright {
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
      margin: 0;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-gray-600);
      background-color: var(--color-gray-100);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full);
      background-color: var(--color-success-accent);
    }

    @media (min-width: 640px) {
      .footer-inner {
        flex-direction: row;
        justify-content: space-between;
      }
    }
  `],
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
