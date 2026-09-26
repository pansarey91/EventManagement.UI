import { PagedRequest } from './common.model';

export interface FeedbackDto {
  id: string;
  eventId: string;
  eventName?: string | null;
  eventTitle?: string | null;
  userId: string;
  userName?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateFeedbackDto {
  eventId: string;
  rating: number;
  comment?: string | null;
}

export interface UpdateFeedbackDto {
  rating: number;
  comment?: string | null;
}

export interface FeedbackQueryDto extends PagedRequest {
  userId?: string;
  rating?: number;
  minRating?: number;
  maxRating?: number;
}

export interface RatingDistributionDto {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
  [key: number]: number;
}

export interface EventFeedbackSummaryDto {
  eventId: string;
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: RatingDistributionDto;
}
