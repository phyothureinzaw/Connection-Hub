import type { ErrorRequestHandler } from 'express';
import type { Logger } from 'pino';
import { AppError, sendProblem } from '../errors/problem.js';

export function errorHandler(logger: Logger): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) { next(error); return; }
    if (error instanceof AppError) {
      sendProblem(req, res, error.status, error.title, error.detail);
      return;
    }
    const bodyError = error as { type?: string } | null;
    if (bodyError?.type === 'entity.parse.failed' || bodyError?.type === 'entity.too.large') {
      const tooLarge = bodyError.type === 'entity.too.large';
      sendProblem(req, res, tooLarge ? 413 : 400, tooLarge ? 'Payload Too Large' : 'Bad Request',
        tooLarge ? 'JSON body exceeds the 16 KB limit.' : 'Request body must be valid JSON.');
      return;
    }
    logger.error({ requestId: res.locals.requestId, event: 'unexpected_error' }, 'request failed');
    sendProblem(req, res, 500, 'Internal Server Error', 'An unexpected error occurred.');
  };
}
