import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegistrationService } from './registration.service';
import { environment } from '../../../environments/environment';
import {
  RegistrationDto,
  CreateRegistrationDto,
  RegistrationQueryDto,
  RegistrationStatus,
  PagedResultDto,
} from '../models';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/registrations`;

  const mockRegistration: RegistrationDto = {
    id: 'reg-1',
    registrationNumber: 'REG-20260913-ABCD1234',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    eventId: 'event-1',
    eventName: 'Tech Summit 2026',
    ticketTypeId: 'ticket-1',
    ticketTypeName: 'VIP Pass',
    quantity: 2,
    totalAmount: 100,
    status: RegistrationStatus.Confirmed,
    registeredAt: '2026-09-13T10:00:00Z',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RegistrationService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(RegistrationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all registrations with query parameters', () => {
    const mockPagedResult: PagedResultDto<RegistrationDto> = {
      items: [mockRegistration],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    const query: RegistrationQueryDto = {
      pageNumber: 1,
      pageSize: 10,
      search: 'Tech',
      status: RegistrationStatus.Confirmed,
      eventId: 'event-1',
    };

    service.getAll(query).subscribe((result) => {
      expect(result).toEqual(mockPagedResult);
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('pageNumber') === '1' &&
      r.params.get('pageSize') === '10' &&
      r.params.get('search') === 'Tech' &&
      r.params.get('status') === '2' &&
      r.params.get('eventId') === 'event-1'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);
  });

  it('should get a registration by ID', () => {
    service.getById('reg-1').subscribe((result) => {
      expect(result).toEqual(mockRegistration);
    });

    const req = httpMock.expectOne(`${baseUrl}/reg-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRegistration);
  });

  it('should get registrations by user ID', () => {
    service.getByUserId('user-1').subscribe((results) => {
      expect(results).toEqual([mockRegistration]);
    });

    const req = httpMock.expectOne(`${baseUrl}/user/user-1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRegistration]);
  });

  it('should get registrations by event ID', () => {
    service.getByEventId('event-1').subscribe((results) => {
      expect(results).toEqual([mockRegistration]);
    });

    const req = httpMock.expectOne(`${baseUrl}/event/event-1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRegistration]);
  });

  it('should create a new registration', () => {
    const dto: CreateRegistrationDto = {
      eventId: 'event-1',
      ticketTypeId: 'ticket-1',
      quantity: 2,
    };

    service.create(dto).subscribe((result) => {
      expect(result).toEqual(mockRegistration);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockRegistration);
  });

  it('should cancel a registration', () => {
    const cancelledRegistration: RegistrationDto = {
      ...mockRegistration,
      status: RegistrationStatus.Cancelled,
    };

    service.cancel('reg-1').subscribe((result) => {
      expect(result.status).toBe(RegistrationStatus.Cancelled);
    });

    const req = httpMock.expectOne(`${baseUrl}/reg-1/cancel`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(cancelledRegistration);
  });
});
