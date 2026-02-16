'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { TopicPicker, DebatePositionSelector } from '@/components/modes/TopicPicker';
import { api } from '@/lib/api-client';
import type { Mode, Level } from '@/lib/types';
import { MODES, LEVELS } from '@/lib/config';
import { logger } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';

const MODE_ICONS: Record<Mode, { icon: string; color: string; bgColor: string }> = {
  FREE_TALK: { icon: 'forum', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  ROLE_PLAY: { icon: 'theater_comedy', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  DEBATE: { icon: 'gavel', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  GRAMMAR_FIX: { icon: 'spellcheck', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
};

const MODE_CTA: Record<Mode, string> = {
  FREE_TALK: 'Start Session',
  ROLE_PLAY: 'Select Scenario',
  DEBATE: 'Join Debate',
  GRAMMAR_FIX: 'Improve Now',
};

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedLevel, setSelectedLevel] = useState<Level>('INTERMEDIATE');
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<Mode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [debatePosition, setDebatePosition] = useState<'for' | 'against' | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { setSession, setLevel, setContext, reset: resetChat } = useChatStore();
  const { startSession, reset: resetSession } = useSessionStore();

  const startPracticeSession = async (mode: Mode, topic?: string, position?: 'for' | 'against') => {
    if (isStarting) return;

    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/login');
      return;
    }

    setIsStarting(true);

    try {
      resetChat();
      resetSession();

      // Create session in DB to get a real ID (userId from auth token)
      const { sessionId } = await api.sessions.create({
        mode,
        level: selectedLevel,
      });

      setSession(sessionId, mode);
      setLevel(selectedLevel);

      if (mode === 'FREE_TALK' && topic) {
        setContext({ topic });
      } else if (mode === 'ROLE_PLAY' && topic) {
        setContext({ scenario: topic });
      } else if (mode === 'DEBATE' && topic) {
        setContext({ debateTopic: topic, debatePosition: position || 'for' });
      }

      startSession();
      router.push(`/tutor/${mode.toLowerCase()}`);
    } catch (err) {
      logger.error('Failed to create session:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleModeClick = (mode: Mode) => {
    setSelectedMode(mode);
    setSelectedTopic('');
    setDebatePosition(null);
    setShowTopicModal(true);
  };

  const handleTopicConfirm = async () => {
    if (!selectedMode) return;
    if (selectedMode === 'DEBATE' && (!selectedTopic || !debatePosition)) return;
    if (selectedMode === 'ROLE_PLAY' && !selectedTopic) return;

    await startPracticeSession(selectedMode, selectedTopic, debatePosition || undefined);
    setShowTopicModal(false);
  };

  const canConfirmTopic = () => {
    if (!selectedMode) return false;
    if (selectedMode === 'DEBATE') return !!selectedTopic && !!debatePosition;
    if (selectedMode === 'ROLE_PLAY') return !!selectedTopic;
    // Free Talk and Grammar Fix can always start (topic optional)
    return true;
  };

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#101722] text-slate-900 dark:text-white transition-colors duration-300">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-[#f5f7f8]/80 dark:bg-[#101722]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="full" size="md" />
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium hover:text-[#3c83f6] transition-colors">Home</Link>
            <a className="text-sm font-medium hover:text-[#3c83f6] transition-colors cursor-pointer" href="#modes">Features</a>
            <a className="text-sm font-medium hover:text-[#3c83f6] transition-colors cursor-pointer" href="#stats">Stats</a>
            <Link href="/dashboard" className="text-sm font-medium hover:text-[#3c83f6] transition-colors">Dashboard</Link>
          </nav>
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              // Authenticated: Show user menu
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-[#3c83f6] flex items-center justify-center text-white text-sm font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">{user.name}</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="material-symbols-outlined text-sm">dashboard</span>
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="material-symbols-outlined text-sm">logout</span>
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // Not authenticated: Show login/signup buttons
              <>
                <Link href="/login" className="hidden sm:block text-sm font-medium hover:text-[#3c83f6] transition-colors">
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="bg-[#3c83f6] hover:bg-[#3c83f6]/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#3c83f6]/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(60,131,246,0.15)_0%,rgba(16,23,34,0)_100%)]" />
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3c83f6]/10 text-[#3c83f6] border border-[#3c83f6]/20 text-xs font-bold mb-6 tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3c83f6] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3c83f6]" />
              </span>
              New: Advanced Debate Mode
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-r from-[#3c83f6] to-indigo-400 bg-clip-text text-transparent">
              Master English Through <br className="hidden md:block" /> Conversation
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-10">
              Practice speaking, debating, and roleplaying with our advanced AI tutor. Get real-time feedback and level up your fluency with personalized lessons.
            </p>

            {isAuthenticated ? (
              /* Level Selector - Only for authenticated users */
              <div className="max-w-md mx-auto mb-12">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                  Select Your Level
                </h4>
                <div className="flex p-1.5 bg-slate-200 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-300 dark:border-slate-700">
                  {LEVELS.map((level) => (
                    <label key={level.id} className="flex-1 cursor-pointer">
                      <input
                        className="hidden peer"
                        name="level"
                        type="radio"
                        value={level.id}
                        checked={selectedLevel === level.id}
                        onChange={() => setSelectedLevel(level.id)}
                      />
                      <div className="py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-500 dark:text-slate-400 peer-checked:bg-white dark:peer-checked:bg-[#101722] peer-checked:text-[#3c83f6] peer-checked:shadow-sm transition-all text-center">
                        {level.title}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              /* CTA for non-authenticated users */
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-[#3c83f6] hover:bg-[#3c83f6]/90 text-white rounded-xl text-lg font-bold transition-all shadow-xl shadow-[#3c83f6]/30"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-lg font-bold transition-all border-2 border-slate-200 dark:border-slate-700"
                >
                  Log In
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Learning Modes Grid - Only for authenticated users */}
        {isAuthenticated && (
          <section id="modes" className="max-w-7xl mx-auto px-6 pb-24">
            <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Choose Your Learning Mode</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Tailored experiences for every communication goal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODES.map((mode) => {
                const iconInfo = MODE_ICONS[mode.id];
                const cta = MODE_CTA[mode.id];
                return (
                  <button
                    key={mode.id}
                    onClick={() => handleModeClick(mode.id)}
                    className="group relative p-8 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 hover:border-[#3c83f6]/50 transition-all duration-300 shadow-sm hover:shadow-xl dark:hover:shadow-[#3c83f6]/5 text-left"
                  >
                    <div className={`w-12 h-12 rounded-lg ${iconInfo.bgColor} ${iconInfo.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined text-3xl">{iconInfo.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                      {mode.description}
                    </p>
                    <div className="flex items-center text-[#3c83f6] font-semibold text-sm">
                      {cta}
                      <span className="material-symbols-outlined ml-1 text-base">arrow_forward</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Main CTA */}
            <div className="mt-20 text-center">
              <button
                onClick={() => startPracticeSession('FREE_TALK')}
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-[#3c83f6] text-white text-xl font-bold hover:scale-105 transition-all shadow-2xl shadow-[#3c83f6]/40"
              >
                Start Practicing Now
              </button>
              <p className="mt-6 text-slate-500 text-sm font-medium">
                No credit card required &bull; Free daily sessions included
              </p>
            </div>
          </section>
        )}

        {/* Features Preview - For non-authenticated users */}
        {!isAuthenticated && (
          <section id="modes" className="max-w-7xl mx-auto px-6 pb-24">
            <div className="flex flex-col md:flex-row items-end justify-between mb-10 gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Discover Our Learning Modes</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Sign up to unlock all features and start learning.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MODES.map((mode) => {
                const iconInfo = MODE_ICONS[mode.id];
                return (
                  <div
                    key={mode.id}
                    className="relative p-8 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 shadow-sm text-left opacity-75"
                  >
                    <div className="absolute top-4 right-4 px-3 py-1 bg-[#3c83f6]/10 text-[#3c83f6] text-xs font-bold rounded-full border border-[#3c83f6]/20">
                      🔒 Sign up to unlock
                    </div>
                    <div className={`w-12 h-12 rounded-lg ${iconInfo.bgColor} ${iconInfo.color} flex items-center justify-center mb-6`}>
                      <span className="material-symbols-outlined text-3xl">{iconInfo.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Sign Up CTA */}
            <div className="mt-20 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-[#3c83f6] text-white text-xl font-bold hover:scale-105 transition-all shadow-2xl shadow-[#3c83f6]/40"
              >
                Sign Up to Start Learning
              </Link>
              <p className="mt-6 text-slate-500 text-sm font-medium">
                No credit card required &bull; Free to get started
              </p>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section id="stats" className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-black text-[#3c83f6] mb-1">4</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Practice Modes</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#3c83f6] mb-1">3</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-500">Skill Levels</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#3c83f6] mb-1">24/7</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-500">AI Availability</div>
            </div>
            <div>
              <div className="text-3xl font-black text-[#3c83f6] mb-1">Free</div>
              <div className="text-xs uppercase tracking-widest font-bold text-slate-500">To Get Started</div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined">translate</span>
            <span className="text-sm font-bold">Talkivo &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-8">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Privacy</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Terms</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</span>
          </div>
          <div className="flex gap-4">
            <button aria-label="Share" className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center hover:bg-[#3c83f6] hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">share</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Session Setup Modal */}
      {showTopicModal && selectedMode && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowTopicModal(false)}
          />
          {/* Modal */}
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-[#3c83f6] to-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {selectedMode === 'FREE_TALK' && 'Set Up Free Talk'}
                    {selectedMode === 'ROLE_PLAY' && 'Choose a Scenario'}
                    {selectedMode === 'DEBATE' && 'Select Debate Topic'}
                    {selectedMode === 'GRAMMAR_FIX' && 'Grammar Fix Mode'}
                  </h2>
                  <p className="text-blue-100 mt-1 text-sm">
                    {selectedMode === 'FREE_TALK' && 'Pick an optional topic or jump right in'}
                    {selectedMode === 'ROLE_PLAY' && 'Practice real-world conversations'}
                    {selectedMode === 'DEBATE' && 'Choose a topic and your position'}
                    {selectedMode === 'GRAMMAR_FIX' && 'Get instant corrections on every sentence'}
                  </p>
                </div>
                <button
                  onClick={() => setShowTopicModal(false)}
                  aria-label="Close"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto flex-1">
              {/* Free Talk - optional topic picker */}
              {selectedMode === 'FREE_TALK' && (
                <TopicPicker
                  mode={selectedMode}
                  onSelect={(topic) => setSelectedTopic(topic)}
                  selectedValue={selectedTopic}
                />
              )}

              {/* Role Play - scenario picker */}
              {selectedMode === 'ROLE_PLAY' && (
                <TopicPicker
                  mode={selectedMode}
                  onSelect={(topic) => setSelectedTopic(topic)}
                  selectedValue={selectedTopic}
                />
              )}

              {/* Debate - topic + position picker */}
              {selectedMode === 'DEBATE' && (
                <>
                  <TopicPicker
                    mode={selectedMode}
                    onSelect={(topic) => setSelectedTopic(topic)}
                    selectedValue={selectedTopic}
                  />
                  {selectedTopic && (
                    <DebatePositionSelector
                      onSelect={(pos) => setDebatePosition(pos)}
                      selectedPosition={debatePosition || undefined}
                    />
                  )}
                </>
              )}

              {/* Grammar Fix - info card */}
              {selectedMode === 'GRAMMAR_FIX' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">spellcheck</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Grammar Analysis</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Every sentence is checked for grammatical accuracy</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">lightbulb</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Detailed Explanations</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Understand why corrections are made</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">dictionary</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Vocabulary Tips</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Learn better word choices and phrasing</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined">trending_up</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Track Progress</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">See your improvement over time</p>
                      </div>
                    </div>
                  </div>

                  {/* Level info */}
                  <div className="mt-6 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[#3c83f6]">school</span>
                      <div>
                        <p className="text-sm font-semibold">Level: {selectedLevel}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {selectedLevel === 'BEGINNER' && 'Simple corrections with detailed explanations'}
                          {selectedLevel === 'INTERMEDIATE' && 'Moderate corrections, natural phrasing suggestions'}
                          {selectedLevel === 'ADVANCED' && 'Nuanced feedback, focus on style and fluency'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowTopicModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTopicConfirm}
                disabled={!canConfirmTopic() || isStarting}
                className="px-6 py-2.5 bg-[#3c83f6] text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-[#3c83f6]/20 hover:bg-[#3c83f6]/90 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#3c83f6]"
              >
                {isStarting ? 'Starting...' : 'Start Session'}
                {!isStarting && <span className="material-symbols-outlined ml-1 text-base align-middle">arrow_forward</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
