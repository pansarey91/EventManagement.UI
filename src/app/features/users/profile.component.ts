import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { UserProfileDto } from '../../core/models';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner.component';
import { ErrorStateComponent } from '../../shared/components/error-state.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    LoadingSpinnerComponent,
    ErrorStateComponent,
  ],
  template: `
    <div class="container profile-page">
      <div class="page-title-section">
        <h1>My Account</h1>
        <p class="subtitle">Manage your personal details, credentials, and account settings.</p>
      </div>

      @if (loading()) {
        <app-loading-spinner message="Loading your profile..."></app-loading-spinner>
      } @else if (loadError()) {
        <app-error-state
          title="Unable to Load Profile"
          [message]="loadError()!"
          (retry)="loadProfile()"
        ></app-error-state>
      } @else if (profile(); as user) {
        <div class="profile-grid">
          <!-- Left Column: User Overview Card -->
          <div class="overview-column">
            <div class="card user-summary-card">
              <div class="avatar-header">
                <div class="avatar-large" aria-hidden="true">
                  {{ user.firstName.charAt(0).toUpperCase() }}
                </div>
                <h2 class="user-display-name">{{ user.firstName }} {{ user.lastName }}</h2>
                <span class="user-email-text">{{ user.email }}</span>
              </div>

              <div class="summary-divider"></div>

              <div class="meta-section">
                <div class="meta-row">
                  <span class="meta-label">Account Status</span>
                  <span
                    class="badge"
                    [class.badge-confirmed]="user.isActive"
                    [class.badge-failed]="!user.isActive"
                  >
                    {{ user.isActive ? 'Active' : 'Deactivated' }}
                  </span>
                </div>

                <div class="meta-row">
                  <span class="meta-label">Assigned Roles</span>
                  <div class="roles-container">
                    @for (role of user.roles; track role) {
                      <span class="badge badge-published">{{ role }}</span>
                    }
                  </div>
                </div>

                <div class="meta-row">
                  <span class="meta-label">Member Since</span>
                  <span class="meta-value">{{ user.createdAt | date: 'mediumDate' }}</span>
                </div>

                @if (user.updatedAt) {
                  <div class="meta-row">
                    <span class="meta-label">Last Updated</span>
                    <span class="meta-value">{{ user.updatedAt | date: 'mediumDate' }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Security Quick Action Card -->
            <div class="card security-summary-card">
              <div class="card-header">
                <h3>Security</h3>
              </div>
              <div class="card-body">
                <p class="security-text">
                  Update your password regularly to keep your event organizer and attendee data secure.
                </p>
                <a routerLink="/profile/change-password" class="btn btn-outline btn-block">
                  <span aria-hidden="true">🔒</span>
                  <span>Change Password</span>
                </a>
              </div>
            </div>
          </div>

          <!-- Right Column: Edit Profile Form -->
          <div class="form-column">
            <div class="card">
              <div class="card-header">
                <h2>Edit Personal Information</h2>
                <p class="card-subtitle">Keep your contact information current for event notifications.</p>
              </div>

              <div class="card-body">
                @if (saveSuccess()) {
                  <div class="alert alert-success profile-alert" role="status" aria-live="polite">
                    <span class="alert-icon" aria-hidden="true">✓</span>
                    <span>{{ saveSuccess() }}</span>
                  </div>
                }

                @if (saveError()) {
                  <div class="alert alert-error profile-alert" role="alert" aria-live="assertive">
                    <span class="alert-icon" aria-hidden="true">⚠️</span>
                    <span>{{ saveError() }}</span>
                  </div>
                }

                <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
                  <div class="form-row">
                    <div class="form-group">
                      <label for="firstName" class="form-label required">First Name</label>
                      <input
                        id="firstName"
                        type="text"
                        class="form-control"
                        [class.is-invalid]="firstName?.invalid && firstName?.touched"
                        formControlName="firstName"
                        placeholder="First name"
                        autocomplete="given-name"
                      />
                      @if (firstName?.invalid && firstName?.touched) {
                        @if (firstName?.errors?.['required']) {
                          <span class="form-error">First name is required.</span>
                        } @else if (firstName?.errors?.['maxlength']) {
                          <span class="form-error">First name cannot exceed 50 characters.</span>
                        }
                      }
                    </div>

                    <div class="form-group">
                      <label for="lastName" class="form-label required">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        class="form-control"
                        [class.is-invalid]="lastName?.invalid && lastName?.touched"
                        formControlName="lastName"
                        placeholder="Last name"
                        autocomplete="family-name"
                      />
                      @if (lastName?.invalid && lastName?.touched) {
                        @if (lastName?.errors?.['required']) {
                          <span class="form-error">Last name is required.</span>
                        } @else if (lastName?.errors?.['maxlength']) {
                          <span class="form-error">Last name cannot exceed 50 characters.</span>
                        }
                      }
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="email" class="form-label required">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      class="form-control"
                      [class.is-invalid]="email?.invalid && email?.touched"
                      formControlName="email"
                      placeholder="you@example.com"
                      autocomplete="email"
                    />
                    <span class="form-hint">Used for sign-in and receiving event registrations and ticket confirmations.</span>
                    @if (email?.invalid && email?.touched) {
                      @if (email?.errors?.['required']) {
                        <span class="form-error">Email is required.</span>
                      } @else if (email?.errors?.['email']) {
                        <span class="form-error">Please enter a valid email address.</span>
                      } @else if (email?.errors?.['maxlength']) {
                        <span class="form-error">Email cannot exceed 100 characters.</span>
                      }
                    }
                  </div>

                  <div class="form-group">
                    <label for="phoneNumber" class="form-label">Phone Number (Optional)</label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      class="form-control"
                      [class.is-invalid]="phoneNumber?.invalid && phoneNumber?.touched"
                      formControlName="phoneNumber"
                      placeholder="+1 555-0199"
                      autocomplete="tel"
                    />
                    @if (phoneNumber?.invalid && phoneNumber?.touched) {
                      <span class="form-error">Phone number cannot exceed 25 characters.</span>
                    }
                  </div>

                  <div class="form-actions">
                    <button
                      type="button"
                      class="btn btn-secondary"
                      [disabled]="saving() || !form.dirty"
                      (click)="resetForm()"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      class="btn btn-primary"
                      [disabled]="form.invalid || saving() || !form.dirty"
                    >
                      @if (saving()) {
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Saving...</span>
                      } @else {
                        <span>Save Changes</span>
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      padding-top: var(--space-4);
      padding-bottom: var(--space-8);
    }

    .page-title-section {
      margin-bottom: var(--space-6);
    }

    .page-title-section h1 {
      margin-bottom: var(--space-1);
    }

    .subtitle {
      color: var(--color-gray-600);
      margin: 0;
      font-size: var(--font-size-base);
    }

    .profile-grid {
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: var(--space-6);
      align-items: start;
    }

    .overview-column {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .user-summary-card {
      padding: var(--space-5);
    }

    .avatar-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .avatar-large {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-full);
      background-color: var(--color-primary-600);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: var(--font-weight-bold);
      margin-bottom: var(--space-3);
      box-shadow: var(--shadow-sm);
    }

    .user-display-name {
      font-size: var(--font-size-lg);
      margin-bottom: 2px;
    }

    .user-email-text {
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
      word-break: break-all;
    }

    .summary-divider {
      height: 1px;
      background-color: var(--border-color);
      margin: var(--space-4) 0;
    }

    .meta-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm);
    }

    .meta-label {
      color: var(--color-gray-600);
      font-weight: var(--font-weight-medium);
    }

    .meta-value {
      color: var(--color-gray-900);
      font-weight: var(--font-weight-semibold);
    }

    .roles-container {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .security-summary-card .card-body {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .security-text {
      font-size: var(--font-size-sm);
      color: var(--color-gray-600);
      margin: 0;
      line-height: 1.4;
    }

    .card-subtitle {
      color: var(--color-gray-500);
      font-size: var(--font-size-sm);
      margin: 0;
      margin-top: 2px;
    }

    .profile-alert {
      margin-bottom: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      border-radius: var(--radius-md);
    }

    .alert-icon {
      font-size: 1.1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .btn-block {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }

    @media (max-width: 900px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 500px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `],
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly feedbackService = inject(UiFeedbackService);

  readonly profile = signal<UserProfileDto | null>(null);
  readonly loading = signal<boolean>(true);
  readonly saving = signal<boolean>(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    phoneNumber: ['', [Validators.maxLength(25)]],
  });

  get firstName() { return this.form.get('firstName'); }
  get lastName() { return this.form.get('lastName'); }
  get email() { return this.form.get('email'); }
  get phoneNumber() { return this.form.get('phoneNumber'); }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.userService.getMyProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.populateForm(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.message || 'Failed to load user profile. Please try again.');
      },
    });
  }

  populateForm(data: UserProfileDto): void {
    this.form.reset({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber || '',
    });
  }

  resetForm(): void {
    const current = this.profile();
    if (current) {
      this.populateForm(current);
      this.saveError.set(null);
      this.saveSuccess.set(null);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(null);

    const formValues = this.form.getRawValue();

    this.userService.updateMyProfile({
      firstName: formValues.firstName!.trim(),
      lastName: formValues.lastName!.trim(),
      email: formValues.email!.trim().toLowerCase(),
      phoneNumber: formValues.phoneNumber ? formValues.phoneNumber.trim() : null,
    }).subscribe({
      next: (updatedProfile) => {
        this.saving.set(false);
        this.profile.set(updatedProfile);
        this.populateForm(updatedProfile);
        this.saveSuccess.set('Your profile has been successfully updated.');
        this.feedbackService.showSuccess('Profile updated successfully.');

        // Synchronize auth state so header and sidebar update display immediately
        this.authService.updateCurrentUser({
          id: updatedProfile.id,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          email: updatedProfile.email,
          phoneNumber: updatedProfile.phoneNumber,
          roles: updatedProfile.roles,
          isActive: updatedProfile.isActive,
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set(err?.message || 'Failed to update profile. Please verify your entries.');
      },
    });
  }
}
