import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

let client: PrismaClient | undefined;

export function getDatabase(connectionString: string) {
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 3000, query_timeout: 3000 }),
    log: [],
  });
  return client;
}
