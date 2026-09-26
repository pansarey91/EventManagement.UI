import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoryManagementComponent } from './category-management.component';
import { CategoryService } from '../../core/services/category.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { EventCategoryDto, PagedResultDto } from '../../core/models';

describe('CategoryManagementComponent', () => {
  let component: CategoryManagementComponent;
  let fixture: ComponentFixture<CategoryManagementComponent>;
  let categoryServiceMock: any;
  let feedbackServiceMock: any;

  const mockCategories: EventCategoryDto[] = [
    {
      id: 'cat-1',
      name: 'Technology',
      description: 'Tech events',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'cat-2',
      name: 'Music & Arts',
      description: 'Concerts and exhibitions',
      isActive: false,
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: null,
    },
  ];

  const mockPagedResult: PagedResultDto<EventCategoryDto> = {
    items: mockCategories,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    categoryServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockPagedResult)),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [CategoryManagementComponent],
      providers: [
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load categories on init', () => {
    expect(component).toBeTruthy();
    expect(categoryServiceMock.getAll).toHaveBeenCalled();
    expect(component.categories().length).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('should filter categories when search input changes', () => {
    const event = { target: { value: 'Tech' } } as unknown as Event;
    component.onSearchInput(event);

    expect(component.searchQuery()).toBe('Tech');
    expect(component.pageNumber()).toBe(1);
    expect(categoryServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Tech', pageNumber: 1 })
    );
  });

  it('should filter categories by status', () => {
    const event = { target: { value: 'active' } } as unknown as Event;
    component.onStatusChange(event);

    expect(component.statusFilter()).toBe('active');
    expect(component.pageNumber()).toBe(1);
    expect(categoryServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, pageNumber: 1 })
    );
  });

  it('should toggle sort direction and reload', () => {
    expect(component.sortDirection()).toBe('asc');
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('desc');
    expect(categoryServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: 'desc' })
    );
  });

  it('should open create modal with empty form', () => {
    component.openCreateModal();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('create');
    expect(component.categoryForm.get('name')?.value).toBe('');
    expect(component.categoryForm.get('isActive')?.value).toBe(true);
  });

  it('should validate form and prevent submission when name is invalid', () => {
    component.openCreateModal();
    component.categoryForm.patchValue({ name: '' });

    component.submitCategoryForm();

    expect(component.categoryForm.invalid).toBe(true);
    expect(categoryServiceMock.create).not.toHaveBeenCalled();
  });

  it('should submit create form and reload categories on success', () => {
    const newCategory: EventCategoryDto = {
      id: 'cat-3',
      name: 'Workshops',
      description: 'Skill building sessions',
      isActive: true,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: null,
    };
    categoryServiceMock.create.mockReturnValue(of(newCategory));

    component.openCreateModal();
    component.categoryForm.patchValue({
      name: 'Workshops',
      description: 'Skill building sessions',
      isActive: true,
    });

    component.submitCategoryForm();

    expect(categoryServiceMock.create).toHaveBeenCalledWith({
      name: 'Workshops',
      description: 'Skill building sessions',
      isActive: true,
    });
    expect(component.isCreateEditModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Workshops')
    );
  });

  it('should handle duplicate category conflict error (409) in create modal', () => {
    categoryServiceMock.create.mockReturnValue(
      throwError(() => ({
        statusCode: 409,
        message: 'An event category with the name "Technology" already exists.',
      }))
    );

    component.openCreateModal();
    component.categoryForm.patchValue({
      name: 'Technology',
      description: 'Existing name',
      isActive: true,
    });

    component.submitCategoryForm();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalError()).toContain('already exists');
  });

  it('should open edit modal with category data and submit updates', () => {
    const updatedCategory: EventCategoryDto = {
      ...mockCategories[0],
      name: 'Advanced Technology',
    };
    categoryServiceMock.update.mockReturnValue(of(updatedCategory));

    component.openEditModal(mockCategories[0]);

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('edit');
    expect(component.selectedCategoryId()).toBe('cat-1');
    expect(component.categoryForm.get('name')?.value).toBe('Technology');

    component.categoryForm.patchValue({ name: 'Advanced Technology' });
    component.submitCategoryForm();

    expect(categoryServiceMock.update).toHaveBeenCalledWith('cat-1', {
      name: 'Advanced Technology',
      description: 'Tech events',
      isActive: true,
    });
    expect(component.isCreateEditModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Advanced Technology')
    );
  });

  it('should open delete modal and confirm deletion successfully', () => {
    categoryServiceMock.delete.mockReturnValue(of(undefined));

    component.openDeleteModal(mockCategories[0]);

    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.categoryToDelete()).toEqual(mockCategories[0]);

    component.confirmDelete();

    expect(categoryServiceMock.delete).toHaveBeenCalledWith('cat-1');
    expect(component.isDeleteModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Technology')
    );
  });

  it('should display error message in delete modal when category has linked events', () => {
    categoryServiceMock.delete.mockReturnValue(
      throwError(() => ({
        statusCode: 400,
        message: 'Cannot delete category "Technology" because it is currently assigned to one or more events.',
      }))
    );

    component.openDeleteModal(mockCategories[0]);
    component.confirmDelete();

    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.deleteError()).toContain('Cannot delete category');
  });
});
