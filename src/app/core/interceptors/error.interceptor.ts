import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/** Surfaces every failed HTTP request as a toast, then re-throws for local handling. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const message = toErrorMessage(error);
      notification.error(message);
      return throwError(() => error);
    }),
  );
};

const STATUS_MESSAGES: Partial<Record<HttpStatusCode, string>> = {
  [HttpStatusCode.BadRequest]: 'Invalid request. Please check your input.',
  [HttpStatusCode.Unauthorized]: 'You are not signed in. Please log in and try again.',
  [HttpStatusCode.Forbidden]: 'You do not have permission to perform this action.',
  [HttpStatusCode.NotFound]: 'The requested resource was not found.',
  [HttpStatusCode.RequestTimeout]: 'The request timed out. Please try again.',
  [HttpStatusCode.Conflict]: 'This item was changed elsewhere. Please refresh and retry.',
  [HttpStatusCode.UnprocessableEntity]: 'Validation failed. Please check your input.',
  [HttpStatusCode.TooManyRequests]: 'Too many requests. Please wait and try again.',
  [HttpStatusCode.InternalServerError]: 'Server error. Please try again later.',
  [HttpStatusCode.BadGateway]: 'Server is temporarily unavailable. Please try again later.',
  [HttpStatusCode.ServiceUnavailable]: 'Service unavailable. Please try again later.',
  [HttpStatusCode.GatewayTimeout]: 'Server took too long to respond. Please try again.',
};

/**
 * Maps a failed HTTP request to a user-facing message.
 * Precedence: non-HttpErrorResponse (e.g. client-side/network throw) -> generic message;
 * status 0 (no response reached the browser, e.g. CORS/offline) -> connectivity message;
 * server-provided `error.message` -> shown verbatim; otherwise a friendly message keyed by
 * status code, falling back to a generic "status N" message for unmapped codes.
 *
 * @param error - The value thrown by the HTTP pipeline.
 * @returns A short, user-facing error string safe to display in a toast.
 */
function toErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'An unexpected error occurred.';
  }
  if (error.status === 0) {
    return 'Unable to reach the server. Check your connection.';
  }
  if (typeof error.error?.message === 'string') {
    return error.error.message;
  }
  return (
    STATUS_MESSAGES[error.status as HttpStatusCode] ?? `Request failed (status ${error.status}).`
  );
}
