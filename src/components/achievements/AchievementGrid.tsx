'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { AchievementItem } from '@/lib/types';

export function AchievementGrid() {
  const [unlocked, setUnlocked] = useState<AchievementItem[]>([]);
  const [locked, setLocked] = useState<AchievementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievements = () => {
    setError(null);
    setLoading(true);
    api.achievements.list()
      .then((data) => {
        setUnlocked(data.unlocked);
        setLocked(data.locked);
        setLoading(false);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setLoading(false);
        console.error('Failed to fetch achievements:', err);
      });
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6">
        <div className="text-center py-4">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          <button
            onClick={fetchAchievements}
            className="text-xs text-[#3c83f6] hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-lg text-amber-500">emoji_events</span>
        Achievements
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-auto">
          {unlocked.length}/{unlocked.length + locked.length}
        </span>
      </h3>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
        {unlocked.map((a) => (
          <div key={a.type} className="flex flex-col items-center gap-1 group" title={`${a.title}: ${a.description}`}>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border-2 border-amber-400/50 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                {a.icon}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 text-center leading-tight">
              {a.title}
            </span>
          </div>
        ))}

        {locked.map((a) => (
          <div key={a.type} className="flex flex-col items-center gap-1 opacity-40" title={a.description}>
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-slate-400 dark:text-slate-500">
                lock
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center leading-tight">
              {a.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
