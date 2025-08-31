import type {
  PostgresJsDatabase,
  PostgresJsQueryResultHKT
} from 'drizzle-orm/postgres-js';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../schema.js';

/**
 * Does not support transactions, but is faster.
 * Production use.
 */
export type AppDbNeonHttp = Omit<
  NeonHttpDatabase<typeof schema> & {
    $client: NeonQueryFunction<false, false>;
  },
  'transaction'
>;

/**
 * Supports transactions.
 * Used in production for transactional operations and in development always.
 */
export type AppDbPostgres = PostgresJsDatabase<typeof schema> & {
  $client: postgres.Sql;
};

/**
 * A type providing parity with AppDbNeonHttp for development.
 */
export type AppDbPostgresNoTx = Omit<AppDbPostgres, 'transaction'>;

/**
 * Exported as a utility to allow passing typed transactions
 * to the shared database functions.
 */
export type AppDbTxn = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;
