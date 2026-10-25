import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import type { Logger } from 'pino';

export function requestContext(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    const start = performance.now();
    res.on('finish', () => {
      // Deliberate allowlist: no URL/query, headers, bodies, or raw errors.
      logger.info({ requestId, method: req.method, status: res.statusCode,
        durationMs: Math.round(performance.now() - start) }, 'request completed');
    });
    next();
  };
}
