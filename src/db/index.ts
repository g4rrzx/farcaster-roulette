import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL is missing from environment variables. Using dummy connection for build phase.');
}

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
