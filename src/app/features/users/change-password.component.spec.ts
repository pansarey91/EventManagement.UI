import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ChangePasswordComponent } from './change-password.component';
import { UserService } from '../../core/services/user.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;
  let userServiceMock: {
    changePassword: ReturnType<typeof vi.fn>;
  };
  let feedbackServiceMock: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    userServiceMock = {
      changePassword: vi.fn(),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with invalid empty form and password fields hidden', () => {
    expect(component.form.valid).toBe(false);
    expect(component.showCurrentPassword()).toBe(false);
    expect(component.showNewPassword()).toBe(false);
    expect(component.showConfirmPassword()).toBe(false);
    expect(component.errorMessage()).toBeNull();
    expect(component.successMessage()).toBeNull();
  });

  it('should toggle password visibility flags', () => {
    component.showCurrentPassword.set(true);
    expect(component.showCurrentPassword()).toBe(true);

    component.showNewPassword.set(true);
    expect(component.showNewPassword()).toBe(true);

    component.showConfirmPassword.set(true);
    expect(component.showConfirmPassword()).toBe(true);
  });

  it('should detect password confirmation mismatch', () => {
    component.form.patchValue({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword@123',
      confirmNewPassword: 'DifferentPassword@123',
    });

    expect(component.form.valid).toBe(false);
    expect(component.form.hasError('passwordMismatch')).toBe(true);
    expect(component.confirmNewPassword?.hasError('passwordMismatch')).toBe(true);
  });

  it('should validate new password against backend complexity policy', () => {
    const newPassControl = component.newPassword;

    // Missing symbol
    newPassControl?.setValue('Password123');
    expect(newPassControl?.hasError('pattern')).toBe(true);

    // Missing uppercase
    newPassControl?.setValue('password@123');
    expect(newPassControl?.hasError('pattern')).toBe(true);

    // Missing digit
    newPassControl?.setValue('Password@Symbol');
    expect(newPassControl?.hasError('pattern')).toBe(true);

    // Too short (< 8 chars)
    newPassControl?.setValue('P@1s');
    expect(newPassControl?.hasError('minlength') || newPassControl?.hasError('pattern')).toBe(true);

    // Valid
    newPassControl?.setValue('Valid@Password123');
    expect(newPassControl?.valid).toBe(true);
  });

  it('should submit change-password request, clear passwords, and notify on success', () => {
    userServiceMock.changePassword.mockReturnValue(of({ message: 'Password changed successfully.' }));

    component.form.setValue({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword@123',
      confirmNewPassword: 'NewPassword@123',
    });

    component.onSubmit();

    expect(userServiceMock.changePassword).toHaveBeenCalledWith({
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword@123',
      confirmNewPassword: 'NewPassword@123',
    });

    expect(component.successMessage()).toBe('Password changed successfully.');
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalled();
    expect(component.currentPassword?.value).toBeNull();
    expect(component.newPassword?.value).toBeNull();
    expect(component.confirmNewPassword?.value).toBeNull();
    expect(component.saving()).toBe(false);
  });

  it('should display error message when backend rejects password change', () => {
    userServiceMock.changePassword.mockReturnValue(
      throwError(() => ({ message: 'The current password provided is incorrect.' }))
    );

    component.form.setValue({
      currentPassword: 'WrongPassword123!',
      newPassword: 'NewPassword@123',
      confirmNewPassword: 'NewPassword@123',
    });

    component.onSubmit();

    expect(component.errorMessage()).toBe('The current password provided is incorrect.');
    expect(component.saving()).toBe(false);
  });
});
