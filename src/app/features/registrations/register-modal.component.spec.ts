import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterModalComponent } from './register-modal.component';
import { RegistrationService } from '../../core/services/registration.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import {
  PublicEventDetailsDto,
  RegistrationDto,
  RegistrationStatus,
  EventStatus,
} from '../../core/models';

describe('RegisterModalComponent', () => {
  let component: RegisterModalComponent;
  let fixture: ComponentFixture<RegisterModalComponent>;
  let registrationServiceMock: { create: any };
  let feedbackServiceMock: { showSuccess: any; showError: any };

  const mockEvent: PublicEventDetailsDto = {
    id: 'event-1',
    name: 'Tech Innovation Summit 2026',
    description: 'Premier technology conference',
    categoryId: 'cat-1',
    categoryName: 'Technology',
    venueId: 'ven-1',
    venueName: 'Grand Hall',
    venueAddress: '123 Main St',
    venueCity: 'Tech City',
    venueState: 'CA',
    venuePostalCode: '94016',
    venueCountry: 'USA',
    organizerId: 'org-1',
    organizerName: 'Tech Corp',
    startDateTime: '2026-10-15T09:00:00Z',
    endDateTime: '2026-10-15T17:00:00Z',
    registrationDeadline: '2026-10-10T23:59:59Z',
    maxCapacity: 500,
    status: EventStatus.Published,
    bannerImageUrl: null,
    minimumTicketPrice: 50,
    availableTicketCount: 200,
    averageRating: 4.8,
    totalFeedback: 42,
    isRegistrationOpen: true,
    createdAt: '2026-08-01T10:00:00Z',
    schedules: [],
    ticketTypes: [
      {
        id: 'ticket-free',
        name: 'Free General Admission',
        description: 'Standard access pass',
        price: 0,
        availableQuantity: 50,
        saleStartDate: '2026-08-01T00:00:00Z',
        saleEndDate: '2026-10-10T00:00:00Z',
        isAvailable: true,
      },
      {
        id: 'ticket-paid',
        name: 'VIP All-Access',
        description: 'Includes VIP lounge and after-party',
        price: 150,
        availableQuantity: 5,
        saleStartDate: '2026-08-01T00:00:00Z',
        saleEndDate: '2026-10-10T00:00:00Z',
        isAvailable: true,
      },
    ],
  };

  const mockRegistration: RegistrationDto = {
    id: 'reg-123',
    registrationNumber: 'REG-20261015-TEST1234',
    userId: 'user-1',
    userName: 'Jane Doe',
    userEmail: 'jane@example.com',
    eventId: 'event-1',
    eventName: 'Tech Innovation Summit 2026',
    ticketTypeId: 'ticket-free',
    ticketTypeName: 'Free General Admission',
    quantity: 1,
    totalAmount: 0,
    status: RegistrationStatus.Confirmed,
    registeredAt: '2026-09-13T12:00:00Z',
    createdAt: '2026-09-13T12:00:00Z',
    updatedAt: null,
  };

  beforeEach(async () => {
    registrationServiceMock = {
      create: vi.fn().mockReturnValue(of(mockRegistration)),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [RegisterModalComponent],
      providers: [
        provideRouter([]),
        { provide: RegistrationService, useValue: registrationServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterModalComponent);
    component = fixture.componentInstance;
    component.event = mockEvent;
    fixture.detectChanges();
  });

  it('should create and pre-select first available ticket tier', () => {
    expect(component).toBeTruthy();
    expect(component.selectedTicketTypeId()).toBe('ticket-free');
    expect(component.selectedTicket()?.name).toBe('Free General Admission');
    expect(component.quantity()).toBe(1);
    expect(component.estimatedTotal()).toBe(0);
  });

  it('should calculate estimated total when ticket and quantity change', () => {
    const vipTicket = mockEvent.ticketTypes![1];
    component.selectTicket(vipTicket);

    expect(component.selectedTicketTypeId()).toBe('ticket-paid');
    expect(component.estimatedTotal()).toBe(150);

    component.increaseQuantity();
    expect(component.quantity()).toBe(2);
    expect(component.estimatedTotal()).toBe(300);

    component.decreaseQuantity();
    expect(component.quantity()).toBe(1);
    expect(component.estimatedTotal()).toBe(150);
  });

  it('should not increase quantity beyond available stock', () => {
    const vipTicket = mockEvent.ticketTypes![1]; // max 5 available
    component.selectTicket(vipTicket);

    // Increase to max 5
    for (let i = 0; i < 10; i++) {
      component.increaseQuantity();
    }
    expect(component.quantity()).toBe(5);
  });

  it('should submit registration and display success state', () => {
    const emitSpy = vi.spyOn(component.registered, 'emit');

    component.submitRegistration();

    expect(registrationServiceMock.create).toHaveBeenCalledWith({
      eventId: 'event-1',
      ticketTypeId: 'ticket-free',
      quantity: 1,
    });
    expect(component.successResult()).toEqual(mockRegistration);
    expect(emitSpy).toHaveBeenCalledWith(mockRegistration);
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalled();
  });

  it('should handle registration error gracefully', () => {
    registrationServiceMock.create.mockReturnValue(
      throwError(() => ({ error: { message: 'Insufficient tickets available.' } }))
    );

    component.submitRegistration();

    expect(component.isSubmitting()).toBe(false);
    expect(component.submitError()).toBe('Insufficient tickets available.');
    expect(component.successResult()).toBeNull();
  });

  it('should emit closed event when closeModal is called', () => {
    const emitSpy = vi.spyOn(component.closed, 'emit');
    component.closeModal();
    expect(emitSpy).toHaveBeenCalled();
  });
});
