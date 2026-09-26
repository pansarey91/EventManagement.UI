import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container auth-container">
      <div class="card auth-card">
        <div class="card-header">
          <h2>Create Account</h2>
          <p>Join EventSync to register for conferences, concerts, workshops, and more.</p>
        </div>

        <div class="card-body">
          @if (errorMessage()) {
            <div class="alert alert-error auth-error-banner" role="alert" aria-live="assertive">
              <span class="alert-icon" aria-hidden="true">⚠️</span>
              <span class="alert-message">{{ errorMessage() }}</span>
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
                  placeholder="Jane"
                  autocomplete="given-name"
                />
                @if (firstName?.invalid && firstName?.touched) {
                  <span class="form-error">First name is required.</span>
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
                  placeholder="Doe"
                  autocomplete="family-name"
                />
                @if (lastName?.invalid && lastName?.touched) {
                  <span class="form-error">Last name is required.</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="reg-email" class="form-label required">Email Address</label>
              <input
                id="reg-email"
                type="email"
                class="form-control"
                [class.is-invalid]="email?.invalid && email?.touched"
                formControlName="email"
                placeholder="jane.doe@example.com"
                autocomplete="email"
              />
              @if (email?.invalid && email?.touched) {
                <span class="form-error">Please enter a valid email address.</span>
              }
            </div>

            <div class="form-group">
              <label for="phoneNumber" class="form-label">Phone Number (Optional)</label>
              <input
                id="phoneNumber"
                type="tel"
                class="form-control"
                formControlName="phoneNumber"
                placeholder="+1 555-0199"
                autocomplete="tel"
              />
            </div>

            <div class="form-group">
              <label for="reg-password" class="form-label required">Password</label>
              <div class="password-input-wrapper">
                <input
                  id="reg-password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="password?.invalid && password?.touched"
                  formControlName="password"
                  placeholder="At least 8 characters (e.g. Pass@123)"
                  autocomplete="new-password"
                />
                <button
                  type="button"
                  class="password-toggle-btn"
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  (click)="togglePasswordVisibility()"
                >
                  <span aria-hidden="true">{{ showPassword() ? '🙈' : '👁️' }}</span>
                </button>
              </div>
              <span class="form-hint">Must be 8+ characters with uppercase (A-Z), lowercase (a-z), digit (0-9), and special symbol.</span>
              @if (password?.invalid && password?.touched) {
                @if (password?.errors?.['required']) {
                  <span class="form-error">Password is required.</span>
                } @else {
                  <span class="form-error">Password must be at least 8 characters and include uppercase, lowercase, digit, and special character.</span>
                }
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Creating account...</span>
              } @else {
                <span>Create Account</span>
              }
            </button>
          </form>
        </div>

        <div class="card-footer text-center">
          <p class="footer-text">
            Already have an account?
            <a routerLink="/login">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      padding-top: var(--space-6);
    }

    .auth-card {
      width: 100%;
      max-width: 500px;
    }

    .auth-error-banner {
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

    .alert-message {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
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

    .btn-block {
      width: 100%;
      margin-top: var(--space-2);
    }

    .text-center {
      text-align: center;
    }

    .footer-text {
      margin: 0;
      font-size: var(--font-size-sm);
    }

    @media (max-width: 480px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly feedbackService = inject(UiFeedbackService);
  private readonly router = inject(Router);

  readonly loading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', [Validators.required, Validators.maxLength(50)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/),
      ],
    ],
    phoneNumber: ['', [Validators.maxLength(25)]],
  });

  get firstName() { return this.form.get('firstName'); }
  get lastName() { return this.form.get('lastName'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.loading.set(true);
    const dto = this.form.getRawValue();

    this.authService.register({
      firstName: dto.firstName!,
      lastName: dto.lastName!,
      email: dto.email!,
      password: dto.password!,
      phoneNumber: dto.phoneNumber || undefined,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.feedbackService.showSuccess(`Welcome to EventSync, ${res.user?.firstName}!`);
        this.router.navigate(['/events']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'Registration failed. Please check your details and try again.');
      },
    });
  }
}
