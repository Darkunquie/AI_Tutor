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

const ERROR_CONFIG: Record<string, { label: string; color: string; barColor: string }> = {
  GRAMMAR: { label: 'Grammar', color: 'text-[#ffb4ab]', barColor: 'bg-[#ffb4ab]' },
  VOCABULARY: { label: 'Vocabulary', color: 'text-[#f2be8c]', barColor: 'bg-[#f2be8c]' },
  STRUCTURE: { label: 'Structure', color: 'text-[#a7ccea]', barColor: 'bg-[#a7ccea]' },
  FLUENCY: { label: 'Fluency', color: 'text-[#b19cd9]', barColor: 'bg-[#b19cd9]' },
};

const CORRECTION_COLORS: Record<string, string> = {
  GRAMMAR: 'border-[#ffb4ab]',
  VOCABULARY: 'border-[#f2be8c]',
  STRUCTURE: 'border-[#a7ccea]',
  FLUENCY: 'border-[#b19cd9]',
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
    return 'Flawless execution today. Your command of language was precise and natural. Maintain this standard.';
  }

  const worst = sorted[0][0];
  const focus: Record<string, string> = {
    GRAMMAR: 'Your synthesis of ideas is strong, yet tense inconsistencies occasionally disrupt flow. Focus on maintaining a singular temporal anchor.',
    VOCABULARY: 'Your expression is clear but could benefit from a richer lexicon. Challenge yourself with more precise word choices next session.',
    STRUCTURE: 'Your ideas are compelling, but sentence construction sometimes obscures meaning. Practice building complex sentences with clear clause ordering.',
    FLUENCY: 'Your confidence is growing. Work on reducing hesitation markers to let your natural eloquence shine through.',
  };

  return focus[worst] || 'Continue refining your craft. Each session brings you closer to mastery.';
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
  const [showAll, setShowAll] = useState(false);
  const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
  const grade = getGrade(score);
  const displayed = showAll ? corrections : corrections.slice(0, 5);
  const counsel = generateCounsel(errorCounts);

  // SVG circle math
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#E5E1E4] antialiased">
      <div className="mx-auto max-w-[1200px] px-8 lg:px-12 pt-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ── Left Column ── */}
          <div className="flex flex-col gap-10">
            {/* Score Ring */}
            <section className="bg-[#1B1B1D] p-10 rounded-2xl border border-[#50453B]/10 flex flex-col items-center text-center">
              <div className="relative w-[200px] h-[200px] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle cx="100" cy="100" r={radius} fill="none" stroke="#50453B" strokeOpacity="0.2" strokeWidth="4" />
                  <circle
                    cx="100" cy="100" r={radius} fill="none"
                    stroke="#D4A373" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="z-10 flex flex-col items-center">
                  <span className="font-serif text-[64px] leading-none text-[#f2be8c]">{Math.round(score)}</span>
                  <span className="text-sm tracking-widest uppercase text-[#9A948A]">/ 100</span>
                </div>
                <div className="absolute -right-8 top-1/2 -translate-y-1/2">
                  <span className="font-serif text-[48px] text-[#f2be8c]">{grade}</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-3 flex-wrap justify-center">
                <span className="px-3 py-1 bg-[#65411a] text-[#f0bd8b] text-[11px] tracking-widest uppercase rounded-full border border-[#D4A373]/20">
                  {MODE_LABELS[mode] || mode}
                </span>
                <span className="px-3 py-1 bg-[#201F21] text-[#D4C4B7] text-[11px] tracking-widest uppercase rounded-full border border-[#50453B]/30">
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </span>
                <span className="text-sm text-[#E5E1E4]">{formatDuration(duration)}</span>
              </div>

              <p className="mt-4 text-[#9A948A] text-xs tracking-wide italic">
                {dateStr}, {timeStr}
                {context.topic ? ` · ${context.topic}` : context.scenario ? ` · ${context.scenario}` : ''}
              </p>
            </section>

            {/* Stat Cards */}
            <section className="grid grid-cols-2 gap-4">
              <StatCard icon="chat" label="Messages" value={String(messageCount)} />
              <StatCard icon="auto_stories" label="Lexicon" value={String(vocabularyGained.length)} />
              <StatCard icon="warning" label="Corrections" value={String(totalErrors)} />
              <StatCard icon="mic" label="Duration" value={formatDuration(duration)} />
            </section>
          </div>

          {/* ── Right Column ── */}
          <div className="flex flex-col gap-10">
            {/* Error Breakdown */}
            <section className="space-y-6">
              <h3 className="font-serif italic text-[#f2be8c] text-xl tracking-tight">Linguistic Precision</h3>
              <div className="space-y-4">
                {(['GRAMMAR', 'VOCABULARY', 'STRUCTURE', 'FLUENCY'] as const).map((key) => {
                  const val = errorCounts[key] ?? 0;
                  const maxErrors = Math.max(totalErrors, 1);
                  const pct = totalErrors > 0 ? Math.round((1 - val / maxErrors) * 100) : 100;
                  const cfg = ERROR_CONFIG[key];
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] tracking-widest uppercase text-[#D4C4B7]">
                        <span>{cfg.label}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1 bg-[#353437] rounded-full overflow-hidden">
                        <div className={`h-full ${cfg.barColor} transition-all duration-700`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Corrections */}
              {corrections.length > 0 && (
                <div className="space-y-4 mt-6">
                  <span className="text-[10px] tracking-widest uppercase text-[#9A948A] block">Critical Refinements</span>
                  {displayed.map((c, i) => (
                    <div
                      key={`${c.original}-${i}`}
                      className={`p-5 rounded bg-[#1B1B1D] border-l-2 ${CORRECTION_COLORS[c.type] || 'border-[#D4A373]'}`}
                    >
                      <div className="mb-2">
                        <span className="px-2 py-0.5 bg-[#93000a]/20 text-[#ffb4ab] text-[9px] tracking-widest uppercase rounded">
                          {ERROR_CONFIG[c.type]?.label || c.type}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="line-through text-[#ffb4ab]/60 decoration-[#ffb4ab]/40">{c.original}</span>
                        <span className="material-symbols-outlined text-xs mx-2 align-middle text-[#9A948A]">arrow_forward</span>
                        <span className="font-bold text-[#b4e3b2]">{c.corrected}</span>
                      </p>
                      {c.explanation && (
                        <p className="mt-2 text-xs italic text-[#9A948A]">{c.explanation}</p>
                      )}
                    </div>
                  ))}
                  {corrections.length > 5 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="text-[13px] text-[#D4A373] hover:text-[#DDB389]"
                    >
                      {showAll ? 'Show less' : `Show all ${corrections.length} corrections →`}
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* Vocabulary */}
            {vocabularyGained.length > 0 && (
              <section className="space-y-6">
                <h3 className="font-serif italic text-[#f2be8c] text-xl tracking-tight">Lexical Acquisitions</h3>
                <div className="space-y-3">
                  {vocabularyGained.map((word, i) => (
                    <div
                      key={`${word}-${i}`}
                      className="p-4 bg-[#201F21] border border-[#50453B]/15 rounded flex justify-between items-center group hover:bg-[#2A2A2C] transition-colors"
                    >
                      <h4 className="font-bold text-sm text-[#E5E1E4] group-hover:text-[#f2be8c] transition-colors">{word}</h4>
                      <span className="text-[9px] px-2 py-0.5 border border-[#D4A373]/30 text-[#D4A373] uppercase tracking-tighter rounded">Acquired</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Full Width Bottom ── */}
          <div className="lg:col-span-2 pt-8 border-t border-[#50453B]/15 flex flex-col gap-8">
            {/* Counsel */}
            <div className="bg-[#D4A373]/5 p-8 rounded-xl border border-[#D4A373]/10 relative overflow-hidden">
              <div className="absolute top-4 right-4 opacity-10">
                <span className="material-symbols-outlined text-4xl text-[#D4A373]">lightbulb</span>
              </div>
              <h4 className="font-serif italic text-[#D4A373] mb-3">Scholar&rsquo;s Curated Counsel</h4>
              <p className="text-[#9A948A] text-sm italic leading-relaxed max-w-4xl">
                &ldquo;{counsel}&rdquo;
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={onViewDashboard}
                className="px-8 py-3 bg-gradient-to-r from-[#f2be8c] to-[#D4A373] text-[#0E0E10] rounded font-semibold text-sm tracking-wide shadow-lg shadow-[#D4A373]/10 active:scale-95 transition-transform"
              >
                Start New Session
              </button>
              <button
                onClick={onGoHome}
                className="px-8 py-3 bg-transparent border border-[#50453B] text-[#D4C4B7] rounded text-sm tracking-wide hover:bg-[#201F21] transition-colors active:scale-95"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-[#1B1B1D] p-6 rounded-lg relative overflow-hidden group border border-[#50453B]/10">
      <div className="absolute bottom-[-10px] right-[-10px] opacity-5 text-[#D4C4B7] group-hover:opacity-10 transition-opacity">
        <span className="material-symbols-outlined text-6xl">{icon}</span>
      </div>
      <div className="flex flex-col gap-1 relative z-10">
        <span className="text-[10px] tracking-widest uppercase text-[#D4C4B7]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-[#f2be8c]">{icon}</span>
          <span className="font-serif text-2xl text-[#f2be8c]">{value}</span>
        </div>
      </div>
    </div>
  );
}
