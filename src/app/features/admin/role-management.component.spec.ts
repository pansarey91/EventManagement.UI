import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RoleManagementComponent } from './role-management.component';
import { RoleService } from '../../core/services/role.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { RoleDto, PagedResultDto } from '../../core/models';

describe('RoleManagementComponent', () => {
  let component: RoleManagementComponent;
  let fixture: ComponentFixture<RoleManagementComponent>;
  let roleServiceMock: any;
  let feedbackServiceMock: any;

  const mockRoles: RoleDto[] = [
    {
      id: 'role-1',
      name: 'Admin',
      description: 'Platform Administrator with full access',
      userCount: 3,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'role-2',
      name: 'Organizer',
      description: 'Event Organizer with event creation and management privileges',
      userCount: 12,
      createdAt: '2026-01-02T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'role-3',
      name: 'Attendee',
      description: 'Standard event attendee',
      userCount: 150,
      createdAt: '2026-01-03T10:00:00Z',
      updatedAt: null,
    },
  ];

  const mockPagedResult: PagedResultDto<RoleDto> = {
    items: mockRoles,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 3,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    roleServiceMock = {
      getRoles: vi.fn().mockReturnValue(of(mockPagedResult)),
      getRoleById: vi.fn(),
      createRole: vi.fn(),
      updateRole: vi.fn(),
      deleteRole: vi.fn(),
    };

    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RoleManagementComponent],
      providers: [
        { provide: RoleService, useValue: roleServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load roles on init', () => {
    expect(component).toBeTruthy();
    expect(roleServiceMock.getRoles).toHaveBeenCalled();
    expect(component.roles().length).toBe(3);
    expect(component.totalCount()).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('should reload roles when search query changes', () => {
    component.onSearchChange('admin');

    expect(component.searchQuery()).toBe('admin');
    expect(component.pageNumber()).toBe(1);
    expect(roleServiceMock.getRoles).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'admin', pageNumber: 1 })
    );
  });

  it('should reload roles when sort changes', () => {
    const event = { target: { value: 'createdat' } } as unknown as Event;
    component.onSortChange(event);

    expect(component.sortBy()).toBe('createdat');
    expect(component.pageNumber()).toBe(1);
    expect(roleServiceMock.getRoles).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'createdat' })
    );
  });

  it('should toggle sort direction and reload', () => {
    expect(component.sortDirection()).toBe('asc');
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('desc');
    expect(roleServiceMock.getRoles).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: 'desc' })
    );
  });

  it('should change page size and reload', () => {
    roleServiceMock.getRoles.mockReturnValue(
      of({ ...mockPagedResult, pageSize: 20 })
    );

    component.onPageSizeChange(20);

    expect(component.pageSize()).toBe(20);
    expect(component.pageNumber()).toBe(1);
    expect(roleServiceMock.getRoles).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20, pageNumber: 1 })
    );
  });

  it('should change page number and reload', () => {
    component.totalPages.set(3);
    roleServiceMock.getRoles.mockReturnValue(
      of({ ...mockPagedResult, pageNumber: 2, totalPages: 3 })
    );

    component.onPageChange(2);

    expect(component.pageNumber()).toBe(2);
    expect(roleServiceMock.getRoles).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 2 })
    );
  });

  it('should reset filters and reload roles', () => {
    component.searchQuery.set('custom');
    component.pageNumber.set(2);

    component.resetFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.pageNumber()).toBe(1);
    expect(roleServiceMock.getRoles).toHaveBeenCalled();
  });

  it('should display error when loadRoles fails', () => {
    roleServiceMock.getRoles.mockReturnValue(
      throwError(() => ({ message: 'Network connection lost.' }))
    );

    component.loadRoles();

    expect(component.error()).toBe('Network connection lost.');
    expect(component.loading()).toBe(false);
  });

  // Modal: Create Role
  it('should open create modal with empty form', () => {
    component.openCreateModal();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('create');
    expect(component.roleForm.get('name')?.value).toBe('');
    expect(component.roleForm.get('description')?.value).toBe('');
    expect(component.selectedRoleId()).toBeNull();
  });

  it('should validate form and prevent submission when name is invalid', () => {
    component.openCreateModal();
    component.roleForm.patchValue({ name: '' });

    component.submitRoleForm();

    expect(component.roleForm.invalid).toBe(true);
    expect(roleServiceMock.createRole).not.toHaveBeenCalled();
  });

  it('should submit create form and reload roles on success', () => {
    const newRole: RoleDto = {
      id: 'role-4',
      name: 'Auditor',
      description: 'Audits platform events and financial logs',
      userCount: 0,
      createdAt: '2026-03-01T10:00:00Z',
    };
    roleServiceMock.createRole.mockReturnValue(of(newRole));

    component.openCreateModal();
    component.roleForm.patchValue({
      name: 'Auditor',
      description: 'Audits platform events and financial logs',
    });

    component.submitRoleForm();

    expect(roleServiceMock.createRole).toHaveBeenCalledWith({
      name: 'Auditor',
      description: 'Audits platform events and financial logs',
    });
    expect(component.isCreateEditModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Auditor')
    );
  });

  it('should handle conflict/validation error in create modal', () => {
    roleServiceMock.createRole.mockReturnValue(
      throwError(() => ({
        message: 'A role with the name "Admin" already exists.',
      }))
    );

    component.openCreateModal();
    component.roleForm.patchValue({
      name: 'Admin',
      description: 'Duplicate',
    });

    component.submitRoleForm();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalError()).toContain('already exists');
    expect(component.saving()).toBe(false);
  });

  // Modal: Edit Role
  it('should open edit modal with role data', () => {
    component.openEditModal(mockRoles[1]);

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('edit');
    expect(component.selectedRoleId()).toBe('role-2');
    expect(component.roleForm.get('name')?.value).toBe('Organizer');
    expect(component.roleForm.get('description')?.value).toBe(
      'Event Organizer with event creation and management privileges'
    );
  });

  it('should submit update form and reload roles on success', () => {
    const updatedRole: RoleDto = {
      ...mockRoles[1],
      description: 'Updated description for organizer',
    };
    roleServiceMock.updateRole.mockReturnValue(of(updatedRole));

    component.openEditModal(mockRoles[1]);
    component.roleForm.patchValue({
      name: 'Organizer',
      description: 'Updated description for organizer',
    });

    component.submitRoleForm();

    expect(roleServiceMock.updateRole).toHaveBeenCalledWith('role-2', {
      name: 'Organizer',
      description: 'Updated description for organizer',
    });
    expect(component.isCreateEditModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Organizer')
    );
  });

  it('should handle error when updating role fails', () => {
    roleServiceMock.updateRole.mockReturnValue(
      throwError(() => ({ message: 'Failed to update role in database.' }))
    );

    component.openEditModal(mockRoles[1]);
    component.roleForm.patchValue({ name: 'Organizer Updated' });

    component.submitRoleForm();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalError()).toBe('Failed to update role in database.');
    expect(component.saving()).toBe(false);
  });

  // Modal: Delete Role
  it('should open delete modal with role to delete', () => {
    component.openDeleteModal(mockRoles[2]);

    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.roleToDelete()).toEqual(mockRoles[2]);
  });

  it('should confirm delete and reload roles on success', () => {
    roleServiceMock.deleteRole.mockReturnValue(of(undefined));

    component.openDeleteModal(mockRoles[2]);
    component.confirmDelete();

    expect(roleServiceMock.deleteRole).toHaveBeenCalledWith('role-3');
    expect(component.isDeleteModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Attendee')
    );
  });

  it('should handle backend error when role cannot be deleted because users are assigned', () => {
    const errorResponse = {
      statusCode: 400,
      message: "Cannot delete role 'Admin' because it is currently assigned to one or more users.",
    };
    roleServiceMock.deleteRole.mockReturnValue(throwError(() => errorResponse));

    component.openDeleteModal(mockRoles[0]);
    component.confirmDelete();

    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.deleteError()).toContain('Cannot delete role');
    expect(feedbackServiceMock.showError).toHaveBeenCalledWith(errorResponse.message);
    expect(component.deleting()).toBe(false);
  });

  it('should adjust page number if last item on page > 1 is deleted', () => {
    roleServiceMock.deleteRole.mockReturnValue(of(undefined));
    component.roles.set([mockRoles[0]]);
    component.pageNumber.set(2);

    component.openDeleteModal(mockRoles[0]);
    component.confirmDelete();

    expect(component.pageNumber()).toBe(1);
  });

  it('should close modals on backdrop click or escape key', () => {
    component.openCreateModal();
    expect(component.isCreateEditModalOpen()).toBe(true);

    const backdropEvent = {
      target: { classList: { contains: (cls: string) => cls === 'modal-backdrop' } },
    } as unknown as MouseEvent;
    component.onBackdropClick(backdropEvent);
    expect(component.isCreateEditModalOpen()).toBe(false);

    component.openDeleteModal(mockRoles[0]);
    expect(component.isDeleteModalOpen()).toBe(true);
    component.onEscapePressed();
    expect(component.isDeleteModalOpen()).toBe(false);
  });
});
