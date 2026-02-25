// One-time migration script to approve all existing users
// and set the admin user role.
// Run with: node scripts/migrate-approve-existing-users.js

const { PrismaClient } = require('../src/generated/prisma');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const adapter = new PrismaBetterSqlite3({ url: DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  // Approve all existing users (they were already using the app)
  const approved = await db.user.updateMany({
    where: { status: 'PENDING' },
    data: { status: 'APPROVED' },
  });
  console.log(`Approved ${approved.count} existing user(s)`);

  // Set admin role for the admin email
  const adminEmail = 'anillkumars4@gmail.com';
  const admin = await db.user.updateMany({
    where: { email: adminEmail },
    data: { role: 'ADMIN', status: 'APPROVED' },
  });

  if (admin.count > 0) {
    console.log(`Set admin role for ${adminEmail}`);
  } else {
    console.log(`Admin user ${adminEmail} not found - they can sign up and be manually promoted`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
