import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrganizerTicketTypesComponent } from './organizer-ticket-types.component';
import { TicketTypeService } from '../../core/services/ticket-type.service';
import { EventService } from '../../core/services/event.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { TicketTypeDto, EventDto, EventStatus } from '../../core/models';

describe('OrganizerTicketTypesComponent', () => {
  let component: OrganizerTicketTypesComponent;
  let fixture: ComponentFixture<OrganizerTicketTypesComponent>;
  let ticketTypeServiceMock: any;
  let eventServiceMock: any;
  let uiFeedbackMock: any;

  const mockEvent: EventDto = {
    id: 'event-123',
    name: 'Tech Conference 2026',
    description: 'Premier developer event',
    categoryId: 'cat-1',
    venueId: 'venue-1',
    venueName: 'Center Stage',
    organizerId: 'org-1',
    organizerName: 'Tech Host',
    startDateTime: '2026-11-20T09:00:00Z',
    endDateTime: '2026-11-20T17:00:00Z',
    maxCapacity: 100,
    status: EventStatus.Published,
    bannerImageUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockTickets: TicketTypeDto[] = [
    {
      id: 'ticket-1',
      eventId: 'event-123',
      name: 'General Admission',
      description: 'Standard hall access',
      price: 50,
      totalQuantity: 40,
      availableQuantity: 30, // 10 sold
      saleStartDate: '2026-10-01T00:00:00Z',
      saleEndDate: '2026-11-15T00:00:00Z',
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'ticket-2',
      eventId: 'event-123',
      name: 'VIP',
      description: 'Front row + lunch',
      price: 150,
      totalQuantity: 20,
      availableQuantity: 20,
      saleStartDate: '2026-10-01T00:00:00Z',
      saleEndDate: '2026-11-15T00:00:00Z',
      isActive: false,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(async () => {
    ticketTypeServiceMock = {
      getByEventId: vi.fn().mockReturnValue(of(mockTickets)),
      create: vi.fn().mockReturnValue(of({ ...mockTickets[0], id: 'ticket-3', name: 'New Tier' })),
      update: vi.fn().mockReturnValue(of({ ...mockTickets[0], name: 'Updated Tier' })),
      delete: vi.fn().mockReturnValue(of(void 0)),
      toggleStatus: vi.fn().mockReturnValue(of({ ...mockTickets[0], isActive: false })),
    };

    eventServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockEvent)),
    };

    uiFeedbackMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
      showInfo: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [OrganizerTicketTypesComponent],
      providers: [
        provideRouter([]),
        { provide: TicketTypeService, useValue: ticketTypeServiceMock },
        { provide: EventService, useValue: eventServiceMock },
        { provide: UiFeedbackService, useValue: uiFeedbackMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'eventId' ? 'event-123' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizerTicketTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load event context and ticket types', () => {
    expect(component).toBeTruthy();
    expect(eventServiceMock.getById).toHaveBeenCalledWith('event-123');
    expect(ticketTypeServiceMock.getByEventId).toHaveBeenCalledWith('event-123');
    expect(component.event()).toEqual(mockEvent);
    expect(component.ticketTypes().length).toBe(2);
    expect(component.allocatedTickets()).toBe(60);
    expect(component.remainingCapacity()).toBe(40);
  });

  it('should open create modal with default values and precalculated remaining capacity', () => {
    component.openCreateModal();
    expect(component.formModalOpen()).toBe(true);
    expect(component.editingTicketId()).toBeNull();
    expect(component.ticketForm.get('totalQuantity')?.value).toBe(40); // remaining capacity is 40
    expect(component.ticketForm.get('isActive')?.value).toBe(true);
  });

  it('should submit valid new ticket type and refresh list', () => {
    component.openCreateModal();
    component.ticketForm.patchValue({
      name: 'Workshop Pass',
      price: 25,
      totalQuantity: 15,
    });

    component.onFormSubmit();

    expect(ticketTypeServiceMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: 'event-123',
        name: 'Workshop Pass',
        price: 25,
        totalQuantity: 15,
      })
    );
    expect(uiFeedbackMock.showSuccess).toHaveBeenCalled();
    expect(component.formModalOpen()).toBe(false);
  });

  it('should open edit modal and patch existing values', () => {
    component.openEditModal(mockTickets[0]);
    expect(component.formModalOpen()).toBe(true);
    expect(component.editingTicketId()).toBe('ticket-1');
    expect(component.ticketForm.get('name')?.value).toBe('General Admission');
    expect(component.ticketForm.get('price')?.value).toBe(50);
  });

  it('should prevent reducing totalQuantity below consumed tickets in edit mode', () => {
    component.openEditModal(mockTickets[0]); // 10 consumed (40 - 30)
    component.ticketForm.patchValue({
      totalQuantity: 5, // Below 10 consumed
    });

    expect(component.ticketForm.errors?.['belowConsumed']).toBeTruthy();
  });

  it('should prevent exceeding total event capacity', () => {
    component.openCreateModal(); // other tickets have 60 total, maxCapacity is 100
    component.ticketForm.patchValue({
      totalQuantity: 50, // 60 + 50 = 110 > 100
    });

    expect(component.ticketForm.errors?.['exceedsEventCapacity']).toBeTruthy();
  });

  it('should toggle active status and show notification', () => {
    component.toggleActiveStatus(mockTickets[0]);
    expect(ticketTypeServiceMock.toggleStatus).toHaveBeenCalledWith(mockTickets[0]);
    expect(uiFeedbackMock.showSuccess).toHaveBeenCalled();
  });

  it('should prompt delete and execute upon confirmation', () => {
    component.promptDelete(mockTickets[0]);
    expect(component.deleteModalOpen()).toBe(true);
    expect(component.ticketToDelete()).toEqual(mockTickets[0]);

    component.confirmDelete();
    expect(ticketTypeServiceMock.delete).toHaveBeenCalledWith('ticket-1');
    expect(uiFeedbackMock.showSuccess).toHaveBeenCalled();
    expect(component.deleteModalOpen()).toBe(false);
  });

  it('should handle delete error when registrations exist', () => {
    ticketTypeServiceMock.delete.mockReturnValue(
      throwError(() => ({ message: 'Cannot delete ticket type because it has existing registrations.' }))
    );

    component.promptDelete(mockTickets[0]);
    component.confirmDelete();

    expect(uiFeedbackMock.showError).toHaveBeenCalledWith(
      expect.stringContaining('existing registrations')
    );
    expect(component.actionLoading()).toBe(false);
  });
});
