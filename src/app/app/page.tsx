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
  FREE_TALK: { icon: 'chat_bubble', color: 'text-teal-400', hoverBorder: 'hover:border-teal-500/30', iconBg: 'bg-teal-500/10', label: 'Free Talk', tagline: 'Spontaneous conversation on any topic.' },
  ROLE_PLAY: { icon: 'theater_comedy', color: 'text-purple-400', hoverBorder: 'hover:border-purple-500/30', iconBg: 'bg-purple-500/10', label: 'Role Play', tagline: 'Practice real-world scenarios.' },
  DEBATE: { icon: 'gavel', color: 'text-orange-400', hoverBorder: 'hover:border-orange-500/30', iconBg: 'bg-orange-500/10', label: 'Debate', tagline: 'Defend your stance on issues.' },
  GRAMMAR_FIX: { icon: 'spellcheck', color: 'text-emerald-400', hoverBorder: 'hover:border-emerald-500/30', iconBg: 'bg-emerald-500/10', label: 'Grammar Fix', tagline: 'Iron out persistent structural errors.' },
  PRONUNCIATION: { icon: 'mic', color: 'text-amber-400', hoverBorder: 'hover:border-amber-500/30', iconBg: 'bg-amber-500/10', label: 'Pronunciation', tagline: 'Master phonetics with AI feedback.' },
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
      <div className="mx-auto max-w-[1200px] px-8 md:px-12 pt-12 pb-16">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-[#F5F2EC]">
              {greeting()}, {firstName}
            </h1>
            <p className="text-[#D4A373] text-sm font-medium tracking-wide mt-1">{today()}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[13px] text-[#9A948A] hover:text-[#F5F2EC] transition-colors"
          >
            View dashboard →
          </button>
        </header>

        {error && (
          <div className="mb-8 flex items-center justify-between border-l-2 border-[#B5564C] bg-[#B5564C]/10 px-4 py-3 text-[13px] text-[#F5F2EC]">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 text-[12px] text-[#9A948A] hover:text-[#F5F2EC]">dismiss</button>
          </div>
        )}

        {/* Stats Row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <GlassCard icon="local_fire_department" iconFill label="Current Streak" value={stats ? `${stats.streak} Days` : '—'} />
          <GlassCard icon="auto_stories" label="Words Learned" value={stats ? String(stats.wordsLearned) : '—'} />
          <GlassCard icon="schedule" label="Minutes Practiced" value={stats ? `${stats.minutesPracticed}m` : '—'} />
          <GlassCard icon="school" label="Current Level" value={selectedLevel.charAt(0) + selectedLevel.slice(1).toLowerCase()} />
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Study Paths */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg text-[#9A948A] flex items-center gap-3 mb-2">
              <span className="w-8 h-px bg-[#50453B]" />
              Select Study Path
            </h2>

            <div className="space-y-3">
              {MODE_ORDER.map((id) => {
                const cfg = MODE_CONFIG[id];
                return (
                  <button
                    key={id}
                    disabled={isStarting}
                    onClick={() => handleModeClick(id)}
                    className={`group flex w-full items-center gap-4 rounded-xl p-5 transition-all duration-300 border border-transparent ${cfg.hoverBorder} bg-[#1B1B1D] hover:bg-[#2A2A2C] disabled:opacity-50`}
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-lg ${cfg.iconBg} flex items-center justify-center`}>
                      <span className={`material-symbols-outlined text-2xl ${cfg.color}`}>{cfg.icon}</span>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-sm text-[#F5F2EC]">{cfg.label}</h3>
                      <p className="text-xs text-[#9A948A] italic line-clamp-1">{cfg.tagline}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#50453B] group-hover:text-[#9A948A] transition-colors">chevron_right</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Level + Tip */}
          <div className="space-y-6">
            {/* Level Selector */}
            <div className="rounded-xl border border-[#2A2A2E] bg-[#1B1B1D] p-6">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#9A948A] font-bold mb-4">Your Level</div>
              <div className="flex flex-col gap-2">
                {LEVEL_ORDER.map((lv) => {
                  const active = selectedLevel === lv;
                  const meta = LEVELS.find((l) => l.id === lv);
                  return (
                    <button
                      key={lv}
                      onClick={() => setSelectedLevel(lv)}
                      className={`text-left px-4 py-3 rounded-lg text-sm transition-all ${
                        active
                          ? 'bg-[#D4A373]/10 text-[#D4A373] border border-[#D4A373]/20'
                          : 'text-[#9A948A] hover:text-[#F5F2EC] hover:bg-[#2A2A2C] border border-transparent'
                      }`}
                    >
                      {meta?.title}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Tip */}
            <div className="rounded-xl border border-[#2A2A2C] bg-[rgba(53,52,55,0.4)] backdrop-blur-[12px] p-6 min-h-[200px]">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#D4A373]">lightbulb</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A373]">Daily Tip</span>
              </div>
              <h4 className="text-xl font-serif font-bold text-[#F5F2EC] mb-3">Whose vs. Who&rsquo;s</h4>
              <p className="text-sm text-[#9A948A] leading-relaxed">
                <strong className="text-[#F5F2EC]">Whose</strong> is possessive, while{' '}
                <strong className="text-[#F5F2EC]">Who&rsquo;s</strong> is a contraction of &ldquo;who is&rdquo;.
              </p>
              <div className="mt-4 bg-[#0E0E10]/60 p-4 rounded-lg border border-[#D4A373]/15">
                <p className="text-sm italic text-[#D4A373]">&ldquo;Who&rsquo;s responsible for whose shoes?&rdquo;</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-[#2A2A2E]">
          <div className="flex items-center justify-between rounded-xl bg-[#1B1B1D] border border-[#2A2A2E] p-6 hover:border-[#50453B] transition-colors">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-[#2A2A2C] flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.4)] animate-pulse" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-[#F5F2EC]">Quick Start</h4>
                <p className="text-xs text-[#9A948A]">Jump into a free talk session instantly</p>
              </div>
            </div>
            <button
              onClick={() => startPracticeSession('FREE_TALK')}
              disabled={isStarting}
              className="rounded-lg bg-[#2A2A2C] hover:bg-[#353437] px-6 py-3 text-sm font-semibold text-[#F5F2EC] transition-colors disabled:opacity-50"
            >
              {isStarting ? 'Starting…' : 'Start Session'}
            </button>
          </div>
          <p className="mt-4 text-center text-[12px] text-[#50453B]">
            Your progress, history and vocabulary are saved automatically.
          </p>
        </div>
      </div>

      {/* Topic Picker Modal */}
      {showTopicModal && selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0E0E10]/80 backdrop-blur-sm" onClick={() => setShowTopicModal(false)} />
          <div
            className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-[#2A2A2E] bg-[#17171A] text-[#F5F2EC] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
            role="dialog" aria-modal="true" aria-labelledby="modal-title"
          >
            <div className="border-b border-[#2A2A2E] p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg ${MODE_CONFIG[selectedMode].iconBg} flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-lg ${MODE_CONFIG[selectedMode].color}`}>{MODE_CONFIG[selectedMode].icon}</span>
                </div>
                <span className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">{MODE_CONFIG[selectedMode].label}</span>
              </div>
              <h3 id="modal-title" className="font-serif mt-2 text-[28px] leading-[1.15] tracking-[-0.02em]">
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
            <div className="flex items-center justify-between border-t border-[#2A2A2E] p-5">
              <button onClick={() => setShowTopicModal(false)} className="text-[13px] text-[#9A948A] hover:text-[#F5F2EC]">Cancel</button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm() || isStarting}
                className="rounded-md bg-[#D4A373] px-5 py-2.5 text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isStarting ? 'Starting…' : 'Begin session →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ── Glass stat card ─────────────────────────────────────────────── */
function GlassCard({ icon, iconFill, label, value }: { icon: string; iconFill?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-xl p-6 flex flex-col justify-between min-h-[140px] transition-all duration-500 hover:shadow-[0_0_25px_rgba(242,190,140,0.08)] bg-[rgba(53,52,55,0.4)] backdrop-blur-[12px] border border-[rgba(80,69,59,0.15)]">
      <div className="w-10 h-10 rounded-lg bg-[#D4A373]/10 flex items-center justify-center text-[#D4A373] mb-3">
        <span className="material-symbols-outlined text-2xl" style={iconFill ? { fontVariationSettings: "'FILL' 1" } : undefined}>{icon}</span>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#9A948A] font-bold mb-1">{label}</p>
        <p className="text-2xl font-serif font-bold text-[#F5F2EC]">{value}</p>
      </div>
    </div>
  );
}
