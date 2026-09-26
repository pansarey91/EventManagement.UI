import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UserManagementComponent } from './user-management.component';
import { UserService } from '../../core/services/user.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { UserDto, PagedResultDto } from '../../core/models';

describe('UserManagementComponent', () => {
  let component: UserManagementComponent;
  let fixture: ComponentFixture<UserManagementComponent>;
  let userServiceMock: any;
  let feedbackServiceMock: any;

  const mockUsers: UserDto[] = [
    {
      id: 'user-1',
      firstName: 'Alice',
      lastName: 'Smith',
      email: 'alice@example.com',
      phoneNumber: '+1234567890',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'user-2',
      firstName: 'Bob',
      lastName: 'Jones',
      email: 'bob@example.com',
      phoneNumber: null,
      isActive: false,
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: null,
    },
  ];

  const mockPagedResult: PagedResultDto<UserDto> = {
    items: mockUsers,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    userServiceMock = {
      getUsers: vi.fn().mockReturnValue(of(mockPagedResult)),
      updateUserStatus: vi.fn(),
    };

    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserManagementComponent],
      providers: [
        { provide: UserService, useValue: userServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load users on init', () => {
    expect(component).toBeTruthy();
    expect(userServiceMock.getUsers).toHaveBeenCalled();
    expect(component.users().length).toBe(2);
    expect(component.totalCount()).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should reload users when search changes', () => {
    component.onSearchChange('alice');

    expect(component.searchQuery()).toBe('alice');
    expect(component.pageNumber()).toBe(1);
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'alice', pageNumber: 1 })
    );
  });

  it('should filter by active status', () => {
    const event = { target: { value: 'active' } } as unknown as Event;
    component.onStatusChange(event);

    expect(component.statusFilter()).toBe('active');
    expect(component.pageNumber()).toBe(1);
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, pageNumber: 1 })
    );
  });

  it('should filter by inactive status', () => {
    const event = { target: { value: 'inactive' } } as unknown as Event;
    component.onStatusChange(event);

    expect(component.statusFilter()).toBe('inactive');
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false, pageNumber: 1 })
    );
  });

  it('should change sort order and sort direction', () => {
    const sortEvent = { target: { value: 'email' } } as unknown as Event;
    component.onSortChange(sortEvent);

    expect(component.sortBy()).toBe('email');
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'email' })
    );

    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('asc');
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: 'asc' })
    );
  });

  it('should handle page size changes', () => {
    userServiceMock.getUsers.mockReturnValue(
      of({ ...mockPagedResult, pageSize: 20 })
    );

    component.onPageSizeChange(20);

    expect(component.pageSize()).toBe(20);
    expect(component.pageNumber()).toBe(1);
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20, pageNumber: 1 })
    );
  });

  it('should handle page change within bounds', () => {
    component.totalPages.set(3);
    userServiceMock.getUsers.mockReturnValue(
      of({ ...mockPagedResult, pageNumber: 2, totalPages: 3 })
    );

    component.onPageChange(2);

    expect(component.pageNumber()).toBe(2);
    expect(userServiceMock.getUsers).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 2 })
    );
  });

  it('should reset filters and reload', () => {
    component.searchQuery.set('Alice');
    component.statusFilter.set('inactive');
    component.pageNumber.set(3);

    component.resetFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.statusFilter()).toBe('all');
    expect(component.pageNumber()).toBe(1);
    expect(userServiceMock.getUsers).toHaveBeenCalled();
  });

  it('should toggle user status from active to inactive successfully', () => {
    const userToToggle = mockUsers[0]; // isActive: true
    const updatedUser: UserDto = { ...userToToggle, isActive: false };
    userServiceMock.updateUserStatus.mockReturnValue(of(updatedUser));

    component.toggleUserStatus(userToToggle);

    expect(userServiceMock.updateUserStatus).toHaveBeenCalledWith('user-1', { isActive: false });
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('deactivated')
    );
    const updated = component.users().find((u) => u.id === 'user-1');
    expect(updated?.isActive).toBe(false);
  });

  it('should toggle user status from inactive to active successfully', () => {
    const userToToggle = mockUsers[1]; // isActive: false
    const updatedUser: UserDto = { ...userToToggle, isActive: true };
    userServiceMock.updateUserStatus.mockReturnValue(of(updatedUser));

    component.toggleUserStatus(userToToggle);

    expect(userServiceMock.updateUserStatus).toHaveBeenCalledWith('user-2', { isActive: true });
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('activated')
    );
    const updated = component.users().find((u) => u.id === 'user-2');
    expect(updated?.isActive).toBe(true);
  });

  it('should handle error when toggle user status fails', () => {
    userServiceMock.updateUserStatus.mockReturnValue(
      throwError(() => ({ message: 'Cannot deactivate the last system administrator.' }))
    );

    component.toggleUserStatus(mockUsers[0]);

    expect(feedbackServiceMock.showError).toHaveBeenCalledWith(
      'Cannot deactivate the last system administrator.'
    );
    expect(component.togglingUserId()).toBeNull();
  });

  it('should display error when loading users fails', () => {
    userServiceMock.getUsers.mockReturnValue(
      throwError(() => ({ message: 'Network error' }))
    );

    component.loadUsers();

    expect(component.error()).toBe('Network error');
    expect(component.loading()).toBe(false);
  });
});
