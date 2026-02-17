'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Flashcard } from '@/components/review/Flashcard';
import RequireAuth from '@/components/auth/RequireAuth';
import type { ReviewWord, ReviewStats } from '@/lib/types';

export default function ReviewPage() {
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async () => {
    setError(null);
    setLoading(true);
    setCompleted(false);
    try {
      const data = await api.vocabulary.getReviewWords(20);
      setWords(data.words);
      setStats(data.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      console.error('Failed to fetch review words:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  return (
    <RequireAuth>
      <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#101722] text-slate-900 dark:text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#101722]/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="p-2 bg-[#3c83f6] rounded-xl text-white">
                  <span className="material-symbols-outlined block text-xl">school</span>
                </div>
                <span className="text-xl font-bold tracking-tight">Talkivo</span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Dashboard
                </Link>
                <span className="px-4 py-2 text-sm font-semibold text-[#3c83f6] bg-[#3c83f6]/10 rounded-lg">
                  Review
                </span>
                <Link href="/" className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Practice
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-2xl font-bold tracking-tight">Vocabulary Review</h1>
            {stats && (
              <div className="flex items-center gap-6 mt-2 text-sm text-purple-100">
                <span><strong className="text-white">{stats.totalDue}</strong> due</span>
                <span><strong className="text-white">{stats.reviewedToday}</strong> reviewed today</span>
                <span><strong className="text-white">{stats.totalWords}</strong> total words</span>
              </div>
            )}
          </div>
        </section>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-6 py-10">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Failed to Load</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
              </div>
              <button
                onClick={fetchWords}
                className="px-6 py-2.5 bg-[#3c83f6] hover:bg-[#2b6bcf] text-white font-semibold rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">Loading words...</p>
            </div>
          ) : completed ? (
            /* Completed state */
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                  celebration
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Session Complete!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">Great job reviewing your vocabulary.</p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={fetchWords}
                  className="px-6 py-3 rounded-xl bg-[#3c83f6] text-white font-bold text-sm hover:bg-[#3c83f6]/90 transition-colors shadow-lg shadow-[#3c83f6]/20"
                >
                  Review More
                </button>
                <Link
                  href="/dashboard"
                  className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          ) : words.length === 0 ? (
            /* Empty state */
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#3c83f6]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-[#3c83f6]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">All caught up!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                No words due for review. Start a practice session to learn new vocabulary!
              </p>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#3c83f6] text-white text-lg font-bold hover:scale-105 transition-all shadow-2xl shadow-[#3c83f6]/40"
              >
                Start Practicing
              </Link>
            </div>
          ) : (
            /* Flashcard UI */
            <Flashcard words={words} onComplete={() => setCompleted(true)} />
          )}
        </main>
      </div>
    </RequireAuth>
  );
}
