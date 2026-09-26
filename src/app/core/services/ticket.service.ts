import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  EventTicketDto,
  ValidateTicketQrDto,
  TicketValidationResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/tickets`;

  /**
   * Retrieves all event tickets belonging to the authenticated attendee.
   */
  getMyTickets(): Observable<EventTicketDto[]> {
    return this.http.get<EventTicketDto[]>(`${this.apiUrl}/my-tickets`);
  }

  /**
   * Retrieves a single event ticket by its unique ID.
   */
  getById(id: string): Observable<EventTicketDto> {
    return this.http.get<EventTicketDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves an event ticket by its ticket code (e.g. TKT-20260913-ABCD1234).
   */
  getByTicketCode(ticketCode: string): Observable<EventTicketDto> {
    return this.http.get<EventTicketDto>(`${this.apiUrl}/code/${ticketCode}`);
  }

  /**
   * Retrieves all tickets associated with a specific registration.
   */
  getByRegistrationId(registrationId: string): Observable<EventTicketDto[]> {
    return this.http.get<EventTicketDto[]>(`${this.apiUrl}/registration/${registrationId}`);
  }

  /**
   * Retrieves all tickets issued for a specific event (Organizer or Admin).
   */
  getByEventId(eventId: string): Observable<EventTicketDto[]> {
    return this.http.get<EventTicketDto[]>(`${this.apiUrl}/event/${eventId}`);
  }

  /**
   * Explicitly triggers ticket generation for a confirmed registration.
   */
  generateTickets(registrationId: string): Observable<EventTicketDto[]> {
    return this.http.post<EventTicketDto[]>(
      `${environment.apiBaseUrl}/registrations/${registrationId}/tickets/generate`,
      {}
    );
  }

  /**
   * Retrieves the backend-generated QR code PNG image as a Blob for a ticket ID.
   */
  getQrCodeBlob(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/qr`, {
      responseType: 'blob',
    });
  }

  /**
   * Retrieves the backend-generated QR code PNG image as a Blob for a ticket code.
   */
  getQrCodeBlobByCode(ticketCode: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/code/${ticketCode}/qr`, {
      responseType: 'blob',
    });
  }

  /**
   * Validates a ticket QR token for check-in eligibility (Organizer, Staff, or Admin).
   */
  validateTicket(dto: ValidateTicketQrDto): Observable<TicketValidationResultDto> {
    return this.http.post<TicketValidationResultDto>(`${this.apiUrl}/validate`, dto);
  }
}
