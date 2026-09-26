import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { environment } from '../../../environments/environment';
import {
  PaymentDto,
  CreatePaymentDto,
  MarkPaymentFailedDto,
  PaymentQueryDto,
  PaymentStatus,
  PagedResultDto,
} from '../models';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/payments`;

  const mockPayment: PaymentDto = {
    id: 'pay-1',
    registrationId: 'reg-1',
    amount: 150,
    status: PaymentStatus.Pending,
    paymentMethod: 'Credit Card',
    transactionId: null,
    paidAt: null,
    failureReason: null,
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PaymentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all payments with query parameters', () => {
    const mockPagedResult: PagedResultDto<PaymentDto> = {
      items: [mockPayment],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    const query: PaymentQueryDto = {
      pageNumber: 1,
      pageSize: 10,
      registrationId: 'reg-1',
      eventId: 'event-1',
      userId: 'user-1',
      status: PaymentStatus.Pending,
      paymentMethod: 'Credit Card',
    };

    service.getAll(query).subscribe((result) => {
      expect(result).toEqual(mockPagedResult);
    });

    const req = httpMock.expectOne((r) =>
      r.url === baseUrl &&
      r.params.get('pageNumber') === '1' &&
      r.params.get('pageSize') === '10' &&
      r.params.get('registrationId') === 'reg-1' &&
      r.params.get('eventId') === 'event-1' &&
      r.params.get('userId') === 'user-1' &&
      r.params.get('status') === '1' &&
      r.params.get('paymentMethod') === 'Credit Card'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPagedResult);
  });

  it('should get a payment by ID', () => {
    service.getById('pay-1').subscribe((result) => {
      expect(result).toEqual(mockPayment);
    });

    const req = httpMock.expectOne(`${baseUrl}/pay-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPayment);
  });

  it('should get payments by registration ID', () => {
    service.getByRegistrationId('reg-1').subscribe((results) => {
      expect(results).toEqual([mockPayment]);
    });

    const req = httpMock.expectOne(`${baseUrl}/registration/reg-1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPayment]);
  });

  it('should create a new payment', () => {
    const dto: CreatePaymentDto = {
      registrationId: 'reg-1',
      paymentMethod: 'UPI',
    };

    service.create(dto).subscribe((result) => {
      expect(result).toEqual(mockPayment);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(mockPayment);
  });

  it('should mark a payment as successful', () => {
    const completedPayment: PaymentDto = {
      ...mockPayment,
      status: PaymentStatus.Completed,
      transactionId: 'TXN-123456',
      paidAt: '2026-09-13T10:05:00Z',
    };

    service.markSuccessful('pay-1').subscribe((result) => {
      expect(result.status).toBe(PaymentStatus.Completed);
      expect(result.transactionId).toBe('TXN-123456');
    });

    const req = httpMock.expectOne(`${baseUrl}/pay-1/success`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush(completedPayment);
  });

  it('should mark a payment as failed', () => {
    const failDto: MarkPaymentFailedDto = {
      failureReason: 'Insufficient funds / decline',
    };

    const failedPayment: PaymentDto = {
      ...mockPayment,
      status: PaymentStatus.Failed,
      failureReason: failDto.failureReason,
    };

    service.markFailed('pay-1', failDto).subscribe((result) => {
      expect(result.status).toBe(PaymentStatus.Failed);
      expect(result.failureReason).toBe(failDto.failureReason);
    });

    const req = httpMock.expectOne(`${baseUrl}/pay-1/fail`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(failDto);
    req.flush(failedPayment);
  });
});
