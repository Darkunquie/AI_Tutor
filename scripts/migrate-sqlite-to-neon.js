#!/usr/bin/env node

// One-time migration script: SQLite → Neon PostgreSQL
// Run on VPS BEFORE deploying the new code (while better-sqlite3 is still installed)
//
// Usage:
//   NEON_URL="postgresql://..." node scripts/migrate-sqlite-to-neon.js
//
// Or set NEON_URL in .env and run:
//   node -e "require('dotenv').config()" && node scripts/migrate-sqlite-to-neon.js

const Database = require('better-sqlite3');
const { Client } = require('pg');
const path = require('path');

const SQLITE_PATH = path.resolve(__dirname, '..', 'prisma', 'dev.db');
const NEON_URL = process.env.NEON_URL || process.env.DATABASE_URL;

if (!NEON_URL || NEON_URL.startsWith('file:')) {
  console.error('Error: Set NEON_URL to your Neon PostgreSQL connection string');
  console.error('Usage: NEON_URL="postgresql://..." node scripts/migrate-sqlite-to-neon.js');
  process.exit(1);
}

async function migrate() {
  // Open SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  console.log(`Opened SQLite: ${SQLITE_PATH}`);

  // Connect to Neon
  const pg = new Client({ connectionString: NEON_URL, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  console.log('Connected to Neon PostgreSQL');

  try {
    // --- Migrate Users ---
    const users = sqlite.prepare('SELECT * FROM User').all();
    console.log(`\nMigrating ${users.length} users...`);
    for (const u of users) {
      await pg.query(
        `INSERT INTO "User" (id, name, phone, email, password, role, status, level, "dailyGoalMinutes", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6:::"UserRole",$7:::"UserStatus",$8:::"Level",$9,$10,$11)
         ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.phone, u.email, u.password, u.role, u.status, u.level, u.dailyGoalMinutes, u.createdAt, u.updatedAt]
      );
    }
    console.log(`  ✓ ${users.length} users migrated`);

    // --- Migrate Sessions ---
    const sessions = sqlite.prepare('SELECT * FROM Session').all();
    console.log(`Migrating ${sessions.length} sessions...`);
    for (const s of sessions) {
      await pg.query(
        `INSERT INTO "Session" (id, "userId", mode, level, duration, score, "vocabularyJson", "fillerWordCount", "fillerDetails", "avgPronunciation", "createdAt", "updatedAt")
         VALUES ($1,$2,$3:::"Mode",$4:::"Level",$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        [s.id, s.userId, s.mode, s.level, s.duration, s.score, s.vocabularyJson, s.fillerWordCount, s.fillerDetails, s.avgPronunciation, s.createdAt, s.updatedAt]
      );
    }
    console.log(`  ✓ ${sessions.length} sessions migrated`);

    // --- Migrate Messages ---
    const messages = sqlite.prepare('SELECT * FROM Message').all();
    console.log(`Migrating ${messages.length} messages...`);
    for (const m of messages) {
      await pg.query(
        `INSERT INTO "Message" (id, "sessionId", role, content, corrections, "pronunciationScore", "fillerWordCount", timestamp)
         VALUES ($1,$2,$3:::"Role",$4,$5,$6,$7,$8)
         ON CONFLICT (id) DO NOTHING`,
        [m.id, m.sessionId, m.role, m.content, m.corrections, m.pronunciationScore, m.fillerWordCount, m.timestamp]
      );
    }
    console.log(`  ✓ ${messages.length} messages migrated`);

    // --- Migrate Errors ---
    const errors = sqlite.prepare('SELECT * FROM Error').all();
    console.log(`Migrating ${errors.length} errors...`);
    for (const e of errors) {
      await pg.query(
        `INSERT INTO "Error" (id, "sessionId", category, original, corrected, explanation, "createdAt")
         VALUES ($1,$2,$3:::"ErrorType",$4,$5,$6,$7)
         ON CONFLICT (id) DO NOTHING`,
        [e.id, e.sessionId, e.category, e.original, e.corrected, e.explanation, e.createdAt]
      );
    }
    console.log(`  ✓ ${errors.length} errors migrated`);

    // --- Migrate Vocabulary ---
    const vocab = sqlite.prepare('SELECT * FROM Vocabulary').all();
    console.log(`Migrating ${vocab.length} vocabulary words...`);
    for (const v of vocab) {
      await pg.query(
        `INSERT INTO "Vocabulary" (id, "userId", "sessionId", word, definition, context, source, mastery, "createdAt", "reviewedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7:::"VocabSource",$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [v.id, v.userId, v.sessionId, v.word, v.definition, v.context, v.source, v.mastery, v.createdAt, v.reviewedAt]
      );
    }
    console.log(`  ✓ ${vocab.length} vocabulary words migrated`);

    // --- Migrate DailyStats ---
    const stats = sqlite.prepare('SELECT * FROM DailyStats').all();
    console.log(`Migrating ${stats.length} daily stats...`);
    for (const d of stats) {
      await pg.query(
        `INSERT INTO "DailyStats" (id, "userId", date, "sessionsCount", "totalDuration", "avgScore", "grammarErrors", "vocabErrors", "structureErrors", "fluencyErrors", "wordsLearned", "fillerWords")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (id) DO NOTHING`,
        [d.id, d.userId, d.date, d.sessionsCount, d.totalDuration, d.avgScore, d.grammarErrors, d.vocabErrors, d.structureErrors, d.fluencyErrors, d.wordsLearned, d.fillerWords]
      );
    }
    console.log(`  ✓ ${stats.length} daily stats migrated`);

    // --- Migrate Achievements ---
    const achievements = sqlite.prepare('SELECT * FROM Achievement').all();
    console.log(`Migrating ${achievements.length} achievements...`);
    for (const a of achievements) {
      await pg.query(
        `INSERT INTO "Achievement" (id, "userId", type, "unlockedAt")
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO NOTHING`,
        [a.id, a.userId, a.type, a.unlockedAt]
      );
    }
    console.log(`  ✓ ${achievements.length} achievements migrated`);

    // --- Verify ---
    console.log('\n--- Verification ---');
    const tables = ['User', 'Session', 'Message', 'Error', 'Vocabulary', 'DailyStats', 'Achievement'];
    for (const table of tables) {
      const sqliteCount = sqlite.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
      const pgResult = await pg.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const pgCount = parseInt(pgResult.rows[0].count);
      const match = sqliteCount === pgCount ? '✓' : '✗ MISMATCH';
      console.log(`  ${table}: SQLite=${sqliteCount} PostgreSQL=${pgCount} ${match}`);
    }

    console.log('\nMigration complete!');
  } finally {
    sqlite.close();
    await pg.end();
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
