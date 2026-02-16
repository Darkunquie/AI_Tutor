/**
 * Database Inspection Script
 *
 * Usage: node scripts/check-db.js [table]
 *
 * Examples:
 *   node scripts/check-db.js            # Show all tables with counts
 *   node scripts/check-db.js User       # Show all users
 *   node scripts/check-db.js Session    # Show all sessions
 */

// Use the existing db instance that has the adapter configured
const { db: prisma } = require('../src/lib/db');

async function main() {
  const table = process.argv[2];

  console.log('\n📊 Talkivo Database Inspector\n');
  console.log('━'.repeat(60));

  if (!table) {
    // Show summary of all tables
    console.log('\n📋 Table Summary:\n');

    const userCount = await prisma.user.count();
    const sessionCount = await prisma.session.count();
    const messageCount = await prisma.message.count();
    const errorCount = await prisma.error.count();
    const vocabCount = await prisma.vocabulary.count();
    const statsCount = await prisma.dailyStats.count();

    console.log(`👥 Users:           ${userCount}`);
    console.log(`💬 Sessions:        ${sessionCount}`);
    console.log(`📝 Messages:        ${messageCount}`);
    console.log(`❌ Errors:          ${errorCount}`);
    console.log(`📚 Vocabulary:      ${vocabCount}`);
    console.log(`📈 Daily Stats:     ${statsCount}`);

    console.log('\n💡 Tip: Run with table name to see details');
    console.log('   Example: node scripts/check-db.js User\n');

  } else {
    // Show specific table data
    console.log(`\n🔍 Viewing ${table} table:\n`);

    switch (table.toLowerCase()) {
      case 'user':
      case 'users':
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            level: true,
            createdAt: true,
            _count: {
              select: { sessions: true }
            }
          }
        });
        console.table(users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          level: u.level,
          sessions: u._count.sessions,
          joined: u.createdAt.toLocaleDateString()
        })));
        break;

      case 'session':
      case 'sessions':
        const sessions = await prisma.session.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true }
            }
          }
        });
        console.table(sessions.map(s => ({
          id: s.id.substring(0, 8),
          user: s.user.name,
          mode: s.mode,
          level: s.level,
          duration: `${s.duration}s`,
          score: s.score || 'N/A',
          messages: s.messageCount || 0,
          date: s.createdAt.toLocaleString()
        })));
        break;

      case 'message':
      case 'messages':
        const messages = await prisma.message.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            role: true,
            content: true,
            hasError: true,
            pronunciationScore: true,
            createdAt: true,
            session: {
              select: {
                user: { select: { name: true } }
              }
            }
          }
        });
        console.table(messages.map(m => ({
          id: m.id.substring(0, 8),
          user: m.session.user.name,
          role: m.role,
          preview: m.content.substring(0, 50) + '...',
          hasError: m.hasError,
          score: m.pronunciationScore || 'N/A',
          time: m.createdAt.toLocaleString()
        })));
        break;

      case 'error':
      case 'errors':
        const errors = await prisma.error.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' }
        });
        console.table(errors.map(e => ({
          type: e.type,
          original: e.original.substring(0, 30),
          corrected: e.corrected.substring(0, 30),
          explanation: e.explanation.substring(0, 40)
        })));
        break;

      case 'vocabulary':
      case 'vocab':
        const vocab = await prisma.vocabulary.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { name: true }
            }
          }
        });
        console.table(vocab.map(v => ({
          word: v.word,
          user: v.user.name,
          definition: v.definition.substring(0, 40),
          mastery: v.mastery,
          timesUsed: v.timesUsed,
          added: v.createdAt.toLocaleDateString()
        })));
        break;

      case 'stats':
      case 'dailystats':
        const stats = await prisma.dailyStats.findMany({
          take: 10,
          orderBy: { date: 'desc' },
          include: {
            user: {
              select: { name: true }
            }
          }
        });
        console.table(stats.map(s => ({
          date: s.date,
          user: s.user.name,
          sessions: s.sessionsCompleted,
          minutes: s.minutesPracticed,
          score: s.averageScore,
          errors: s.totalErrors
        })));
        break;

      default:
        console.log(`❌ Unknown table: ${table}`);
        console.log('Available tables: User, Session, Message, Error, Vocabulary, DailyStats');
    }
  }

  console.log('\n' + '━'.repeat(60) + '\n');
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
