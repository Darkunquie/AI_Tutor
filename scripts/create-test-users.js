/**
 * Create Test Users Script
 *
 * Creates test user accounts with known credentials for testing
 *
 * Usage: npx tsx scripts/create-test-users.js
 */

// Load environment variables first
require('dotenv/config');

const { db } = require('../src/lib/db');
const { hashPassword } = require('../src/lib/auth');

const TEST_USERS = [
  {
    name: 'John Beginner',
    email: 'beginner@test.com',
    phone: '9000000001',
    password: 'Test1234',
    level: 'BEGINNER'
  },
  {
    name: 'Sarah Intermediate',
    email: 'intermediate@test.com',
    phone: '9000000002',
    password: 'Test1234',
    level: 'INTERMEDIATE'
  },
  {
    name: 'Mike Advanced',
    email: 'advanced@test.com',
    phone: '9000000003',
    password: 'Test1234',
    level: 'ADVANCED'
  },
  {
    name: 'Emma Expert',
    email: 'expert@test.com',
    phone: '9000000004',
    password: 'Test1234',
    level: 'EXPERT'
  }
];

async function main() {
  console.log('\n🔧 Creating Test Users for Talkivo\n');
  console.log('═'.repeat(60));
  console.log('\n');

  let created = 0;
  let skipped = 0;

  for (const userData of TEST_USERS) {
    try {
      // Check if user already exists
      const existing = await db.user.findFirst({
        where: {
          OR: [
            { email: userData.email },
            { phone: userData.phone }
          ]
        }
      });

      if (existing) {
        console.log(`⏭️  Skipped: ${userData.name} (${userData.email}) - Already exists`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await db.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: hashedPassword,
          level: userData.level
        }
      });

      console.log(`✅ Created: ${userData.name} (${userData.email})`);
      created++;

    } catch (error) {
      console.error(`❌ Error creating ${userData.name}:`, error.message);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created} users`);
  console.log(`   ⏭️  Skipped: ${skipped} users (already exist)`);
  console.log(`   📝 Total:   ${TEST_USERS.length} users`);

  if (created > 0) {
    console.log('\n🔐 Test Credentials:\n');
    console.log('┌────────────────────────────────────────────────────────┐');
    console.log('│  All test accounts use the same password: Test1234    │');
    console.log('└────────────────────────────────────────────────────────┘\n');

    console.log('Login with any of these:');
    TEST_USERS.forEach(user => {
      console.log(`  📧 ${user.email.padEnd(25)} | 🎯 ${user.level}`);
    });
  }

  console.log('\n💡 Tip: Use these accounts to test different user levels');
  console.log('   Login at: http://localhost:3001/login\n');
}

main()
  .catch((e) => {
    console.error('\n❌ Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
