import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'events',
      },
      // Public Routes
      {
        path: 'events',
        data: { breadcrumb: 'Discover Events' },
        loadComponent: () =>
          import('./features/events/events-list.component').then((m) => m.EventsListComponent),
        title: 'Discover Events - EventSync',
      },
      {
        path: 'events/:id',
        data: { breadcrumb: 'Event Details' },
        loadComponent: () =>
          import('./features/events/event-detail.component').then((m) => m.EventDetailComponent),
        title: 'Event Details - EventSync',
      },
      {
        path: 'login',
        canActivate: [guestGuard],
        data: { breadcrumb: 'Sign In' },
        loadComponent: () =>
          import('./features/auth/login.component').then((m) => m.LoginComponent),
        title: 'Sign In - EventSync',
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        data: { breadcrumb: 'Sign Up' },
        loadComponent: () =>
          import('./features/auth/register.component').then((m) => m.RegisterComponent),
        title: 'Create Account - EventSync',
      },

      // Authenticated User / Attendee Routes
      {
        path: 'profile',
        canActivate: [authGuard],
        data: { breadcrumb: 'My Profile' },
        loadComponent: () =>
          import('./features/users/profile.component').then((m) => m.ProfileComponent),
        title: 'My Profile - EventSync',
      },
      {
        path: 'profile/change-password',
        canActivate: [authGuard],
        data: { breadcrumb: 'Change Password' },
        loadComponent: () =>
          import('./features/users/change-password.component').then((m) => m.ChangePasswordComponent),
        title: 'Change Password - EventSync',
      },
      {
        path: 'my-registrations',
        canActivate: [authGuard],
        data: { breadcrumb: 'My Registrations' },
        loadComponent: () =>
          import('./features/registrations/my-registrations.component').then(
            (m) => m.MyRegistrationsComponent
          ),
        title: 'My Registrations - EventSync',
      },
      {
        path: 'my-registrations/:id',
        canActivate: [authGuard],
        data: { breadcrumb: 'Registration Details' },
        loadComponent: () =>
          import('./features/registrations/registration-detail.component').then(
            (m) => m.RegistrationDetailComponent
          ),
        title: 'Registration Details - EventSync',
      },
      {
        path: 'registrations/:registrationId/payment',
        canActivate: [authGuard],
        data: { breadcrumb: 'Payment' },
        loadComponent: () =>
          import('./features/payments/payment-page.component').then(
            (m) => m.PaymentPageComponent
          ),
        title: 'Complete Payment - EventSync',
      },
      {
        path: 'tickets',
        pathMatch: 'full',
        redirectTo: 'my-tickets',
      },
      {
        path: 'my-tickets',
        canActivate: [authGuard],
        data: { breadcrumb: 'My Tickets' },
        loadComponent: () =>
          import('./features/tickets/my-tickets.component').then(
            (m) => m.MyTicketsComponent
          ),
        title: 'My Tickets - EventSync',
      },
      {
        path: 'tickets/:id',
        canActivate: [authGuard],
        data: { breadcrumb: 'Ticket Pass' },
        loadComponent: () =>
          import('./features/tickets/ticket-detail.component').then(
            (m) => m.TicketDetailComponent
          ),
        title: 'Ticket Pass - EventSync',
      },
      {
        path: 'my-feedback',
        canActivate: [authGuard],
        data: { breadcrumb: 'My Reviews' },
        loadComponent: () =>
          import('./features/feedback/my-feedback.component').then(
            (m) => m.MyFeedbackComponent
          ),
        title: 'My Reviews & Feedback - EventSync',
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        data: { breadcrumb: 'Notifications' },
        loadComponent: () =>
          import('./features/notifications/notification-center.component').then(
            (m) => m.NotificationCenterComponent
          ),
        title: 'Notification Center - EventSync',
      },

      // Organizer Workspace Routes
      {
        path: 'organizer/dashboard',
        canActivate: [roleGuard(['Organizer', 'Admin'])],
        data: { breadcrumb: 'Organizer Hub' },
        loadComponent: () =>
          import('./features/dashboard/organizer-dashboard.component').then(
            (m) => m.OrganizerDashboardComponent
          ),
        title: 'Organizer Hub - EventSync',
      },
      {
        path: 'organizer/events',
        canActivate: [roleGuard(['Organizer', 'Admin'])],
        data: { breadcrumb: 'Manage Events' },
        loadComponent: () =>
          import('./features/events/organizer-events.component').then(
            (m) => m.OrganizerEventsComponent
          ),
        title: 'Manage Events - EventSync',
      },
      {
        path: 'organizer/events/create',
        canActivate: [roleGuard(['Organizer', 'Admin'])],
        data: { breadcrumb: 'Create Event' },
        loadComponent: () =>
          import('./features/events/event-create.component').then(
            (m) => m.EventCreateComponent
          ),
        title: 'Create Event - EventSync',
      },
      {
        path: 'organizer/events/:id/edit',
        canActivate: [roleGuard(['Organizer', 'Admin'])],
        data: { breadcrumb: 'Edit Event' },
        loadComponent: () =>
          import('./features/events/event-create.component').then(
            (m) => m.EventCreateComponent
          ),
        title: 'Edit Event - EventSync',
      },
      {
        path: 'organizer/events/:eventId/ticket-types',
        canActivate: [roleGuard(['Organizer', 'Admin'])],
        data: { breadcrumb: 'Ticket Types' },
        loadComponent: () =>
          import('./features/tickets/organizer-ticket-types.component').then(
            (m) => m.OrganizerTicketTypesComponent
          ),
        title: 'Manage Ticket Types - EventSync',
      },
      {
        path: 'organizer/check-in',
        canActivate: [roleGuard(['Organizer', 'Staff', 'Admin'])],
        data: { breadcrumb: 'Check-In Scanner' },
        loadComponent: () =>
          import('./features/attendance/check-in-scanner.component').then(
            (m) => m.CheckInScannerComponent
          ),
        title: 'Check-In Scanner - EventSync',
      },
      {
        path: 'organizer/events/:eventId/check-in',
        canActivate: [roleGuard(['Organizer', 'Staff', 'Admin'])],
        data: { breadcrumb: 'Check-In Scanner' },
        loadComponent: () =>
          import('./features/attendance/check-in-scanner.component').then(
            (m) => m.CheckInScannerComponent
          ),
        title: 'Event Check-In - EventSync',
      },
      {
        path: 'organizer/events/:eventId/attendance',
        canActivate: [roleGuard(['Organizer', 'Staff', 'Admin'])],
        data: { breadcrumb: 'Attendance Roster' },
        loadComponent: () =>
          import('./features/attendance/attendance-list.component').then(
            (m) => m.AttendanceListComponent
          ),
        title: 'Attendance Roster - EventSync',
      },

      // Administrator Workspace Routes
      {
        path: 'admin/dashboard',
        canActivate: [roleGuard(['Admin'])],
        data: { breadcrumb: 'Admin Center' },
        loadComponent: () =>
          import('./features/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        title: 'Admin Center - EventSync',
      },
      {
        path: 'admin/users',
        canActivate: [roleGuard(['Admin'])],
        data: { breadcrumb: 'User Management' },
        loadComponent: () =>
          import('./features/admin/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
        title: 'User Management - EventSync',
      },
      {
        path: 'admin/roles',
        canActivate: [roleGuard(['Admin'])],
        data: { breadcrumb: 'Role Permissions' },
        loadComponent: () =>
          import('./features/admin/role-management.component').then(
            (m) => m.RoleManagementComponent
          ),
        title: 'Role Permissions - EventSync',
      },
      {
        path: 'admin/categories',
        canActivate: [roleGuard(['Admin'])],
        data: { breadcrumb: 'Event Categories' },
        loadComponent: () =>
          import('./features/admin/category-management.component').then(
            (m) => m.CategoryManagementComponent
          ),
        title: 'Event Categories - EventSync',
      },
      {
        path: 'admin/venues',
        canActivate: [roleGuard(['Admin'])],
        data: { breadcrumb: 'Venues' },
        loadComponent: () =>
          import('./features/admin/venue-management.component').then(
            (m) => m.VenueManagementComponent
          ),
        title: 'Venue Directory - EventSync',
      },
      {
        path: 'admin/reports',
        canActivate: [roleGuard(['Admin'])],
        data: { breadcrumb: 'Platform Reports' },
        loadComponent: () =>
          import('./features/admin/platform-reports.component').then(
            (m) => m.PlatformReportsComponent
          ),
        title: 'Platform Reports - EventSync',
      },

      // Error / Access Control Routes
      {
        path: 'forbidden',
        data: { breadcrumb: 'Access Denied' },
        loadComponent: () =>
          import('./shared/components/forbidden.component').then((m) => m.ForbiddenComponent),
        title: 'Access Denied - EventSync',
      },

      // 404 Wildcard
      {
        path: 'not-found',
        data: { breadcrumb: 'Page Not Found' },
        loadComponent: () =>
          import('./shared/components/not-found.component').then((m) => m.NotFoundComponent),
        title: 'Page Not Found - EventSync',
      },
      {
        path: '**',
        redirectTo: 'not-found',
      },
    ],
  },
];
