import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { retry, throwError, timer } from 'rxjs';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 300;
const MAX_JITTER_MS = 100;

/** Status codes considered transient and worth retrying; anything else fails fast. */
const TRANSIENT_STATUSES: ReadonlySet<number> = new Set([
  0, // no response reached the browser (offline/CORS)
  HttpStatusCode.RequestTimeout,
  HttpStatusCode.TooManyRequests,
  HttpStatusCode.BadGateway,
  HttpStatusCode.ServiceUnavailable,
  HttpStatusCode.GatewayTimeout,
  HttpStatusCode.NotFound,
]);

function isTransient(error: unknown): boolean {
  return error instanceof HttpErrorResponse && TRANSIENT_STATUSES.has(error.status);
}

/** Retries idempotent GET requests on transient failures with exponential backoff + jitter. */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET') {
    return next(req);
  }

  return next(req).pipe(
    retry({
      count: MAX_RETRIES,
      delay: (error: unknown, retryCount: number) => {
        if (!isTransient(error)) {
          return throwError(() => error);
        }
        /**
         * Exponential backoff (300ms, 600ms, 1200ms, ...) plus 0-100ms random jitter so
         * concurrent requests retrying after the same failure don't all hit the server at once.
         */
        const backoffMs = BASE_DELAY_MS * 2 ** (retryCount - 1) + Math.random() * MAX_JITTER_MS;
        return timer(backoffMs);
      },
    }),
  );
};
