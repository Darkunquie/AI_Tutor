'use client';

import { useState } from 'react';
import type { Mode, Level, ChatContext, ErrorType, Correction } from '@/lib/types';
import { formatDuration } from '@/stores/sessionStore';

interface SessionReportProps {
  score: number;
  duration: number;
  messageCount: number;
  mode: Mode;
  level: Level;
  context: ChatContext;
  errorCounts: Record<ErrorType, number>;
  corrections: Correction[];
  vocabularyGained: string[];
  onGoHome: () => void;
  onViewDashboard: () => void;
}

const MODE_LABELS: Record<string, string> = {
  FREE_TALK: 'Free Talk',
  ROLE_PLAY: 'Role Play',
  DEBATE: 'Debate',
  GRAMMAR_FIX: 'Grammar Fix',
  PRONUNCIATION: 'Pronunciation',
};

const MODE_ICONS: Record<string, string> = {
  FREE_TALK: 'forum',
  ROLE_PLAY: 'theater_comedy',
  DEBATE: 'gavel',
  GRAMMAR_FIX: 'spellcheck',
  PRONUNCIATION: 'record_voice_over',
};

const ERROR_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  GRAMMAR: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400', icon: 'edit_note' },
  VOCABULARY: { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', icon: 'dictionary' },
  STRUCTURE: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400', icon: 'account_tree' },
  FLUENCY: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', icon: 'record_voice_over' },
};

const ERROR_LABELS: Record<string, string> = {
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
  STRUCTURE: 'Structure',
  FLUENCY: 'Fluency',
};

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getScoreStyle(score: number) {
  if (score >= 80) return { ring: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Excellent!' };
  if (score >= 60) return { ring: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Good progress' };
  return { ring: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Keep practicing' };
}

function generateTips(errorCounts: Record<ErrorType, number>): string[] {
  const tips: string[] = [];
  const sorted = Object.entries(errorCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  for (const [type] of sorted.slice(0, 3)) {
    switch (type) {
      case 'GRAMMAR':
        tips.push('Focus on verb tense consistency and subject-verb agreement.');
        break;
      case 'VOCABULARY':
        tips.push('Try to learn 5 new words each session and use them in sentences.');
        break;
      case 'STRUCTURE':
        tips.push('Practice building complex sentences with proper clause structure.');
        break;
      case 'FLUENCY':
        tips.push('Read aloud more often to improve natural speech flow.');
        break;
    }
  }

  if (tips.length === 0) {
    tips.push('Great work! Keep practicing to maintain your skills.');
  }

  return tips;
}

export function SessionReport({
  score,
  duration,
  messageCount,
  mode,
  level,
  context,
  errorCounts,
  corrections,
  vocabularyGained,
  onGoHome,
  onViewDashboard,
}: SessionReportProps) {
  const [showAllCorrections, setShowAllCorrections] = useState(false);
  const style = getScoreStyle(score);
  const grade = getGrade(score);
  const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
  const tips = generateTips(errorCounts);

  const displayedCorrections = showAllCorrections ? corrections : corrections.slice(0, 5);

  // Score ring calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const topicLabel = context.topic || context.scenario || context.debateTopic || null;

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#101722] text-slate-900 dark:text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 mb-4">
            <span className="material-symbols-outlined text-3xl text-emerald-500">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Session Complete!</h1>
          <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined text-base">{MODE_ICONS[mode] || 'chat'}</span>
            <span>{MODE_LABELS[mode] || mode}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="capitalize">{level.toLowerCase()}</span>
            {topicLabel && (
              <>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span>{topicLabel}</span>
              </>
            )}
          </div>
        </div>

        {/* Score Circle */}
        <div className={`${style.bg} rounded-2xl p-8 mb-6`}>
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  strokeWidth="8"
                  className="text-slate-200 dark:text-slate-700"
                  stroke="currentColor"
                />
                <circle
                  cx="60" cy="60" r={radius}
                  fill="none"
                  strokeWidth="8"
                  className={style.ring}
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{score}</span>
                <span className={`text-sm font-bold ${style.text}`}>{grade}</span>
              </div>
            </div>
            <p className={`mt-3 text-sm font-semibold ${style.text}`}>{style.label}</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: 'schedule', label: 'Duration', value: formatDuration(duration) },
            { icon: 'chat', label: 'Messages', value: messageCount },
            { icon: 'error', label: 'Errors', value: totalErrors },
            { icon: 'spellcheck', label: 'Vocab', value: vocabularyGained.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800/40 rounded-xl p-3 text-center border border-slate-200 dark:border-slate-800"
            >
              <span className="material-symbols-outlined text-lg text-[#3c83f6]">{stat.icon}</span>
              <div className="text-lg font-black mt-1">{stat.value}</div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Error Breakdown */}
        {totalErrors > 0 && (
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Error Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(errorCounts).map(([type, count]) => {
                const colors = ERROR_COLORS[type];
                return (
                  <div
                    key={type}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${colors.bg}`}
                  >
                    <span className={`material-symbols-outlined text-lg ${colors.text}`}>{colors.icon}</span>
                    <div className="flex-1">
                      <span className={`text-xs font-semibold ${colors.text}`}>
                        {ERROR_LABELS[type]}
                      </span>
                    </div>
                    <span className={`text-lg font-black ${colors.text}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Corrections List */}
        {corrections.length > 0 && (
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Corrections ({corrections.length})
            </h3>
            <div className="space-y-3">
              {displayedCorrections.map((c, i) => {
                const colors = ERROR_COLORS[c.type];
                return (
                  <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className={`material-symbols-outlined text-lg mt-0.5 ${colors.text}`}>
                      {colors.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm flex-wrap">
                        <span className="line-through text-red-500 dark:text-red-400 font-medium">
                          {c.original}
                        </span>
                        <span className="material-symbols-outlined text-sm text-slate-400">arrow_forward</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {c.corrected}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {c.explanation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {corrections.length > 5 && (
              <button
                onClick={() => setShowAllCorrections(!showAllCorrections)}
                className="mt-3 text-sm font-semibold text-[#3c83f6] hover:text-[#3c83f6]/80 transition-colors"
              >
                {showAllCorrections ? 'Show less' : `Show all ${corrections.length} corrections`}
              </button>
            )}
          </div>
        )}

        {/* Vocabulary Gained */}
        {vocabularyGained.length > 0 && (
          <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Vocabulary Gained
            </h3>
            <div className="flex flex-wrap gap-2">
              {vocabularyGained.map((word, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-[#3c83f6]/10 text-[#3c83f6] text-sm font-semibold rounded-lg"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            <span className="material-symbols-outlined text-sm align-middle mr-1">lightbulb</span>
            Tips to Improve
          </h3>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span className="material-symbols-outlined text-base text-[#3c83f6] mt-0.5 flex-shrink-0">
                  arrow_right
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">home</span>
            Back to Home
          </button>
          <button
            onClick={onViewDashboard}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#3c83f6] text-white font-semibold hover:bg-[#3c83f6]/90 transition-colors shadow-lg shadow-[#3c83f6]/20"
          >
            <span className="material-symbols-outlined text-lg">insights</span>
            View Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
