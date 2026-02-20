import { defineConfig } from 'drizzle-kit';

// Load .env.local for Next.js projects
import { config } from 'dotenv';
config({ path: '.env.local' });

export default defineConfig({
    out: './drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
