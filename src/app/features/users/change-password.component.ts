import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmNewPassword = control.get('confirmNewPassword');

  if (!newPassword || !confirmNewPassword) {
    return null;
  }

  if (confirmNewPassword.errors && !confirmNewPassword.errors['passwordMismatch']) {
    return null;
  }

  if (newPassword.value !== confirmNewPassword.value) {
    confirmNewPassword.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    confirmNewPassword.setErrors(null);
    return null;
  }
};

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container change-password-page">
      <div class="header-back-link">
        <a routerLink="/profile" class="back-link">
          <span aria-hidden="true">←</span>
          <span>Back to Profile</span>
        </a>
      </div>

      <div class="card change-password-card">
        <div class="card-header">
          <h1>Change Password</h1>
          <p class="subtitle">Update your password to keep your account secure.</p>
        </div>

        <div class="card-body">
          @if (successMessage()) {
            <div class="alert alert-success change-alert" role="status" aria-live="polite">
              <span class="alert-icon" aria-hidden="true">✓</span>
              <div class="alert-content">
                <strong>Success!</strong>
                <p>{{ successMessage() }}</p>
              </div>
            </div>
          }

          @if (errorMessage()) {
            <div class="alert alert-error change-alert" role="alert" aria-live="assertive">
              <span class="alert-icon" aria-hidden="true">⚠️</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <!-- Current Password -->
            <div class="form-group">
              <label for="currentPassword" class="form-label required">Current Password</label>
              <div class="password-input-wrapper">
                <input
                  id="currentPassword"
                  [type]="showCurrentPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="currentPassword?.invalid && currentPassword?.touched"
                  formControlName="currentPassword"
                  placeholder="Enter your current password"
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  [attr.aria-label]="showCurrentPassword() ? 'Hide current password' : 'Show current password'"
                  (click)="showCurrentPassword.set(!showCurrentPassword())"
                >
                  <span aria-hidden="true">{{ showCurrentPassword() ? '🙈' : '👁️' }}</span>
                </button>
              </div>
              @if (currentPassword?.invalid && currentPassword?.touched) {
                <span class="form-error">Current password is required.</span>
              }
            </div>

            <!-- New Password -->
            <div class="form-group">
              <label for="newPassword" class="form-label required">New Password</label>
              <div class="password-input-wrapper">
                <input
                  id="newPassword"
                  [type]="showNewPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="newPassword?.invalid && newPassword?.touched"
                  formControlName="newPassword"
                  placeholder="Enter a new strong password"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  [attr.aria-label]="showNewPassword() ? 'Hide new password' : 'Show new password'"
                  (click)="showNewPassword.set(!showNewPassword())"
                >
                  <span aria-hidden="true">{{ showNewPassword() ? '🙈' : '👁️' }}</span>
                </button>
              </div>
              <span class="form-hint">
                Must be at least 8 characters long and contain uppercase (A-Z), lowercase (a-z), digit (0-9), and special character.
              </span>
              @if (newPassword?.invalid && newPassword?.touched) {
                @if (newPassword?.errors?.['required']) {
                  <span class="form-error">New password is required.</span>
                } @else {
                  <span class="form-error">New password does not meet the security requirements.</span>
                }
              }
            </div>

            <!-- Confirm New Password -->
            <div class="form-group">
              <label for="confirmNewPassword" class="form-label required">Confirm New Password</label>
              <div class="password-input-wrapper">
                <input
                  id="confirmNewPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="confirmNewPassword?.invalid && confirmNewPassword?.touched"
                  formControlName="confirmNewPassword"
                  placeholder="Re-enter your new password"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  [attr.aria-label]="showConfirmPassword() ? 'Hide confirm password' : 'Show confirm password'"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                >
                  <span aria-hidden="true">{{ showConfirmPassword() ? '🙈' : '👁️' }}</span>
                </button>
              </div>
              @if (confirmNewPassword?.invalid && confirmNewPassword?.touched) {
                @if (confirmNewPassword?.errors?.['required']) {
                  <span class="form-error">Please confirm your new password.</span>
                } @else if (confirmNewPassword?.errors?.['passwordMismatch']) {
                  <span class="form-error">Confirmation does not match the new password.</span>
                }
              }
            </div>

            <div class="form-actions">
              <a routerLink="/profile" class="btn btn-secondary">
                Cancel
              </a>
              <button
                type="submit"
                class="btn btn-primary"
                [disabled]="form.invalid || saving()"
              >
                @if (saving()) {
                  <span class="spinner" aria-hidden="true"></span>
                  <span>Updating password...</span>
                } @else {
                  <span>Update Password</span>
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .change-password-page {
      max-width: 520px;
      padding-top: var(--space-4);
      padding-bottom: var(--space-8);
    }

    .header-back-link {
      margin-bottom: var(--space-4);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--color-gray-600);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      text-decoration: none;
    }

    .back-link:hover {
      color: var(--color-primary-600);
      text-decoration: underline;
    }

    .change-password-card h1 {
      font-size: var(--font-size-xl);
      margin-bottom: var(--space-1);
    }

    .subtitle {
      color: var(--color-gray-600);
      margin: 0;
      font-size: var(--font-size-sm);
    }

    .change-alert {
      margin-bottom: var(--space-4);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3);
      border-radius: var(--radius-md);
    }

    .alert-content p {
      margin: 0;
      font-size: var(--font-size-sm);
    }

    .alert-icon {
      font-size: 1.1rem;
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .password-input-wrapper .form-control {
      padding-right: 42px;
    }

    .password-toggle-btn {
      position: absolute;
      right: var(--space-2);
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--space-1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: var(--color-gray-500);
      border-radius: var(--radius-sm);
    }

    .password-toggle-btn:hover {
      color: var(--color-gray-800);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    @media (max-width: 480px) {
      .form-actions {
        flex-direction: column-reverse;
      }

      .form-actions button,
      .form-actions a {
        width: 100%;
        text-align: center;
      }
    }
  `],
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly feedbackService = inject(UiFeedbackService);

  readonly saving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly showCurrentPassword = signal<boolean>(false);
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);

  readonly form = this.fb.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/),
        ],
      ],
      confirmNewPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] }
  );

  get currentPassword() { return this.form.get('currentPassword'); }
  get newPassword() { return this.form.get('newPassword'); }
  get confirmNewPassword() { return this.form.get('confirmNewPassword'); }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const values = this.form.getRawValue();

    this.userService.changePassword({
      currentPassword: values.currentPassword!,
      newPassword: values.newPassword!,
      confirmNewPassword: values.confirmNewPassword!,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.form.reset();
        this.successMessage.set(res?.message || 'Password changed successfully.');
        this.feedbackService.showSuccess('Your password has been changed successfully.');
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.message || 'Failed to change password. Please verify your entries.');
      },
    });
  }
}
