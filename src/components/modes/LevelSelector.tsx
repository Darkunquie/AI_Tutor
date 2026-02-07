'use client';

import { LEVELS } from '@/lib/config';
import type { Level } from '@/lib/types';

interface LevelSelectorProps {
  onSelect: (level: Level) => void;
  selectedLevel: Level;
}

export function LevelSelector({ onSelect, selectedLevel }: LevelSelectorProps) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Select Your Level
      </h3>
      <div className="flex flex-wrap gap-3">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className={`flex-1 min-w-[140px] p-4 rounded-xl border-2 text-left transition-all ${
              selectedLevel === level.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">{level.title}</div>
            <div className="text-xs text-gray-500 mt-1">{level.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
