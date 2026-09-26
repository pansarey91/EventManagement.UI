import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventService } from './event.service';
import { environment } from '../../../environments/environment';
import {
  EventDto,
  PublicEventDto,
  PublicEventDetailsDto,
  CreateEventDto,
  UpdateEventDto,
  EventStatus,
  PagedResultDto,
} from '../models';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  const mockPublicEvent: PublicEventDto = {
    id: 'event-1',
    name: 'Tech Summit 2026',
    description: 'Annual technology conference',
    categoryId: 'cat-1',
    categoryName: 'Technology',
    venueId: 'venue-1',
    venueName: 'Grand Expo Center',
    venueCity: 'Chicago',
    organizerId: 'org-1',
    organizerName: 'Alice Smith',
    startDateTime: '2026-10-15T09:00:00Z',
    endDateTime: '2026-10-17T18:00:00Z',
    registrationDeadline: '2026-10-10T23:59:59Z',
    maxCapacity: 500,
    status: EventStatus.Published,
    bannerImageUrl: 'https://example.com/banner.jpg',
    minimumTicketPrice: 49.99,
    availableTicketCount: 350,
    averageRating: 4.8,
    totalFeedback: 42,
    isRegistrationOpen: true,
    createdAt: '2026-01-01T10:00:00Z',
  };

  const mockEventDto: EventDto = {
    id: 'event-1',
    name: 'Tech Summit 2026',
    description: 'Annual technology conference',
    categoryId: 'cat-1',
    categoryName: 'Technology',
    venueId: 'venue-1',
    venueName: 'Grand Expo Center',
    organizerId: 'org-1',
    organizerName: 'Alice Smith',
    startDateTime: '2026-10-15T09:00:00Z',
    endDateTime: '2026-10-17T18:00:00Z',
    registrationDeadline: '2026-10-10T23:59:59Z',
    maxCapacity: 500,
    status: EventStatus.Draft,
    bannerImageUrl: 'https://example.com/banner.jpg',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: null,
  };

  const mockPublicDetails: PublicEventDetailsDto = {
    ...mockPublicEvent,
    venueAddress: '100 Exhibition Blvd',
    venueState: 'IL',
    venueCountry: 'USA',
    venuePostalCode: '60601',
    ticketTypes: [
      {
        id: 'ticket-1',
        name: 'General Admission',
        description: 'Standard access ticket',
        price: 49.99,
        availableQuantity: 350,
        saleStartDate: '2026-01-10T00:00:00Z',
        saleEndDate: '2026-10-10T00:00:00Z',
        isAvailable: true,
      },
    ],
    schedules: [
      {
        id: 'sched-1',
        title: 'Opening Keynote',
        description: 'Welcome and keynote address',
        startDateTime: '2026-10-15T09:30:00Z',
        endDateTime: '2026-10-15T11:00:00Z',
        location: 'Main Auditorium',
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EventService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should discover public events with query parameters', () => {
    const pagedResult: PagedResultDto<PublicEventDto> = {
      items: [mockPublicEvent],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    let result: PagedResultDto<PublicEventDto> | undefined;
    service.discover({ search: 'Tech', categoryId: 'cat-1', upcomingOnly: true }).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/events/discover?search=Tech&categoryId=cat-1&upcomingOnly=true`
    );
    expect(req.request.method).toBe('GET');
    req.flush(pagedResult);

    expect(result).toEqual(pagedResult);
  });

  it('should get public event details by id', () => {
    let result: PublicEventDetailsDto | undefined;
    service.getPublicDetails('event-1').subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1/public`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPublicDetails);

    expect(result).toEqual(mockPublicDetails);
  });

  it('should get management events list with query params', () => {
    const pagedResult: PagedResultDto<EventDto> = {
      items: [mockEventDto],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    let result: PagedResultDto<EventDto> | undefined;
    service.getAll({ status: EventStatus.Draft, pageNumber: 1, pageSize: 10 }).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/events?pageNumber=1&pageSize=10&status=1`
    );
    expect(req.request.method).toBe('GET');
    req.flush(pagedResult);

    expect(result).toEqual(pagedResult);
  });

  it('should get event by id for management', () => {
    let result: EventDto | undefined;
    service.getById('event-1').subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEventDto);

    expect(result).toEqual(mockEventDto);
  });

  it('should create an event via POST /api/events', () => {
    const createDto: CreateEventDto = {
      name: 'Tech Summit 2026',
      description: 'Annual conference',
      categoryId: 'cat-1',
      venueId: 'venue-1',
      startDateTime: '2026-10-15T09:00:00Z',
      endDateTime: '2026-10-17T18:00:00Z',
      maxCapacity: 500,
    };

    let result: EventDto | undefined;
    service.create(createDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/events`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockEventDto);

    expect(result).toEqual(mockEventDto);
  });

  it('should update an event via PUT /api/events/:id', () => {
    const updateDto: UpdateEventDto = {
      name: 'Tech Summit 2026 Updated',
      categoryId: 'cat-1',
      venueId: 'venue-1',
      startDateTime: '2026-10-15T09:00:00Z',
      endDateTime: '2026-10-17T18:00:00Z',
      maxCapacity: 600,
    };

    let result: EventDto | undefined;
    service.update('event-1', updateDto).subscribe((res) => {
      result = res;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush({ ...mockEventDto, name: 'Tech Summit 2026 Updated', maxCapacity: 600 });

    expect(result?.name).toBe('Tech Summit 2026 Updated');
  });

  it('should delete an event via DELETE /api/events/:id', () => {
    let completed = false;
    service.delete('event-1').subscribe(() => {
      completed = true;
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });

  it('should execute lifecycle transition endpoints', () => {
    // Publish
    service.publish('event-1').subscribe();
    const reqPublish = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1/publish`);
    expect(reqPublish.request.method).toBe('POST');
    reqPublish.flush({ ...mockEventDto, status: EventStatus.Published });

    // Start
    service.start('event-1').subscribe();
    const reqStart = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1/start`);
    expect(reqStart.request.method).toBe('POST');
    reqStart.flush({ ...mockEventDto, status: EventStatus.Ongoing });

    // Complete
    service.complete('event-1').subscribe();
    const reqComplete = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1/complete`);
    expect(reqComplete.request.method).toBe('POST');
    reqComplete.flush({ ...mockEventDto, status: EventStatus.Completed });

    // Cancel
    service.cancel('event-1').subscribe();
    const reqCancel = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1/cancel`);
    expect(reqCancel.request.method).toBe('POST');
    reqCancel.flush({ ...mockEventDto, status: EventStatus.Cancelled });
  });
});
