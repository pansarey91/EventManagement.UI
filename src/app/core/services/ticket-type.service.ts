import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TicketTypeDto,
  CreateTicketTypeDto,
  UpdateTicketTypeDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class TicketTypeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/tickettypes`;
  private readonly eventsUrl = `${environment.apiBaseUrl}/events`;

  /**
   * Retrieves all ticket types defined for a specific event.
   */
  getByEventId(eventId: string): Observable<TicketTypeDto[]> {
    return this.http.get<TicketTypeDto[]>(`${this.eventsUrl}/${eventId}/tickettypes`);
  }

  /**
   * Retrieves a single ticket type by ID.
   */
  getById(id: string): Observable<TicketTypeDto> {
    return this.http.get<TicketTypeDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Creates a new ticket type for an event. AvailableQuantity is automatically initialized by the backend.
   */
  create(dto: CreateTicketTypeDto): Observable<TicketTypeDto> {
    return this.http.post<TicketTypeDto>(this.apiUrl, dto);
  }

  /**
   * Updates an existing ticket type. Preserves consumed/sold ticket inventory consistency.
   */
  update(id: string, dto: UpdateTicketTypeDto): Observable<TicketTypeDto> {
    return this.http.put<TicketTypeDto>(`${this.apiUrl}/${id}`, dto);
  }

  /**
   * Deletes a ticket type by ID. Fails if existing registrations are present.
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Toggles active/inactive status for a ticket type.
   */
  toggleStatus(ticket: TicketTypeDto): Observable<TicketTypeDto> {
    const updateDto: UpdateTicketTypeDto = {
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      totalQuantity: ticket.totalQuantity,
      saleStartDate: ticket.saleStartDate,
      saleEndDate: ticket.saleEndDate,
      isActive: !ticket.isActive,
    };
    return this.update(ticket.id, updateDto);
  }
}
