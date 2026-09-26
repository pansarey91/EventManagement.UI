import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { AuthorizationService } from '../../core/services/authorization.service';
import { AppRole } from '../../core/models';

/**
 * Structural directive that conditionally renders an element based on the current user's roles.
 *
 * Usage:
 * - `<button *hasRole="'Admin'">Delete</button>`
 * - `<div *hasRole="['Organizer', 'Admin']">Organizer Tools</div>`
 * - `<div *hasRole="'Admin'; else unauthorizedTpl">Admin View</div>`
 */
@Directive({
  selector: '[hasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly auth = inject(AuthorizationService);

  private allowedRoles: string[] = [];
  private elseTemplateRef: TemplateRef<unknown> | null = null;
  private hasView = false;
  private hasElseView = false;

  constructor() {
    // React to changes in roles or authentication status reactively
    effect(() => {
      // Access the reactive signal to track changes
      this.auth.roles();
      this.updateView();
    });
  }

  @Input()
  set hasRole(roles: (AppRole | string)[] | AppRole | string | null | undefined) {
    if (!roles) {
      this.allowedRoles = [];
    } else if (Array.isArray(roles)) {
      this.allowedRoles = roles.map((r) => String(r).trim());
    } else {
      this.allowedRoles = [String(roles).trim()];
    }
    this.updateView();
  }

  @Input()
  set hasRoleElse(template: TemplateRef<unknown> | null) {
    this.elseTemplateRef = template;
    this.updateView();
  }

  private updateView(): void {
    const isAuthorized =
      this.allowedRoles.length === 0
        ? this.auth.isAuthenticated()
        : this.auth.hasAnyRole(this.allowedRoles);

    if (isAuthorized) {
      if (!this.hasView) {
        this.viewContainer.clear();
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
        this.hasElseView = false;
      }
    } else {
      if (this.elseTemplateRef) {
        if (!this.hasElseView) {
          this.viewContainer.clear();
          this.viewContainer.createEmbeddedView(this.elseTemplateRef);
          this.hasView = false;
          this.hasElseView = true;
        }
      } else {
        this.viewContainer.clear();
        this.hasView = false;
        this.hasElseView = false;
      }
    }
  }
}
