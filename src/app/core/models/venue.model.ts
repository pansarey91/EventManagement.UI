import { PagedRequest } from './common.model';

export interface VenueDto {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  capacity: number;
  contactPerson?: string | null;
  contactNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateVenueDto {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  capacity: number;
  contactPerson?: string | null;
  contactNumber?: string | null;
  isActive?: boolean;
}

export interface UpdateVenueDto {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  capacity: number;
  contactPerson?: string | null;
  contactNumber?: string | null;
  isActive: boolean;
}

export interface VenueQueryDto extends PagedRequest {
  city?: string;
  isActive?: boolean;
}
