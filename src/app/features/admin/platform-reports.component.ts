import { Component } from '@angular/core';

@Component({
  selector: 'app-platform-reports',
  standalone: true,
  template: `
    <div class="container">
      <header class="page-header">
        <h1>Platform Reports & Analytics</h1>
        <p>Comprehensive revenue breakdown, registrations trends, and attendance rates.</p>
      </header>

      <div class="card">
        <div class="card-body">
          <p>Reports and metrics charts connected to <code>GET /api/reports/...</code>.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: var(--space-6); }
  `],
})
export class PlatformReportsComponent {}
