'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import type { StreakData } from '@/lib/types';

export function StreakWidget() {
  const [data, setData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    setLoading(true);
    api.streaks.get()
      .then((result) => {
        if (mounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          setLoading(false);
          console.error('Failed to fetch streak data:', err);
        }
      });

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
        <div className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6">
        <p className="text-sm text-red-500 text-center">{error}</p>
      </div>
    );
  }

  const goalPercent = data.dailyGoalMinutes > 0
    ? Math.min(100, Math.round((data.todayMinutes / data.dailyGoalMinutes) * 100))
    : 0;

  // SVG circle progress
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (goalPercent / 100) * circumference;

  return (
    <div className="rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-6">
      <div className="flex items-center justify-between">
        {/* Streak count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10">
            <span className="material-symbols-outlined text-3xl text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {data.currentStreak}
              <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 ml-1">
                {data.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Best: {data.longestStreak} days
            </p>
          </div>
        </div>

        {/* Daily goal progress ring */}
        <div className="relative flex items-center justify-center">
          <svg width="68" height="68" className="-rotate-90">
            <circle
              cx="34" cy="34" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-slate-200 dark:text-slate-700"
            />
            <circle
              cx="34" cy="34" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={data.dailyGoalMet ? 'text-emerald-500' : 'text-[#3c83f6]'}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {data.dailyGoalMet ? (
              <span className="material-symbols-outlined text-emerald-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {goalPercent}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Goal label */}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        {data.todayMinutes} / {data.dailyGoalMinutes} min today
      </p>
    </div>
  );
}
