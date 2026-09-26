import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { ChangePasswordDto, UpdateProfileDto, UserProfileDto } from '../models';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  const mockProfile: UserProfileDto = {
    id: 'user-456',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah@example.com',
    phoneNumber: '+15550199',
    isActive: true,
    roles: ['Organizer'],
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get current user profile via GET /api/users/me', () => {
    let result: UserProfileDto | undefined;
    service.getMyProfile().subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/me`);
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);

    expect(result).toEqual(mockProfile);
  });

  it('should update current user profile via PUT /api/users/me', () => {
    const updateDto: UpdateProfileDto = {
      firstName: 'Sarah',
      lastName: 'Connor-Reese',
      email: 'sarah.reese@example.com',
      phoneNumber: '+15559999',
    };

    const updatedProfile: UserProfileDto = {
      ...mockProfile,
      firstName: updateDto.firstName,
      lastName: updateDto.lastName,
      email: updateDto.email ?? mockProfile.email,
      phoneNumber: updateDto.phoneNumber,
      updatedAt: '2026-03-01T12:00:00Z',
    };

    let result: UserProfileDto | undefined;
    service.updateMyProfile(updateDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/me`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(updatedProfile);

    expect(result).toEqual(updatedProfile);
  });

  it('should change password via POST /api/users/change-password', () => {
    const changeDto: ChangePasswordDto = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
      confirmNewPassword: 'NewPassword456!',
    };

    let result: { message: string } | undefined;
    service.changePassword(changeDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/change-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(changeDto);
    req.flush({ message: 'Password changed successfully.' });

    expect(result?.message).toBe('Password changed successfully.');
  });

  it('should query paginated users via GET /api/users with query parameters', () => {
    const mockPagedResult = {
      items: [
        {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      pageNumber: 2,
      pageSize: 10,
      totalCount: 25,
      totalPages: 3,
      hasPreviousPage: true,
      hasNextPage: true,
    };

    let result: typeof mockPagedResult | undefined;
    service
      .getUsers({
        pageNumber: 2,
        pageSize: 10,
        search: 'john',
        isActive: true,
        sortBy: 'lastName',
        sortDirection: 'asc',
      })
      .subscribe((res) => {
        result = res;
      });

    const req = httpMock.expectOne((r) => r.url === `${environment.apiBaseUrl}/users`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('pageNumber')).toBe('2');
    expect(req.request.params.get('pageSize')).toBe('10');
    expect(req.request.params.get('search')).toBe('john');
    expect(req.request.params.get('isActive')).toBe('true');
    expect(req.request.params.get('sortBy')).toBe('lastName');
    expect(req.request.params.get('sortDirection')).toBe('asc');
    req.flush(mockPagedResult);

    expect(result).toEqual(mockPagedResult);
  });

  it('should get user by id via GET /api/users/:id', () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    };

    let result: typeof mockUser | undefined;
    service.getUserById('user-1').subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/user-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);

    expect(result).toEqual(mockUser);
  });

  it('should update user status via PATCH /api/users/:id/status', () => {
    const mockUser = {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      isActive: false,
      createdAt: '2026-01-01T00:00:00Z',
    };

    let result: typeof mockUser | undefined;
    service.updateUserStatus('user-1', { isActive: false }).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/user-1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ isActive: false });
    req.flush(mockUser);

    expect(result?.isActive).toBe(false);
  });

  it('should assign role to user via POST /api/users/:id/roles/:roleId', () => {
    let completed = false;
    service.assignRole('user-1', 'role-admin').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/user-1/roles/role-admin`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Role assigned successfully.' });

    expect(completed).toBe(true);
  });

  it('should remove role from user via DELETE /api/users/:id/roles/:roleId', () => {
    let completed = false;
    service.removeRole('user-1', 'role-admin').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/users/user-1/roles/role-admin`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});
