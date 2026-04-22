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

const ERROR_CONFIG: Record<string, { label: string; color: string }> = {
  GRAMMAR: { label: 'Grammar', color: '#4fd1ff' },
  VOCABULARY: { label: 'Vocabulary', color: '#2a6c88' },
  STRUCTURE: { label: 'Structure', color: '#e8b64c' },
  FLUENCY: { label: 'Fluency', color: '#7a9a6b' },
};

function getGrade(score: number): string {
  if (score >= 95) { return 'A+'; }
  if (score >= 90) { return 'A'; }
  if (score >= 85) { return 'B+'; }
  if (score >= 80) { return 'B'; }
  if (score >= 75) { return 'C+'; }
  if (score >= 70) { return 'C'; }
  if (score >= 60) { return 'D'; }
  return 'F';
}

function generateCounsel(errorCounts: Record<ErrorType, number>): string {
  const sorted = Object.entries(errorCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) {
    return 'Flawless session. Your language was precise and natural. Keep this standard.';
  }

  const focus: Record<string, string> = {
    GRAMMAR: 'Focus on tense consistency. Your ideas are strong but tense shifts disrupt flow.',
    VOCABULARY: 'Try richer word choices next session. Your expression is clear but could be more precise.',
    STRUCTURE: 'Practice building complex sentences with clear clause ordering.',
    FLUENCY: 'Work on reducing hesitation. Your confidence is growing.',
  };

  return focus[sorted[0][0]] || 'Each session brings you closer to mastery.';
}

