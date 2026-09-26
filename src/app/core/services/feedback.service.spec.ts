import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { FeedbackService } from './feedback.service';
import { environment } from '../../../environments/environment';
import {
  FeedbackDto,
  CreateFeedbackDto,
  UpdateFeedbackDto,
  EventFeedbackSummaryDto,
  PagedResultDto,
} from '../models';

describe('FeedbackService', () => {
  let service: FeedbackService;
  let httpMock: HttpTestingController;

  const mockFeedback: FeedbackDto = {
    id: 'feed-1',
    eventId: 'event-1',
    eventName: 'Cloud Architecture Summit',
    userId: 'user-1',
    userName: 'Jane Doe',
    rating: 5,
    comment: 'Exceptional keynote presentations and networking!',
    createdAt: '2026-09-13T12:00:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeedbackService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(FeedbackService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create feedback via POST', () => {
    const createDto: CreateFeedbackDto = {
      eventId: 'event-1',
      rating: 5,
      comment: 'Exceptional keynote presentations and networking!',
    };

    service.create(createDto).subscribe((result) => {
      expect(result).toEqual(mockFeedback);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/feedback`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush(mockFeedback);
  });

  it('should update feedback via PUT', () => {
    const updateDto: UpdateFeedbackDto = {
      rating: 4,
      comment: 'Updated review content',
    };

    const updatedFeedback: FeedbackDto = {
      ...mockFeedback,
      rating: 4,
      comment: 'Updated review content',
      updatedAt: '2026-09-13T13:00:00Z',
    };

    service.update('feed-1', updateDto).subscribe((result) => {
      expect(result).toEqual(updatedFeedback);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/feedback/feed-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush(updatedFeedback);
  });

  it('should delete feedback via DELETE', () => {
    service.delete('feed-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/feedback/feed-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should get feedback by ID', () => {
    service.getById('feed-1').subscribe((result) => {
      expect(result).toEqual(mockFeedback);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/feedback/feed-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockFeedback);
  });

  it('should get paginated feedback for an event with query parameters', () => {
    const mockPagedResult: PagedResultDto<FeedbackDto> = {
      items: [mockFeedback],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    service
      .getByEventId('event-1', {
        pageNumber: 1,
        pageSize: 10,
        rating: 5,
        search: 'keynote',
        sortBy: 'rating',
        sortDescending: true,
      })
      .subscribe((result) => {
        expect(result).toEqual(mockPagedResult);
      });

    const req = httpMock.expectOne((r) =>
      r.url === `${environment.apiBaseUrl}/events/event-1/feedback` &&
      r.params.get('rating') === '5' &&
      r.params.get('search') === 'keynote' &&
      r.params.get('pageNumber') === '1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);
  });

  it('should get rating summary for an event', () => {
    const mockSummary: EventFeedbackSummaryDto = {
      eventId: 'event-1',
      totalFeedback: 10,
      averageRating: 4.8,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 1,
        4: 1,
        5: 8,
      },
    };

    service.getRatingSummary('event-1').subscribe((result) => {
      expect(result).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/events/event-1/rating-summary`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should get my feedback for an event and return feedback when exists', () => {
    service.getMyFeedbackForEvent('event-1').subscribe((result) => {
      expect(result).toEqual(mockFeedback);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/events/event-1/feedback/my-feedback`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockFeedback);
  });

  it('should get my feedback for an event and return null on 404', () => {
    service.getMyFeedbackForEvent('event-1').subscribe((result) => {
      expect(result).toBeNull();
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/events/event-1/feedback/my-feedback`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
  });

  it('should get all feedback for current user', () => {
    service.getMyFeedback().subscribe((result) => {
      expect(result).toEqual([mockFeedback]);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/feedback/my-feedback`);
    expect(req.request.method).toBe('GET');
    req.flush([mockFeedback]);
  });
});
