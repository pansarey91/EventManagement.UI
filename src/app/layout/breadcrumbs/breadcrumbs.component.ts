import { Component, inject, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (breadcrumbs().length > 1) {
      <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
        <div class="container">
          <ol class="breadcrumbs-list">
            @for (item of breadcrumbs(); track item.url; let last = $last) {
              <li class="breadcrumbs-item" [class.is-current]="last">
                @if (!last) {
                  <a [routerLink]="item.url" class="breadcrumb-link">{{ item.label }}</a>
                  <span class="breadcrumb-separator" aria-hidden="true">/</span>
                } @else {
                  <span class="breadcrumb-current" aria-current="page">{{ item.label }}</span>
                }
              </li>
            }
          </ol>
        </div>
      </nav>
    }
  `,
  styles: [`
    .breadcrumbs-nav {
      background-color: var(--color-gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: var(--space-2) 0;
    }

    .breadcrumbs-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      list-style: none;
      margin: 0;
      padding: 0;
      font-size: var(--font-size-xs);
    }

    .breadcrumbs-item {
      display: inline-flex;
      align-items: center;
    }

    .breadcrumb-link {
      color: var(--color-gray-600);
      text-decoration: none;
      transition: color 0.15s ease;
    }

    .breadcrumb-link:hover {
      color: var(--color-primary-600);
      text-decoration: underline;
    }

    .breadcrumb-separator {
      margin: 0 var(--space-2);
      color: var(--color-gray-400);
      user-select: none;
    }

    .breadcrumb-current {
      color: var(--color-gray-900);
      font-weight: var(--font-weight-medium);
    }
  `],
})
export class BreadcrumbsComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private routerSub?: Subscription;

  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.routerSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateBreadcrumbs();
      });

    // Initial build with safe fallbacks
    this.updateBreadcrumbs();
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updateBreadcrumbs(): void {
    try {
      const crumbs: BreadcrumbItem[] = [
        { label: 'Home', url: '/' },
      ];

      let currentRoute: ActivatedRoute | null = this.route?.root ?? null;
      let accumulatedUrl = '';

      while (currentRoute) {
        const child: ActivatedRoute | null =
          currentRoute.firstChild ||
          (currentRoute.children && currentRoute.children.length > 0 ? currentRoute.children[0] : null);

        if (!child) break;

        const snapshot = child.snapshot;
        if (snapshot && Array.isArray(snapshot.url)) {
          const pathSegments = snapshot.url
            .map((s) => s?.path)
            .filter((p): p is string => Boolean(p));

          if (pathSegments.length > 0) {
            accumulatedUrl += `/${pathSegments.join('/')}`;
          }

          const breadcrumbLabel = snapshot.data ? snapshot.data['breadcrumb'] : undefined;
          if (breadcrumbLabel && typeof breadcrumbLabel === 'string') {
            // Prevent duplicate consecutive crumbs
            if (crumbs[crumbs.length - 1]?.label !== breadcrumbLabel) {
              crumbs.push({
                label: breadcrumbLabel,
                url: accumulatedUrl || '/',
              });
            }
          }
        }

        currentRoute = child;
      }

      this.breadcrumbs.set(crumbs);
    } catch {
      // In case route tree is in flux during early initialization, fallback gracefully
      this.breadcrumbs.set([{ label: 'Home', url: '/' }]);
    }
  }
}

