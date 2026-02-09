'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/utils';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProgressChart } from '@/components/dashboard/ProgressChart';
import { ErrorAnalysis } from '@/components/dashboard/ErrorAnalysis';
import { SessionHistory } from '@/components/dashboard/SessionHistory';

interface Stats {
  totalSessions: number;
  totalDuration: number;
  averageScore: number;
  wordsLearned: number;
  totalFillerWords: number;
  avgPronunciation: number;
  errorBreakdown: {
    GRAMMAR: number;
    VOCABULARY: number;
    STRUCTURE: number;
    FLUENCY: number;
  };
  weeklyChange: number;
}

interface ProgressData {
  date: string;
  sessions: number;
  duration: number;
  score: number;
  grammarErrors: number;
  vocabErrors: number;
  structureErrors: number;
  fluencyErrors: number;
  fillerWords: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);

  const userId = 'anonymous';

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const statsData = await api.stats.overview({ userId, period });
        setStats(statsData as Stats);

        const progressResult = await api.stats.progress({ userId, period });
        setProgressData((progressResult.data || []) as unknown as ProgressData[]);
      } catch (error) {
        logger.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const periodOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#101722] text-slate-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#101722]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="p-2 bg-[#3c83f6] rounded-xl text-white">
                <span className="material-symbols-outlined block text-xl">school</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Jarvis</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <span className="px-4 py-2 text-sm font-semibold text-[#3c83f6] bg-[#3c83f6]/10 rounded-lg">
                Dashboard
              </span>
              <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                Practice
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button aria-label="Notifications" className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#3c83f6] rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3c83f6] to-[#8b5cf6] flex items-center justify-center text-white text-sm font-bold">
              Y
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-[#3c83f6] to-[#2563eb] text-white">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Progress Dashboard</h1>
              <p className="text-blue-100 mt-2 text-sm">
                Welcome back! Your English skills have improved by{' '}
                <span className="font-bold text-white">
                  {stats?.weeklyChange ? `${stats.weeklyChange}%` : '—'}
                </span>{' '}
                this week.
              </p>
            </div>

            {/* Period selector - glass morphism */}
            <div className="flex p-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    period === option.value
                      ? 'bg-white text-[#3c83f6] shadow-lg'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-[#3c83f6]/20 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-[#3c83f6] border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm font-medium">Loading your progress...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            {stats && <StatsOverview stats={stats} />}

            {/* Analytics Row - 2/3 + 1/3 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProgressChart data={progressData} />
              </div>
              <div className="lg:col-span-1">
                {stats && <ErrorAnalysis errorBreakdown={stats.errorBreakdown} />}
              </div>
            </div>

            {/* Session History */}
            <SessionHistory userId={userId} />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && stats?.totalSessions === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#3c83f6]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#3c83f6]">school</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">
              Start Your Learning Journey
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
              Complete your first practice session to see your progress here. Every conversation helps you improve!
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#3c83f6] text-white text-lg font-bold hover:scale-105 transition-all shadow-2xl shadow-[#3c83f6]/40"
            >
              <span className="material-symbols-outlined mr-2">play_arrow</span>
              Start Practicing Now
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <span className="material-symbols-outlined text-lg">school</span>
            <span>&copy; 2026 Jarvis AI English Tutor</span>
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500">
            Powered by AI
          </div>
        </div>
      </footer>
    </div>
  );
}
