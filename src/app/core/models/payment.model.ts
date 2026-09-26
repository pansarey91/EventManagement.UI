import { PagedRequest } from './common.model';

export enum PaymentStatus {
  Pending = 1,
  Completed = 2,
  Failed = 3,
  Refunded = 4,
}

export interface PaymentDto {
  id: string;
  registrationId: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  transactionId?: string | null;
  paidAt?: string | null;
  failureReason?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePaymentDto {
  registrationId: string;
  paymentMethod: string;
}

export interface MarkPaymentFailedDto {
  failureReason: string;
}

export interface PaymentQueryDto extends PagedRequest {
  registrationId?: string;
  eventId?: string;
  userId?: string;
  status?: PaymentStatus;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Pending:
      return 'Pending';
    case PaymentStatus.Completed:
      return 'Completed';
    case PaymentStatus.Failed:
      return 'Failed';
    case PaymentStatus.Refunded:
      return 'Refunded';
    default:
      return 'Unknown';
  }
}

export function getPaymentStatusBadgeClass(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.Pending:
      return 'badge-warning';
    case PaymentStatus.Completed:
      return 'badge-success';
    case PaymentStatus.Failed:
      return 'badge-danger';
    case PaymentStatus.Refunded:
      return 'badge-secondary';
    default:
      return 'badge-secondary';
  }
}

export interface PaymentMethodOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const SUPPORTED_PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'Credit Card', label: 'Credit Card', description: 'Visa, MasterCard, Amex', icon: '💳' },
  { id: 'Debit Card', label: 'Debit Card', description: 'Instant bank debit card', icon: '💳' },
  { id: 'UPI', label: 'UPI / QR', description: 'Google Pay, PhonePe, Paytm', icon: '📱' },
  { id: 'Net Banking', label: 'Net Banking', description: 'Direct internet banking transfer', icon: '🏦' },
  { id: 'Bank Transfer', label: 'Bank Transfer / Wire', description: 'Direct NEFT / RTGS transfer', icon: '🏛️' },
  { id: 'Cash', label: 'Cash / Offline', description: 'Pay at venue on event day', icon: '💵' },
];
