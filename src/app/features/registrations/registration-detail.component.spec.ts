import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegistrationDetailComponent } from './registration-detail.component';
import { RegistrationService } from '../../core/services/registration.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { RegistrationDto, RegistrationStatus } from '../../core/models';

import { PaymentService } from '../../core/services/payment.service';

describe('RegistrationDetailComponent', () => {
  let component: RegistrationDetailComponent;
  let fixture: ComponentFixture<RegistrationDetailComponent>;
  let registrationServiceMock: { getById: any; cancel: any };
  let paymentServiceMock: { getByRegistrationId: any };
  let feedbackServiceMock: { showSuccess: any; showError: any };

  const mockRegistration: RegistrationDto = {
    id: 'reg-xyz',
    registrationNumber: 'REG-20261015-TEST9999',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john@example.com',
    eventId: 'event-1',
    eventName: 'Global AI Summit 2026',
    ticketTypeId: 'ticket-1',
    ticketTypeName: 'VIP Pass',
    quantity: 2,
    totalAmount: 300,
    status: RegistrationStatus.Confirmed,
    registeredAt: '2026-09-13T10:00:00Z',
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
  };

  beforeEach(async () => {
    registrationServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockRegistration)),
      cancel: vi.fn(),
    };
    paymentServiceMock = {
      getByRegistrationId: vi.fn().mockReturnValue(of([])),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegistrationDetailComponent],
      providers: [
        provideRouter([]),
        { provide: RegistrationService, useValue: registrationServiceMock },
        { provide: PaymentService, useValue: paymentServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'reg-xyz' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load registration details on init', () => {
    expect(component).toBeTruthy();
    expect(registrationServiceMock.getById).toHaveBeenCalledWith('reg-xyz');
    expect(component.registration()).toEqual(mockRegistration);
    expect(component.loading()).toBe(false);
  });

  it('should open and close cancellation modal', () => {
    expect(component.isCancelModalOpen()).toBe(false);

    component.openCancelModal();
    expect(component.isCancelModalOpen()).toBe(true);

    component.closeCancelModal();
    expect(component.isCancelModalOpen()).toBe(false);
  });

  it('should cancel registration and update state', () => {
    const cancelledReg: RegistrationDto = {
      ...mockRegistration,
      status: RegistrationStatus.Cancelled,
    };
    registrationServiceMock.cancel.mockReturnValue(of(cancelledReg));

    component.openCancelModal();
    component.confirmCancellation();

    expect(registrationServiceMock.cancel).toHaveBeenCalledWith('reg-xyz');
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalled();
    expect(component.isCancelModalOpen()).toBe(false);
    expect(component.registration()?.status).toBe(RegistrationStatus.Cancelled);
  });

  it('should handle cancel error and display notification', () => {
    registrationServiceMock.cancel.mockReturnValue(
      throwError(() => ({ error: { message: 'Cancellation window expired.' } }))
    );

    component.openCancelModal();
    component.confirmCancellation();

    expect(component.isCancelling()).toBe(false);
    expect(feedbackServiceMock.showError).toHaveBeenCalledWith('Cancellation window expired.');
  });

  it('should handle load error gracefully', () => {
    registrationServiceMock.getById.mockReturnValue(
      throwError(() => ({ message: 'Not found' }))
    );

    component.loadRegistration();
    expect(component.error()).toBe('Not found');
    expect(component.loading()).toBe(false);
  });
});
