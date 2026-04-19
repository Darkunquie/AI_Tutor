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

function formatNumber(n: number): string {
  if (n >= 1000) { return `${(n / 1000).toFixed(1)}k`; }
  return String(n);
}

export default function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  const cards = [
    { label: 'Total Users', value: String(stats.users.total) },
    { label: 'Pending', value: String(stats.users.pending) },
    { label: 'Active', value: String(stats.activity.activeUsersThisWeek) },
    { label: 'Sessions', value: String(stats.activity.totalSessions) },
    { label: 'Avg Score', value: `${stats.activity.averageScore}%` },
    { label: 'Words', value: formatNumber(stats.activity.totalVocabularyLearned) },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-[rgba(27,27,29,0.7)] backdrop-blur-[12px] border border-[rgba(80,69,59,0.15)] p-6 rounded-xl relative overflow-hidden group shadow-[0_20px_50px_rgba(242,190,140,0.03)] hover:shadow-[0_20px_50px_rgba(242,190,140,0.08)] transition-all duration-500"
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-widest uppercase text-[#D4C4B7]">{card.label}</span>
            <span className="font-serif text-3xl text-[#f2be8c] font-bold">{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
