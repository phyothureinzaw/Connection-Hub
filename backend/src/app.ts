import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { healthRoutes, type CheckDatabase } from './modules/health/routes.js';
import { requestContext } from './shared/middleware/request-context.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import { sendProblem } from './shared/errors/problem.js';

export function createApp(options: { corsOrigin: string; checkDatabase: CheckDatabase; logger: Logger }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(requestContext(options.logger));
  app.use(helmet());
  app.use(cors({ origin: options.corsOrigin, exposedHeaders: ['X-Request-Id'] }));
  app.use(express.json({ limit: '16kb' }));
  app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  app.use('/api', healthRoutes(options.checkDatabase, options.logger));
  app.use((req, res) => { sendProblem(req, res, 404, 'Not Found', 'The requested route does not exist.'); });
  app.use(errorHandler(options.logger));
  return app;
}
