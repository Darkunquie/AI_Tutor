'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import RequireAuth from '@/components/auth/RequireAuth';
import { AppShell } from '@/components/app/AppShell';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="py-5">
      <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">{label}</div>
      <div className="font-serif-display tabular-nums text-[40px] leading-[1.05] tracking-[-0.02em] text-[#F5F2EC]">
        {value}
      </div>
      {sub && <div className="mt-1 text-[12px] text-[#6B665F]">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) return;
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
    if (!stats) return 0;
    const e = stats.errorBreakdown;
    return e.GRAMMAR + e.VOCABULARY + e.STRUCTURE + e.FLUENCY;
  }, [stats]);

  return (
    <RequireAuth>
      <AppShell>
        <div className="mx-auto max-w-[1100px] px-10 pt-16 pb-16">
          {/* Header */}
          <div className="flex items-end justify-between border-b border-[#2A2A2E] pb-8">
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                Your progress
              </div>
              <h1 className="font-serif-display text-[48px] leading-[1.05] tracking-[-0.02em] text-[#F5F2EC]">
                Dashboard.
              </h1>
              <p className="mt-3 text-[15px] leading-[1.55] text-[#9A948A]">
                {stats && stats.weeklyChange > 0
                  ? `Your speaking score is up ${stats.weeklyChange}% this week.`
                  : 'Speak for a few minutes today and your score will start moving.'}
              </p>
            </div>

            <div className="flex items-center gap-5">
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#6B665F]">Period</span>
              {PERIODS.map((p) => {
                const active = period === p.value;
                return (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    disabled={isLoading}
                    className={
                      'text-[14px] transition-colors ' +
                      (active
                        ? 'text-[#F5F2EC] underline decoration-[#D4A373] decoration-2 underline-offset-[6px]'
                        : 'text-[#9A948A] hover:text-[#F5F2EC]')
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {fetchError && (
            <div className="mt-6 border-l-2 border-[#B5564C] bg-[#B5564C]/10 px-4 py-3 text-[13px] text-[#F5F2EC]">
              {fetchError}
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="mt-16 grid grid-cols-6 gap-x-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="py-5">
                  <div className="mb-3 h-[11px] w-20 rounded bg-[#2A2A2E]" />
                  <div className="h-[40px] w-full rounded bg-[#17171A]" />
                </div>
              ))}
            </div>
          ) : stats && stats.totalSessions === 0 ? (
            <div className="mt-20 max-w-[520px]">
              <h2 className="font-serif-display text-[28px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
                Nothing to show yet.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.6] text-[#9A948A]">
                One session is enough to populate this dashboard. Metrics update the moment
                you end a conversation.
              </p>
              <Link
                href="/app"
                className="mt-8 inline-flex rounded-md bg-[#D4A373] px-6 py-[14px] text-[15px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
              >
                Start your first session
              </Link>
            </div>
          ) : stats ? (
            <>
              {/* Stats grid */}
              <div className="mt-8 grid grid-cols-3 gap-x-10 divide-x divide-[#2A2A2E] border-b border-[#2A2A2E] md:grid-cols-6">
                <div className="pl-0">
                  <Stat label="Sessions" value={stats.totalSessions} />
                </div>
                <div className="pl-8">
                  <Stat label="Time practised" value={formatDuration(stats.totalDuration)} />
                </div>
                <div className="pl-8">
                  <Stat label="Avg. score" value={`${Math.round(stats.averageScore)}/100`} />
                </div>
                <div className="pl-8">
                  <Stat label="Words learned" value={stats.wordsLearned} />
                </div>
                <div className="pl-8">
                  <Stat
                    label="Pronunciation"
                    value={`${Math.round(stats.avgPronunciation)}%`}
                  />
                </div>
                <div className="pl-8">
                  <Stat label="Filler words" value={stats.totalFillerWords} sub="total occurrences" />
                </div>
              </div>

              {/* Chart + errors */}
              <div className="mt-16 grid grid-cols-3 gap-10">
                <div className="col-span-2">
                  <div className="mb-6 flex items-baseline justify-between">
                    <h3 className="font-serif-display text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
                      Score over time.
                    </h3>
                    <span className="text-[12px] text-[#6B665F]">
                      {progressData.length} data points
                    </span>
                  </div>
                  <div className="h-[280px] border border-[#2A2A2E] bg-[#17171A]/40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid stroke="#2A2A2E" strokeDasharray="2 4" />
                        <XAxis
                          dataKey="date"
                          stroke="#6B665F"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#2A2A2E' }}
                        />
                        <YAxis
                          stroke="#6B665F"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: '#2A2A2E' }}
                          domain={[0, 100]}
                        />
                        <Tooltip
                          contentStyle={{
                            background: '#17171A',
                            border: '1px solid #2A2A2E',
                            borderRadius: 4,
                            fontSize: 12,
                            color: '#F5F2EC',
                          }}
                          labelStyle={{ color: '#9A948A' }}
                          cursor={{ stroke: '#D4A373', strokeWidth: 1, strokeDasharray: '2 4' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#D4A373"
                          strokeWidth={1.6}
                          dot={{ r: 2.5, fill: '#D4A373', stroke: '#D4A373' }}
                          activeDot={{ r: 4, fill: '#F2C38E' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="col-span-1">
                  <h3 className="font-serif-display mb-6 text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
                    Where the mistakes live.
                  </h3>
                  <div className="space-y-5">
                    {(['GRAMMAR', 'VOCABULARY', 'STRUCTURE', 'FLUENCY'] as const).map((key) => {
                      const val = stats.errorBreakdown[key];
                      const pct = errorTotal > 0 ? Math.round((val / errorTotal) * 100) : 0;
                      return (
                        <div key={key}>
                          <div className="mb-1.5 flex items-baseline justify-between text-[12px]">
                            <span className="uppercase tracking-[0.12em] text-[#9A948A]">
                              {key.toLowerCase()}
                            </span>
                            <span className="tabular-nums text-[#6B665F]">
                              {val} · {pct}%
                            </span>
                          </div>
                          <div className="h-[2px] w-full bg-[#2A2A2E]">
                            <div
                              className="h-full bg-[#D4A373]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Session history */}
              <div className="mt-16">
                <h3 className="font-serif-display mb-6 text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
                  Recent sessions.
                </h3>
                {user && <SessionHistoryTable userId={user.id} />}
              </div>
            </>
          ) : null}
        </div>
      </AppShell>
    </RequireAuth>
  );
}

/* ------------------------------------------------------------------ */
/* Inline session history table — minimal, editorial                  */
/* ------------------------------------------------------------------ */

interface SessionItem {
  id: string;
  mode: string;
  level: string;
  duration: number;
  score: number;
  createdAt: string;
}

function SessionHistoryTable({ userId }: { userId: string }) {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.sessions.list({ userId, page: 1, pageSize: 10 });
        if (!cancelled) setItems((res?.data ?? []) as SessionItem[]);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load sessions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[52px] w-full bg-[#17171A]/60" />
        ))}
      </div>
    );
  }
  if (err) {
    return <div className="text-[13px] text-[#9A948A]">Could not load sessions: {err}</div>;
  }
  if (!items.length) {
    return <div className="text-[13px] text-[#9A948A]">No sessions yet.</div>;
  }

  return (
    <div className="border-t border-[#2A2A2E]">
      <div className="grid grid-cols-12 gap-4 border-b border-[#2A2A2E] py-3 text-[11px] uppercase tracking-[0.14em] text-[#6B665F]">
        <div className="col-span-3">Mode</div>
        <div className="col-span-2">Level</div>
        <div className="col-span-3">Date</div>
        <div className="col-span-2 text-right">Duration</div>
        <div className="col-span-2 text-right">Score</div>
      </div>
      <ul>
        {items.map((s, i) => (
          <li
            key={s.id ?? i}
            className="grid grid-cols-12 gap-4 border-b border-[#2A2A2E] py-4 text-[14px] text-[#F5F2EC] transition-colors hover:bg-[#17171A]"
          >
            <div className="col-span-3 font-medium">{humanMode(s.mode)}</div>
            <div className="col-span-2 text-[#9A948A]">{titleCase(s.level)}</div>
            <div className="col-span-3 tabular-nums text-[#9A948A]">
              {(() => {
                if (!s.createdAt) return '—';
                const d = new Date(s.createdAt);
                return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              })()}
            </div>
            <div className="col-span-2 tabular-nums text-right text-[#9A948A]">
              {formatDuration(s.duration ?? 0)}
            </div>
            <div className="col-span-2 tabular-nums text-right text-[#D4A373]">
              {Math.round(s.score ?? 0)}/100
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
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
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
