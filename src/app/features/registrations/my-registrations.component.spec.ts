import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MyRegistrationsComponent } from './my-registrations.component';
import { RegistrationService } from '../../core/services/registration.service';
import { UiFeedbackService } from '../../core/services/ui-feedback.service';
import { RegistrationDto, RegistrationStatus } from '../../core/models';

describe('MyRegistrationsComponent', () => {
  let component: MyRegistrationsComponent;
  let fixture: ComponentFixture<MyRegistrationsComponent>;
  let registrationServiceMock: { getAll: any; cancel: any };
  let feedbackServiceMock: { showSuccess: any; showError: any };

  const mockRegistrations: RegistrationDto[] = [
    {
      id: 'reg-1',
      registrationNumber: 'REG-20260913-AAA1',
      userId: 'user-1',
      eventId: 'ev-1',
      eventName: 'Angular Architecture Summit',
      ticketTypeId: 'ticket-1',
      ticketTypeName: 'General Admission',
      quantity: 1,
      totalAmount: 0,
      status: RegistrationStatus.Confirmed,
      registeredAt: '2026-09-01T10:00:00Z',
      createdAt: '2026-09-01T10:00:00Z',
      updatedAt: null,
    },
    {
      id: 'reg-2',
      registrationNumber: 'REG-20260913-BBB2',
      userId: 'user-1',
      eventId: 'ev-2',
      eventName: 'Cloud Native Expo',
      ticketTypeId: 'ticket-2',
      ticketTypeName: 'VIP Pass',
      quantity: 2,
      totalAmount: 200,
      status: RegistrationStatus.Pending,
      registeredAt: '2026-09-05T14:00:00Z',
      createdAt: '2026-09-05T14:00:00Z',
      updatedAt: null,
    },
    {
      id: 'reg-3',
      registrationNumber: 'REG-20260913-CCC3',
      userId: 'user-1',
      eventId: 'ev-3',
      eventName: 'DevOps Workshop',
      ticketTypeId: 'ticket-3',
      ticketTypeName: 'Early Bird',
      quantity: 1,
      totalAmount: 50,
      status: RegistrationStatus.Cancelled,
      registeredAt: '2026-08-20T09:00:00Z',
      createdAt: '2026-08-20T09:00:00Z',
      updatedAt: null,
    },
  ];

  beforeEach(async () => {
    registrationServiceMock = {
      getAll: vi.fn().mockReturnValue(of({ items: mockRegistrations, totalCount: 3 })),
      cancel: vi.fn(),
    };
    feedbackServiceMock = {
      showSuccess: vi.fn(),
      showError: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [MyRegistrationsComponent],
      providers: [
        provideRouter([]),
        { provide: RegistrationService, useValue: registrationServiceMock },
        { provide: UiFeedbackService, useValue: feedbackServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyRegistrationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load registrations on init', () => {
    expect(component).toBeTruthy();
    expect(registrationServiceMock.getAll).toHaveBeenCalled();
    expect(component.registrations().length).toBe(3);
    expect(component.confirmedCount()).toBe(1);
    expect(component.pendingCount()).toBe(1);
    expect(component.cancelledCount()).toBe(1);
  });

  it('should filter registrations by status', () => {
    expect(component.filteredRegistrations().length).toBe(3);

    component.setStatusFilter(RegistrationStatus.Confirmed);
    expect(component.filteredRegistrations().length).toBe(1);
    expect(component.filteredRegistrations()[0].id).toBe('reg-1');

    component.setStatusFilter(RegistrationStatus.Pending);
    expect(component.filteredRegistrations().length).toBe(1);
    expect(component.filteredRegistrations()[0].id).toBe('reg-2');

    component.setStatusFilter(RegistrationStatus.Cancelled);
    expect(component.filteredRegistrations().length).toBe(1);
    expect(component.filteredRegistrations()[0].id).toBe('reg-3');

    component.setStatusFilter('ALL');
    expect(component.filteredRegistrations().length).toBe(3);
  });

  it('should open and close cancellation confirmation modal', () => {
    expect(component.selectedForCancel()).toBeNull();

    component.openCancelModal(mockRegistrations[0]);
    expect(component.selectedForCancel()).toEqual(mockRegistrations[0]);

    component.closeCancelModal();
    expect(component.selectedForCancel()).toBeNull();
  });

  it('should execute cancellation and update registration status in list', () => {
    const cancelledReg: RegistrationDto = {
      ...mockRegistrations[1],
      status: RegistrationStatus.Cancelled,
    };
    registrationServiceMock.cancel.mockReturnValue(of(cancelledReg));

    component.openCancelModal(mockRegistrations[1]);
    component.confirmCancellation();

    expect(registrationServiceMock.cancel).toHaveBeenCalledWith('reg-2');
    expect(feedbackServiceMock.showSuccess).toHaveBeenCalled();
    expect(component.selectedForCancel()).toBeNull();

    const updated = component.registrations().find((r) => r.id === 'reg-2');
    expect(updated?.status).toBe(RegistrationStatus.Cancelled);
  });

  it('should handle cancellation error gracefully', () => {
    registrationServiceMock.cancel.mockReturnValue(
      throwError(() => ({ error: { message: 'Cannot cancel already cancelled registration.' } }))
    );

    component.openCancelModal(mockRegistrations[0]);
    component.confirmCancellation();

    expect(component.cancellingId()).toBeNull();
    expect(feedbackServiceMock.showError).toHaveBeenCalledWith('Cannot cancel already cancelled registration.');
  });
});
