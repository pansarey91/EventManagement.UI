export enum TicketStatus {
  Active = 1,
  Used = 2,
  Cancelled = 3,
  Expired = 4,
}

export interface TicketTypeDto {
  id: string;
  eventId: string;
  eventName?: string | null;
  name: string;
  description?: string | null;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateTicketTypeDto {
  eventId: string;
  name: string;
  description?: string | null;
  price: number;
  totalQuantity: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  isActive?: boolean;
}

export interface UpdateTicketTypeDto {
  name: string;
  description?: string | null;
  price: number;
  totalQuantity: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  isActive: boolean;
}

export interface EventTicketDto {
  id: string;
  registrationId: string;
  ticketNumber: string;
  qrToken: string;
  status: TicketStatus;
  usedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;

  // Enriched Navigation / Event Details
  eventId: string;
  eventName?: string | null;
  eventStartDateTime?: string | null;
  eventEndDateTime?: string | null;
  venueName?: string | null;
  ticketTypeId: string;
  ticketTypeName?: string | null;
  ticketPrice: number;
  registrationNumber?: string | null;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
}

export interface ValidateTicketQrDto {
  qrToken: string;
  eventId?: string;
}

export interface TicketValidationResultDto {
  isValid: boolean;
  message: string;
  ticket?: EventTicketDto | null;
}

export function getTicketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.Active:
      return 'Active';
    case TicketStatus.Used:
      return 'Checked-In';
    case TicketStatus.Cancelled:
      return 'Cancelled';
    case TicketStatus.Expired:
      return 'Expired';
    default:
      return 'Unknown';
  }
}

export function getTicketStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.Active:
      return 'badge-success';
    case TicketStatus.Used:
      return 'badge-info';
    case TicketStatus.Cancelled:
      return 'badge-danger';
    case TicketStatus.Expired:
      return 'badge-secondary';
    default:
      return 'badge-secondary';
  }
}
