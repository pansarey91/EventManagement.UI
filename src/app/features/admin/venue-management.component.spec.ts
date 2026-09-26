import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { VenueManagementComponent } from './venue-management.component';
import { VenueService } from '../../core/services/venue.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { VenueDto, PagedResultDto } from '../../core/models';

describe('VenueManagementComponent', () => {
  let component: VenueManagementComponent;
  let fixture: ComponentFixture<VenueManagementComponent>;
  let venueServiceMock: any;
  let feedbackServiceMock: any;

  const mockVenues: VenueDto[] = [
    {
      id: 'venue-1',
      name: 'Grand Expo Center',
      address: '100 Exhibition Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60601',
      capacity: 5000,
      contactPerson: 'Alice Johnson',
      contactNumber: '+13125550100',
      isActive: true,
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'venue-2',
      name: 'Civic Auditorium',
      address: '250 Civic Center Dr',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60602',
      capacity: 1200,
      contactPerson: null,
      contactNumber: null,
      isActive: false,
      createdAt: '2026-01-15T12:00:00Z',
      updatedAt: '2026-02-01T15:00:00Z',
    },
  ];

  const mockPagedResult: PagedResultDto<VenueDto> = {
    items: mockVenues,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 2,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    venueServiceMock = {
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
      imports: [VenueManagementComponent],
      providers: [
        { provide: VenueService, useValue: venueServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VenueManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component and load venues on init', () => {
    expect(component).toBeTruthy();
    expect(venueServiceMock.getAll).toHaveBeenCalled();
    expect(component.venues().length).toBe(2);
    expect(component.totalCount()).toBe(2);
  });

  it('should filter venues when search input changes', () => {
    const event = { target: { value: 'Expo' } } as unknown as Event;
    component.onSearchInput(event);

    expect(component.searchQuery()).toBe('Expo');
    expect(component.pageNumber()).toBe(1);
    expect(venueServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Expo', pageNumber: 1 })
    );
  });

  it('should filter venues when city filter changes', () => {
    const event = { target: { value: 'Chicago' } } as unknown as Event;
    component.onCityFilterInput(event);

    expect(component.cityFilter()).toBe('Chicago');
    expect(component.pageNumber()).toBe(1);
    expect(venueServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ city: 'Chicago', pageNumber: 1 })
    );
  });

  it('should filter venues by status', () => {
    const event = { target: { value: 'active' } } as unknown as Event;
    component.onStatusChange(event);

    expect(component.statusFilter()).toBe('active');
    expect(component.pageNumber()).toBe(1);
    expect(venueServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, pageNumber: 1 })
    );
  });

  it('should toggle sort direction and reload', () => {
    expect(component.sortDirection()).toBe('asc');
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('desc');
    expect(venueServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: 'desc' })
    );
  });

  it('should open create modal with empty form', () => {
    component.openCreateModal();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('create');
    expect(component.venueForm.get('name')?.value).toBe('');
    expect(component.venueForm.get('country')?.value).toBe('USA');
    expect(component.venueForm.get('isActive')?.value).toBe(true);
  });

  it('should validate form and prevent submission when required fields are missing', () => {
    component.openCreateModal();
    component.venueForm.patchValue({
      name: '',
      address: '',
      city: '',
      state: '',
      country: '',
      capacity: null,
    });

    component.submitVenueForm();

    expect(component.venueForm.invalid).toBe(true);
    expect(venueServiceMock.create).not.toHaveBeenCalled();
  });

  it('should submit create form and reload venues on success', () => {
    const newVenue: VenueDto = {
      id: 'venue-3',
      name: 'Skyline Pavilion',
      address: '777 High St',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      postalCode: '98101',
      capacity: 2500,
      contactPerson: 'Bob Ross',
      contactNumber: '+12065550188',
      isActive: true,
      createdAt: '2026-03-01T10:00:00Z',
      updatedAt: null,
    };
    venueServiceMock.create.mockReturnValue(of(newVenue));

    component.openCreateModal();
    component.venueForm.patchValue({
      name: 'Skyline Pavilion',
      address: '777 High St',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      postalCode: '98101',
      capacity: 2500,
      contactPerson: 'Bob Ross',
      contactNumber: '+12065550188',
      isActive: true,
    });

    component.submitVenueForm();

    expect(venueServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Skyline Pavilion',
        city: 'Seattle',
        capacity: 2500,
      })
    );
    expect(component.isCreateEditModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Skyline Pavilion')
    );
  });

  it('should handle duplicate venue conflict error (409) in create modal', () => {
    venueServiceMock.create.mockReturnValue(
      throwError(() => ({
        statusCode: 409,
        message: 'A venue with the name "Grand Expo Center" already exists in "Chicago".',
      }))
    );

    component.openCreateModal();
    component.venueForm.patchValue({
      name: 'Grand Expo Center',
      address: '100 Exhibition Blvd',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      capacity: 5000,
    });

    component.submitVenueForm();

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalError()).toContain('already exists');
  });

  it('should open edit modal with venue data and submit updates', () => {
    const updatedVenue: VenueDto = {
      ...mockVenues[0],
      capacity: 5500,
    };
    venueServiceMock.update.mockReturnValue(of(updatedVenue));

    component.openEditModal(mockVenues[0]);

    expect(component.isCreateEditModalOpen()).toBe(true);
    expect(component.modalMode()).toBe('edit');
    expect(component.selectedVenueId()).toBe('venue-1');
    expect(component.venueForm.get('name')?.value).toBe('Grand Expo Center');
    expect(component.venueForm.get('capacity')?.value).toBe(5000);

    component.venueForm.patchValue({ capacity: 5500 });
    component.submitVenueForm();

    expect(venueServiceMock.update).toHaveBeenCalledWith('venue-1', expect.objectContaining({
      capacity: 5500,
    }));
    expect(component.isCreateEditModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Grand Expo Center')
    );
  });

  it('should open delete modal and confirm deletion successfully', () => {
    venueServiceMock.delete.mockReturnValue(of(undefined));

    component.openDeleteModal(mockVenues[0]);

    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.venueToDelete()).toEqual(mockVenues[0]);

    component.confirmDelete();

    expect(venueServiceMock.delete).toHaveBeenCalledWith('venue-1');
    expect(component.isDeleteModalOpen()).toBe(false);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Grand Expo Center')
    );
  });

  it('should display error message in delete modal when venue has linked events', () => {
    venueServiceMock.delete.mockReturnValue(
      throwError(() => ({
        statusCode: 400,
        message: 'Cannot delete venue "Grand Expo Center" because it is currently assigned to one or more events.',
      }))
    );

    component.openDeleteModal(mockVenues[0]);
    component.confirmDelete();

    expect(component.isDeleteModalOpen()).toBe(true);
    expect(component.deleteError()).toContain('Cannot delete venue');
  });

  it('should reset filters and reload venues', () => {
    component.searchQuery.set('Expo');
    component.cityFilter.set('Chicago');
    component.statusFilter.set('active');

    component.resetFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.cityFilter()).toBe('');
    expect(component.statusFilter()).toBe('all');
    expect(component.pageNumber()).toBe(1);
    expect(venueServiceMock.getAll).toHaveBeenCalled();
  });
});
