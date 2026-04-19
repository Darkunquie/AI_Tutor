'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Flashcard } from '@/components/review/Flashcard';
import RequireAuth from '@/components/auth/RequireAuth';
import { AppShell } from '@/components/app/AppShell';
import type { ReviewWord, ReviewStats } from '@/lib/types';

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

  return (
    <RequireAuth>
      <AppShell>
        <div className="mx-auto max-w-[960px] px-10 pt-16 pb-16">
          <div className="flex items-end justify-between border-b border-[#2A2A2E] pb-8">
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                Vocabulary review
              </div>
              <h1 className="font-serif-display text-[48px] leading-[1.05] tracking-[-0.02em] text-[#F5F2EC]">
                The words that stuck.
              </h1>
              <p className="mt-3 text-[15px] leading-[1.55] text-[#9A948A]">
                Spaced-repetition review. A few minutes a day quietly builds a vocabulary
                you can actually reach for in a conversation.
              </p>
            </div>

            {stats && (
              <div className="flex items-center gap-10 text-right">
                {[
                  { label: 'Due', value: stats.totalDue },
                  { label: 'Today', value: stats.reviewedToday },
                  { label: 'Total', value: stats.totalWords },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                      {s.label}
                    </div>
                    <div className="font-serif-display tabular-nums mt-1 text-[28px] leading-none text-[#F5F2EC]">
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-14">
            {error ? (
              <div className="max-w-[480px]">
                <h2 className="font-serif-display text-[24px] leading-[1.2] text-[#F5F2EC]">
                  Could not load words.
                </h2>
                <p className="mt-3 text-[14px] text-[#9A948A]">{error}</p>
                <button
                  onClick={fetchWords}
                  className="mt-6 inline-flex rounded-md bg-[#D4A373] px-6 py-[12px] text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                <div className="h-[320px] w-full bg-[#17171A]/40" />
              </div>
            ) : completed ? (
              <div className="max-w-[520px]">
                <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                  Session complete
                </div>
                <h2 className="font-serif-display text-[32px] leading-[1.15] tracking-[-0.01em] text-[#F5F2EC]">
                  You&rsquo;re done for now.
                </h2>
                <p className="mt-4 text-[15px] leading-[1.6] text-[#9A948A]">
                  Every word you just saw is scheduled for review at the right moment.
                  Come back tomorrow.
                </p>
                <div className="mt-8 flex items-center gap-6">
                  <button
                    onClick={fetchWords}
                    className="rounded-md bg-[#D4A373] px-6 py-[12px] text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
                  >
                    Review more →
                  </button>
                  <Link
                    href="/dashboard"
                    className="text-[14px] text-[#9A948A] hover:text-[#F5F2EC]"
                  >
                    View dashboard
                  </Link>
                </div>
              </div>
            ) : words.length === 0 ? (
              <div className="max-w-[480px]">
                <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                  All caught up
                </div>
                <h2 className="font-serif-display text-[32px] leading-[1.15] tracking-[-0.01em] text-[#F5F2EC]">
                  No words due.
                </h2>
                <p className="mt-4 text-[15px] leading-[1.6] text-[#9A948A]">
                  Start a practice session and the tutor will quietly feed new vocabulary
                  into your review queue.
                </p>
                <Link
                  href="/app"
                  className="mt-8 inline-flex rounded-md bg-[#D4A373] px-6 py-[12px] text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
                >
                  Start a session →
                </Link>
              </div>
            ) : (
              <div className="rounded-xl border border-[#2A2A2E] bg-[#17171A] p-8">
                <Flashcard words={words} onComplete={() => setCompleted(true)} />
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
