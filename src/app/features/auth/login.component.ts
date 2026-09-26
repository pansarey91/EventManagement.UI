import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthorizationService } from '../../core/services/authorization.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="container auth-container">
      <div class="card auth-card">
        <div class="card-header">
          <h2>Welcome Back</h2>
          <p>Sign in to your EventSync account to manage and discover events.</p>
        </div>

        <div class="card-body">
          @if (errorMessage()) {
            <div class="alert alert-error auth-error-banner" role="alert" aria-live="assertive">
              <span class="alert-icon" aria-hidden="true">⚠️</span>
              <span class="alert-message">{{ errorMessage() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
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
              @if (email?.invalid && email?.touched) {
                <span class="form-error">Please provide a valid email address.</span>
              }
            </div>

            <div class="form-group">
              <label for="password" class="form-label required">Password</label>
              <div class="password-input-wrapper">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  class="form-control"
                  [class.is-invalid]="password?.invalid && password?.touched"
                  formControlName="password"
                  placeholder="••••••••"
                  autocomplete="current-password"
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
              @if (password?.invalid && password?.touched) {
                <span class="form-error">Password is required.</span>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <span class="spinner" aria-hidden="true"></span>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
              }
            </button>
          </form>
        </div>

        <div class="card-footer text-center">
          <p class="footer-text">
            Don't have an account yet?
            <a routerLink="/register">Create an account</a>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      padding-top: var(--space-8);
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
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
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly authzService = inject(AuthorizationService);
  private readonly feedbackService = inject(UiFeedbackService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal<boolean>(false);
  readonly showPassword = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get email() {
    return this.form.get('email');
  }

  get password() {
    return this.form.get('password');
  }

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

    this.authService.login({
      email: dto.email!,
      password: dto.password!,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.feedbackService.showSuccess(`Welcome back, ${res.user?.firstName || 'User'}!`);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || this.authzService.getLandingRoute();
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.message || 'Invalid email or password. Please try again.');
      },
    });
  }
}
