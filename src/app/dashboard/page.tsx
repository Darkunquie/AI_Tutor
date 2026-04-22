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

interface SessionItem {
  id: string;
  mode: string;
  level: string;
  duration: number;
  score: number;
  createdAt: string;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) { return `${h}h ${m}m`; }
  return `${m}m`;
}

function humanMode(m: string) {
  const map: Record<string, string> = {
    FREE_TALK: 'Free_Talk', ROLE_PLAY: 'Role_Play', DEBATE: 'Debate',
    GRAMMAR_FIX: 'Grammar_Fix', PRONUNCIATION: 'Pronunciation',
  };
  return map[m] ?? m;
}

function relativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days === 0) {
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '.')} // ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} IST`;
  }
  if (days === 1) { return 'YESTERDAY'; }
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replaceAll('/', '.');
}

function SparkBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-16 items-end gap-[2px]">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-full"
          style={{ height: `${Math.max(5, (v / max) * 100)}%`, background: color, opacity: 0.2 + (i / data.length) * 0.8 }}
        />
      ))}
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
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) { return; }
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [statsData, progressResult, sessResult] = await Promise.all([
          api.stats.overview({ userId: user.id, period }),
          api.stats.progress({ userId: user.id, period }),
          api.sessions.list({ userId: user.id, page: 1, pageSize: 5 }),
        ]);
        if (!cancelled) {
          setStats(statsData as Stats);
          setProgressData(progressResult.data || []);
          setSessions((sessResult as unknown as { data: SessionItem[] }).data ?? []);
        }
      } catch (error) {
        logger.error('Dashboard fetch failed:', error);
        if (!cancelled) { setFetchError('Failed to load dashboard data.'); }
      } finally {
        if (!cancelled) { setIsLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [period, authLoading, isAuthenticated, user]);

  const errorTotal = useMemo(() => {
    if (!stats) { return 0; }
    const e = stats.errorBreakdown;
    return e.GRAMMAR + e.VOCABULARY + e.STRUCTURE + e.FLUENCY;
  }, [stats]);

  const pct = (key: 'GRAMMAR' | 'VOCABULARY' | 'STRUCTURE' | 'FLUENCY') =>
    errorTotal > 0 ? Math.round((stats?.errorBreakdown[key] ?? 0) / errorTotal * 100) : 0;

  const scoreTrend = progressData.slice(-8).map((d) => d.score || 0);

  return (
    <RequireAuth>
      <AppShell>
        <div
          className="max-w-[1200px] p-8"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(79,209,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        >

          {/* ── Header ── */}
          <header className="mb-12">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#c7e9b4] shadow-[0_0_8px_rgba(199,233,180,0.7)]" />
              <span className="text-[11px] text-[#7a9a6b]">System Active</span>
              <span className="mx-1 text-zinc-700">{'/'}{'/'}
              </span>
              <span className="text-[11px] text-[#879299]">
                {new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} IST · STREAK {String(stats?.totalSessions ?? 0).padStart(2, '0')}
              </span>
            </div>
            <h1 className="mb-3 font-[Sora] text-4xl font-bold tracking-[-0.03em] text-[#e6eef8]">
              SESSIONS <span className="text-[#bcc8cf]/30">&amp;</span> FOCUS_COMMAND
            </h1>
            <p className="max-w-xl text-sm text-[#bcc8cf]">
              Your learning analytics and session history.
            </p>
          </header>

          {fetchError && (
            <div className="mb-6 border-l-2 border-[#ffb4ab] bg-[#ffb4ab]/10 px-4 py-3">
              <p className="text-sm text-[#ffb4ab]">{fetchError}</p>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[100px] animate-pulse border border-[#3d484e] bg-[#141a22]" />
              ))}
            </div>
          ) : stats && stats.totalSessions === 0 ? (
            <div className="mt-16 max-w-[480px]">
              <h2 className="font-[Sora] text-2xl font-bold text-[#e6eef8]">Nothing to show yet.</h2>
              <p className="mt-3 text-sm text-[#879299]">Complete one session to populate your dashboard.</p>
            </div>
          ) : (<>

          {/* ── Performance ── */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
              <h2 className="text-[14px] font-semibold text-[#e6eef8]">Performance</h2>
              <span className=""></span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Avg Score', val: `${Math.round(stats?.averageScore ?? 0)}%`, color: '#4fd1ff', data: scoreTrend.length > 1 ? scoreTrend : [40, 60, 90, 50, 70, 100, 40, 20] },
                { label: 'Grammar', val: `${pct('GRAMMAR')}%`, color: '#f2bf54', data: [20, 50, 30, 60, 40, 90, 50, 70] },
                { label: 'Fluency', val: `${100 - pct('FLUENCY')}%`, color: '#c7e9b4', data: [80, 70, 90, 100, 85, 95, 80, 75] },
                { label: 'Latency', val: '04', color: '#ffb4ab', data: [10, 15, 12, 20, 15, 10, 18, 5] },
              ].map((t) => (
                <div key={t.label} className="border border-[#3d484e] bg-[#2f353e]/50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[11px] text-[#879299]">{t.label}</span>
                    <span className="text-[13px] font-medium" style={{ color: t.color }}>{t.val}</span>
                  </div>
                  <SparkBars data={t.data} color={t.color} />
                </div>
              ))}
            </div>
          </section>

          {/* ── UNIT 03+04: Progress + Error ── */}
          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Progress chart */}
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
                <h2 className="text-[14px] font-semibold text-[#e6eef8]">Progress</h2>
                <span className=""></span>
              </div>
              <div className="border border-[#3d484e] bg-[#141a22] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#4fd1ff]/60">{'// SCORE TREND'}</span>
                    <h3 className="mt-1 font-[Sora] text-lg font-bold">Weighted score over time</h3>
                  </div>
                  <div className="flex gap-[2px] border border-[#3d484e] bg-[#0d131b] p-[2px]">
                    {['7d', '30d', 'All'].map((p) => (
                      <button key={p} onClick={() => setPeriod(p === 'All' ? '90d' : p)} disabled={isLoading}
                        className={`px-2.5 py-1 font-mono text-[10px] transition-colors ${period === (p === 'All' ? '90d' : p) ? 'bg-[#1f242d] text-[#e6eef8]' : 'text-[#879299] hover:text-[#e6eef8]'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <svg viewBox="0 0 600 200" className="h-[200px] w-full" preserveAspectRatio="none">
                  <defs><linearGradient id="cg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4FD1FF" stopOpacity="0.3" /><stop offset="1" stopColor="#4FD1FF" stopOpacity="0" /></linearGradient></defs>
                  {[40, 100, 160].map((y) => (<line key={y} x1="0" x2="600" y1={y} y2={y} stroke="#3d484e" strokeWidth="0.5" />))}
                  {progressData.length > 1 ? (() => {
                    const pts = progressData.map((d, i) => ({ x: (i / (progressData.length - 1)) * 600, y: 180 - ((d.score / 100) * 160) }));
                    return (<>
                      <path d={`M${pts[0].x},${pts[0].y} ${pts.map((p) => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},200 L${pts[0].x},200 Z`} fill="url(#cg)" />
                      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#4FD1FF" strokeWidth="2" />
                      {pts.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2} fill="#E6EEF8" stroke={i === pts.length - 1 ? '#4FD1FF' : 'none'} strokeWidth="2" />))}
                    </>);
                  })() : (
                    <text x="300" y="110" textAnchor="middle" fill="#879299" fontFamily="JetBrains Mono" fontSize="12">{'// AWAITING DATA'}</text>
                  )}
                  <text x="0" y="196" fill="#879299" fontFamily="JetBrains Mono" fontSize="10">{progressData[0]?.date?.slice(5) || ''}</text>
                  <text x="560" y="196" fill="#879299" fontFamily="JetBrains Mono" fontSize="10">Today</text>
                </svg>
              </div>
            </div>

            {/* Error donut */}
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
                <h2 className="text-[14px] font-semibold text-[#e6eef8]">Error Analysis</h2>
                <span className=""></span>
              </div>
              <div className="border border-[#3d484e] bg-[#141a22] p-6">
                <span className="font-mono text-[10px] text-[#4fd1ff]/60">{'// WHERE YOU SLIP'}</span>
                <div className="mt-4 flex items-center gap-6">
                  <svg width="140" height="140" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#3d484e" strokeWidth="4" />
                    {(() => {
                      const slices = [
                        { val: pct('GRAMMAR'), color: '#4fd1ff' },
                        { val: pct('VOCABULARY'), color: '#2a6c88' },
                        { val: pct('FLUENCY'), color: '#7a9a6b' },
                        { val: pct('STRUCTURE'), color: '#e8b64c' },
                      ];
                      let offset = 0;
                      return slices.map((s, i) => {
                        const dash = (s.val / 100) * 88;
                        const el = <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={s.color} strokeWidth="4" strokeDasharray={`${dash} ${88 - dash}`} strokeDashoffset={-offset} transform="rotate(-90 18 18)" strokeLinecap="round" />;
                        offset += dash;
                        return el;
                      });
                    })()}
                    <text x="18" y="17" textAnchor="middle" fill="#e6eef8" fontFamily="JetBrains Mono" fontSize="6" fontWeight="500">{errorTotal}</text>
                    <text x="18" y="22" textAnchor="middle" fill="#879299" fontFamily="JetBrains Mono" fontSize="2.5">errors</text>
                  </svg>
                  <div className="flex flex-col gap-2.5">
                    {[
                      { label: 'GRAMMAR', color: '#4fd1ff', val: pct('GRAMMAR') },
                      { label: 'VOCABULARY', color: '#2a6c88', val: pct('VOCABULARY') },
                      { label: 'FLUENCY', color: '#7a9a6b', val: pct('FLUENCY') },
                      { label: 'STRUCTURE', color: '#e8b64c', val: pct('STRUCTURE') },
                    ].map((e) => (
                      <div key={e.label} className="flex items-center gap-2.5 font-mono text-xs">
                        <span className="h-2.5 w-2.5" style={{ background: e.color }} />
                        <span className="text-[#bcc8cf]">{e.label}</span>
                        <b className="ml-auto text-[#e6eef8]">{e.val}%</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── UNIT 05+06: Transmissions + Vocab ── */}
          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Recent transmissions */}
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
                <h2 className="text-[14px] font-semibold text-[#e6eef8]">Recent Sessions</h2>
                <span className=""></span>
              </div>
              <div className="space-y-[2px] border border-zinc-800 bg-zinc-900">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between bg-[#161c24] p-4">
                      <div className="h-4 w-48 animate-pulse bg-[#242a33]" />
                    </div>
                  ))
                ) : sessions.length === 0 ? (
                  <div className="bg-[#161c24] p-6 text-center font-mono text-xs text-zinc-500">{'// NO TRANSMISSIONS RECORDED'}</div>
                ) : (
                  sessions.map((s, i) => (
                    <Link key={s.id} href={`/sessions/${s.id}`} className="flex items-center justify-between bg-[#161c24] p-4 transition-colors hover:bg-[#242a33]">
                      <div className="flex items-center gap-4">
                        <span className="">{String(i + 1).padStart(3, '0')}</span>
                        <div>
                          <div className="font-mono text-xs font-bold uppercase text-[#dde3ee]">{humanMode(s.mode)}</div>
                          <div className="">{relativeDate(s.createdAt)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[13px] font-medium text-[#4fd1ff]">{Math.round(s.score ?? 0)}/100</div>
                        <div className="font-mono text-[10px] text-[#c7e9b4]">{formatDuration(s.duration)}</div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <Link href="/dashboard" className="mt-3 block w-full border border-[#3d484e] bg-[#141a22] py-2 text-center font-mono text-[10px] font-bold uppercase text-zinc-500 transition-colors hover:border-[#4fd1ff]/40 hover:text-[#4fd1ff]">
                View All Sessions
              </Link>
            </div>

            {/* Vocab + Streak */}
            <div className="space-y-4">
              {/* Vocab panel (inverted cyan) */}
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
                  <h2 className="text-[14px] font-semibold text-[#e6eef8]">Vocabulary</h2>
                  <span className=""></span>
                </div>
                <div className="relative overflow-hidden border-2 border-[#4fd1ff]/50 bg-[#4fd1ff] p-7">
                  <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 10px)' }} />
                  <div className="relative z-10">
                    <div className="mb-6 flex items-center justify-between border-b border-[#003545]/20 pb-2">
                      <h3 className="font-[Sora] text-[13px] font-bold uppercase tracking-[0.1em] text-[#003545]">VOCAB_ACQUISITION</h3>
                      <span className="font-mono text-[10px] text-[#003545]/60">CRITICAL</span>
                    </div>
                    <div className="mb-7 flex items-center gap-6">
                      <div><div className="font-[Sora] text-5xl font-black tracking-tighter text-[#003545]">{stats?.wordsLearned ?? 0}</div><div className="mt-1 font-mono text-[10px] font-bold text-[#003545]/70">NODES_REGISTERED</div></div>
                      <div className="h-12 w-px bg-[#003545]/20" />
                      <div><div className="font-[Sora] text-5xl font-black tracking-tighter text-[#003545]">+{pct('VOCABULARY')}</div><div className="mt-1 font-mono text-[10px] font-bold text-[#003545]/70">SESSION_GAIN</div></div>
                    </div>
                    <div className="mb-4 flex items-center justify-between border border-[#003545]/20 bg-[#003545]/10 p-3">
                      <span className="font-mono text-xs font-bold text-[#003545]">PROTOCOL_EFFICIENCY</span>
                      <div className="h-1 w-32 overflow-hidden rounded-full bg-[#003545]/20"><div className="h-full bg-[#003545]" style={{ width: `${Math.min(100, Math.round(stats?.averageScore ?? 0))}%` }} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link href="/review" className="bg-[#003545] py-3 text-center font-mono text-[10px] font-bold uppercase text-[#4fd1ff] transition-colors hover:bg-[#003545]/90">Drill_Queue</Link>
                      <Link href="/tutor/free-talk" className="border border-[#003545] py-3 text-center font-mono text-[10px] font-bold uppercase text-[#003545] transition-colors hover:bg-[#003545]/10">Start_Session</Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak calendar */}
              <div className="border border-[#3d484e] bg-[#141a22] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-[#4fd1ff]/60">{'// STREAK'}</span>
                    <h3 className="mt-1 font-[Sora] text-base font-bold">Last 28 days</h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 border border-[#3d484e] px-2 py-1 font-mono text-[10px] text-[#bcc8cf]">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4fd1ff]" />
                    {progressData.filter((d) => d.sessions > 0).length} days active
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-[repeat(14,1fr)] gap-[3px]">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const d = progressData[progressData.length - 28 + i];
                    const lvl = d ? Math.min(3, Math.ceil(d.sessions / 2)) : 0;
                    const cls = lvl === 3 ? 'bg-[#4fd1ff] border-[#4fd1ff] shadow-[0_0_6px_rgba(79,209,255,0.3)]'
                      : lvl === 2 ? 'bg-[#4fd1ff]/35 border-[#4fd1ff]/40'
                      : lvl === 1 ? 'bg-[#4fd1ff]/15 border-[#4fd1ff]/20'
                      : 'bg-[#1f242d] border-[#3d484e]';
                    return <div key={i} className={`aspect-square border ${cls}`} />;
                  })}
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-[0.1em] text-[#879299]">
                  <span>4 WEEKS AGO</span><span>TODAY</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="mt-16 flex items-end justify-between">
            <div className="space-y-1">
              {[
                { color: '#c7e9b4', text: 'Version 8.2.1' },
                { color: '#4fd1ff', text: 'Connection: Strong' },
                { color: '#f2bf54', text: 'Data Encrypted' },
              ].map((r) => (
                <div key={r.text} className="flex items-center gap-2">
                  <span className="h-[5px] w-[5px]" style={{ background: r.color }} />
                  <span className="">{r.text}</span>
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="font-[Sora] text-lg font-black uppercase tracking-tighter text-zinc-800">TALKIVO</div>
              <div className="font-mono text-[10px] text-zinc-600">{'© 2026 // OPERATOR_CONSOLE'}</div>
            </div>
          </footer>

          </>)}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
