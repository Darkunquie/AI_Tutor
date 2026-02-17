import { defineConfig } from 'prisma/config';
import path from 'path';

// Prisma 7 config - provides database URL for CLI commands (prisma db push, migrate, etc.)
// The adapter in src/lib/db.ts handles runtime connections
const dbUrl = process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), 'prisma', 'dev.db')}`;

export default defineConfig({
  datasource: {
    url: dbUrl,
  },
});
