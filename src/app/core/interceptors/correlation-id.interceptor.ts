import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Attaches an X-Correlation-ID header to every outgoing HTTP request,
 * aligning with the ASP.NET Core CorrelationIdMiddleware for distributed tracing.
 */
export const correlationIdInterceptor: HttpInterceptorFn = (req, next) => {
  const correlationId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `cid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const clonedReq = req.clone({
    setHeaders: {
      'X-Correlation-ID': correlationId,
    },
  });

  return next(clonedReq);
};
