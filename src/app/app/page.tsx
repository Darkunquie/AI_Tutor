'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { TopicPicker, DebatePositionSelector } from '@/components/modes/TopicPicker';
import { api } from '@/lib/api-client';
import type { Mode, Level } from '@/lib/types';
import { LEVELS } from '@/lib/config';
import { logger } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/app/AppShell';

const MODE_ORDER: Mode[] = ['FREE_TALK', 'ROLE_PLAY', 'DEBATE', 'GRAMMAR_FIX', 'PRONUNCIATION'];

const MODE_CONFIG: Record<Mode, { icon: string; color: string; hoverBorder: string; iconBg: string; label: string; tagline: string }> = {
  FREE_TALK: { icon: 'forum', color: 'text-[#4fd1ff]', hoverBorder: 'hover:border-[#4fd1ff]/30', iconBg: 'bg-[#4fd1ff]/10', label: 'Free Talk', tagline: 'Spontaneous conversation on any topic.' },
  ROLE_PLAY: { icon: 'groups', color: 'text-[#f2bf54]', hoverBorder: 'hover:border-[#f2bf54]/30', iconBg: 'bg-[#f2bf54]/10', label: 'Role Play', tagline: 'Practice real-world scenarios.' },
  DEBATE: { icon: 'swords', color: 'text-[#c7e9b4]', hoverBorder: 'hover:border-[#c7e9b4]/30', iconBg: 'bg-[#c7e9b4]/10', label: 'Debate', tagline: 'Defend your stance on issues.' },
  GRAMMAR_FIX: { icon: 'spellcheck', color: 'text-[#bcc8cf]', hoverBorder: 'hover:border-[#bcc8cf]/30', iconBg: 'bg-[#bcc8cf]/10', label: 'Grammar Fix', tagline: 'Correct and improve every sentence.' },
  PRONUNCIATION: { icon: 'record_voice_over', color: 'text-[#ffb4ab]', hoverBorder: 'hover:border-[#ffb4ab]/30', iconBg: 'bg-[#ffb4ab]/10', label: 'Pronunciation', tagline: 'Perfect your accent and clarity.' },
};

const LEVEL_ORDER: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) { return 'Still up'; }
  if (h < 12) { return 'Good morning'; }
  if (h < 17) { return 'Good afternoon'; }
  return 'Good evening';
}

