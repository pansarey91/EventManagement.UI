import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketQrModalComponent } from './ticket-qr-modal.component';
import { TicketService } from '../../../core/services/ticket.service';
import { of, throwError } from 'rxjs';
import { EventTicketDto, TicketStatus } from '../../../core/models';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TicketQrModalComponent', () => {
  let component: TicketQrModalComponent;
  let fixture: ComponentFixture<TicketQrModalComponent>;
  let ticketServiceMock: {
    getQrCodeBlob: ReturnType<typeof vi.fn>;
  };

  const mockTicket: EventTicketDto = {
    id: 'ticket-123',
    ticketNumber: 'TKT-999-ABC',
    registrationId: 'reg-456',
    qrToken: 'QR-TOKEN-SECURE-999',
    status: TicketStatus.Active,
    usedAt: null,
    createdAt: new Date().toISOString(),
    eventId: 'event-789',
    eventName: 'Global Tech Summit 2026',
    eventStartDateTime: new Date('2026-10-15T09:00:00Z').toISOString(),
    eventEndDateTime: new Date('2026-10-15T17:00:00Z').toISOString(),
    venueName: 'Tech Arena 1',
    ticketTypeId: 'tt-1',
    ticketTypeName: 'VIP Pass',
    ticketPrice: 150,
    userId: 'user-001',
    userName: 'Jane Doe',
  };

  beforeEach(async () => {
    // Mock URL.createObjectURL and URL.revokeObjectURL in jsdom
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-qr-uuid');
    } else {
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake-qr-uuid');
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    const fakeBlob = new Blob(['fake-png-data'], { type: 'image/png' });
    ticketServiceMock = {
      getQrCodeBlob: vi.fn().mockReturnValue(of(fakeBlob)),
    };

    await TestBed.configureTestingModule({
      imports: [TicketQrModalComponent],
      providers: [
        { provide: TicketService, useValue: ticketServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketQrModalComponent);
    component = fixture.componentInstance;
    component.ticket = { ...mockTicket };
  });

  it('should initialize and fetch the QR code blob for the given ticket', () => {
    fixture.detectChanges();

    expect(ticketServiceMock.getQrCodeBlob).toHaveBeenCalledWith('ticket-123');
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.qrSafeUrl()).toBeTruthy();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.qr-image')).toBeTruthy();
    expect(compiled.textContent).toContain('TKT-999-ABC');
    expect(compiled.textContent).toContain('Global Tech Summit 2026');
    expect(compiled.textContent).toContain('VIP Pass');
  });

  it('should display error message and allow retry when QR fetching fails', () => {
    ticketServiceMock.getQrCodeBlob.mockReturnValue(throwError(() => new Error('Network error')));

    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toContain('Failed to generate entry QR code');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.qr-error')).toBeTruthy();

    // Now test retry
    const fakeBlob = new Blob(['fake-retry-png'], { type: 'image/png' });
    ticketServiceMock.getQrCodeBlob.mockReturnValue(of(fakeBlob));

    const retryBtn = compiled.querySelector('.qr-error button') as HTMLButtonElement;
    retryBtn.click();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.error()).toBeNull();
    expect(component.qrSafeUrl()).toBeTruthy();
  });

  it('should emit closed when close button is clicked', () => {
    fixture.detectChanges();
    const closedSpy = vi.spyOn(component.closed, 'emit');

    const closeBtn = fixture.nativeElement.querySelector('.modal-close') as HTMLButtonElement;
    closeBtn.click();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should emit closed when modal backdrop is clicked', () => {
    fixture.detectChanges();
    const closedSpy = vi.spyOn(component.closed, 'emit');

    const backdrop = fixture.nativeElement.querySelector('.modal-backdrop') as HTMLElement;
    backdrop.click();

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should emit closed on Escape key press', () => {
    fixture.detectChanges();
    const closedSpy = vi.spyOn(component.closed, 'emit');

    component.onEscapePressed();
    expect(closedSpy).toHaveBeenCalled();
  });

  it('should clean up object URL on component destruction', () => {
    fixture.detectChanges();
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL');

    fixture.destroy();
    expect(revokeSpy).toHaveBeenCalled();
  });
});
