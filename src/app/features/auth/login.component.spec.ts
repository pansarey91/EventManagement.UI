import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthorizationService } from '../../core/services/authorization.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { AuthResponseDto } from '../../core/models';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authServiceMock: {
    login: ReturnType<typeof vi.fn>;
  };
  let feedbackServiceMock: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'test-token',
    tokenType: 'Bearer',
    expiresAt: new Date().toISOString(),
    roles: ['Attendee'],
    user: {
      id: 'u1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isActive: true,
      roles: ['Attendee'],
    },
  };

  beforeEach(async () => {
    authServiceMock = {
      login: vi.fn(),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: AuthorizationService,
          useValue: { getLandingRoute: vi.fn().mockReturnValue('/events') },
        },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: { returnUrl: '/profile' },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should initialize with invalid empty form and showPassword false', () => {
    expect(component.form.valid).toBe(false);
    expect(component.showPassword()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword()).toBe(false);
  });

  it('should mark fields touched and not call authService on empty submit', () => {
    component.onSubmit();
    expect(component.form.touched).toBe(true);
    expect(authServiceMock.login).not.toHaveBeenCalled();
  });

  it('should call authService.login, notify success, and navigate to returnUrl on successful login', () => {
    authServiceMock.login.mockReturnValue(of(mockAuthResponse));

    component.form.setValue({
      email: 'john@example.com',
      password: 'ValidPassword123!',
    });

    component.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: 'john@example.com',
      password: 'ValidPassword123!',
    });
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith('Welcome back, John!');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/profile');
    expect(component.loading()).toBe(false);
  });

  it('should set inline errorMessage banner when login fails', () => {
    authServiceMock.login.mockReturnValue(
      throwError(() => ({ message: 'Invalid email or password.' }))
    );

    component.form.setValue({
      email: 'john@example.com',
      password: 'WrongPassword!',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('Invalid email or password.');
    expect(component.loading()).toBe(false);
  });
});
