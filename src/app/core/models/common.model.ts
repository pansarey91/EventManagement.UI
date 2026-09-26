/**
 * Represents a paginated server response matching backend PagedResultDto<T>.
 */
export interface PagedResultDto<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Base query request matching backend PagedRequest.
 */
export interface PagedRequest {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDescending?: boolean;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Normalized client-side error model handling both
 * ExceptionMiddleware responses and ASP.NET Core ValidationProblemDetails.
 */
export interface ApiError {
  statusCode: number;
  message: string;
  detailed?: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
}
