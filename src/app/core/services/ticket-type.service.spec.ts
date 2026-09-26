import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TicketTypeService } from './ticket-type.service';
import { TicketTypeDto, CreateTicketTypeDto, UpdateTicketTypeDto } from '../models';
import { environment } from '../../../environments/environment';

describe('TicketTypeService', () => {
  let service: TicketTypeService;
  let httpMock: HttpTestingController;

  const mockTicket: TicketTypeDto = {
    id: 'ticket-1',
    eventId: 'event-1',
    name: 'General Admission',
    description: 'Access to main hall',
    price: 50,
    totalQuantity: 100,
    availableQuantity: 100,
    saleStartDate: '2026-10-01T00:00:00Z',
    saleEndDate: '2026-10-10T00:00:00Z',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TicketTypeService,
      ],
    });

    service = TestBed.inject(TicketTypeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve ticket types by event ID', () => {
    service.getByEventId('event-1').subscribe((res) => {
      expect(res).toEqual([mockTicket]);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/events/event-1/tickettypes`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTicket]);
  });

  it('should retrieve ticket type by ID', () => {
    service.getById('ticket-1').subscribe((res) => {
      expect(res).toEqual(mockTicket);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tickettypes/ticket-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTicket);
  });

  it('should create new ticket type', () => {
    const createDto: CreateTicketTypeDto = {
      eventId: 'event-1',
      name: 'VIP Pass',
      price: 150,
      totalQuantity: 20,
      isActive: true,
    };

    service.create(createDto).subscribe((res) => {
      expect(res.name).toBe('VIP Pass');
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tickettypes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createDto);
    req.flush({ ...mockTicket, name: 'VIP Pass', price: 150, totalQuantity: 20 });
  });

  it('should update ticket type', () => {
    const updateDto: UpdateTicketTypeDto = {
      name: 'General Admission Updated',
      price: 60,
      totalQuantity: 120,
      isActive: true,
    };

    service.update('ticket-1', updateDto).subscribe((res) => {
      expect(res.name).toBe('General Admission Updated');
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tickettypes/ticket-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateDto);
    req.flush({ ...mockTicket, ...updateDto });
  });

  it('should delete ticket type', () => {
    service.delete('ticket-1').subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tickettypes/ticket-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should toggle active status', () => {
    service.toggleStatus(mockTicket).subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/tickettypes/ticket-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.isActive).toBe(false);
    req.flush({ ...mockTicket, isActive: false });
  });
});
