import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { UserProfileDto } from '../../core/models';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;
  let userServiceMock: {
    getMyProfile: ReturnType<typeof vi.fn>;
    updateMyProfile: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    updateCurrentUser: ReturnType<typeof vi.fn>;
  };
  let feedbackServiceMock: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
  };

  const mockProfile: UserProfileDto = {
    id: 'user-789',
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@example.com',
    phoneNumber: '+15550000',
    isActive: true,
    roles: ['Admin', 'Organizer'],
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-01T12:00:00Z',
  };

  beforeEach(async () => {
    userServiceMock = {
      getMyProfile: vi.fn().mockReturnValue(of(mockProfile)),
      updateMyProfile: vi.fn(),
    };
    authServiceMock = {
      updateCurrentUser: vi.fn(),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load and populate user profile on initialization', () => {
    expect(userServiceMock.getMyProfile).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.profile()).toEqual(mockProfile);

    expect(component.form.get('firstName')?.value).toBe('Diana');
    expect(component.form.get('lastName')?.value).toBe('Prince');
    expect(component.form.get('email')?.value).toBe('diana@example.com');
    expect(component.form.get('phoneNumber')?.value).toBe('+15550000');
  });

  it('should display error state when getMyProfile fails and allow retry', () => {
    userServiceMock.getMyProfile.mockReturnValue(
      throwError(() => ({ message: 'Failed to fetch user details' }))
    );

    component.loadProfile();

    expect(component.loading()).toBe(false);
    expect(component.loadError()).toBe('Failed to fetch user details');

    // Test retry
    userServiceMock.getMyProfile.mockReturnValue(of(mockProfile));
    component.loadProfile();

    expect(component.loadError()).toBeNull();
    expect(component.profile()).toEqual(mockProfile);
  });

  it('should validate required fields and email formatting', () => {
    component.form.patchValue({
      firstName: '',
      lastName: '',
      email: 'invalid-email',
    });

    expect(component.form.valid).toBe(false);
    expect(component.firstName?.hasError('required')).toBe(true);
    expect(component.lastName?.hasError('required')).toBe(true);
    expect(component.email?.hasError('email')).toBe(true);
  });

  it('should submit updated profile and synchronize auth state', () => {
    const updatedProfile: UserProfileDto = {
      ...mockProfile,
      firstName: 'Diana',
      lastName: 'Prince-Wayne',
      email: 'diana.wayne@example.com',
      phoneNumber: '+15551111',
    };

    userServiceMock.updateMyProfile.mockReturnValue(of(updatedProfile));

    component.form.patchValue({
      firstName: 'Diana',
      lastName: 'Prince-Wayne',
      email: 'diana.wayne@example.com',
      phoneNumber: '+15551111',
    });
    component.form.markAsDirty();

    component.onSubmit();

    expect(userServiceMock.updateMyProfile).toHaveBeenCalledWith({
      firstName: 'Diana',
      lastName: 'Prince-Wayne',
      email: 'diana.wayne@example.com',
      phoneNumber: '+15551111',
    });

    expect(authServiceMock.updateCurrentUser).toHaveBeenCalledWith({
      id: updatedProfile.id,
      firstName: 'Diana',
      lastName: 'Prince-Wayne',
      email: 'diana.wayne@example.com',
      phoneNumber: '+15551111',
      roles: ['Admin', 'Organizer'],
      isActive: true,
    });

    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith('Profile updated successfully.');
    expect(component.saveSuccess()).toContain('successfully updated');
    expect(component.saving()).toBe(false);
  });

  it('should handle update error and display inline error banner', () => {
    userServiceMock.updateMyProfile.mockReturnValue(
      throwError(() => ({ message: 'A user with the email already exists.' }))
    );

    component.form.patchValue({
      firstName: 'Diana',
      lastName: 'Prince',
      email: 'taken@example.com',
      phoneNumber: '+15550000',
    });
    component.form.markAsDirty();

    component.onSubmit();

    expect(component.saveError()).toBe('A user with the email already exists.');
    expect(component.saving()).toBe(false);
  });

  it('should reset form back to current profile state on resetForm()', () => {
    component.form.patchValue({
      firstName: 'Modified',
      lastName: 'Name',
    });
    component.form.markAsDirty();

    component.resetForm();

    expect(component.form.get('firstName')?.value).toBe('Diana');
    expect(component.form.get('lastName')?.value).toBe('Prince');
    expect(component.saveError()).toBeNull();
  });
});
