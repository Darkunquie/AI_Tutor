'use client';

import { useState } from 'react';
import type { FillerWordDetection } from '@/lib/types';

interface FillerWordBadgeProps {
  count: number;
  detections?: FillerWordDetection[];
  showDetails?: boolean;
}

export function FillerWordBadge({ count, detections, showDetails = true }: FillerWordBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (count === 0) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ${
          showDetails ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        } transition-opacity`}
        title={showDetails ? 'Click to see details' : undefined}
      >
        <span className="material-symbols-outlined text-[16px]">history_edu</span>
        <span>{count} Filler word{count > 1 ? 's' : ''}</span>
      </button>

      {isExpanded && detections && detections.length > 0 && (
        <div className="absolute z-10 mt-2 right-0 min-w-[220px] bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 uppercase tracking-wider">
            Filler words detected
          </div>
          <ul className="space-y-2">
            {detections.map((d, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span className="text-slate-700 dark:text-slate-300">&ldquo;{d.word}&rdquo;</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">&times;{d.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            Tip: Try pausing instead of using filler words
          </div>
        </div>
      )}
    </div>
  );
}
