'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { TopicPicker, DebatePositionSelector } from '@/components/modes/TopicPicker';
import { api } from '@/lib/api-client';
import type { Mode, Level } from '@/lib/types';
import { MODES, LEVELS } from '@/lib/config';
import { logger } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/app/AppShell';

const MODE_ORDER: Mode[] = ['FREE_TALK', 'ROLE_PLAY', 'DEBATE', 'GRAMMAR_FIX', 'PRONUNCIATION'];

const MODE_TAGLINES: Record<Mode, string> = {
  FREE_TALK: 'Pick any topic. Just talk.',
  ROLE_PLAY: 'Rehearse the conversation before it happens.',
  DEBATE: 'Defend a position. Sharpen your thinking.',
  GRAMMAR_FIX: 'Bring a paragraph. Leave it better.',
  PRONUNCIATION: 'The sounds you avoid, practised with care.',
};

const LEVEL_ORDER: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const LENGTHS = [5, 15, 30];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
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
  const [sessionLength, setSessionLength] = useState<number>(15);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [debatePosition, setDebatePosition] = useState<'for' | 'against' | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setSession, setLevel, setContext, reset: resetChat } = useChatStore();
  const { startSession, reset: resetSession } = useSessionStore();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setShowTopicModal(false);
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handleEscape]);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  const startPracticeSession = async (
    mode: Mode,
    topic?: string,
    position?: 'for' | 'against',
  ) => {
    if (isStarting) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setIsStarting(true);
    try {
      resetChat();
      resetSession();
      const { sessionId } = await api.sessions.create({ mode, level: selectedLevel });
      setSession(sessionId, mode);
      setLevel(selectedLevel);
      if (mode === 'FREE_TALK' && topic) setContext({ topic });
      else if (mode === 'ROLE_PLAY' && topic) setContext({ scenario: topic });
      else if (mode === 'DEBATE' && topic)
        setContext({ debateTopic: topic, debatePosition: position || 'for' });
      else if (mode === 'PRONUNCIATION' && topic) setContext({ topic });
      startSession();
      router.push(`/tutor/${mode.toLowerCase()}`);
    } catch (err: unknown) {
      logger.error('Failed to create session:', err);
      const status =
        (err as { statusCode?: number; status?: number })?.statusCode ??
        (err as { status?: number })?.status;
      if (status === 401) {
        router.push('/login');
      } else {
      }
    } finally {
      setIsStarting(false);
    }
  };

  const handleModeClick = (mode: Mode) => {
    setSelectedMode(mode);
    setSelectedTopic('');
    setDebatePosition(null);
    if (mode === 'GRAMMAR_FIX') {
      startPracticeSession(mode);
      return;
    }
    setShowTopicModal(true);
  };

  const canConfirm = () => {
    if (!selectedMode) return false;
    if (selectedMode === 'DEBATE') return !!selectedTopic && !!debatePosition;
    if (selectedMode === 'ROLE_PLAY') return !!selectedTopic;
    return true;
  };

  const handleConfirm = async () => {
    if (!selectedMode) return;
    await startPracticeSession(selectedMode, selectedTopic, debatePosition || undefined);
    setShowTopicModal(false);
  };

  const firstName = user?.name?.split(' ')[0] || 'friend';

  return (
    <AppShell>
      <div className="mx-auto max-w-[880px] px-10 pt-24 pb-16">
        {/* Greeting */}
        <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
          {today()}
        </div>
        <h1 className="font-serif-display text-[48px] leading-[1.1] tracking-[-0.02em] text-[#F5F2EC]">
          {greeting()}, {firstName}.
        </h1>
        <p className="mt-4 text-[15px] leading-[1.55] text-[#9A948A]">
          Pick a mode. We&rsquo;ll handle the rest.
        </p>

        {error && (
          <div className="mt-6 flex items-center justify-between border-l-2 border-[#B5564C] bg-[#B5564C]/10 px-4 py-3 text-[13px] text-[#F5F2EC]">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-3 text-[12px] text-[#9A948A] hover:text-[#F5F2EC]"
            >
              dismiss
            </button>
          </div>
        )}

        {/* Question */}
        <h2 className="font-serif-display mt-16 text-[28px] leading-[1.3] tracking-[-0.01em] text-[#F5F2EC]">
          What shall we practise today?
        </h2>

        {/* Mode list */}
        <ul className="mt-10 border-t border-[#2A2A2E]">
          {MODE_ORDER.map((id, i) => {
            const mode = MODES.find((m) => m.id === id);
            if (!mode) return null;
            return (
              <li key={id}>
                <button
                  disabled={isStarting}
                  onClick={() => handleModeClick(id)}
                  className="group relative flex w-full items-center gap-8 border-b border-[#2A2A2E] px-2 py-6 text-left transition-colors hover:bg-[#17171A] disabled:opacity-60"
                >
                  <span className="absolute left-0 top-0 h-full w-[3px] bg-[#D4A373] opacity-0 transition-opacity group-hover:opacity-100" />
                  <span className="font-serif-display tabular-nums w-6 text-[14px] text-[#6B665F] transition-colors group-hover:text-[#D4A373]">
                    0{i + 1}
                  </span>
                  <span className="w-[180px] text-[18px] font-medium text-[#F5F2EC]">
                    {mode.title}
                  </span>
                  <span className="font-serif-display flex-1 text-[16px] italic leading-[1.45] text-[#9A948A]">
                    {MODE_TAGLINES[id]}
                  </span>
                  <span className="text-[13px] text-[#D4A373] opacity-0 transition-opacity group-hover:opacity-100">
                    Begin →
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Level + length */}
        <div className="mt-12 flex items-center justify-between border-t border-b border-[#2A2A2E] py-5">
          <div className="flex items-center gap-6">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
              Your level
            </span>
            <div className="flex items-center gap-4">
              {LEVEL_ORDER.map((lv) => {
                const active = selectedLevel === lv;
                const meta = LEVELS.find((l) => l.id === lv);
                return (
                  <button
                    key={lv}
                    onClick={() => setSelectedLevel(lv)}
                    className={
                      'text-[14px] transition-colors ' +
                      (active
                        ? 'text-[#F5F2EC] underline decoration-[#D4A373] decoration-2 underline-offset-[6px]'
                        : 'text-[#9A948A] hover:text-[#F5F2EC]')
                    }
                  >
                    {meta?.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
              Session length
            </span>
            <div className="flex items-center gap-4">
              {LENGTHS.map((m) => {
                const active = sessionLength === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSessionLength(m)}
                    className={
                      'tabular-nums text-[14px] transition-colors ' +
                      (active
                        ? 'text-[#F5F2EC] underline decoration-[#D4A373] decoration-2 underline-offset-[6px]'
                        : 'text-[#9A948A] hover:text-[#F5F2EC]')
                    }
                  >
                    {m} min
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between text-[13px] text-[#6B665F]">
          <span>Your progress, history and vocabulary are saved automatically.</span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-[#D4A373] hover:text-[#DDB389]"
          >
            View dashboard →
          </button>
        </div>
      </div>

      {/* Session setup modal */}
      {showTopicModal && selectedMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#0E0E10]/80 backdrop-blur-sm"
            onClick={() => setShowTopicModal(false)}
          />
          <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-[#2A2A2E] bg-[#17171A] text-[#F5F2EC] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
            <div className="border-b border-[#2A2A2E] p-8">
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                {selectedMode === 'FREE_TALK' && 'Free Talk'}
                {selectedMode === 'ROLE_PLAY' && 'Role Play'}
                {selectedMode === 'DEBATE' && 'Debate'}
                {selectedMode === 'PRONUNCIATION' && 'Pronunciation'}
              </div>
              <h3 className="font-serif-display mt-2 text-[28px] leading-[1.15] tracking-[-0.02em]">
                {selectedMode === 'FREE_TALK' && 'Pick a topic, or just start.'}
                {selectedMode === 'ROLE_PLAY' && 'Choose a scenario.'}
                {selectedMode === 'DEBATE' && 'Pick a topic and a side.'}
                {selectedMode === 'PRONUNCIATION' && 'Choose a category.'}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <TopicPicker
                mode={selectedMode}
                onSelect={(topic) => setSelectedTopic(topic)}
                selectedValue={selectedTopic}
              />
              {selectedMode === 'DEBATE' && selectedTopic && (
                <DebatePositionSelector
                  onSelect={(pos) => setDebatePosition(pos)}
                  selectedPosition={debatePosition || undefined}
                />
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#2A2A2E] p-5">
              <button
                onClick={() => setShowTopicModal(false)}
                className="text-[13px] text-[#9A948A] hover:text-[#F5F2EC]"
              >
                Cancel
              </button>
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
