import { defineConfig } from 'drizzle-kit';

if (!process.env.DEV_DATABASE_URL)
  throw new Error('DEV_DATABASE_URL is not set');

export default defineConfig({
  schema: './src/demo/db/schema.ts',
  out: './src/demo/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DEV_DATABASE_URL },
  verbose: true,
  strict: true
});