export function SessionReport({
  score, duration, messageCount, mode, level, context,
  errorCounts, corrections, vocabularyGained, onGoHome, onViewDashboard,
}: SessionReportProps) {
  const [showAll, setShowAll] = useState(false);
  const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
  const grade = getGrade(score);
  const displayed = showAll ? corrections : corrections.slice(0, 5);
  const counsel = generateCounsel(errorCounts);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-[#0d131b] text-[#e6eef8] antialiased">
      <div className="mx-auto max-w-[1100px] px-8 pb-20 pt-10">

        {/* Header */}
        <header className="mb-10">
          <div className="mb-2 text-[12px] text-[#879299]">
            {dateStr}, {timeStr}
            {context.topic ? ` · ${context.topic}` : context.scenario ? ` · ${context.scenario}` : ''}
          </div>
          <h1 className="font-[Sora] text-3xl font-bold tracking-[-0.02em] text-[#e6eef8]">
            Session Report
          </h1>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── Left Column ── */}
          <div className="space-y-6">
            {/* Score Ring */}
            <div className="flex flex-col items-center border border-[#3d484e] bg-[#141a22] p-10 text-center">
              <div className="relative flex h-[180px] w-[180px] items-center justify-center">
                <svg className="absolute inset-0 h-full w-full -rotate-90">
                  <circle cx="90" cy="90" r={radius} fill="none" stroke="#3d484e" strokeWidth="3" />
                  <circle
                    cx="90" cy="90" r={radius} fill="none"
                    stroke="#4fd1ff" strokeWidth="3" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="z-10 flex flex-col items-center">
                  <span className="font-[Sora] text-[56px] font-bold leading-none text-[#e6eef8]">{Math.round(score)}</span>
                  <span className="text-sm text-[#879299]">/ 100</span>
                </div>
                <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                  <span className="font-[Sora] text-[40px] font-bold text-[#4fd1ff]">{grade}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="border border-[#4fd1ff]/20 bg-[#4fd1ff]/10 px-3 py-1 text-[11px] font-medium text-[#4fd1ff]">
                  {MODE_LABELS[mode] || mode}
                </span>
                <span className="border border-[#3d484e] bg-[#1f242d] px-3 py-1 text-[11px] text-[#bcc8cf]">
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </span>
                <span className="text-sm text-[#879299]">{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Messages', value: String(messageCount), icon: 'chat' },
                { label: 'New Words', value: String(vocabularyGained.length), icon: 'auto_stories' },
                { label: 'Corrections', value: String(totalErrors), icon: 'edit_note' },
                { label: 'Duration', value: formatDuration(duration), icon: 'schedule' },
              ].map((s) => (
                <div key={s.label} className="border border-[#3d484e] bg-[#141a22] p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-[#4fd1ff]">{s.icon}</span>
                    <span className="text-[11px] text-[#879299]">{s.label}</span>
                  </div>
                  <span className="font-[Sora] text-2xl font-bold text-[#e6eef8]">{s.value}</span>
                </div>
              ))}
            </div>

            {/* Counsel */}
            <div className="border border-[#4fd1ff]/20 bg-[#4fd1ff]/[0.03] p-6">
              <h4 className="mb-2 text-[13px] font-medium text-[#4fd1ff]">Tutor Feedback</h4>
              <p className="text-[14px] italic leading-relaxed text-[#bcc8cf]">
                &ldquo;{counsel}&rdquo;
              </p>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-6">
            {/* Error Breakdown */}
            <div className="border border-[#3d484e] bg-[#141a22] p-6">
              <h3 className="mb-5 text-[14px] font-semibold text-[#e6eef8]">Error Breakdown</h3>
              <div className="space-y-4">
                {(['GRAMMAR', 'VOCABULARY', 'STRUCTURE', 'FLUENCY'] as const).map((key) => {
                  const val = errorCounts[key] ?? 0;
                  const maxErrors = Math.max(totalErrors, 1);
                  const pct = totalErrors > 0 ? Math.round((1 - val / maxErrors) * 100) : 100;
                  const cfg = ERROR_CONFIG[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="text-[#bcc8cf]">{cfg.label}</span>
                        <span className="font-medium text-[#e6eef8]">{pct}%</span>
                      </div>
                      <div className="h-[3px] overflow-hidden bg-[#1f242d]">
                        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Corrections */}
            {corrections.length > 0 && (
              <div className="border border-[#3d484e] bg-[#141a22] p-6">
                <h3 className="mb-4 text-[14px] font-semibold text-[#e6eef8]">Corrections</h3>
                <div className="space-y-3">
                  {displayed.map((c, i) => (
                    <div
                      key={`${c.original}-${i}`}
                      className="border-l-2 bg-[#0d131b] p-4"
                      style={{ borderColor: ERROR_CONFIG[c.type]?.color || '#4fd1ff' }}
                    >
                      <div className="mb-2">
                        <span className="text-[10px] font-medium text-[#879299]">
                          {ERROR_CONFIG[c.type]?.label || c.type}
                        </span>
                      </div>
                      <p className="text-[14px]">
                        <span className="text-[#e8b64c] line-through decoration-[#e8b64c]/40">{c.original}</span>
                        <span className="mx-2 text-[#879299]">→</span>
                        <span className="font-medium text-[#7a9a6b]">{c.corrected}</span>
                      </p>
                      {c.explanation && (
                        <p className="mt-2 text-[12px] italic text-[#879299]">{c.explanation}</p>
                      )}
                    </div>
                  ))}
                  {corrections.length > 5 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="text-[13px] text-[#4fd1ff] hover:text-[#7dd3fc]"
                    >
                      {showAll ? 'Show less' : `Show all ${corrections.length} corrections →`}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Vocabulary */}
            {vocabularyGained.length > 0 && (
              <div className="border border-[#3d484e] bg-[#141a22] p-6">
                <h3 className="mb-4 text-[14px] font-semibold text-[#e6eef8]">Words Learned</h3>
                <div className="flex flex-wrap gap-2">
                  {vocabularyGained.map((word, i) => (
                    <span
                      key={`${word}-${i}`}
                      className="border border-[#4fd1ff]/20 bg-[#4fd1ff]/[0.06] px-3 py-1.5 text-[13px] font-medium text-[#4fd1ff]"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onViewDashboard}
            className="bg-[#4fd1ff] px-8 py-3 text-[14px] font-semibold text-[#0d131b] transition-colors hover:bg-[#7dd3fc]"
          >
            Start New Session
          </button>
          <button
            onClick={onGoHome}
            className="border border-[#3d484e] bg-transparent px-8 py-3 text-[14px] text-[#bcc8cf] transition-colors hover:bg-[#1f242d]"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
