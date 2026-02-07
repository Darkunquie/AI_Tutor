'use client';

import { useState } from 'react';

interface PronunciationFeedbackProps {
  score: number;
  lowConfidenceWords?: string[];
  compact?: boolean;
}

export function PronunciationFeedback({
  score,
  lowConfidenceWords = [],
  compact = true,
}: PronunciationFeedbackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreStyle = () => {
    if (score >= 80) return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' };
    if (score >= 60) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' };
    return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' };
  };

  const style = getScoreStyle();

  const getFeedbackMessage = () => {
    if (score >= 90) return 'Excellent pronunciation!';
    if (score >= 80) return 'Great pronunciation!';
    if (score >= 70) return 'Good pronunciation';
    if (score >= 60) return 'Fair pronunciation';
    if (score >= 50) return 'Keep practicing';
    return 'Try speaking more clearly';
  };

  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${style.bg} ${style.text} cursor-pointer hover:opacity-80 transition-opacity`}
          title="Pronunciation score - click for details"
        >
          <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
          <span>Pronunciation: {score}%</span>
        </button>

        {isExpanded && (
          <div className="absolute z-10 mt-2 right-0 min-w-[240px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center`}>
                <span className={`text-lg font-black ${style.text}`}>{score}</span>
              </div>
              <div>
                <div className="font-bold text-sm">Pronunciation</div>
                <div className={`text-xs font-medium ${style.text}`}>{getFeedbackMessage()}</div>
              </div>
            </div>

            {lowConfidenceWords.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                  Words to practice
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {lowConfidenceWords.map((word, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-md font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Tip: Speak clearly and at a steady pace
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full size display
  return (
    <div className={`${style.bg} rounded-xl p-4`}>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray={`${(score / 100) * 176} 176`} strokeLinecap="round" className={style.text} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-black ${style.text}`}>{score}</span>
          </div>
        </div>

        <div className="flex-1">
          <h4 className={`font-bold ${style.text}`}>Pronunciation Score</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{getFeedbackMessage()}</p>

          {lowConfidenceWords.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Practice: </span>
              {lowConfidenceWords.map((word, i) => (
                <span key={i} className="text-xs mr-1">
                  {word}
                  {i < lowConfidenceWords.length - 1 && ', '}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
