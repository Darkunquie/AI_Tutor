'use client';

import { useState } from 'react';
import { api } from '@/lib/api-client';
import type { ReviewWord } from '@/lib/types';

interface FlashcardProps {
  words: ReviewWord[];
  onComplete: () => void;
}

export function Flashcard({ words, onComplete }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{ correct: number; incorrect: number }>({ correct: 0, incorrect: 0 });

  const word = words[currentIndex];
  if (!word) return null;

  const isLast = currentIndex === words.length - 1;

  const handleAnswer = async (correct: boolean) => {
    if (submitting) return;
    setSubmitting(true);

    // Optimistic update
    setResults((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }));

    try {
      await api.vocabulary.submitReview(word.id, correct);
    } catch (err) {
      console.error('Failed to submit review:', err);
      // Rollback optimistic update
      setResults((prev) => ({
        correct: prev.correct - (correct ? 1 : 0),
        incorrect: prev.incorrect - (correct ? 0 : 1),
      }));
    }

    setSubmitting(false);
    setFlipped(false);

    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const masteryColor =
    word.mastery >= 80 ? 'bg-emerald-500' :
    word.mastery >= 50 ? 'bg-amber-500' :
    word.mastery >= 20 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between w-full text-sm text-slate-500 dark:text-slate-400">
        <span>{currentIndex + 1} / {words.length}</span>
        <div className="flex items-center gap-3">
          <span className="text-emerald-500 font-semibold">{results.correct} correct</span>
          <span className="text-red-500 font-semibold">{results.incorrect} missed</span>
        </div>
      </div>

      {/* Card */}
      <div
        onClick={() => !flipped && setFlipped(true)}
        onKeyDown={(e) => {
          if (!flipped && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setFlipped(true);
          }
        }}
        tabIndex={0}
        role="button"
        aria-pressed={flipped}
        className={`w-full min-h-[240px] rounded-2xl border-2 p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#3c83f6] focus:ring-offset-2 ${
          flipped
            ? 'bg-white dark:bg-slate-800 border-[#3c83f6]/30 shadow-lg'
            : 'bg-gradient-to-br from-[#3c83f6] to-indigo-500 border-transparent text-white shadow-xl shadow-[#3c83f6]/20 hover:scale-[1.02]'
        }`}
      >
        {!flipped ? (
          <>
            <p className="text-3xl font-black mb-3">{word.word}</p>
            <p className="text-sm opacity-80">Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">{word.word}</p>
            {word.definition && (
              <p className="text-base text-slate-600 dark:text-slate-300 mb-3">{word.definition}</p>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              &ldquo;{word.context}&rdquo;
            </p>
            {/* Mastery bar */}
            <div className="w-full mt-4 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${masteryColor} rounded-full transition-all`} style={{ width: `${word.mastery}%` }} />
              </div>
              <span className="text-xs font-semibold text-slate-500">{word.mastery}%</span>
            </div>
          </>
        )}
      </div>

      {/* Action buttons - only show when flipped */}
      {flipped && (
        <div className="flex gap-4 w-full">
          <button
            onClick={() => handleAnswer(false)}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">close</span>
            Missed
          </button>
          <button
            onClick={() => handleAnswer(true)}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg align-middle mr-1">check</span>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
