import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

// Prisma 7 config - provides database URL for CLI commands (prisma db push, migrate, etc.)
// Runtime connections use datasourceUrl in PrismaClient constructor (see src/lib/db.ts)
export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
