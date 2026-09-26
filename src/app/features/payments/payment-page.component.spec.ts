import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PaymentPageComponent } from './payment-page.component';
import { RegistrationService } from '../../core/services/registration.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthorizationService } from '../../core/services/authorization.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  RegistrationDto,
  RegistrationStatus,
  PaymentDto,
  PaymentStatus,
} from '../../core/models';

describe('PaymentPageComponent', () => {
  let component: PaymentPageComponent;
  let fixture: ComponentFixture<PaymentPageComponent>;

  let mockRegistrationService: {
    getById: ReturnType<typeof vi.fn>;
  };

  let mockPaymentService: {
    getByRegistrationId: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    markSuccessful: ReturnType<typeof vi.fn>;
    markFailed: ReturnType<typeof vi.fn>;
  };

  let mockAuthzService: {
    isAdmin: ReturnType<typeof vi.fn>;
    isOrganizer: ReturnType<typeof vi.fn>;
  };

  let mockUiFeedback: {
    showSuccess: ReturnType<typeof vi.fn>;
    showError: ReturnType<typeof vi.fn>;
    showWarning: ReturnType<typeof vi.fn>;
  };

  const dummyRegistration: RegistrationDto = {
    id: 'reg-100',
    registrationNumber: 'REG-2026-TEST',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    eventId: 'event-1',
    eventName: 'Annual Tech Summit',
    ticketTypeId: 'ticket-1',
    ticketTypeName: 'VIP Pass',
    quantity: 2,
    totalAmount: 200,
    status: RegistrationStatus.Pending,
    registeredAt: '2026-09-13T10:00:00Z',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
  };

  const dummyPayment: PaymentDto = {
    id: 'pay-100',
    registrationId: 'reg-100',
    amount: 200,
    status: PaymentStatus.Pending,
    paymentMethod: 'Credit Card',
    transactionId: null,
    paidAt: null,
    failureReason: null,
    createdAt: '2026-09-13T10:05:00Z',
    updatedAt: null,
  };

  beforeEach(async () => {
    mockRegistrationService = {
      getById: vi.fn().mockReturnValue(of(dummyRegistration)),
    };

    mockPaymentService = {
      getByRegistrationId: vi.fn().mockReturnValue(of([dummyPayment])),
      create: vi.fn().mockReturnValue(of(dummyPayment)),
      markSuccessful: vi.fn().mockReturnValue(
        of({ ...dummyPayment, status: PaymentStatus.Completed, transactionId: 'TXN-999' })
      ),
      markFailed: vi.fn().mockReturnValue(
        of({ ...dummyPayment, status: PaymentStatus.Failed, failureReason: 'Declined' })
      ),
    };

    mockAuthzService = {
      isAdmin: vi.fn().mockReturnValue(false),
      isOrganizer: vi.fn().mockReturnValue(false),
    };

    mockUiFeedback = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PaymentPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'registrationId' ? 'reg-100' : null),
              },
            },
          },
        },
        { provide: RegistrationService, useValue: mockRegistrationService },
        { provide: PaymentService, useValue: mockPaymentService },
        { provide: AuthorizationService, useValue: mockAuthzService },
        { provide: UiFeedbackService, useValue: mockUiFeedback },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentPageComponent);
    component = fixture.componentInstance;
  });

  it('should create and load registration and payments on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(mockRegistrationService.getById).toHaveBeenCalledWith('reg-100');
    expect(mockPaymentService.getByRegistrationId).toHaveBeenCalledWith('reg-100');
    expect(component.registration()).toEqual(dummyRegistration);
    expect(component.payments().length).toBe(1);
    expect(component.pendingPayment()).toEqual(dummyPayment);
  });

  it('should handle registration load error properly', () => {
    mockRegistrationService.getById.mockReturnValue(
      throwError(() => ({ error: { message: 'Not found' } }))
    );

    fixture.detectChanges();

    expect(component.pageError()).toBe('Not found');
    expect(component.loading()).toBe(false);
  });

  it('should allow user to initiate payment', () => {
    // Start with no existing payments
    mockPaymentService.getByRegistrationId.mockReturnValue(of([]));
    fixture.detectChanges();

    expect(component.pendingPayment()).toBeNull();

    component.selectedMethod.set('UPI');
    component.submitPayment();

    expect(mockPaymentService.create).toHaveBeenCalledWith({
      registrationId: 'reg-100',
      paymentMethod: 'UPI',
    });
    expect(mockUiFeedback.showSuccess).toHaveBeenCalled();
  });

  it('should refresh payment status when check status is clicked', () => {
    fixture.detectChanges();

    component.refreshPaymentStatus();

    expect(mockRegistrationService.getById).toHaveBeenCalledWith('reg-100');
    expect(mockPaymentService.getByRegistrationId).toHaveBeenCalledWith('reg-100');
  });

  it('should allow organizer to mark payment as successful', () => {
    mockAuthzService.isOrganizer.mockReturnValue(true);
    fixture.detectChanges();

    expect(component.canVerify()).toBe(true);

    component.markSuccessful('pay-100');

    expect(mockPaymentService.markSuccessful).toHaveBeenCalledWith('pay-100');
    expect(component.registration()?.status).toBe(RegistrationStatus.Confirmed);
    expect(mockUiFeedback.showSuccess).toHaveBeenCalled();
  });

  it('should allow organizer to mark payment as failed', () => {
    mockAuthzService.isAdmin.mockReturnValue(true);
    fixture.detectChanges();

    component.openFailModal(dummyPayment);
    expect(component.failModalOpen()).toBe(true);

    component.failReason = 'UTR number mismatch';
    component.confirmFailPayment();

    expect(mockPaymentService.markFailed).toHaveBeenCalledWith('pay-100', {
      failureReason: 'UTR number mismatch',
    });
    expect(component.failModalOpen()).toBe(false);
    expect(mockUiFeedback.showWarning).toHaveBeenCalled();
  });
});
