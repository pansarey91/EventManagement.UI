import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { AlertsComponent } from '../alerts/alerts.component';
import { BreadcrumbsComponent } from '../breadcrumbs/breadcrumbs.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    AlertsComponent,
    BreadcrumbsComponent,
    LoadingSpinnerComponent,
  ],
  template: `
    <!-- Accessible Skip Link -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Global Loading Overlay -->
    @if (loadingService.isLoading()) {
      <app-loading-spinner [overlay]="true" [message]="loadingService.message()" />
    }

    <!-- Sticky Top Header -->
    <app-header (toggleSidebar)="toggleSidebar()" />

    <!-- Application Shell Body -->
    <div class="layout-container">
      <!-- Role-Aware Navigation Sidebar -->
      <app-sidebar [isOpen]="sidebarOpen()" (close)="closeSidebar()" />

      <!-- Main Shell Content Area -->
      <div class="main-shell">
        <!-- Dynamic Breadcrumb Trail -->
        <app-breadcrumbs />

        <!-- Notification Toast Messages -->
        <app-alerts />

        <!-- Accessible Main Landmark -->
        <main id="main-content" class="main-content" tabindex="-1">
          <router-outlet />
        </main>

        <!-- Footer -->
        <app-footer />
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    .layout-container {
      display: flex;
      flex: 1;
      position: relative;
    }

    .main-shell {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      min-width: 0;
      transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .main-content {
      flex: 1;
      padding-top: var(--space-6);
      padding-bottom: var(--space-10);
      outline: none;
    }

    /* Desktop Viewport >= 1024px: Sidebar is docked */
    @media (min-width: 1024px) {
      .main-shell {
        margin-left: 260px;
      }
    }
  `],
})
export class MainLayoutComponent {
  readonly loadingService = inject(LoadingService);
  readonly sidebarOpen = signal<boolean>(false);

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
