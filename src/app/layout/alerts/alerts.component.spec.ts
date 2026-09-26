import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertsComponent } from './alerts.component';
import { UiFeedbackService, AlertMessage } from '../../core/services/ui-feedback.service';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AlertsComponent', () => {
  let component: AlertsComponent;
  let fixture: ComponentFixture<AlertsComponent>;
  let alertsSignal: ReturnType<typeof signal<AlertMessage[]>>;
  let dismissAlertSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    alertsSignal = signal<AlertMessage[]>([]);
    dismissAlertSpy = vi.fn();

    const mockFeedbackService = {
      alerts: alertsSignal,
      dismissAlert: dismissAlertSpy,
    };

    await TestBed.configureTestingModule({
      imports: [AlertsComponent],
      providers: [
        { provide: UiFeedbackService, useValue: mockFeedbackService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsComponent);
    component = fixture.componentInstance;
  });

  it('should render nothing when there are no alerts', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelectorAll('.alert').length).toBe(0);
  });

  it('should render active alerts with appropriate styles, titles, and messages', () => {
    alertsSignal.set([
      { id: '1', type: 'success', message: 'Event created successfully!', title: 'Success' },
      { id: '2', type: 'error', message: 'Failed to process payment.', title: 'Payment Error' },
      { id: '3', type: 'info', message: 'New announcement available.' },
    ]);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const alertElements = compiled.querySelectorAll('.alert');
    expect(alertElements.length).toBe(3);

    expect(alertElements[0].classList.contains('alert-success')).toBe(true);
    expect(alertElements[0].textContent).toContain('Success');
    expect(alertElements[0].textContent).toContain('Event created successfully!');

    expect(alertElements[1].classList.contains('alert-error')).toBe(true);
    expect(alertElements[1].textContent).toContain('Payment Error');

    expect(alertElements[2].classList.contains('alert-info')).toBe(true);
    expect(alertElements[2].textContent).toContain('New announcement available.');
  });

  it('should call feedbackService.dismissAlert when close button is clicked', () => {
    alertsSignal.set([
      { id: 'alert-abc', type: 'warning', message: 'Tickets are selling fast!' },
    ]);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.alert-close') as HTMLButtonElement;
    closeBtn.click();

    expect(dismissAlertSpy).toHaveBeenCalledWith('alert-abc');
  });
});
