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
  if (hours > 0) { return `${hours}h ${minutes}m`; }
  return `${minutes}m`;
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    { label: 'Total Users', value: stats.users.total, icon: 'group', sub: `${stats.users.newThisWeek} new this week` },
    { label: 'Pending Approval', value: stats.users.pending, icon: 'pending', sub: stats.users.pending > 0 ? 'Action needed' : 'All clear', alert: stats.users.pending > 0 },
    { label: 'Active Users (7d)', value: stats.activity.activeUsersThisWeek, icon: 'trending_up', sub: `${stats.activity.sessionsThisWeek} sessions this week` },
    { label: 'Total Sessions', value: stats.activity.totalSessions, icon: 'chat', sub: `${formatDuration(stats.activity.totalPracticeDuration)} total practice` },
    { label: 'Avg Score', value: stats.activity.averageScore, icon: 'grade', sub: 'Out of 100' },
    { label: 'Words Learned', value: stats.activity.totalVocabularyLearned, icon: 'menu_book', sub: 'Across all users' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[#1B1B1D] rounded-xl p-6 border border-[#50453B]/10 relative overflow-hidden group hover:shadow-[0_0_25px_rgba(242,190,140,0.08)] transition-all duration-500"
        >
          <div className="absolute bottom-[-10px] right-[-10px] opacity-5 text-[#D4C4B7] group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-6xl">{card.icon}</span>
          </div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <div className="w-10 h-10 rounded-lg bg-[#D4A373]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-[#f2be8c]">{card.icon}</span>
            </div>
            {card.alert && (
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#D4A373] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D4A373]" />
              </span>
            )}
          </div>
          <div className="relative z-10">
            <p className="font-serif text-2xl text-[#f2be8c]">{card.value}</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[#D4C4B7] mt-1 font-bold">{card.label}</p>
            <p className="text-xs text-[#9A948A] mt-1">{card.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
