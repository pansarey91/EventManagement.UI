import { Component } from '@angular/core';

@Component({
  selector: 'app-role-management',
  standalone: true,
  template: `
    <div class="container">
      <header class="page-header">
        <h1>Role Permissions</h1>
        <p>Configure platform roles and permission boundaries.</p>
      </header>

      <div class="card">
        <div class="card-body">
          <p>Role management interface connected to <code>GET /api/roles</code>.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: var(--space-6); }
  `],
})
export class RoleManagementComponent {}
