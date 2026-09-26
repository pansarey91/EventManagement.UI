import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TicketService } from './ticket.service';
import { environment } from '../../../environments/environment';
import {
  EventTicketDto,
  TicketStatus,
  ValidateTicketQrDto,
  TicketValidationResultDto,
} from '../models';

describe('TicketService', () => {
  let service: TicketService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/tickets`;

  const dummyTicket: EventTicketDto = {
    id: 'tkt-1',
    registrationId: 'reg-1',
    ticketNumber: 'TKT-20260913-ABCD1234',
    qrToken: 'qr-token-uuid-1',
    status: TicketStatus.Active,
    usedAt: null,
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
    eventId: 'event-1',
    eventName: 'Annual Tech Summit',
    eventStartDateTime: '2026-10-15T09:00:00Z',
    eventEndDateTime: '2026-10-15T18:00:00Z',
    venueName: 'Grand Convention Center',
    ticketTypeId: 'tt-1',
    ticketTypeName: 'VIP Pass',
    ticketPrice: 150,
    registrationNumber: 'REG-20260913-9999',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TicketService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TicketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all tickets for authenticated user', () => {
    service.getMyTickets().subscribe((tickets) => {
      expect(tickets).toEqual([dummyTicket]);
    });

    const req = httpMock.expectOne(`${baseUrl}/my-tickets`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyTicket]);
  });

  it('should get a ticket by its ID', () => {
    service.getById('tkt-1').subscribe((ticket) => {
      expect(ticket).toEqual(dummyTicket);
    });

    const req = httpMock.expectOne(`${baseUrl}/tkt-1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyTicket);
  });

  it('should get a ticket by ticket code', () => {
    service.getByTicketCode('TKT-20260913-ABCD1234').subscribe((ticket) => {
      expect(ticket).toEqual(dummyTicket);
    });

    const req = httpMock.expectOne(`${baseUrl}/code/TKT-20260913-ABCD1234`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyTicket);
  });

  it('should get tickets by registration ID', () => {
    service.getByRegistrationId('reg-1').subscribe((tickets) => {
      expect(tickets).toEqual([dummyTicket]);
    });

    const req = httpMock.expectOne(`${baseUrl}/registration/reg-1`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyTicket]);
  });

  it('should get tickets by event ID', () => {
    service.getByEventId('event-1').subscribe((tickets) => {
      expect(tickets).toEqual([dummyTicket]);
    });

    const req = httpMock.expectOne(`${baseUrl}/event/event-1`);
    expect(req.request.method).toBe('GET');
    req.flush([dummyTicket]);
  });

  it('should trigger ticket generation for registration', () => {
    service.generateTickets('reg-1').subscribe((tickets) => {
      expect(tickets).toEqual([dummyTicket]);
    });

    const req = httpMock.expectOne(
      `${environment.apiBaseUrl}/registrations/reg-1/tickets/generate`
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush([dummyTicket]);
  });

  it('should get QR code as a Blob', () => {
    const mockBlob = new Blob(['fake-png-bytes'], { type: 'image/png' });

    service.getQrCodeBlob('tkt-1').subscribe((blob) => {
      expect(blob).toEqual(mockBlob);
    });

    const req = httpMock.expectOne(`${baseUrl}/tkt-1/qr`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });

  it('should validate ticket QR token', () => {
    const dto: ValidateTicketQrDto = {
      qrToken: 'qr-token-uuid-1',
      eventId: 'event-1',
    };

    const mockResult: TicketValidationResultDto = {
      isValid: true,
      message: 'Ticket is valid for admission.',
      ticket: dummyTicket,
    };

    service.validateTicket(dto).subscribe((result) => {
      expect(result).toEqual(mockResult);
    });

    const req = httpMock.expectOne(`${baseUrl}/validate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockResult);
  });
});
