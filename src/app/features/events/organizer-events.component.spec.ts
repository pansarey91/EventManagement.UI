import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganizerEventsComponent } from './organizer-events.component';
import { EventService } from '../../core/services/event.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { EventDto, EventStatus, PagedResultDto } from '../../core/models';

describe('OrganizerEventsComponent', () => {
  let component: OrganizerEventsComponent;
  let fixture: ComponentFixture<OrganizerEventsComponent>;
  let eventServiceMock: any;
  let uiFeedbackMock: any;

  const mockDraftEvent: EventDto = {
    id: 'draft-event-id',
    name: 'Draft Workshop',
    description: 'Upcoming draft',
    categoryId: 'cat-1',
    categoryName: 'Workshop',
    venueId: 'venue-1',
    venueName: 'Room A',
    organizerId: 'org-1',
    organizerName: 'Host User',
    startDateTime: '2026-12-10T09:00:00Z',
    endDateTime: '2026-12-10T17:00:00Z',
    registrationDeadline: null,
    maxCapacity: 50,
    status: EventStatus.Draft,
    bannerImageUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockPagedEvents: PagedResultDto<EventDto> = {
    items: [mockDraftEvent],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 1,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };

  beforeEach(async () => {
    eventServiceMock = {
      getAll: vi.fn().mockReturnValue(of(mockPagedEvents)),
      publish: vi.fn().mockReturnValue(of({ ...mockDraftEvent, status: EventStatus.Published })),
      start: vi.fn().mockReturnValue(of({ ...mockDraftEvent, status: EventStatus.Ongoing })),
      complete: vi.fn().mockReturnValue(of({ ...mockDraftEvent, status: EventStatus.Completed })),
      cancel: vi.fn().mockReturnValue(of({ ...mockDraftEvent, status: EventStatus.Cancelled })),
      delete: vi.fn().mockReturnValue(of(void 0)),
    };

    uiFeedbackMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganizerEventsComponent],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceMock },
        { provide: UiFeedbackService, useValue: uiFeedbackMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and fetch organizer events on init', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getAll).toHaveBeenCalled();
    expect(component.events().length).toBe(1);
    expect(component.events()[0].name).toBe('Draft Workshop');
  });

  it('should filter by status and reload events', () => {
    component.onStatusChange(String(EventStatus.Draft));
    expect(component.statusFilter()).toBe(String(EventStatus.Draft));
    expect(eventServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: EventStatus.Draft })
    );
  });

  it('should prompt action modal for publishing draft event', () => {
    component.promptAction(mockDraftEvent, 'publish');
    expect(component.actionModal().isOpen).toBe(true);
    expect(component.actionModal().action).toBe('publish');
    expect(component.actionModal().title).toBe('Publish Event');
  });

  it('should execute publish action on confirmation and show success toast', () => {
    component.promptAction(mockDraftEvent, 'publish');
    component.confirmAction();

    expect(eventServiceMock.publish).toHaveBeenCalledWith('draft-event-id');
    expect(uiFeedbackMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('published successfully')
    );
    expect(component.actionModal().isOpen).toBe(false);
  });

  it('should execute delete action on confirmation', () => {
    component.promptAction(mockDraftEvent, 'delete');
    component.confirmAction();

    expect(eventServiceMock.delete).toHaveBeenCalledWith('draft-event-id');
    expect(uiFeedbackMock.showSuccess).toHaveBeenCalledWith(
      expect.stringContaining('has been deleted')
    );
  });

  it('should handle action error and display error toast', () => {
    eventServiceMock.publish.mockReturnValue(
      throwError(() => ({ message: 'Cannot publish incomplete event' }))
    );

    component.promptAction(mockDraftEvent, 'publish');
    component.confirmAction();

    expect(uiFeedbackMock.showError).toHaveBeenCalledWith('Cannot publish incomplete event');
    expect(component.actionLoading()).toBe(false);
  });

  it('should search events and reset page to 1', () => {
    component.pageNumber.set(3);
    component.onSearchChange('Hackathon');
    expect(component.searchQuery()).toBe('Hackathon');
    expect(component.pageNumber()).toBe(1);
    expect(eventServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Hackathon', pageNumber: 1 })
    );
  });

  it('should change page when onPageChange is called', () => {
    eventServiceMock.getAll.mockReturnValue(
      of({ ...mockPagedEvents, pageNumber: 2, totalPages: 5 })
    );
    component.totalPages.set(5);
    component.onPageChange(2);
    expect(component.pageNumber()).toBe(2);
    expect(eventServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 2 })
    );
  });

  it('should change page size and reset to page 1', () => {
    component.onPageSizeChange(20);
    expect(component.pageSize()).toBe(20);
    expect(component.pageNumber()).toBe(1);
    expect(eventServiceMock.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ pageSize: 20, pageNumber: 1 })
    );
  });

  it('should clear filters and reset search', () => {
    component.searchQuery.set('Workshop');
    component.statusFilter.set('1');
    component.clearFilters();

    expect(component.searchQuery()).toBe('');
    expect(component.statusFilter()).toBe('');
    expect(component.pageNumber()).toBe(1);
    expect(eventServiceMock.getAll).toHaveBeenCalled();
  });
});
