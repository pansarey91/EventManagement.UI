import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentDto,
  CreatePaymentDto,
  MarkPaymentFailedDto,
  PaymentQueryDto,
  PagedResultDto,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/payments`;

  /**
   * Retrieves paginated payments with optional filtering (scoped server-side).
   */
  getAll(query?: PaymentQueryDto): Observable<PagedResultDto<PaymentDto>> {
    let params = new HttpParams();

    if (query) {
      if (query.pageNumber != null) params = params.set('pageNumber', query.pageNumber.toString());
      if (query.pageSize != null) params = params.set('pageSize', query.pageSize.toString());
      if (query.registrationId) params = params.set('registrationId', query.registrationId);
      if (query.eventId) params = params.set('eventId', query.eventId);
      if (query.userId) params = params.set('userId', query.userId);
      if (query.status != null) params = params.set('status', query.status.toString());
      if (query.paymentMethod) params = params.set('paymentMethod', query.paymentMethod);
      if (query.fromDate) params = params.set('fromDate', query.fromDate);
      if (query.toDate) params = params.set('toDate', query.toDate);
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortDirection) params = params.set('sortDirection', query.sortDirection);
    }

    return this.http.get<PagedResultDto<PaymentDto>>(this.apiUrl, { params });
  }

  /**
   * Retrieves a single payment by ID (Registration Owner, Event Organizer, or Admin).
   */
  getById(id: string): Observable<PaymentDto> {
    return this.http.get<PaymentDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves all payments associated with a specific registration.
   */
  getByRegistrationId(registrationId: string): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(`${this.apiUrl}/registration/${registrationId}`);
  }

  /**
   * Creates a new payment for a registration (Registration Owner or Admin).
   * Note: The amount is authoritatively calculated on the backend from the Registration.
   */
  create(dto: CreatePaymentDto): Observable<PaymentDto> {
    return this.http.post<PaymentDto>(this.apiUrl, dto);
  }

  /**
   * Marks a pending payment as successful (Event Organizer or Admin).
   */
  markSuccessful(id: string): Observable<PaymentDto> {
    return this.http.patch<PaymentDto>(`${this.apiUrl}/${id}/success`, {});
  }

  /**
   * Marks a pending payment as failed with reason (Event Organizer or Admin).
   */
  markFailed(id: string, dto: MarkPaymentFailedDto): Observable<PaymentDto> {
    return this.http.patch<PaymentDto>(`${this.apiUrl}/${id}/fail`, dto);
  }
}
