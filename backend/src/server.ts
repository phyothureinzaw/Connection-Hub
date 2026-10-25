import 'dotenv/config';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { getDatabase } from './infrastructure/database/client.js';

const bootstrapLogger = createLogger();
try {
  const env = loadEnv(process.env);
  const logger = createLogger(env.LOG_LEVEL);
  const database = getDatabase(env.DATABASE_URL);
  const app = createApp({ corsOrigin: env.CORS_ORIGIN, logger,
    checkDatabase: async () => { await database.$queryRaw`SELECT 1`; },
  });
  const server = createServer(app);
  let stopping = false;
  async function shutdown(failed = false) {
    if (stopping) return;
    stopping = true;
    logger.info({ event: 'shutdown' }, 'stopping server');
    const deadline = setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 10_000);
    deadline.unref();
    try {
      await new Promise<void>((resolve, reject) => {
        if (!server.listening) { resolve(); return; }
        server.close((error) => { if (error) reject(error); else resolve(); });
      });
      await database.$disconnect();
      process.exitCode = failed ? 1 : 0;
    } catch {
      logger.error({ event: 'shutdown_failed' }, 'resource cleanup failed');
      process.exitCode = 1;
    } finally { clearTimeout(deadline); }
  }
  server.once('error', () => {
    logger.error({ event: 'startup_failed' }, 'could not start HTTP server; check PORT availability');
    void shutdown(true);
  });
  process.once('SIGINT', () => { void shutdown(); });
  process.once('SIGTERM', () => { void shutdown(); });
  server.listen(env.PORT, () => { logger.info({ port: env.PORT }, 'ConnectHub API listening'); });
} catch (error) {
  // Only validation errors are safe to print; never serialize arbitrary exceptions.
  const detail = error instanceof Error && error.message.startsWith('Invalid environment configuration:')
    ? error.message : 'Could not initialize the API. Check the server configuration.';
  bootstrapLogger.fatal({ event: 'startup_failed', detail }, 'startup failed');
  process.exitCode = 1;
}
