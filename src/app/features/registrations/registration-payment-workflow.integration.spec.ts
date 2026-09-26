import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegistrationService } from '../../core/services/registration.service';
import { PaymentService } from '../../core/services/payment.service';
import { environment } from '../../../environments/environment';
import {
  RegistrationDto,
  PaymentDto,
  RegistrationStatus,
  PaymentStatus,
} from '../../core/models';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Registration & Payment Lifecycle Workflow Integration Tests', () => {
  let registrationService: RegistrationService;
  let paymentService: PaymentService;
  let httpTesting: HttpTestingController;

  const mockRegistration: RegistrationDto = {
    id: 'reg-001',
    registrationNumber: 'REG-2026-001',
    userId: 'usr-12345',
    userName: 'Dev Tester',
    userEmail: 'user@eventsync.com',
    eventId: 'evt-100',
    eventName: 'Cloud Architecture Summit',
    ticketTypeId: 'tt-200',
    ticketTypeName: 'General Admission',
    quantity: 2,
    totalAmount: 100,
    status: RegistrationStatus.Pending,
    registeredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const mockPayment: PaymentDto = {
    id: 'pay-001',
    registrationId: 'reg-001',
    amount: 100,
    paymentMethod: 'Credit Card',
    status: PaymentStatus.Completed,
    transactionId: 'TXN-987654',
    failureReason: null,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RegistrationService,
        PaymentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    registrationService = TestBed.inject(RegistrationService);
    paymentService = TestBed.inject(PaymentService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should execute end-to-end flow: create registration -> initiate payment -> mark payment successful', () => {
    // 1. Create Registration
    let createdReg: RegistrationDto | null = null;
    registrationService.create({
      eventId: 'evt-100',
      ticketTypeId: 'tt-200',
      quantity: 2,
    }).subscribe((reg) => {
      createdReg = reg;
    });

    const regReq = httpTesting.expectOne(`${environment.apiBaseUrl}/registrations`);
    expect(regReq.request.method).toBe('POST');
    expect(regReq.request.body).toEqual({
      eventId: 'evt-100',
      ticketTypeId: 'tt-200',
      quantity: 2,
    });
    regReq.flush(mockRegistration);

    expect(createdReg).not.toBeNull();
    expect((createdReg as any).id).toBe('reg-001');
    expect((createdReg as any).status).toBe(RegistrationStatus.Pending);
    expect((createdReg as any).totalAmount).toBe(100);

    // 2. Initiate Payment for the registration
    let createdPay: PaymentDto | null = null;
    paymentService.create({
      registrationId: (createdReg as any).id,
      paymentMethod: 'Credit Card',
    }).subscribe((pay) => {
      createdPay = pay;
    });

    const payReq = httpTesting.expectOne(`${environment.apiBaseUrl}/payments`);
    expect(payReq.request.method).toBe('POST');
    expect(payReq.request.body.registrationId).toBe('reg-001');
    expect(payReq.request.body.paymentMethod).toBe('Credit Card');
    payReq.flush({ ...mockPayment, status: PaymentStatus.Pending });

    expect(createdPay).not.toBeNull();
    expect((createdPay as any).status).toBe(PaymentStatus.Pending);

    // 3. Mark payment successful
    let finalizedPay: PaymentDto | null = null;
    paymentService.markSuccessful((createdPay as any).id).subscribe((pay) => {
      finalizedPay = pay;
    });

    const successReq = httpTesting.expectOne(`${environment.apiBaseUrl}/payments/${(createdPay as any).id}/success`);
    expect(successReq.request.method).toBe('PATCH');
    successReq.flush(mockPayment);

    expect(finalizedPay).not.toBeNull();
    expect((finalizedPay as any).status).toBe(PaymentStatus.Completed);
  });

  it('should handle registration inventory conflict (409 Conflict) without automatic duplicate retries', () => {
    let capturedError: any = null;
    registrationService.create({
      eventId: 'evt-100',
      ticketTypeId: 'tt-200',
      quantity: 5,
    }).subscribe({
      next: () => {},
      error: (err) => {
        capturedError = err;
      },
    });

    const regReq = httpTesting.expectOne(`${environment.apiBaseUrl}/registrations`);
    regReq.flush(
      { statusCode: 409, message: 'Requested quantity exceeds available inventory.' },
      { status: 409, statusText: 'Conflict' }
    );

    expect(capturedError).not.toBeNull();
    expect(capturedError.status).toBe(409);
    expect(capturedError.error.message).toContain('exceeds available inventory');
  });

  it('should cancel registration and restore inventory through PATCH /registrations/:id/cancel', () => {
    let cancelledReg: RegistrationDto | null = null;
    registrationService.cancel('reg-001').subscribe((reg) => {
      cancelledReg = reg;
    });

    const cancelReq = httpTesting.expectOne(`${environment.apiBaseUrl}/registrations/reg-001/cancel`);
    expect(cancelReq.request.method).toBe('PATCH');
    cancelReq.flush({
      ...mockRegistration,
      status: RegistrationStatus.Cancelled,
    });

    expect(cancelledReg).not.toBeNull();
    expect((cancelledReg as any).status).toBe(RegistrationStatus.Cancelled);
  });
});
