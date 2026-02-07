'use client';

import { MODES } from '@/lib/config';
import type { Mode } from '@/lib/types';

interface ModeSelectorProps {
  onSelect: (mode: Mode) => void;
  selectedMode?: Mode | null;
}

export function ModeSelector({ onSelect, selectedMode }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onSelect(mode.id)}
          className={`p-6 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-lg ${
            selectedMode === mode.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">{mode.icon}</span>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">
                {mode.title}
              </h3>
              <p className="mt-1 text-gray-600 text-sm">{mode.description}</p>
            </div>
          </div>
          <div
            className={`mt-4 h-1 rounded-full ${mode.color} opacity-60`}
          />
        </button>
      ))}
    </div>
  );
}
