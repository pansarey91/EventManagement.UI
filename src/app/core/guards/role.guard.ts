import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthorizationService } from '../services/authorization.service';
import { AppRole } from '../models';

/**
 * Functional guard factory ensuring the user is authenticated and possesses
 * at least one of the required roles to activate the route.
 *
 * Can be used as a factory: `canActivate: [roleGuard(['Admin'])]`
 * or as a standalone guard reading `route.data['roles']`: `canActivate: [roleGuard()]`
 *
 * Redirect behavior:
 * - Unauthenticated -> `/login` with `returnUrl` query parameter.
 * - Authenticated but unauthorized -> `/forbidden` (403 page).
 */
export function roleGuard(roles?: (AppRole | string)[]): CanActivateFn {
  return (route, state) => {
    const auth = inject(AuthorizationService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const requiredRoles = roles ?? (route.data?.['roles'] as string[]) ?? [];

    // If no roles specified, authenticated access is sufficient
    if (requiredRoles.length === 0) {
      return true;
    }

    if (auth.hasAnyRole(requiredRoles)) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
}
