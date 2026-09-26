import { PagedRequest } from './common.model';

export enum RegistrationStatus {
  Pending = 1,
  Confirmed = 2,
  Cancelled = 3,
}

export interface RegistrationDto {
  id: string;
  registrationNumber: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  eventId: string;
  eventName?: string | null;
  ticketTypeId: string;
  ticketTypeName?: string | null;
  quantity: number;
  totalAmount: number;
  status: RegistrationStatus;
  registeredAt: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateRegistrationDto {
  userId?: string; // Optional: Backend automatically resolves to authenticated user
  eventId: string;
  ticketTypeId: string;
  quantity: number;
}

export interface RegistrationQueryDto extends PagedRequest {
  userId?: string;
  eventId?: string;
  status?: RegistrationStatus;
  fromDate?: string;
  toDate?: string;
}

export function getRegistrationStatusLabel(status: RegistrationStatus): string {
  switch (status) {
    case RegistrationStatus.Pending:
      return 'Pending';
    case RegistrationStatus.Confirmed:
      return 'Confirmed';
    case RegistrationStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}

export function getRegistrationStatusBadgeClass(status: RegistrationStatus): string {
  switch (status) {
    case RegistrationStatus.Pending:
      return 'badge-warning';
    case RegistrationStatus.Confirmed:
      return 'badge-success';
    case RegistrationStatus.Cancelled:
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
}