function today(): string {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function AppHome() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<Level>('INTERMEDIATE');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [debatePosition, setDebatePosition] = useState<'for' | 'against' | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ streak: number; wordsLearned: number; minutesPracticed: number } | null>(null);

  const { setSession, setLevel, setContext, reset: resetChat } = useChatStore();
  const { startSession, reset: resetSession } = useSessionStore();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setShowTopicModal(false); }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); }
  }, [isAuthenticated, router]);

  // Fetch stats
  useEffect(() => {
    if (!user) { return; }
    let cancelled = false;
    (async () => {
      try {
        const [streakData, overviewData] = await Promise.all([
          api.streaks.get(),
          api.stats.overview({ userId: user.id, period: '30d' }),
        ]);
        if (!cancelled) {
          setStats({
            streak: (streakData as { currentStreak?: number })?.currentStreak || 0,
            wordsLearned: (overviewData as { wordsLearned?: number })?.wordsLearned || 0,
            minutesPracticed: Math.round(((overviewData as { totalDuration?: number })?.totalDuration || 0) / 60),
          });
        }
      } catch { /* silent */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const startPracticeSession = async (mode: Mode, topic?: string, position?: 'for' | 'against') => {
    if (isStarting) { return; }
    if (!isAuthenticated) { router.push('/login'); return; }
    setIsStarting(true);
    try {
      resetChat();
      resetSession();
      const { sessionId } = await api.sessions.create({ mode, level: selectedLevel });
      setSession(sessionId, mode);
      setLevel(selectedLevel);
      if (mode === 'FREE_TALK' && topic) { setContext({ topic }); }
      else if (mode === 'ROLE_PLAY' && topic) { setContext({ scenario: topic }); }
      else if (mode === 'DEBATE' && topic) { setContext({ debateTopic: topic, debatePosition: position || 'for' }); }
      else if (mode === 'PRONUNCIATION' && topic) { setContext({ topic }); }
      startSession();
      router.push(`/tutor/${mode.toLowerCase()}`);
    } catch (err: unknown) {
      logger.error('Failed to create session:', err);
      const status = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { status?: number })?.status;
      if (status === 401) { router.push('/login'); }
      else { setError('Failed to start session. Please try again.'); }
    } finally {
      setIsStarting(false);
    }
  };

  const handleModeClick = (mode: Mode) => {
    setSelectedMode(mode);
    setSelectedTopic('');
    setDebatePosition(null);
    if (mode === 'GRAMMAR_FIX') { startPracticeSession(mode); return; }
    setShowTopicModal(true);
  };

  const canConfirm = () => {
    if (!selectedMode) { return false; }
    if (selectedMode === 'DEBATE') { return !!selectedTopic && !!debatePosition; }
    if (selectedMode === 'ROLE_PLAY') { return !!selectedTopic; }
    return true;
  };

  const handleConfirm = async () => {
    if (!selectedMode) { return; }
    await startPracticeSession(selectedMode, selectedTopic, debatePosition || undefined);
    setShowTopicModal(false);
  };

  const firstName = user?.name?.split(' ')[0] || 'friend';

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] px-8 pt-8 pb-16">
        {/* Header */}
        <header className="mb-10">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#c7e9b4] shadow-[0_0_8px_rgba(199,233,180,0.7)]" />
            <span className="text-[11px] text-[#7a9a6b]">SYSTEM LINK ESTABLISHED</span>
            <span className="mx-1 text-[11px] text-[#879299]">{'//'}</span>
            <span className="text-[11px] text-[#879299]">SESSION · {today().toUpperCase()}</span>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-[Sora] text-4xl font-black tracking-[-0.03em] text-[#e6eef8]">
                {greeting()}, <span className="text-[#4fd1ff]">{firstName}.</span>
              </h1>
              <p className="mt-2 text-sm text-[#bcc8cf]">Queue: ready for session · Your streak is active.</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="font-mono text-[11px] text-[#4fd1ff] transition-colors hover:text-[#7dd3fc]"
            >
              View dashboard →
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 flex items-center justify-between border-l-2 border-[#ffb4ab] bg-[#ffb4ab]/10 px-4 py-3 text-[13px] text-[#e6eef8]">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 text-[11px] text-[#879299] hover:text-[#e6eef8]">dismiss</button>
          </div>
        )}

        {/* Stats Row */}
        <section className="mb-10 grid grid-cols-2 gap-[2px] md:grid-cols-4">
          <StatCard label="Current Streak" value={stats ? `${stats.streak} Days` : '—'} />
          <StatCard label="Words Learned" value={stats ? String(stats.wordsLearned) : '—'} />
          <StatCard label="Minutes Practiced" value={stats ? `${stats.minutesPracticed}m` : '—'} />
          <StatCard label="Current Level" value={selectedLevel.charAt(0) + selectedLevel.slice(1).toLowerCase()} />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          {/* Left: Study Paths */}
          <div>
            <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
              <h2 className="text-[14px] font-semibold text-[#e6eef8]">Select Study Path</h2>
              <span className="">5 modes</span>
            </div>

            <div className="flex flex-col gap-[2px]">
              {MODE_ORDER.map((id, i) => {
                const cfg = MODE_CONFIG[id];
                const isFirst = i === 0;
                return (
                  <button
                    key={id}
                    disabled={isStarting}
                    onClick={() => handleModeClick(id)}
                    className={`group flex w-full items-center gap-4 border border-transparent p-4 text-left transition-all ${cfg.hoverBorder} ${isFirst ? 'border-l-[3px] border-l-[#4fd1ff] bg-[#4fd1ff]/[0.04]' : 'bg-[#141a22]'} hover:bg-[#1f242d] disabled:opacity-50`}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center ${cfg.iconBg}`}>
                      <span className={`material-symbols-outlined text-2xl ${cfg.color}`}>{cfg.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-[Sora] text-[15px] font-bold text-[#e6eef8]">{cfg.label}</h3>
                      <p className="text-[13px] text-[#879299]">{cfg.tagline}</p>
                    </div>
                    <span className="text-[#879299] transition-colors group-hover:text-[#4fd1ff]">&rsaquo;</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Level + Tip */}
          <div className="space-y-4">
            {/* Level Selector */}
            <div className="border border-[#3d484e] bg-[#141a22] p-6">
              <div className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#879299]">YOUR LEVEL</div>
              <div className="flex flex-col gap-1">
                {LEVEL_ORDER.map((lv) => {
                  const active = selectedLevel === lv;
                  const meta = LEVELS.find((l) => l.id === lv);
                  return (
                    <button
                      key={lv}
                      onClick={() => setSelectedLevel(lv)}
                      className={`px-4 py-2.5 text-left text-sm transition-all ${
                        active
                          ? 'border-l-2 border-[#4fd1ff] bg-[#1f242d] text-[#4fd1ff]'
                          : 'border-l-2 border-transparent text-[#879299] hover:bg-[#1f242d] hover:text-[#bcc8cf]'
                      }`}
                    >
                      {meta?.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Tip */}
            <div className="border border-[#3d484e] bg-[#141a22] p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="h-[6px] w-[6px] rounded-full bg-[#e8b64c]" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-[#e8b64c]">DAILY TIP</span>
              </div>
              <h4 className="mb-2 font-[Sora] text-lg font-bold text-[#e6eef8]">Whose vs. Who&rsquo;s</h4>
              <p className="text-[13px] leading-relaxed text-[#879299]">
                <strong className="text-[#e6eef8]">Whose</strong> is possessive, while{' '}
                <strong className="text-[#e6eef8]">Who&rsquo;s</strong> is a contraction of &ldquo;who is.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Tutor notes */}
        <div className="mt-10">
          <div className="mb-4 flex items-center justify-between border-b border-[#4fd1ff]/20 pb-2">
            <h2 className="text-[14px] font-semibold text-[#e6eef8]">Notes</h2>
            <span className=""></span>
          </div>
          <div className="flex flex-col gap-[2px]">
            <div className="border border-[#3d484e] bg-[#141a22] p-5">
              <div className="mb-1 text-[11px] text-[#879299]">[ {new Date().toISOString().slice(0, 10)} ]</div>
              <div className="font-[Sora] text-sm font-semibold text-[#e6eef8]">Quick start a free talk session</div>
              <div className="mt-1 text-[13px] text-[#879299]">Jump in instantly. Your progress saves automatically.</div>
              <button
                onClick={() => startPracticeSession('FREE_TALK')}
                disabled={isStarting}
                className="mt-3 font-mono text-[11px] text-[#4fd1ff] transition-colors hover:text-[#7dd3fc] disabled:opacity-50"
              >
                {isStarting ? 'Starting...' : 'Start Session →'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 flex items-center justify-between border-t border-[#3d484e]/40 pt-4">
          <span className="font-mono text-[10px] text-zinc-600">&copy; 2026 TALKIVO // NODE: HYD-01</span>
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#7a9a6b]">
            <span className="h-[5px] w-[5px] rounded-full bg-[#7a9a6b]" /> SYSTEM_OPTIMAL
          </span>
        </footer>
      </div>

      {/* Topic Picker Modal */}
      {showTopicModal && selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0d131b]/80 backdrop-blur-sm" onClick={() => setShowTopicModal(false)} />
          <div
            className="relative flex max-h-[90vh] w-full max-w-[800px] flex-col overflow-hidden border border-[#3d484e] bg-[#141a22] text-[#e6eef8] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
            role="dialog" aria-modal="true" aria-labelledby="modal-title"
          >
            <div className="border-b border-[#3d484e] p-8">
              <div className="mb-2 flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center ${MODE_CONFIG[selectedMode].iconBg}`}>
                  <span className={`material-symbols-outlined text-lg ${MODE_CONFIG[selectedMode].color}`}>{MODE_CONFIG[selectedMode].icon}</span>
                </div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#4fd1ff]">{MODE_CONFIG[selectedMode].label}</span>
              </div>
              <h3 id="modal-title" className="mt-2 font-[Sora] text-[28px] font-bold leading-[1.15] tracking-[-0.02em]">
                {selectedMode === 'FREE_TALK' && 'Pick a topic, or just start.'}
                {selectedMode === 'ROLE_PLAY' && 'Choose a scenario.'}
                {selectedMode === 'DEBATE' && 'Pick a topic and a side.'}
                {selectedMode === 'PRONUNCIATION' && 'Choose a category.'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <TopicPicker mode={selectedMode} onSelect={(topic) => setSelectedTopic(topic)} selectedValue={selectedTopic} />
              {selectedMode === 'DEBATE' && selectedTopic && (
                <DebatePositionSelector onSelect={(pos) => setDebatePosition(pos)} selectedPosition={debatePosition || undefined} />
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[#3d484e] p-5">
              <button onClick={() => setShowTopicModal(false)} className="font-mono text-[11px] text-[#879299] hover:text-[#e6eef8]">Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm() || isStarting}
                className="bg-[#4fd1ff] px-5 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-wider text-[#0d131b] transition-colors hover:bg-[#7dd3fc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? 'Starting...' : 'Begin session →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ── HUD stat card ── */
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#3d484e] bg-[#141a22] p-5">
      <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#879299]">{label}</div>
      <div className="font-[Sora] text-[28px] font-bold leading-none tracking-[-0.03em] text-[#e6eef8]">{value}</div>
    </div>
  );
}
