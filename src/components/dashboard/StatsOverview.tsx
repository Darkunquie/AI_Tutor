'use client';

interface StatsOverviewProps {
  stats: {
    totalSessions: number;
    totalDuration: number;
    averageScore: number;
    wordsLearned: number;
    totalFillerWords: number;
    avgPronunciation: number;
    weeklyChange: number;
  };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const cards = [
    {
      label: 'Total Sessions',
      value: stats.totalSessions,
      icon: 'auto_stories',
      trend: stats.weeklyChange > 0 ? `+${stats.weeklyChange}%` : stats.weeklyChange < 0 ? `${stats.weeklyChange}%` : null,
      trendUp: stats.weeklyChange > 0,
    },
    {
      label: 'Practice Time',
      value: formatDuration(stats.totalDuration),
      icon: 'schedule',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Average Score',
      value: `${stats.averageScore}%`,
      icon: 'grade',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Words Learned',
      value: stats.wordsLearned,
      icon: 'spellcheck',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Pronunciation',
      value: stats.avgPronunciation > 0 ? `${stats.avgPronunciation}%` : '—',
      icon: 'record_voice_over',
      trend: null,
      trendUp: true,
    },
    {
      label: 'Filler Words',
      value: stats.totalFillerWords,
      icon: 'chat_bubble',
      trend: null,
      trendUp: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {card.label}
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#3c83f6]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-[#3c83f6]">{card.icon}</span>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {card.value}
          </div>
          {card.trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${
              card.label === 'Filler Words'
                ? 'text-emerald-600 dark:text-emerald-400'
                : card.trendUp
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
            }`}>
              <span className="material-symbols-outlined text-sm">
                {card.label === 'Filler Words' ? 'trending_down' : card.trendUp ? 'trending_up' : 'trending_down'}
              </span>
              {card.trend} vs last week
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
