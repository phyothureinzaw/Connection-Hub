import { Router } from 'express';
import type { Logger } from 'pino';
import { AppError } from '../../shared/errors/problem.js';

export type CheckDatabase = () => Promise<void>;

export function healthRoutes(checkDatabase: CheckDatabase, logger: Logger) {
  const router = Router();
  router.get('/health', (_req, res) => { res.json({ status: 'ok' }); });
  router.get('/ready', async (_req, res) => {
    try { await checkDatabase(); }
    catch {
      logger.warn({ requestId: res.locals.requestId, event: 'database_unavailable' }, 'readiness check failed');
      throw new AppError(503, 'Service Unavailable', 'The database is currently unavailable. Please try again.');
    }
    res.json({ status: 'ready', database: 'connected' });
  });
  return router;
}
