'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import RequireAuth from '@/components/auth/RequireAuth';
import { AppShell } from '@/components/app/AppShell';


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

const PERIODS = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: 'All' },
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) { return `${h}h ${m}m`; }
  return `${m}m`;
}

function humanMode(m: string) {
  const map: Record<string, string> = {
    FREE_TALK: 'Free Talk',
    ROLE_PLAY: 'Role Play',
    DEBATE: 'Debate',
    GRAMMAR_FIX: 'Grammar Fix',
    PRONUNCIATION: 'Pronunciation',
  };
  return map[m] ?? m;
}

function titleCase(s: string) {
  if (!s) { return ''; }
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/* ------------------------------------------------------------------ */
/* Academic Seal icon                                                  */
/* ------------------------------------------------------------------ */
function AcademicSeal({ icon, className = '' }: { icon: string; className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full border-[1.5px] border-[#f2be8c] ${className}`}
      style={{
        width: 42,
        height: 42,
        background: 'radial-gradient(circle, rgba(242,190,140,0.1) 0%, transparent 70%)',
      }}
    >
      <div
        className="absolute inset-[2px] rounded-full border-[0.5px] border-dashed border-[#f2be8c] opacity-50"
      />
      <span
        className="material-symbols-outlined text-[20px] text-[#f2be8c]"
        style={{ textShadow: '0 0 8px rgba(242,190,140,0.3)' }}
      >
        {icon}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stat card (glassmorphism)                                           */
/* ------------------------------------------------------------------ */
function GlassStatCard({
  icon,
  label,
  value,
  change,
}: {
  icon: string;
  label: string;
  value: string | number;
  change?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl p-4"
      style={{
        background: 'rgba(53,52,55,0.4)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(80,69,59,0.15)',
        boxShadow: '0 0 20px rgba(242,190,140,0.05)',
      }}
    >
      <AcademicSeal icon={icon} />
      <div>
        <p className="text-[10px] uppercase tracking-widest leading-none mb-1 text-[#d4c4b7]">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-serif text-[#f2be8c]">{value}</h3>
          {change && (
            <span className="text-[#a7ccea] text-[10px] font-bold">{change}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Error bar row                                                       */
/* ------------------------------------------------------------------ */
const ERROR_CONFIG = [
  { key: 'GRAMMAR' as const, label: 'Grammar Accuracy', color: '#ffb4ab', suffix: '% Errors' },
  { key: 'VOCABULARY' as const, label: 'Vocab Variety', color: '#d4a373', suffix: '% Imp.' },
  { key: 'STRUCTURE' as const, label: 'Sentence Structure', color: '#a7ccea', suffix: '% Complex' },
  { key: 'FLUENCY' as const, label: 'Speech Fluency', color: '#b19cd9', suffix: '% Hes.' },
];

/* ------------------------------------------------------------------ */
/* Main dashboard page                                                 */
/* ------------------------------------------------------------------ */
export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) { return; }
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const statsData = await api.stats.overview({ userId: user.id, period });
        const progressResult = await api.stats.progress({ userId: user.id, period });
        if (!cancelled) {
          setStats(statsData as Stats);
          setProgressData(progressResult.data || []);
        }
      } catch (error) {
        if (!cancelled) {
          logger.error('Failed to fetch dashboard data:', error);
          setFetchError('Failed to load dashboard data.');
        }
      } finally {
        if (!cancelled) { setIsLoading(false); }
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [period, authLoading, isAuthenticated, user]);

  const errorTotal = useMemo(() => {
    if (!stats) { return 0; }
    const e = stats.errorBreakdown;
    return e.GRAMMAR + e.VOCABULARY + e.STRUCTURE + e.FLUENCY;
  }, [stats]);

  const streakDays = 5; // TODO: wire to /api/streaks

  return (
    <RequireAuth>
      <AppShell>
        {/* ── Top bar with period selector ── */}
        <header className="sticky top-0 z-40 border-b border-[#50453b]/20 bg-[#131315]/90 px-6 py-3 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="font-serif text-xl font-bold leading-none text-[#f2be8c]">
                  The Scholar
                </h1>
                <span className="font-serif text-[9px] italic uppercase tracking-widest text-[#f2be8c]/60">
                  Command Center
                </span>
              </div>

              <nav className="flex items-center gap-1">
                <Link
                  href="/dashboard"
                  className="rounded-lg border border-[#f2be8c]/20 bg-[#d4a373]/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#f2be8c]"
                >
                  Dashboard
                </Link>
                <Link
                  href="/review"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-500 transition-colors hover:text-[#f2be8c]"
                >
                  Review
                </Link>
              </nav>

              <div className="mx-2 h-6 w-px bg-[#50453b]/20" />

              {/* Period selector pills */}
              <div className="flex rounded-lg border border-[#50453b]/10 bg-[#1b1b1d] p-0.5">
                {PERIODS.map((p) => {
                  const active = period === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setPeriod(p.value)}
                      disabled={isLoading}
                      className={
                        'px-3 py-1 text-[10px] uppercase tracking-widest font-sans transition-colors ' +
                        (active
                          ? 'rounded-md bg-[#353437]/30 text-[#f2be8c]'
                          : 'text-gray-400 hover:text-[#f2be8c]')
                      }
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="rounded-lg bg-gradient-to-r from-[#f2be8c] to-[#d4a373] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#0E0E10] transition-transform active:scale-95"
              >
                New Session
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-6 pb-12 pt-8">
          {fetchError && (
            <div className="mb-6 rounded-xl border border-red-800 bg-red-900/20 p-4">
              <p className="text-sm text-red-400">{fetchError}</p>
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[88px] animate-pulse rounded-xl"
                  style={{ background: 'rgba(53,52,55,0.4)' }}
                />
              ))}
            </div>
          ) : stats && stats.totalSessions === 0 ? (
            /* ── Empty state ── */
            <div className="mt-20 max-w-[520px]">
              <h2 className="font-serif text-[28px] leading-[1.2] text-[#f2be8c]">
                Nothing to show yet.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.6] text-[#9A948A]">
                One session is enough to populate this dashboard.
              </p>
              <Link
                href="/app"
                className="mt-8 inline-flex rounded-lg bg-gradient-to-r from-[#f2be8c] to-[#d4a373] px-6 py-3 text-[15px] font-medium text-[#0E0E10] transition-colors"
              >
                Start your first session
              </Link>
            </div>
          ) : stats ? (
            <>
              {/* ── Stat cards row ── */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <GlassStatCard
                  icon="menu_book"
                  label="Sessions"
                  value={stats.totalSessions}
                  change={stats.weeklyChange > 0 ? `+${stats.weeklyChange}%` : undefined}
                />
                <GlassStatCard
                  icon="hourglass_top"
                  label="Time Invested"
                  value={formatDuration(stats.totalDuration)}
                />
                <GlassStatCard
                  icon="workspace_premium"
                  label="Avg Score"
                  value={`${Math.round(stats.averageScore)}%`}
                />
                <GlassStatCard
                  icon="translate"
                  label="New Words"
                  value={stats.wordsLearned}
                />
              </div>

              {/* ── Three-column layout ── */}
              <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left column — Fluency chart + Streak + Tip */}
                <div className="space-y-6 lg:col-span-4">
                  {/* Fluency Progress bar chart */}
                  <div className="rounded-xl border border-[#50453b]/15 bg-[#1b1b1d] p-6">
                    <div className="mb-6 flex items-start justify-between">
                      <h4 className="font-serif text-lg italic text-[#f2be8c]">Fluency Progress</h4>
                      <span className="material-symbols-outlined text-[#f2be8c]/30">analytics</span>
                    </div>
                    <div className="mb-4 flex h-32 items-end gap-1.5 px-1">
                      {progressData.slice(-8).map((d, i) => {
                        const maxScore = 100;
                        const h = Math.max(5, (d.score / maxScore) * 100);
                        const isLast = i === Math.min(progressData.length, 8) - 1;
                        return (
                          <div
                            key={d.date}
                            className={`flex-1 rounded-t-sm ${
                              isLast
                                ? 'bg-gradient-to-t from-[#f2be8c] to-[#d4a373]'
                                : 'bg-[#f2be8c]'
                            }`}
                            style={{ height: `${h}%`, opacity: isLast ? 1 : 0.2 + (i / 8) * 0.4 }}
                          />
                        );
                      })}
                      {progressData.length === 0 &&
                        Array.from({ length: 8 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-[#f2be8c]"
                            style={{ height: `${15 + i * 8}%`, opacity: 0.15 + i * 0.05 }}
                          />
                        ))}
                    </div>
                    <div className="flex justify-between text-[9px] uppercase tracking-tight text-[#d4c4b7]">
                      <span>{progressData[0]?.date || '—'}</span>
                      <span>Today</span>
                    </div>
                  </div>

                  {/* Streak widget */}
                  <div className="rounded-xl border border-[#50453b]/15 bg-[#1b1b1d] p-6 text-center">
                    <h4 className="mb-4 font-serif text-sm italic text-[#f2be8c]">
                      Learning Momentum
                    </h4>
                    <div className="relative mb-6 inline-flex items-center justify-center">
                      <svg className="h-32 w-32 -rotate-90">
                        <circle
                          className="text-[#353437]"
                          cx="64" cy="64" r="56"
                          fill="transparent" stroke="currentColor" strokeWidth="6"
                        />
                        <circle
                          className="text-[#f2be8c]"
                          cx="64" cy="64" r="56"
                          fill="transparent" stroke="currentColor" strokeWidth="6"
                          strokeDasharray="352"
                          strokeDashoffset={352 - (streakDays / 7) * 352}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="block font-serif text-3xl text-[#f2be8c]">{streakDays}</span>
                        <span className="text-[8px] uppercase tracking-widest text-[#d4c4b7]">
                          Day Streak
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/app"
                        className="rounded-lg border border-[#f2be8c]/20 bg-[#f2be8c]/10 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-[#f2be8c] transition-all hover:bg-[#f2be8c]/20"
                      >
                        Start Session
                      </Link>
                      <Link
                        href="/review"
                        className="rounded-lg border border-[#50453b]/10 bg-[#353437]/50 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-[#d4c4b7] transition-colors hover:text-[#f2be8c]"
                      >
                        Review Notes
                      </Link>
                    </div>
                  </div>

                  {/* Scholar's Tip */}
                  <div className="rounded-xl border border-[#50453b]/15 bg-[#1b1b1d] p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <AcademicSeal icon="history_edu" className="scale-75" />
                      <h4 className="font-serif text-sm italic text-[#f2be8c]">Scholar&apos;s Tip</h4>
                    </div>
                    <p className="text-xs italic leading-relaxed text-[#d4c4b7]">
                      &ldquo;Your use of conditional clauses has improved. Try incorporating more
                      <strong> subjunctive moods</strong> in your next conversation to reach C2 level.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Middle column — Linguistic Precision + Achievements */}
                <div className="space-y-6 lg:col-span-3">
                  <div className="flex h-full flex-col rounded-xl border border-[#50453b]/15 bg-[#1b1b1d] p-6">
                    <div className="mb-8 flex items-center justify-between">
                      <h4 className="font-serif text-lg italic text-[#f2be8c]">
                        Linguistic Precision
                      </h4>
                      <span className="material-symbols-outlined text-[#f2be8c]/30">psychology</span>
                    </div>

                    <div className="space-y-8">
                      {ERROR_CONFIG.map((cfg) => {
                        const val = stats.errorBreakdown[cfg.key];
                        const pct = errorTotal > 0 ? Math.round((val / errorTotal) * 100) : 0;
                        return (
                          <div key={cfg.key}>
                            <div className="mb-2 flex justify-between text-[10px] uppercase tracking-widest">
                              <span className="text-[#d4c4b7]">{cfg.label}</span>
                              <span style={{ color: cfg.color }}>
                                {pct}{cfg.suffix}
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#353437]">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Achievements */}
                    <div className="mt-auto border-t border-[#50453b]/10 pt-8">
                      <h4 className="mb-4 font-serif text-xs italic uppercase tracking-wider text-[#f2be8c]">
                        Recent Accolades
                      </h4>
                      <div className="flex justify-between gap-2">
                        <AcademicSeal icon="dark_mode" />
                        <AcademicSeal icon="auto_stories" />
                        <AcademicSeal icon="verified_user" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — Session Ledger */}
                <div className="lg:col-span-5">
                  <SessionLedger userId={user!.id} />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Floating AI assistant indicator */}
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
          <div className="rounded-full border border-[#50453b]/20 bg-[#353437]/60 px-4 py-1.5 text-[9px] italic uppercase tracking-widest text-[#f2be8c] shadow-2xl backdrop-blur-xl">
            AI Assistant Active
          </div>
          <Link
            href="/app"
            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#f2be8c] bg-gradient-to-tr from-[#f2be8c]/20 to-[#d4a373]/20 transition-transform hover:scale-105"
            style={{
              background: 'radial-gradient(circle, rgba(242,190,140,0.1) 0%, transparent 70%)',
            }}
          >
            <span
              className="material-symbols-outlined text-3xl text-[#f2be8c]"
              style={{ textShadow: '0 0 8px rgba(242,190,140,0.3)' }}
            >
              mic
            </span>
          </Link>
        </div>
      </AppShell>
    </RequireAuth>
  );
}

/* ------------------------------------------------------------------ */
/* Session Ledger — table with academic styling                        */
/* ------------------------------------------------------------------ */
interface SessionItem {
  id: string;
  mode: string;
  level: string;
  duration: number;
  score: number;
  createdAt: string;
}

function scoreToGrade(score: number): { grade: string; color: string } {
  if (score >= 90) { return { grade: 'A+', color: '#f2be8c' }; }
  if (score >= 85) { return { grade: 'A', color: '#f2be8c' }; }
  if (score >= 80) { return { grade: 'A-', color: '#f2be8c' }; }
  if (score >= 75) { return { grade: 'B+', color: '#f2be8c' }; }
  if (score >= 70) { return { grade: 'B', color: '#d4a373' }; }
  if (score >= 65) { return { grade: 'B-', color: '#d4a373' }; }
  if (score >= 60) { return { grade: 'C+', color: '#a7ccea' }; }
  if (score >= 50) { return { grade: 'C', color: '#a7ccea' }; }
  return { grade: 'D', color: '#ffb4ab' };
}

function SessionLedger({ userId }: { userId: string }) {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 4;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.sessions.list({ userId, page, pageSize });
        const typed = res as unknown as { data: SessionItem[]; total: number };
        if (!cancelled) {
          setItems(typed.data ?? []);
          setTotal(typed.total ?? 0);
        }
      } catch (e) {
        logger.error('Session ledger fetch failed:', e);
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [userId, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-[#50453b]/15 bg-[#1b1b1d]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#50453b]/15 bg-[#2a2a2c]/30 p-5">
        <div className="flex items-center gap-3">
          <AcademicSeal icon="list_alt" className="scale-75" />
          <h4 className="font-serif text-lg italic leading-none text-[#f2be8c]">
            Detailed Session Ledger
          </h4>
        </div>
        <span className="material-symbols-outlined text-xl text-[#f2be8c]">filter_list</span>
      </div>

      {/* Table */}
      <div className="flex-grow overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[#50453b]/5 text-[9px] uppercase tracking-widest text-[#d4c4b7]">
              <th className="px-5 py-4 font-medium">Session / Topic</th>
              <th className="px-5 py-4 text-center font-medium">Dur.</th>
              <th className="px-5 py-4 text-right font-medium">Accuracy</th>
              <th className="px-5 py-4 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#50453b]/5">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={4} className="px-5 py-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#353437]" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-sm text-[#d4c4b7]">
                  No sessions yet
                </td>
              </tr>
            ) : (
              items.map((s) => {
                const { grade, color } = scoreToGrade(Math.round(s.score ?? 0));
                return (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-[#2a2a2c]/40"
                  >
                    <td className="px-5 py-4">
                      <span className="mb-0.5 block text-xs font-bold text-[#e5e1e4]">
                        {humanMode(s.mode)}
                      </span>
                      <span className="rounded border border-[#f2be8c]/10 bg-[#f2be8c]/5 px-1.5 py-0.5 text-[9px] text-[#f2be8c]/70">
                        {titleCase(s.level)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-[10px] text-[#d4c4b7]">
                      {formatDuration(s.duration ?? 0)}
                    </td>
                    <td className="px-5 py-4 text-right text-[10px] font-medium text-[#e5e1e4]">
                      {Math.round(s.score ?? 0)}%
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="font-serif font-bold" style={{ color }}>
                        {grade}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-auto flex items-center justify-between border-t border-[#50453b]/10 bg-[#2a2a2c]/10 px-5 py-4">
        <span className="text-[9px] uppercase tracking-widest text-[#d4c4b7]">
          {items.length > 0
            ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`
            : '0 sessions'}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-6 w-6 items-center justify-center rounded border border-[#50453b]/10 text-[#d4c4b7] disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-xs">chevron_left</span>
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex h-6 w-6 items-center justify-center rounded border border-[#50453b]/10 text-[#e5e1e4] hover:border-[#f2be8c]/40 disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-xs">chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  );
}
