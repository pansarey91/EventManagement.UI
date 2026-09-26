import { PagedRequest } from './common.model';

export enum NotificationType {
  RegistrationConfirmed = 1,
  RegistrationCancelled = 2,
  PaymentSuccessful = 3,
  PaymentFailed = 4,
  EventPublished = 5,
  EventCancelled = 6,
  EventReminder = 7,
  TicketGenerated = 8,
  CheckInConfirmed = 9,
  System = 10,
}

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationQueryDto extends PagedRequest {
  isRead?: boolean;
  type?: NotificationType;
  fromDate?: string;
  toDate?: string;
}

export interface UnreadCountDto {
  unreadCount: number;
}

export interface MarkAllAsReadResultDto {
  updatedCount: number;
  message: string;
}
