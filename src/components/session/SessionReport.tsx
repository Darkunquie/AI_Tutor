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

function getVerdict(score: number): string {
  if (score >= 90) return 'Exceptional.';
  if (score >= 80) return 'A strong session.';
  if (score >= 70) return 'Solid, with room to grow.';
  if (score >= 60) return 'Coming along.';
  return 'Worth another try.';
}

function generateTips(errorCounts: Record<ErrorType, number>): string[] {
  const tips: string[] = [];
  const sorted = Object.entries(errorCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  for (const [type] of sorted.slice(0, 3)) {
    switch (type) {
      case 'GRAMMAR':
        tips.push('Focus on verb tense consistency and subject–verb agreement.');
        break;
      case 'VOCABULARY':
        tips.push('Learn a few new words each session and put them to use.');
        break;
      case 'STRUCTURE':
        tips.push('Practice building complex sentences with clear clause order.');
        break;
      case 'FLUENCY':
        tips.push('Read aloud daily to smooth out hesitation and fillers.');
        break;
    }
  }
  if (tips.length === 0) {
    tips.push('No patterns worth fixing today. Keep the rhythm.');
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
  const [showAll, setShowAll] = useState(false);
  const totalErrors = Object.values(errorCounts).reduce((a, b) => a + b, 0);
  const grade = getGrade(score);
  const verdict = getVerdict(score);
  const tips = generateTips(errorCounts);
  const displayed = showAll ? corrections : corrections.slice(0, 5);
  const topicLabel = context.topic || context.scenario || context.debateTopic || null;

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F5F2EC] font-geist antialiased">
      <div className="mx-auto max-w-[880px] px-10 pt-16 pb-20">
        {/* Eyebrow */}
        <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
          Session report
        </div>

        {/* Hero — score + verdict */}
        <div className="grid grid-cols-12 gap-10 border-b border-[#2A2A2E] pb-10">
          <div className="col-span-7">
            <h1 className="font-serif-display text-[64px] leading-[1.05] tracking-[-0.03em] text-[#F5F2EC]">
              {verdict}
            </h1>
            <p className="mt-4 text-[15px] leading-[1.55] text-[#9A948A]">
              {MODE_LABELS[mode] || mode} · {level.charAt(0) + level.slice(1).toLowerCase()}
              {topicLabel ? ` · ${topicLabel}` : ''}
            </p>
          </div>
          <div className="col-span-5 flex flex-col items-end justify-center border-l border-[#2A2A2E] pl-10">
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">Score</div>
            <div className="font-serif-display tabular-nums flex items-baseline gap-3 leading-none text-[#F5F2EC]">
              <span className="text-[96px] tracking-[-0.03em]">{Math.round(score)}</span>
              <span className="text-[24px] text-[#6B665F]">/100</span>
            </div>
            <div className="mt-2 text-[13px] text-[#9A948A]">
              Grade <span className="text-[#F5F2EC]">{grade}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-x-8 divide-x divide-[#2A2A2E] border-b border-[#2A2A2E] py-6">
          {[
            { label: 'Duration', value: formatDuration(duration) },
            { label: 'Messages', value: messageCount },
            { label: 'Errors', value: totalErrors },
            { label: 'Words gained', value: vocabularyGained.length },
          ].map((s, i) => (
            <div key={s.label} className={i === 0 ? 'pl-0 pr-8' : 'px-8'}>
              <div className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                {s.label}
              </div>
              <div className="font-serif-display tabular-nums mt-2 text-[32px] leading-none text-[#F5F2EC]">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Error breakdown */}
        {totalErrors > 0 && (
          <section className="mt-14">
            <h3 className="font-serif-display text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
              Where the mistakes lived.
            </h3>
            <div className="mt-6 grid grid-cols-4 gap-6 border-t border-[#2A2A2E] pt-6">
              {(['GRAMMAR', 'VOCABULARY', 'STRUCTURE', 'FLUENCY'] as const).map((key) => {
                const val = errorCounts[key] ?? 0;
                const pct = totalErrors > 0 ? Math.round((val / totalErrors) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <span className="text-[11px] uppercase tracking-[0.12em] text-[#9A948A]">
                        {ERROR_LABELS[key]}
                      </span>
                      <span className="tabular-nums text-[12px] text-[#6B665F]">{pct}%</span>
                    </div>
                    <div className="h-[2px] w-full bg-[#2A2A2E]">
                      <div
                        className="h-full bg-[#D4A373]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="font-serif-display tabular-nums mt-3 text-[22px] leading-none text-[#F5F2EC]">
                      {val}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Corrections */}
        {corrections.length > 0 && (
          <section className="mt-14">
            <div className="flex items-baseline justify-between">
              <h3 className="font-serif-display text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
                What I&rsquo;d change next time.
              </h3>
              <span className="text-[12px] text-[#6B665F]">{corrections.length} total</span>
            </div>
            <ul className="mt-6 border-t border-[#2A2A2E]">
              {displayed.map((c, i) => (
                <li
                  key={`${c.original}-${c.corrected}-${i}`}
                  className="grid grid-cols-12 gap-6 border-b border-[#2A2A2E] py-5"
                >
                  <div className="col-span-4 text-[14px] leading-[1.5] text-[#9A948A] line-through">
                    {c.original}
                  </div>
                  <div className="col-span-4 font-serif-display text-[17px] italic leading-[1.4] text-[#F5F2EC]">
                    {c.corrected}
                  </div>
                  <div className="col-span-4 text-[13px] leading-[1.55] text-[#9A948A]">
                    {c.explanation}
                  </div>
                </li>
              ))}
            </ul>
            {corrections.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-4 text-[13px] text-[#D4A373] hover:text-[#DDB389]"
              >
                {showAll ? 'Show less' : `Show all ${corrections.length} corrections →`}
              </button>
            )}
          </section>
        )}

        {/* Vocabulary */}
        {vocabularyGained.length > 0 && (
          <section className="mt-14">
            <h3 className="font-serif-display text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
              New vocabulary.
            </h3>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#2A2A2E] pt-5">
              {vocabularyGained.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="font-serif-display text-[18px] text-[#F5F2EC]"
                >
                  {word}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Tips */}
        <section className="mt-14">
          <h3 className="font-serif-display text-[24px] leading-[1.2] tracking-[-0.01em] text-[#F5F2EC]">
            For next session.
          </h3>
          <ol className="mt-4 border-t border-[#2A2A2E] pt-5">
            {tips.map((tip, i) => (
              <li key={i} className="flex gap-6 border-b border-[#2A2A2E] py-4">
                <span className="font-serif-display tabular-nums w-6 text-[16px] text-[#D4A373]">
                  0{i + 1}
                </span>
                <span className="text-[15px] leading-[1.55] text-[#F5F2EC]">{tip}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Actions */}
        <div className="mt-14 flex items-center gap-6">
          <button
            onClick={onGoHome}
            className="rounded-md border border-[#2A2A2E] bg-transparent px-6 py-[12px] text-[14px] text-[#F5F2EC] transition-colors hover:border-[#3A3A3F] hover:bg-[#17171A]"
          >
            ← Back to home
          </button>
          <button
            onClick={onViewDashboard}
            className="rounded-md bg-[#D4A373] px-6 py-[12px] text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
          >
            View dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
