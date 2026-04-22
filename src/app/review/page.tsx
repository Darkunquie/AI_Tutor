'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Flashcard } from '@/components/review/Flashcard';
import RequireAuth from '@/components/auth/RequireAuth';
import { AppShell } from '@/components/app/AppShell';
import type { ReviewWord, ReviewStats } from '@/lib/types';

function MasteryBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-[#1F242D] overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-[#4FD1FF] to-[#7DD3FC]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function StatusChip({ mastery, reviewedAt }: { mastery: number; reviewedAt: string | null }) {
  if (mastery >= 80) {
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] bg-[#4ade80]/10 text-[#4ade80]">
        MASTERED
      </span>
    );
  }
  if (!reviewedAt) {
    return (
      <span className="inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] bg-[#4FD1FF]/10 text-[#4FD1FF]">
        NEW
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] bg-[#fbbf24]/10 text-[#fbbf24]">
      DUE NOW
    </span>
  );
}

export default function ReviewPage() {
  const [words, setWords] = useState<ReviewWord[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWords = useCallback(async () => {
    setError(null);
    setLoading(true);
    setCompleted(false);
    try {
      const data = await api.vocabulary.getReviewWords(20);
      setWords(data.words);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const dueCount = stats?.totalDue ?? 0;
  const freshCount = words.filter((w) => !w.reviewedAt).length;
  const masteredCount = words.filter((w) => w.mastery >= 80).length;

  return (
    <RequireAuth>
      <AppShell>
        <div className="mx-auto max-w-[1080px] px-6 pt-10 pb-20">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-6 mb-8">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4FD1FF]">
                {/* review kicker */}
                {'// review · today\'s queue'}
              </span>
              <h1 className="mt-2.5 text-[clamp(36px,4vw,56px)] font-bold leading-[1.05] tracking-[-0.03em] text-[#E6EEF8]">
                {loading ? 'Loading...' : `${dueCount} cards due.`}
              </h1>
              <p className="mt-2 text-[15px] text-[#BCC8CF]">
                Spaced repetition, keyboard-friendly. Press{' '}
                <b className="font-mono text-[#E6EEF8]">Space</b> to flip,{' '}
                <b className="font-mono text-[#E6EEF8]">1–4</b> to rate.
              </p>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={fetchWords}
                className="rounded-lg border border-[#3D484E] bg-[#141A22] px-4 py-2.5 font-mono text-[12px] text-[#BCC8CF] transition-colors hover:border-[#4FD1FF]/40 hover:text-[#E6EEF8]"
              >
                Shuffle
              </button>
              <Link
                href="/app"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4FD1FF] px-4 py-2.5 font-mono text-[12px] font-medium text-[#0D131B] transition-all hover:bg-[#7DD3FC]"
              >
                Start audio mode →
              </Link>
            </div>
          </div>

          {/* Main content */}
          {error ? (
            <div className="max-w-[480px]">
              <h2 className="text-[24px] font-bold leading-[1.2] text-[#E6EEF8]">
                Could not load words.
              </h2>
              <p className="mt-3 text-[14px] text-[#879299]">{error}</p>
              <button
                onClick={fetchWords}
                className="mt-6 inline-flex rounded-lg bg-[#4FD1FF] px-6 py-3 font-mono text-[13px] font-medium text-[#0D131B] transition-colors hover:bg-[#7DD3FC]"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="h-[380px] w-full max-w-[540px] animate-pulse rounded-2xl bg-[#141A22]" />
            </div>
          ) : completed ? (
            <div className="max-w-[520px]">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4FD1FF]">
                {'// session complete'}
              </span>
              <h2 className="mt-2 text-[32px] font-bold leading-[1.15] tracking-[-0.01em] text-[#E6EEF8]">
                You&rsquo;re done for now.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.6] text-[#879299]">
                Every word you just saw is scheduled for review at the right moment.
                Come back tomorrow.
              </p>
              <div className="mt-8 flex items-center gap-6">
                <button
                  onClick={fetchWords}
                  className="rounded-lg bg-[#4FD1FF] px-6 py-3 font-mono text-[13px] font-medium text-[#0D131B] transition-colors hover:bg-[#7DD3FC]"
                >
                  Review more →
                </button>
                <Link
                  href="/dashboard"
                  className="font-mono text-[13px] text-[#879299] transition-colors hover:text-[#E6EEF8]"
                >
                  View dashboard
                </Link>
              </div>
            </div>
          ) : words.length === 0 ? (
            <div className="max-w-[480px]">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4FD1FF]">
                {'// all caught up'}
              </span>
              <h2 className="mt-2 text-[32px] font-bold leading-[1.15] tracking-[-0.01em] text-[#E6EEF8]">
                No words due.
              </h2>
              <p className="mt-4 text-[15px] leading-[1.6] text-[#879299]">
                Start a practice session and the tutor will quietly feed new vocabulary
                into your review queue.
              </p>
              <Link
                href="/app"
                className="mt-8 inline-flex rounded-lg bg-[#4FD1FF] px-6 py-3 font-mono text-[13px] font-medium text-[#0D131B] transition-colors hover:bg-[#7DD3FC]"
              >
                Start a session →
              </Link>
            </div>
          ) : (
            <>
              {/* Flashcard deck */}
              <Flashcard words={words} onComplete={() => setCompleted(true)} />

              {/* Queue list */}
              <div className="mt-16">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4FD1FF]">
                      {"// today's queue"}
                    </span>
                    <h2 className="mt-2 text-[22px] font-bold tracking-[-0.02em] text-[#E6EEF8]">
                      Full list
                    </h2>
                  </div>
                  <span className="flex items-center gap-2 rounded-full border border-[#3D484E] bg-[#141A22] px-3 py-1 font-mono text-[11px] text-[#879299]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4FD1FF] animate-pulse" />
                    {dueCount - freshCount - masteredCount} due · {freshCount} fresh · {masteredCount} mastered
                  </span>
                </div>

                <div className="rounded-2xl border border-[#3D484E] bg-gradient-to-b from-white/[0.04] to-white/[0.01] overflow-hidden">
                  {/* Header row */}
                  <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_40px] gap-4 items-center px-5 py-3 border-b border-[#3D484E] font-mono text-[10px] uppercase tracking-[0.1em] text-[#879299]">
                    <span>Word</span>
                    <span>Seen</span>
                    <span>Mastery</span>
                    <span>Status</span>
                    <span />
                  </div>

                  {words.map((w) => (
                    <div
                      key={w.id}
                      className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-4 items-center px-5 py-3.5 border-b border-[#3D484E]/50 last:border-b-0 transition-colors hover:bg-[#141A22]"
                    >
                      <div className="font-mono text-[14px] text-[#E6EEF8]">
                        {w.word}
                      </div>
                      <div className="font-mono text-[11px] tracking-[0.05em] text-[#879299]">
                        {w.mastery > 0 ? `${Math.ceil(w.mastery / 5)}×` : '—'}
                      </div>
                      <div>
                        <MasteryBar value={w.mastery} />
                      </div>
                      <div>
                        <StatusChip mastery={w.mastery} reviewedAt={w.reviewedAt} />
                      </div>
                      <div className="text-right font-mono text-[14px] text-[#879299]">→</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
