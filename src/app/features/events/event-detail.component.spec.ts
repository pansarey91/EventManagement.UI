import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { EventDetailComponent } from './event-detail.component';
import { EventService } from '../../core/services/event.service';
import { AuthService } from '../../core/services/auth.service';
import { FeedbackService } from '../../core/services/feedback.service';
import { RegistrationService } from '../../core/services/registration.service';
import {
  PublicEventDetailsDto,
  EventStatus,
  RegistrationStatus,
  EventFeedbackSummaryDto,
  PagedResultDto,
  FeedbackDto,
} from '../../core/models';

describe('EventDetailComponent', () => {
  let component: EventDetailComponent;
  let fixture: ComponentFixture<EventDetailComponent>;
  let eventServiceMock: any;
  let authServiceMock: any;
  let feedbackServiceMock: any;
  let registrationServiceMock: any;

  const mockFeedbackSummary: EventFeedbackSummaryDto = {
    eventId: 'test-event-id',
    totalFeedback: 1,
    averageRating: 5.0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 },
  };

  const mockFeedbackList: PagedResultDto<FeedbackDto> = {
    items: [
      {
        id: 'f-1',
        eventId: 'test-event-id',
        userId: 'attendee-1',
        userName: 'Attendee One',
        rating: 5,
        comment: 'Brilliant event!',
        createdAt: '2026-09-13T12:00:00Z',
        updatedAt: null,
      },
    ],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 5,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  const mockDetails: PublicEventDetailsDto = {
    id: 'test-event-id',
    name: 'AI & Cloud Summit',
    description: 'Learn latest AI architectures.',
    categoryId: 'cat-1',
    categoryName: 'Tech',
    venueId: 'venue-1',
    venueName: 'Grand Ballroom',
    venueAddress: '100 Main St',
    venueCity: 'San Francisco',
    venueState: 'CA',
    venueCountry: 'USA',
    venuePostalCode: '94105',
    organizerId: 'org-user-123',
    organizerName: 'Sarah Jenkins',
    startDateTime: '2026-12-01T10:00:00Z',
    endDateTime: '2026-12-01T18:00:00Z',
    registrationDeadline: '2026-11-30T23:59:59Z',
    maxCapacity: 300,
    status: EventStatus.Published,
    bannerImageUrl: 'https://example.com/banner.png',
    minimumTicketPrice: 49.99,
    availableTicketCount: 120,
    averageRating: 4.9,
    totalFeedback: 10,
    isRegistrationOpen: true,
    createdAt: '2026-01-01T00:00:00Z',
    ticketTypes: [
      {
        id: 'ticket-1',
        name: 'General Admission',
        description: 'Standard access',
        price: 49.99,
        availableQuantity: 120,
        isAvailable: true,
      },
    ],
    schedules: [
      {
        id: 'sched-1',
        title: 'Keynote Address',
        description: 'Opening remarks',
        startDateTime: '2026-12-01T10:00:00Z',
        endDateTime: '2026-12-01T11:00:00Z',
        location: 'Auditorium A',
      },
    ],
  };

  beforeEach(async () => {
    eventServiceMock = {
      getPublicDetails: vi.fn().mockReturnValue(of(mockDetails)),
    };

    authServiceMock = {
      isAuthenticated: vi.fn().mockReturnValue(true),
      isAdmin: vi.fn().mockReturnValue(false),
      isOrganizer: vi.fn().mockReturnValue(true),
      getUserId: vi.fn().mockReturnValue('org-user-123'),
    };

    feedbackServiceMock = {
      getRatingSummary: vi.fn().mockReturnValue(of(mockFeedbackSummary)),
      getByEventId: vi.fn().mockReturnValue(of(mockFeedbackList)),
      getMyFeedbackForEvent: vi.fn().mockReturnValue(of(null)),
      delete: vi.fn().mockReturnValue(of(undefined)),
    };

    registrationServiceMock = {
      getByUserId: vi.fn().mockReturnValue(of([
        { eventId: 'test-event-id', status: RegistrationStatus.Confirmed },
      ])),
    };

    await TestBed.configureTestingModule({
      imports: [EventDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EventService, useValue: eventServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: FeedbackService, useValue: feedbackServiceMock },
        { provide: RegistrationService, useValue: registrationServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'test-event-id' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load event details on initialization', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getPublicDetails).toHaveBeenCalledWith('test-event-id');
    expect(component.event()).toEqual(mockDetails);
    expect(component.loading()).toBe(false);
  });

  it('should allow organizer who owns the event to manage it', () => {
    expect(component.canManageEvent()).toBe(true);
  });

  it('should allow admin to manage any event', () => {
    authServiceMock.isAdmin.mockReturnValue(true);
    expect(component.canManageEvent()).toBe(true);
  });

  it('should not allow other non-owner organizers to manage it', () => {
    authServiceMock.getUserId.mockReturnValue('different-user-id');
    expect(component.canManageEvent()).toBe(false);
  });

  it('should handle error when event details cannot be loaded', () => {
    eventServiceMock.getPublicDetails.mockReturnValue(
      throwError(() => ({ message: 'Event not found.' }))
    );

    component.loadEventDetails();
    expect(component.error()).toBe('Event not found.');
    expect(component.loading()).toBe(false);
  });

  it('should open register modal when handleRegisterClick is called by authenticated user', () => {
    expect(component.isRegisterModalOpen()).toBe(false);
    component.handleRegisterClick();
    expect(component.isRegisterModalOpen()).toBe(true);
  });

  it('should close register modal when closeRegisterModal is called', () => {
    component.isRegisterModalOpen.set(true);
    component.closeRegisterModal();
    expect(component.isRegisterModalOpen()).toBe(false);
  });

  it('should reload event details upon successful registration', () => {
    const loadSpy = vi.spyOn(component, 'loadEventDetails');
    component.onRegistrationSuccess({} as any);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should load feedback summary and reviews when event details load', () => {
    expect(feedbackServiceMock.getRatingSummary).toHaveBeenCalledWith('test-event-id');
    expect(feedbackServiceMock.getByEventId).toHaveBeenCalledWith(
      'test-event-id',
      expect.objectContaining({ pageNumber: 1, pageSize: 5 })
    );
    expect(component.feedbackSummary()).toEqual(mockFeedbackSummary);
    expect(component.feedbacks().length).toBe(1);
  });

  it('should evaluate canLeaveFeedback correctly based on event conclusion and registration', () => {
    // Current mockDetails has endDateTime in future (2026-12-01) and Published status -> false
    expect(component.canLeaveFeedback()).toBe(false);

    // Concluded event
    component.event.set({
      ...mockDetails,
      status: EventStatus.Completed,
    });
    expect(component.canLeaveFeedback()).toBe(true);

    // If user already left feedback -> false
    component.myFeedback.set(mockFeedbackList.items[0]);
    expect(component.canLeaveFeedback()).toBe(false);
  });

  it('should filter reviews by rating', () => {
    component.onFilterByRating(5);
    expect(component.feedbackRatingFilter()).toBe(5);
    expect(component.feedbackPage()).toBe(1);
    expect(feedbackServiceMock.getByEventId).toHaveBeenCalledWith(
      'test-event-id',
      expect.objectContaining({ rating: 5, pageNumber: 1 })
    );
  });

  it('should open and close feedback modal', () => {
    expect(component.isFeedbackModalOpen()).toBe(false);
    component.openFeedbackModal();
    expect(component.isFeedbackModalOpen()).toBe(true);
    component.closeFeedbackModal();
    expect(component.isFeedbackModalOpen()).toBe(false);
  });
});
