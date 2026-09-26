import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EventCreateComponent } from './event-create.component';
import { EventService } from '../../core/services/event.service';
import { CategoryService } from '../../core/services/category.service';
import { VenueService } from '../../core/services/venue.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { EventDto, EventStatus } from '../../core/models';

describe('EventCreateComponent', () => {
  let component: EventCreateComponent;
  let fixture: ComponentFixture<EventCreateComponent>;
  let eventServiceMock: any;
  let categoryServiceMock: any;
  let venueServiceMock: any;
  let uiFeedbackMock: any;
  let router: Router;

  const mockCategories = [
    { id: 'cat-1', name: 'Conference', isActive: true },
  ];

  const mockVenues = [
    { id: 'venue-1', name: 'Center Plaza', city: 'Denver', capacity: 200, isActive: true },
  ];

  const mockExistingEvent: EventDto = {
    id: 'existing-event-id',
    name: 'Tech Conference 2026',
    description: 'Conference details',
    categoryId: 'cat-1',
    venueId: 'venue-1',
    organizerId: 'org-1',
    startDateTime: '2026-12-15T09:00:00Z',
    endDateTime: '2026-12-15T17:00:00Z',
    registrationDeadline: '2026-12-14T23:59:59Z',
    maxCapacity: 150,
    status: EventStatus.Draft,
    bannerImageUrl: 'https://example.com/banner.jpg',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const createComponentWithRouteId = async (id: string | null) => {
    eventServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockExistingEvent)),
      create: vi.fn().mockReturnValue(of(mockExistingEvent)),
      update: vi.fn().mockReturnValue(of(mockExistingEvent)),
    };

    categoryServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ items: mockCategories })),
    };

    venueServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ items: mockVenues })),
    };

    uiFeedbackMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [EventCreateComponent],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceMock },
        { provide: CategoryService, useValue: categoryServiceMock },
        { provide: VenueService, useValue: venueServiceMock },
        { provide: UiFeedbackService, useValue: uiFeedbackMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? id : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(EventCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await createComponentWithRouteId(null);
    });

    it('should initialize form in create mode with default values', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode()).toBe(false);
      expect(component.eventForm.get('name')?.value).toBe('');
      expect(component.eventForm.get('maxCapacity')?.value).toBe(100);
      expect(categoryServiceMock.getAll).toHaveBeenCalled();
      expect(venueServiceMock.getAll).toHaveBeenCalled();
    });

    it('should validate that endDateTime must be after startDateTime', () => {
      component.eventForm.patchValue({
        startDateTime: '2026-10-15T12:00',
        endDateTime: '2026-10-15T10:00',
      });

      expect(component.eventForm.errors?.['endBeforeStart']).toBe(true);
    });

    it('should validate that maxCapacity does not exceed venue capacity', () => {
      component.eventForm.patchValue({
        venueId: 'venue-1',
        maxCapacity: 250, // Venue capacity is 200
      });

      expect(component.eventForm.errors?.['capacityExceedsVenue']).toBeTruthy();
    });

    it('should submit valid new event and redirect', () => {
      component.eventForm.patchValue({
        name: 'New Great Event',
        categoryId: 'cat-1',
        venueId: 'venue-1',
        startDateTime: '2026-10-15T09:00',
        endDateTime: '2026-10-15T17:00',
        maxCapacity: 150,
      });

      component.onSubmit();

      expect(eventServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Great Event',
          categoryId: 'cat-1',
          venueId: 'venue-1',
          maxCapacity: 150,
        })
      );
      expect(uiFeedbackMock.showSuccess).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/organizer/events']);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await createComponentWithRouteId('existing-event-id');
    });

    it('should load and patch existing event details into form', () => {
      expect(component.isEditMode()).toBe(true);
      expect(eventServiceMock.getById).toHaveBeenCalledWith('existing-event-id');
      expect(component.eventForm.get('name')?.value).toBe('Tech Conference 2026');
      expect(component.eventForm.get('maxCapacity')?.value).toBe(150);
    });

    it('should submit updated event and redirect', () => {
      component.eventForm.patchValue({
        name: 'Tech Conference 2026 Updated',
      });

      component.onSubmit();

      expect(eventServiceMock.update).toHaveBeenCalledWith(
        'existing-event-id',
        expect.objectContaining({
          name: 'Tech Conference 2026 Updated',
        })
      );
      expect(uiFeedbackMock.showSuccess).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/organizer/events']);
    });
  });
});
