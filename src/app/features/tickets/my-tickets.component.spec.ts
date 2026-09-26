import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { MyTicketsComponent } from './my-tickets.component';
import { TicketService } from '../../core/services/ticket.service';
import { EventTicketDto, TicketStatus } from '../../core/models';

describe('MyTicketsComponent', () => {
  let component: MyTicketsComponent;
  let fixture: ComponentFixture<MyTicketsComponent>;

  let mockTicketService: {
    getMyTickets: ReturnType<typeof vi.fn>;
    getQrCodeBlob: ReturnType<typeof vi.fn>;
  };

  const dummyTicket1: EventTicketDto = {
    id: 'tkt-101',
    registrationId: 'reg-101',
    ticketNumber: 'TKT-2026-001',
    qrToken: 'qr-uuid-1',
    status: TicketStatus.Active,
    usedAt: null,
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
    eventId: 'event-1',
    eventName: 'Annual Tech Summit',
    eventStartDateTime: '2026-10-15T09:00:00Z',
    eventEndDateTime: '2026-10-15T18:00:00Z',
    venueName: 'Grand Hall',
    ticketTypeId: 'tt-1',
    ticketTypeName: 'VIP Pass',
    ticketPrice: 200,
    registrationNumber: 'REG-101',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
  };

  const dummyTicket2: EventTicketDto = {
    id: 'tkt-102',
    registrationId: 'reg-102',
    ticketNumber: 'TKT-2026-002',
    qrToken: 'qr-uuid-2',
    status: TicketStatus.Used,
    usedAt: '2026-09-13T11:00:00Z',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
    eventId: 'event-2',
    eventName: 'Web Dev Workshop',
    eventStartDateTime: '2026-11-01T10:00:00Z',
    eventEndDateTime: '2026-11-01T16:00:00Z',
    venueName: 'Room 404',
    ticketTypeId: 'tt-2',
    ticketTypeName: 'General Admission',
    ticketPrice: 50,
    registrationNumber: 'REG-102',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
  };

  beforeEach(async () => {
    mockTicketService = {
      getMyTickets: vi.fn().mockReturnValue(of([dummyTicket1, dummyTicket2])),
      getQrCodeBlob: vi.fn().mockReturnValue(of(new Blob(['fake-bytes'], { type: 'image/png' }))),
    };

    await TestBed.configureTestingModule({
      imports: [MyTicketsComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: mockTicketService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyTicketsComponent);
    component = fixture.componentInstance;
  });

  it('should create and load tickets on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockTicketService.getMyTickets).toHaveBeenCalled();
    expect(component.tickets().length).toBe(2);
    expect(component.activeCount()).toBe(1);
    expect(component.usedCount()).toBe(1);
  });

  it('should filter tickets by status properly', () => {
    fixture.detectChanges();

    expect(component.filteredTickets().length).toBe(2);

    component.setStatusFilter(TicketStatus.Active);
    expect(component.filteredTickets().length).toBe(1);
    expect(component.filteredTickets()[0].id).toBe('tkt-101');

    component.setStatusFilter(TicketStatus.Used);
    expect(component.filteredTickets().length).toBe(1);
    expect(component.filteredTickets()[0].id).toBe('tkt-102');

    component.setStatusFilter(TicketStatus.Cancelled);
    expect(component.filteredTickets().length).toBe(0);
  });

  it('should open and close QR modal for a selected ticket', () => {
    fixture.detectChanges();

    expect(component.selectedTicketForQr()).toBeNull();

    component.openQrModal(dummyTicket1);
    expect(component.selectedTicketForQr()).toEqual(dummyTicket1);

    component.closeQrModal();
    expect(component.selectedTicketForQr()).toBeNull();
  });

  it('should handle error when loading tickets fails', () => {
    mockTicketService.getMyTickets.mockReturnValue(
      throwError(() => ({ error: { message: 'Network error' } }))
    );

    fixture.detectChanges();

    expect(component.error()).toBe('Network error');
    expect(component.loading()).toBe(false);
  });
});
