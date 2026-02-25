'use client';

interface AdminStats {
  users: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  activity: {
    totalSessions: number;
    sessionsThisWeek: number;
    activeUsersThisWeek: number;
    totalPracticeDuration: number;
    averageScore: number;
    totalVocabularyLearned: number;
  };
}

interface AdminStatsCardsProps {
  stats: AdminStats;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    {
      label: 'Total Users',
      value: stats.users.total,
      icon: 'group',
      color: 'text-[#3c83f6]',
      bgColor: 'bg-[#3c83f6]/10',
      sub: `${stats.users.newThisWeek} new this week`,
    },
    {
      label: 'Pending Approval',
      value: stats.users.pending,
      icon: 'pending',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      sub: stats.users.pending > 0 ? 'Action needed' : 'All clear',
      alert: stats.users.pending > 0,
    },
    {
      label: 'Active Users (7d)',
      value: stats.activity.activeUsersThisWeek,
      icon: 'trending_up',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      sub: `${stats.activity.sessionsThisWeek} sessions this week`,
    },
    {
      label: 'Total Sessions',
      value: stats.activity.totalSessions,
      icon: 'chat',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      sub: `${formatDuration(stats.activity.totalPracticeDuration)} total practice`,
    },
    {
      label: 'Avg Score',
      value: stats.activity.averageScore,
      icon: 'grade',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      sub: 'Out of 100',
    },
    {
      label: 'Words Learned',
      value: stats.activity.totalVocabularyLearned,
      icon: 'menu_book',
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      sub: 'Across all users',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${card.bgColor}`}>
              <span className={`material-symbols-outlined text-xl ${card.color}`}>
                {card.icon}
              </span>
            </div>
            {card.alert && (
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {card.value}
          </p>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            {card.label}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {card.sub}
          </p>
        </div>
      ))}
    </div>
  );
}
