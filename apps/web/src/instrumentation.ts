/**
 * Next.js instrumentation - `onRequestError` fires for any uncaught error
 * in a Server Component, route handler, or middleware. We log it to stderr;
 * Vercel captures stdout/stderr in its runtime logs, so this gives baseline
 * production error visibility with no third-party APM dependency.
 *
 * To upgrade later: swap the console.error for Sentry's captureRequestError.
 */
export function onRequestError(
  error: unknown,
  request: { path: string; method: string },
  context: { routerKind: string; routePath: string; renderSource: string },
) {
  console.error("[inspo] request error", {
    method: request?.method,
    path: request?.path,
    route: context?.routePath,
    source: context?.renderSource,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
