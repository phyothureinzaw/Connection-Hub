import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  // Generation/validation do not connect. Runtime requires a validated real URL.
  datasource: { url: process.env.DATABASE_URL ?? 'postgresql://unused:unused@localhost:5432/connecthub_dev' },
});
