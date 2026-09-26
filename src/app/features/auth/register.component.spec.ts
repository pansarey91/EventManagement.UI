import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { AuthResponseDto } from '../../core/models';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authServiceMock: {
    register: ReturnType<typeof vi.fn>;
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
      id: 'u2',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      isActive: true,
      roles: ['Attendee'],
    },
  };

  beforeEach(async () => {
    authServiceMock = {
      register: vi.fn(),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockImplementation(() => Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should initialize with invalid empty form and showPassword false', () => {
    expect(component.form.valid).toBe(false);
    expect(component.showPassword()).toBe(false);
    expect(component.errorMessage()).toBeNull();
  });

  it('should validate password against backend complexity rules', () => {
    const passwordCtrl = component.form.get('password');

    // Missing uppercase
    passwordCtrl?.setValue('password123!');
    expect(passwordCtrl?.hasError('pattern')).toBe(true);

    // Missing lowercase
    passwordCtrl?.setValue('PASSWORD123!');
    expect(passwordCtrl?.hasError('pattern')).toBe(true);

    // Missing number
    passwordCtrl?.setValue('PasswordSymbol!');
    expect(passwordCtrl?.hasError('pattern')).toBe(true);

    // Missing special character
    passwordCtrl?.setValue('Password123');
    expect(passwordCtrl?.hasError('pattern')).toBe(true);

    // Less than 8 characters
    passwordCtrl?.setValue('Pass1!');
    expect(passwordCtrl?.hasError('minlength') || passwordCtrl?.hasError('pattern')).toBe(true);

    // Valid password
    passwordCtrl?.setValue('Pass@1234');
    expect(passwordCtrl?.valid).toBe(true);
  });

  it('should call authService.register and navigate on valid submit', () => {
    authServiceMock.register.mockReturnValue(of(mockAuthResponse));

    component.form.setValue({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'StrongPassword123!',
      phoneNumber: '+1234567890',
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'StrongPassword123!',
      phoneNumber: '+1234567890',
    });
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith('Welcome to EventSync, Alice!');
    expect(router.navigate).toHaveBeenCalledWith(['/events']);
    expect(component.loading()).toBe(false);
  });

  it('should set inline errorMessage banner when registration fails', () => {
    authServiceMock.register.mockReturnValue(
      throwError(() => ({ message: 'User with this email already exists.' }))
    );

    component.form.setValue({
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      password: 'StrongPassword123!',
      phoneNumber: '',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('User with this email already exists.');
    expect(component.loading()).toBe(false);
  });
});
