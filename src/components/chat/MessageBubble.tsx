'use client';

import { useState } from 'react';
import type { Message, Correction } from '@/lib/types';

interface MessageBubbleProps {
  message: Message;
}

const CORRECTION_COLORS: Record<string, { border: string; badge: string; badgeBg: string }> = {
  GRAMMAR: { border: 'border-[#ffb4ab]', badge: 'text-[#ffb4ab]', badgeBg: 'bg-[#ffb4ab]/10' },
  VOCABULARY: { border: 'border-[#f2be8c]', badge: 'text-[#f2be8c]', badgeBg: 'bg-[#f2be8c]/10' },
  STRUCTURE: { border: 'border-[#a7ccea]', badge: 'text-[#a7ccea]', badgeBg: 'bg-[#a7ccea]/10' },
  FLUENCY: { border: 'border-[#b19cd9]', badge: 'text-[#b19cd9]', badgeBg: 'bg-[#b19cd9]/10' },
};

function CorrectionPopup({ corrections }: { corrections: Correction[] }) {
  return (
    <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
      {corrections.map((c, i) => {
        const style = CORRECTION_COLORS[c.type] || CORRECTION_COLORS.GRAMMAR;
        return (
          <div
            key={`${c.original}-${i}`}
            className={`rounded-lg bg-[#1B1B1D] p-3 border-l-2 ${style.border}`}
          >
            <span className={`text-[9px] uppercase tracking-widest ${style.badge} ${style.badgeBg} px-1.5 py-0.5 rounded`}>
              {c.type}
            </span>
            <p className="mt-1.5 text-sm text-[#E5E1E4]">
              <span className="line-through text-[#ffb4ab]/60">{c.original}</span>
              <span className="material-symbols-outlined text-xs mx-1.5 align-middle text-[#9A948A]">arrow_forward</span>
              <span className="font-bold text-[#b4e3b2]">{c.corrected}</span>
            </p>
            {c.explanation && (
              <p className="mt-1 text-[11px] italic text-[#9A948A]">{c.explanation}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showCorrections, setShowCorrections] = useState(false);
  const isUser = message.role === 'USER';

  if (isUser) {
    const hasCorrections = message.corrections && message.corrections.length > 0;
    const isCorrect = message.hasBeenChecked && !hasCorrections;

    return (
      <div className="flex flex-col items-end gap-1">
        {/* User message */}
        <div className="flex items-start justify-end gap-3 max-w-[80%]">
          <div className="flex flex-col items-end gap-1">
            <p className="text-[11px] font-medium text-[#9A948A] mr-1">You</p>
            <div className="rounded-2xl rounded-tr-none bg-[#D4A373] p-4 text-[#0E0E10] shadow-lg shadow-[#D4A373]/10">
              <p className="leading-relaxed whitespace-pre-wrap text-sm">{message.content}</p>
            </div>

            {/* Toggle badge below message */}
            {hasCorrections && (
              <button
                onClick={() => setShowCorrections(!showCorrections)}
                className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab] text-[10px] font-bold uppercase tracking-wider hover:bg-[#ffb4ab]/20 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">
                  {showCorrections ? 'expand_less' : 'lightbulb'}
                </span>
                {message.corrections!.length} correction{message.corrections!.length > 1 ? 's' : ''}
                <span className="material-symbols-outlined text-xs">
                  {showCorrections ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                </span>
              </button>
            )}

            {isCorrect && (
              <div className="flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-full bg-[#b4e3b2]/10 border border-[#b4e3b2]/20 text-[#b4e3b2] text-[10px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Correct
              </div>
            )}
          </div>
        </div>

        {/* Correction popup (toggleable) */}
        {hasCorrections && showCorrections && (
          <div className="w-full max-w-[80%] mr-0">
            <CorrectionPopup corrections={message.corrections!} />
          </div>
        )}
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-3 max-w-[80%]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4A373]/10 text-[#D4A373] border border-[#D4A373]/20">
        <span className="material-symbols-outlined text-lg">smart_toy</span>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium text-[#9A948A] ml-1">Talkivo</p>
        <div className="rounded-2xl rounded-tl-none bg-[#1B1B1D] p-4 text-[#E5E1E4] border border-[#50453B]/15">
          <p className="leading-relaxed whitespace-pre-wrap text-sm">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
