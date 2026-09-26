import { PagedRequest } from './common.model';

export interface EventCategoryDto {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateEventCategoryDto {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateEventCategoryDto {
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface EventCategoryQueryDto extends PagedRequest {
  isActive?: boolean;
}
