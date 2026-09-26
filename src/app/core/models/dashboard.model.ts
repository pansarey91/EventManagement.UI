import { EventStatus } from './event.model';
import { RegistrationStatus } from './registration.model';
import { PaymentStatus } from './payment.model';

export interface DashboardOverviewDto {
  totalEvents: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalUsers: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  totalTicketsGenerated: number;
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalAttendance: number;
}

export interface OrganizerDashboardDto {
  // Events
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  upcomingEvents: number;

  // Registrations
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;

  // Tickets
  totalTicketsSold: number;
  remainingTicketInventory: number;

  // Revenue & Payments
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;

  // Attendance
  totalAttendance: number;
  attendanceRate: number;

  // Feedback
  averageRating: number;
  totalReviews: number;

  // Top Events & Activity
  topEvents: TopEventDto[];
  recentRegistrations: RecentRegistrationDto[];
  recentPayments: RecentPaymentDto[];
  recentCheckIns: RecentAttendanceDto[];
}

export interface UsersByRoleDto {
  roleName: string;
  count: number;
}

export interface RecentUserDto {
  userId: string;
  fullName: string;
  email: string;
  roles: string[];
  isActive: boolean;
  createdAt: string;
}

export interface CategoryMetricDto {
  categoryId: string;
  categoryName: string;
  eventCount: number;
  registrationCount: number;
}

export interface TopOrganizerDto {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  eventCount: number;
  totalRevenue: number;
  totalRegistrations: number;
}

export interface RatingCountDto {
  rating: number;
  count: number;
}

export interface RecentFeedbackDto {
  feedbackId: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface AdminDashboardDto {
  // Users
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  newUsersInPeriod: number;
  usersByRole: UsersByRoleDto[];
  recentUsers: RecentUserDto[];

  // Events
  totalEvents: number;
  draftEvents: number;
  publishedEvents: number;
  ongoingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  upcomingEvents: number;
  eventsByCategory: CategoryMetricDto[];
  topOrganizers: TopOrganizerDto[];

  // Registrations
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;

  // Tickets
  totalTicketsSold: number;
  availableTicketInventory: number;
  totalEventTickets: number;
  activeTickets: number;
  usedTickets: number;
  cancelledTickets: number;
  ticketCheckInRate: number;

  // Revenue & Payments
  totalRevenue: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  refundedPayments: number;
  refundedAmount: number;

  // Attendance
  totalAttendance: number;
  overallAttendanceRate: number;

  // Feedback
  totalFeedback: number;
  averageRating: number;
  ratingDistribution: RatingCountDto[];
  recentFeedbacks: RecentFeedbackDto[];

  // Top Events & Activity
  topEvents: TopEventDto[];
  recentRegistrations: RecentRegistrationDto[];
  recentPayments: RecentPaymentDto[];
  recentCheckIns: RecentAttendanceDto[];

  // Trend Timelines
  dailyRegistrationTrends: DailyRegistrationTrendDto[];
  dailyRevenueTrends: DailyRevenueTrendDto[];
}

export interface RecentRegistrationDto {
  registrationId: string;
  registrationNumber: string;
  eventId: string;
  eventName: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  totalAmount: number;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface RecentPaymentDto {
  paymentId: string;
  registrationId: string;
  eventId: string;
  eventName: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface RecentAttendanceDto {
  attendanceId: string;
  eventId: string;
  eventName: string;
  ticketNumber: string;
  attendeeName: string;
  checkedInAt: string;
}

export interface RecentActivityDto {
  id: string;
  activityType: string;
  description: string;
  timestamp: string;
  userId?: string | null;
  userName?: string | null;
}

export interface TopEventDto {
  eventId: string;
  eventName: string;
  registrationCount: number;
  revenue: number;
  attendanceCount: number;
}

export interface DailyRevenueTrendDto {
  date: string;
  amount: number;
  transactionCount: number;
}

export interface EventRevenueDto {
  eventId: string;
  eventName: string;
  successfulPaymentCount: number;
  revenue: number;
}

export interface RevenueReportDto {
  totalRevenue: number;
  successfulPaymentCount: number;
  pendingPaymentCount: number;
  failedPaymentCount: number;
  events: EventRevenueDto[];
  timeline: DailyRevenueTrendDto[];
}

export interface DailyRegistrationTrendDto {
  date: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
}

export interface EventRegistrationBreakdownDto {
  eventId: string;
  eventName: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
}

export interface RegistrationReportDto {
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  events: EventRegistrationBreakdownDto[];
  timeline: DailyRegistrationTrendDto[];
}

export interface EventAttendanceBreakdownDto {
  eventId: string;
  eventName: string;
  totalRegistrations: number;
  confirmedRegistrations: number;
  attendanceCount: number;
  attendanceRate: number;
}

export interface AttendanceReportDto {
  totalAttendance: number;
  totalConfirmedRegistrations: number;
  overallAttendanceRate: number;
  events: EventAttendanceBreakdownDto[];
}

export interface TicketTypeAnalyticsDto {
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  utilizationPercentage: number;
}

export interface EventAnalyticsDto {
  eventId: string;
  eventName: string;
  eventStatus: EventStatus;
  categoryName?: string | null;
  venueName?: string | null;
  startDateTime: string;
  endDateTime: string;
  maxCapacity: number;
  registeredTickets: number;
  remainingCapacity: number;
  capacityUtilizationPercentage: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  cancelledRegistrations: number;
  totalRevenue: number;
  successfulPaymentsCount: number;
  pendingPaymentsCount: number;
  failedPaymentsCount: number;
  attendanceCount: number;
  attendanceRate: number;
  ticketTypes: TicketTypeAnalyticsDto[];
}

export interface EventAnalyticsListDto {
  eventId: string;
  eventName: string;
  categoryName?: string | null;
  venueName?: string | null;
  startDateTime: string;
  endDateTime: string;
  status: EventStatus;
  maxCapacity: number;
  registrationCount: number;
  confirmedRegistrations: number;
  revenue: number;
  attendanceCount: number;
  attendanceRate: number;
  averageRating: number;
  totalFeedbackCount: number;
}

export interface DashboardDateQueryDto {
  startDate?: string;
  endDate?: string;
}
