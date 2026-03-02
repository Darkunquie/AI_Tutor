'use client';

interface TrialStats {
  active: number;
  expiringSoon: number;
  expired: number;
  noTrial: number;
}

interface TrialStatsCardsProps {
  trials: TrialStats;
}

export default function TrialStatsCards({ trials }: TrialStatsCardsProps) {
  const cards = [
    {
      label: 'Active Trials',
      value: trials.active,
      icon: 'verified',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      sub: 'Currently on trial',
    },
    {
      label: 'Expiring Soon',
      value: trials.expiringSoon,
      icon: 'timer',
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      sub: 'Within 24 hours',
      alert: trials.expiringSoon > 0,
    },
    {
      label: 'Expired Trials',
      value: trials.expired,
      icon: 'timer_off',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      sub: 'Trial period ended',
    },
    {
      label: 'No Trial',
      value: trials.noTrial,
      icon: 'block',
      color: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-800/50',
      sub: 'Approved without trial',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <span className="relative flex h-3 w-3">
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
