'use client';

import { useEffect, useState } from 'react';

interface FillerWordAlertProps {
  word: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function FillerWordAlert({
  word,
  onDismiss,
  autoDismissMs = 3000,
}: FillerWordAlertProps) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onDismiss, 300);
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(onDismiss, 300);
  };

  const tips: Record<string, string> = {
    um: 'Pause silently instead',
    uh: 'Take a breath and pause',
    like: 'Be more specific',
    'you know': 'Explain your point clearly',
    basically: 'Get to the point directly',
    actually: 'Remove it - your sentence is fine without it',
    so: 'Start with the subject instead',
    well: 'Begin with your main point',
  };

  const tip = tips[word.toLowerCase()] || 'Try pausing instead';

  return (
    <div
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        bg-[#3c83f6] text-white px-5 py-3.5 rounded-xl shadow-xl shadow-[#3c83f6]/20
        flex items-center gap-3 max-w-sm
        transition-all duration-300
        ${isLeaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}
      `}
    >
      <span className="material-symbols-outlined text-2xl">chat_bubble</span>
      <div className="flex-1">
        <div className="font-bold text-sm">
          You said &ldquo;{word}&rdquo;
        </div>
        <div className="text-sm text-blue-100">
          {tip}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}
