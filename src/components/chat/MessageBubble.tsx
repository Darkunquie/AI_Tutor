'use client';

import type { Message, Correction } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

const CORRECTION_STYLES: Record<string, { bg: string; text: string }> = {
  GRAMMAR: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' },
  VOCABULARY: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400' },
  STRUCTURE: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-400' },
  FLUENCY: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-400' },
};

function CorrectionTip({ correction }: { correction: Correction }) {
  const style = CORRECTION_STYLES[correction.type] || CORRECTION_STYLES.GRAMMAR;

  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3c83f6]/10 text-[#3c83f6]">
        <span className="material-symbols-outlined">lightbulb</span>
      </div>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className={`rounded-xl ${style.bg} p-4 border border-[#3c83f6]/20 ${style.text}`}>
          <p className="text-sm font-medium">
            <strong className="text-[#3c83f6] font-bold">{correction.type} Tip:</strong>{' '}
            <span className="line-through opacity-60">{correction.original}</span>
            {' → '}
            <span className="font-bold underline">{correction.corrected}</span>
          </p>
          {correction.explanation && (
            <p className="text-xs mt-1 opacity-80">{correction.explanation}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'USER';

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-4">
        {/* User message */}
        <div className="flex items-start justify-end gap-4 max-w-[80%]">
          <div className="flex flex-col gap-1.5 items-end">
            <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 mr-1">You</p>
            <div className="rounded-2xl rounded-tr-none bg-[#3c83f6] p-4 text-white shadow-lg shadow-[#3c83f6]/20">
              <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
          {/* User avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-2 border-white dark:border-slate-800 shadow-md">
            <span className="material-symbols-outlined text-xl">person</span>
          </div>
        </div>

        {/* Correction tips (displayed as coaching messages below user message) */}
        {message.corrections && message.corrections.length > 0 && (
          <div className="w-full flex flex-col gap-4">
            {message.corrections.map((correction, index) => (
              <CorrectionTip key={index} correction={correction} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3c83f6] text-white shadow-lg shadow-[#3c83f6]/20">
        <span className="material-symbols-outlined">smart_toy</span>
      </div>
      <div className="flex flex-col gap-1.5 max-w-[80%]">
        <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 ml-1">Jarvis</p>
        <div className="rounded-2xl rounded-tl-none bg-white p-4 text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700">
          <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
