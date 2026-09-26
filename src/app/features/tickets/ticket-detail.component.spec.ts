import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TicketDetailComponent } from './ticket-detail.component';
import { TicketService } from '../../core/services/ticket.service';
import { EventTicketDto, TicketStatus } from '../../core/models';

describe('TicketDetailComponent', () => {
  let component: TicketDetailComponent;
  let fixture: ComponentFixture<TicketDetailComponent>;
  let ticketServiceMock: { getById: any; getQrCodeBlob: any };

  const mockTicket: EventTicketDto = {
    id: 'tkt-1',
    ticketNumber: 'TKT-20261015-ABC12345',
    registrationId: 'reg-1',
    status: TicketStatus.Active,
    qrToken: 'test-qr-token-1234567890',
    usedAt: null,
    createdAt: '2026-09-13T10:00:00Z',
    updatedAt: null,
    eventId: 'event-1',
    eventName: 'Tech Innovation Summit 2026',
    eventStartDateTime: '2026-10-15T09:00:00Z',
    eventEndDateTime: '2026-10-15T18:00:00Z',
    venueName: 'Convention Hall A',
    ticketTypeId: 'tt-1',
    ticketTypeName: 'VIP Pass',
    ticketPrice: 150,
    registrationNumber: 'REG-20261015-TEST1234',
    userId: 'user-1',
    userName: 'Jane Doe',
    userEmail: 'jane@example.com',
  };

  const mockBlob = new Blob(['mock-png-bytes'], { type: 'image/png' });

  beforeEach(async () => {
    ticketServiceMock = {
      getById: vi.fn().mockReturnValue(of(mockTicket)),
      getQrCodeBlob: vi.fn().mockReturnValue(of(mockBlob)),
    };

    // Mock URL.createObjectURL and revokeObjectURL
    if (typeof window.URL.createObjectURL === 'undefined') {
      window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    } else {
      vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    }

    await TestBed.configureTestingModule({
      imports: [TicketDetailComponent],
      providers: [
        provideRouter([]),
        { provide: TicketService, useValue: ticketServiceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'tkt-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load ticket details on init', () => {
    expect(component).toBeTruthy();
    expect(ticketServiceMock.getById).toHaveBeenCalledWith('tkt-1');
    expect(component.ticket()).toEqual(mockTicket);
    expect(component.loading()).toBe(false);
    expect(ticketServiceMock.getQrCodeBlob).toHaveBeenCalledWith('tkt-1');
  });

  it('should handle error when ticket cannot be found', () => {
    ticketServiceMock.getById.mockReturnValue(
      throwError(() => ({ error: { message: 'Ticket not found.' } }))
    );

    component.loadTicket();

    expect(component.ticket()).toBeNull();
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('Ticket not found.');
  });

  it('should handle QR code load failure gracefully', () => {
    ticketServiceMock.getQrCodeBlob.mockReturnValue(
      throwError(() => new Error('QR network error'))
    );

    component.loadQr('tkt-1');

    expect(component.qrLoading()).toBe(false);
    expect(component.qrError()).toBe('Unable to load QR image.');
    expect(component.qrSafeUrl()).toBeNull();
  });

  it('should call window.print when printTicket is clicked', () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    component.printTicket();

    expect(printSpy).toHaveBeenCalled();
  });

  it('should cleanup object URL on destroy', () => {
    const revokeSpy = vi.spyOn(window.URL, 'revokeObjectURL');
    component.ngOnDestroy();
    expect(revokeSpy).toHaveBeenCalled();
  });
});
