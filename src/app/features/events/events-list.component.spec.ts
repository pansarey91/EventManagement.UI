import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EventsListComponent } from './events-list.component';
import { EventService } from '../../core/services/event.service';
import { CategoryService } from '../../core/services/category.service';
import { VenueService } from '../../core/services/venue.service';
import { PublicEventDto, EventStatus, PagedResultDto } from '../../core/models';

describe('EventsListComponent', () => {
  let component: EventsListComponent;
  let fixture: ComponentFixture<EventsListComponent>;
  let eventServiceMock: any;
  let categoryServiceMock: any;
  let venueServiceMock: any;

  const mockPublicEvents: PublicEventDto[] = [
    {
      id: 'event-1',
      name: 'Tech World 2026',
      description: 'Annual global developer gathering',
      categoryId: 'cat-1',
      categoryName: 'Technology',
      venueId: 'venue-1',
      venueName: 'Convention Hall',
      venueCity: 'Seattle',
      organizerId: 'org-1',
      organizerName: 'Tech Corp',
      startDateTime: '2026-11-10T09:00:00Z',
      endDateTime: '2026-11-10T17:00:00Z',
      registrationDeadline: '2026-11-09T23:59:59Z',
      maxCapacity: 500,
      status: EventStatus.Published,
      bannerImageUrl: 'https://example.com/banner.jpg',
      minimumTicketPrice: 99,
      availableTicketCount: 150,
      averageRating: 4.8,
      totalFeedback: 25,
      isRegistrationOpen: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockPagedEvents: PagedResultDto<PublicEventDto> = {
    items: mockPublicEvents,
    pageNumber: 1,
    pageSize: 9,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    eventServiceMock = {
      discover: vi.fn().mockReturnValue(of(mockPagedEvents)),
    };

    categoryServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ items: [{ id: 'cat-1', name: 'Technology' }] })),
    };

    venueServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ items: [{ id: 'venue-1', name: 'Convention Hall', city: 'Seattle' }] })),
    };

    await TestBed.configureTestingModule({
      imports: [EventsListComponent],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: VenueService, useValue: venueServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load initial events and reference categories/venues', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.discover).toHaveBeenCalled();
    expect(categoryServiceMock.getAll).toHaveBeenCalled();
    expect(venueServiceMock.getAll).toHaveBeenCalled();
    expect(component.events().length).toBe(1);
    expect(component.events()[0].name).toBe('Tech World 2026');
  });

  it('should filter events when search query changes', () => {
    component.onSearchChange('developer');
    expect(component.searchQuery()).toBe('developer');
    expect(component.pageNumber()).toBe(1);
    expect(eventServiceMock.discover).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'developer' })
    );
  });

  it('should filter events by category', () => {
    component.onCategoryChange('cat-1');
    expect(component.selectedCategoryId()).toBe('cat-1');
    expect(eventServiceMock.discover).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1' })
    );
  });

  it('should filter events by venue', () => {
    component.onVenueChange('venue-1');
    expect(component.selectedVenueId()).toBe('venue-1');
    expect(eventServiceMock.discover).toHaveBeenCalledWith(
      expect.objectContaining({ venueId: 'venue-1' })
    );
  });

  it('should toggle sort direction and reload', () => {
    expect(component.sortDirection()).toBe('asc');
    component.toggleSortDirection();
    expect(component.sortDirection()).toBe('desc');
    expect(eventServiceMock.discover).toHaveBeenCalledWith(
      expect.objectContaining({ sortDirection: 'desc' })
    );
  });

  it('should clear all active filters', () => {
    component.searchQuery.set('Tech');
    component.selectedCategoryId.set('cat-1');
    component.clearFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.selectedCategoryId()).toBe('');
    expect(component.pageNumber()).toBe(1);
    expect(eventServiceMock.discover).toHaveBeenCalled();
  });

  it('should handle API error gracefully', () => {
    eventServiceMock.discover.mockReturnValue(
      throwError(() => ({ message: 'Server offline' }))
    );

    component.loadEvents();
    expect(component.error()).toBe('Server offline');
    expect(component.loading()).toBe(false);
  });

  it('should change page and preserve query parameters', () => {
    eventServiceMock.discover.mockReturnValue(
      of({ ...mockPagedEvents, pageNumber: 2, totalPages: 5 })
    );
    component.totalPages.set(5);
    component.onPageChange(2);
    expect(component.pageNumber()).toBe(2);
    expect(eventServiceMock.discover).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 2 })
    );
  });

  it('should change page size and reset to page 1', () => {
    component.onPageSizeChange(18);
    expect(component.pageSize()).toBe(18);
    expect(component.pageNumber()).toBe(1);
    expect(eventServiceMock.discover).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 18, pageNumber: 1 })
    );
  });
});
