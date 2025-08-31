import { neon } from '@neondatabase/serverless';
import postgres from 'postgres';
import * as schema from '../schema.js';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeonHttp } from 'drizzle-orm/neon-http';
import { DEV_DATABASE_URL, DATABASE_URL } from '$env/static/private';
import type {
  AppDbNeonHttp,
  AppDbPostgres,
  AppDbPostgresNoTx
} from './types.js';
import { dev } from '$app/environment';

let nonTransactionalDb: AppDbNeonHttp | AppDbPostgresNoTx | undefined =
  undefined;
let transactionalDb: AppDbPostgres | undefined = undefined;

export const getDb = <Transactional extends boolean>(
  transactional?: Transactional
): Transactional extends true
  ? AppDbPostgres
  : AppDbNeonHttp | AppDbPostgresNoTx => {
  const connectionString = dev ? DEV_DATABASE_URL : DATABASE_URL;
  if (transactional) {
    if (!transactionalDb) {
      transactionalDb = drizzlePg(postgres(connectionString), { schema });
    }
    return transactionalDb as Transactional extends true
      ? AppDbPostgres
      : AppDbNeonHttp;
  }
  if (!nonTransactionalDb) {
    if (dev) {
      if (!transactionalDb) {
        transactionalDb = drizzlePg(postgres(connectionString), { schema });
      }
      nonTransactionalDb = transactionalDb;
    } else {
      const client = neon(connectionString);
      nonTransactionalDb = drizzleNeonHttp<typeof schema>(client, { schema });
    }
  }
  return nonTransactionalDb as Transactional extends true
    ? AppDbPostgres
    : AppDbNeonHttp;
};
