import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAdmin, successResponse } from '@/lib/error-handler';

async function handleGet(_request: NextRequest) {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    totalSessions,
    recentSessions,
    totalVocabulary,
    sessionAgg,
    newUsersThisWeek,
    newUsersThisMonth,
    activeUsersThisWeek,
  ] = await Promise.all([
    db.user.count({ where: { role: 'USER' } }),
    db.user.count({ where: { status: 'PENDING', role: 'USER' } }),
    db.user.count({ where: { status: 'APPROVED', role: 'USER' } }),
    db.user.count({ where: { status: 'REJECTED', role: 'USER' } }),
    db.session.count(),
    db.session.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.vocabulary.count(),
    db.session.aggregate({
      _sum: { duration: true },
      _avg: { score: true },
    }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo }, role: 'USER' } }),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo }, role: 'USER' } }),
    db.session.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  return successResponse({
    users: {
      total: totalUsers,
      pending: pendingUsers,
      approved: approvedUsers,
      rejected: rejectedUsers,
      newThisWeek: newUsersThisWeek,
      newThisMonth: newUsersThisMonth,
    },
    activity: {
      totalSessions,
      sessionsThisWeek: recentSessions,
      activeUsersThisWeek: activeUsersThisWeek.length,
      totalPracticeDuration: sessionAgg._sum.duration || 0,
      averageScore: Math.round(sessionAgg._avg.score || 0),
      totalVocabularyLearned: totalVocabulary,
    },
  });
}

export const GET = withAdmin(handleGet);
