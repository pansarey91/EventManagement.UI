import { PagedRequest } from './common.model';

export interface AttendanceDto {
  id: string;
  eventTicketId: string;
  ticketNumber?: string | null;
  registrationId: string;
  registrationNumber?: string | null;
  eventId: string;
  eventName?: string | null;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  checkedInById: string;
  checkedInByName?: string | null;
  checkedInAt: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CheckInDto {
  eventId?: string | null;
  qrToken?: string | null;
  ticketNumber?: string | null;
  ticketId?: string | null;
  registrationId?: string | null;
  userId?: string | null;
  checkedInById?: string | null;
}

export interface AttendanceSummaryDto {
  eventId: string;
  eventName: string;
  totalTickets: number;
  checkedInCount: number;
  remainingCount: number;
  checkInPercentage: number;
}

export interface AttendanceQueryDto extends PagedRequest {
  checkedInById?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CheckInResult {
  success: boolean;
  message: string;
  attendance?: AttendanceDto;
  statusType: 'success' | 'duplicate' | 'wrong_event' | 'invalid' | 'unauthorized' | 'error';
  scannedCode?: string;
  timestamp: Date;
}
