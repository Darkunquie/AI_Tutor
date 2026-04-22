'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import type { ReviewWord } from '@/lib/types';

interface FlashcardProps {
  words: ReviewWord[];
  onComplete: () => void;
}

const RATINGS = [
  { key: 'again', label: 'Again', sub: '< 1 MIN', color: '#f87171', correct: false },
  { key: 'hard', label: 'Hard', sub: '10 MIN', color: '#fbbf24', correct: true },
  { key: 'good', label: 'Good', sub: '1 DAY', color: '#a5f3c4', correct: true },
  { key: 'easy', label: 'Easy', sub: '4 DAYS', color: '#4ade80', correct: true },
] as const;

export function Flashcard({ words, onComplete }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const word = words[currentIndex];
  const total = words.length;
  const progress = total > 0 ? ((currentIndex) / total) * 100 : 0;
  const remaining = total - currentIndex;

  const flip = useCallback(() => {
    if (!flipped && !submitting) { setFlipped(true); }
  }, [flipped, submitting]);

  const handleRate = useCallback(async (correct: boolean) => {
    if (submitting || !word) return;
    setSubmitting(true);

    try {
      await api.vocabulary.submitReview(word.id, correct);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setFlipped(false);

    if (currentIndex >= total - 1) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [submitting, word, currentIndex, total, onComplete]);

  // Keyboard: Space to flip, 1-4 to rate
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') { return; }
      if (e.code === 'Space') {
        e.preventDefault();
        flip();
      }
      if (flipped && !submitting) {
        const idx = Number(e.key) - 1;
        if (idx >= 0 && idx < RATINGS.length) {
          e.preventDefault();
          handleRate(RATINGS[idx].correct);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flip, flipped, submitting, handleRate]);

  if (!word) return null;

  const masteryPct = word.mastery;
  const masteryLabel =
    masteryPct >= 80 ? '// MASTERED' :
    masteryPct >= 40 ? '// LEARNING' : '// NEW';

  return (
    <div className="flex flex-col items-center gap-0">
      {/* Progress bar */}
      <div className="flex w-full max-w-[540px] items-center gap-4 mb-6">
        <span className="font-mono text-[13px] tabular-nums text-[#879299]">
          {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <div className="flex-1 h-1 rounded-full bg-[#1F242D] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#4FD1FF] to-[#7DD3FC] transition-all duration-400"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-mono text-[13px] text-[#879299]">
          {remaining} remaining
        </span>
      </div>

      {/* Card deck */}
      <div className="relative grid place-items-center w-full" style={{ perspective: '1500px', height: '400px' }}>
        <div className="relative w-full max-w-[540px] h-[370px]">
          {/* Behind cards */}
          <div
            className="absolute inset-0 rounded-2xl border border-[#3D484E] bg-gradient-to-b from-white/[0.04] to-white/[0.01]"
            style={{ transform: 'translateY(28px) scale(0.9) translateZ(-80px)', opacity: 0.3 }}
          />
          <div
            className="absolute inset-0 rounded-2xl border border-[#3D484E] bg-gradient-to-b from-white/[0.04] to-white/[0.01]"
            style={{ transform: 'translateY(16px) scale(0.95) translateZ(-40px)', opacity: 0.55 }}
          />

          {/* Active card */}
          <div
            className="absolute inset-0 rounded-2xl border border-[#3D484E] bg-gradient-to-b from-white/[0.08] to-white/[0.015] shadow-lg cursor-pointer"
            style={{ transformStyle: 'preserve-3d' }}
            onClick={flip}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                flip();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={flipped ? 'Card back showing definition' : 'Tap to flip card'}
          >
            <div
              className="relative w-full h-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transitionTimingFunction: 'cubic-bezier(.2,.7,.3,1)',
              }}
            >
              {/* Front face */}
              <div
                className="absolute inset-0 flex flex-col justify-between p-10"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4FD1FF]">
                    {masteryLabel}
                  </span>
                  <span className="rounded-full border border-[#3D484E] bg-[#141A22] px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-[#879299]">
                    CARD {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                  </span>
                </div>

                <div>
                  <div className="font-mono text-[clamp(48px,8vw,72px)] leading-[1.05] tracking-[-0.04em] text-[#E6EEF8]">
                    {word.word}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[13px] text-[#879299]">
                    <span className="text-[#4FD1FF]">↻</span>
                    Tap card or press Space to flip
                  </span>
                </div>
              </div>

              {/* Back face */}
              <div
                className="absolute inset-0 flex flex-col justify-between p-10"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#4FD1FF]">
                    // definition
                  </span>
                  <span className="rounded-full border border-[#3D484E] bg-[#141A22] px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-[#879299]">
                    MASTERY {masteryPct}%
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="font-mono text-[28px] tracking-[-0.02em] text-[#E6EEF8]">
                    {word.word}
                  </div>
                  {word.definition && (
                    <p className="text-[16px] leading-[1.55] text-[#BCC8CF] max-w-[44ch]">
                      {word.definition}
                    </p>
                  )}
                  <div className="rounded-xl border border-[#3D484E] bg-[#141A22] px-4 py-3.5 font-mono text-[14px] leading-[1.5] text-[#E6EEF8]">
                    &ldquo;{word.context}&rdquo;
                    <span className="mt-2 block font-mono text-[11px] tracking-[0.08em] text-[#879299]">
                      CONTEXT FROM SESSION
                    </span>
                  </div>
                </div>

                <span className="flex items-center gap-2 font-mono text-[13px] text-[#879299]">
                  Rate your recall below ↓
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="grid w-full max-w-[540px] grid-cols-4 gap-2.5 mt-6">
        {RATINGS.map((r, i) => (
          <button
            key={r.key}
            disabled={!flipped || submitting}
            onClick={() => handleRate(r.correct)}
            className="flex flex-col items-center gap-1 rounded-xl border border-[#3D484E] bg-[#141A22] px-2.5 py-3.5 font-mono text-[12px] transition-all hover:-translate-y-0.5 hover:border-[#4FD1FF]/40 disabled:opacity-30 disabled:hover:translate-y-0"
          >
            <b style={{ color: r.color }} className="text-[14px] tracking-[-0.01em]">{r.label}</b>
            <span className="text-[10px] tracking-[0.1em] text-[#879299]">{r.sub}</span>
            <span className="mt-0.5 text-[10px] text-[#879299]/60">{i + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
