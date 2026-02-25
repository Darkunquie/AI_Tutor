// Seed script to create/promote the admin account.
// Run with: npx prisma db seed
// Requires ADMIN_PASSWORD env var if creating a new admin account.

const { PrismaClient } = require('../src/generated/prisma');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
const db = new PrismaClient({ adapter });

const ADMIN_EMAIL = 'anillkumars4@gmail.com';

async function seed() {
  const existing = await db.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (existing) {
    if (existing.role === 'ADMIN') {
      console.log('Admin account already exists with ADMIN role');
      return;
    }
    await db.user.update({
      where: { email: ADMIN_EMAIL },
      data: { role: 'ADMIN', status: 'APPROVED' },
    });
    console.log('Updated existing user to ADMIN role');
  } else {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
      console.error('ADMIN_PASSWORD env var is required to create a new admin account.');
      console.error('Usage: ADMIN_PASSWORD=yourpassword npx prisma db seed');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.user.create({
      data: {
        name: 'Admin',
        phone: '0000000000',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
      },
    });
    console.log('Created admin account');
  }
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect());
