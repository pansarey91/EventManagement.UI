import { PagedRequest } from './common.model';

export enum EventStatus {
  Draft = 1,
  Published = 2,
  Ongoing = 3,
  Completed = 4,
  Cancelled = 5,
}

export interface EventDto {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  categoryName?: string | null;
  venueId: string;
  venueName?: string | null;
  organizerId: string;
  organizerName?: string | null;
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string | null;
  maxCapacity: number;
  status: EventStatus;
  bannerImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PublicEventDto {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  categoryName?: string | null;
  venueId: string;
  venueName?: string | null;
  venueCity?: string | null;
  organizerId: string;
  organizerName?: string | null;
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string | null;
  maxCapacity: number;
  status: EventStatus;
  bannerImageUrl?: string | null;
  minimumTicketPrice?: number | null;
  availableTicketCount: number;
  averageRating: number;
  totalFeedback: number;
  isRegistrationOpen: boolean;
  createdAt: string;
}

export interface PublicTicketTypeDto {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  availableQuantity: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  isAvailable: boolean;
}

export interface PublicEventScheduleDto {
  id: string;
  title: string;
  description?: string | null;
  startDateTime: string;
  endDateTime: string;
  location?: string | null;
}

export interface PublicEventDetailsDto {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  categoryName?: string | null;
  venueId: string;
  venueName?: string | null;
  venueAddress?: string | null;
  venueCity?: string | null;
  venueState?: string | null;
  venueCountry?: string | null;
  venuePostalCode?: string | null;
  organizerId: string;
  organizerName?: string | null;
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string | null;
  maxCapacity: number;
  status: EventStatus;
  bannerImageUrl?: string | null;
  minimumTicketPrice?: number | null;
  availableTicketCount: number;
  averageRating: number;
  totalFeedback: number;
  isRegistrationOpen: boolean;
  createdAt: string;
  ticketTypes: PublicTicketTypeDto[];
  schedules: PublicEventScheduleDto[];
}

export interface CreateEventDto {
  name: string;
  description?: string | null;
  categoryId: string;
  venueId: string;
  organizerId?: string | null;
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string | null;
  maxCapacity: number;
  status?: EventStatus;
  bannerImageUrl?: string | null;
}

export interface UpdateEventDto {
  name: string;
  description?: string | null;
  categoryId: string;
  venueId: string;
  organizerId?: string | null;
  startDateTime: string;
  endDateTime: string;
  registrationDeadline?: string | null;
  maxCapacity: number;
  status?: EventStatus;
  bannerImageUrl?: string | null;
}

export interface EventQueryDto extends PagedRequest {
  categoryId?: string;
  venueId?: string;
  organizerId?: string;
  status?: EventStatus;
  fromDate?: string;
  toDate?: string;
}

export interface EventDiscoveryQueryDto extends PagedRequest {
  categoryId?: string;
  venueId?: string;
  organizerId?: string;
  startDate?: string;
  endDate?: string;
  upcomingOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
}
