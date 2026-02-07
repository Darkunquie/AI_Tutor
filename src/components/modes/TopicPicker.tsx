'use client';

import { SCENARIOS, DEBATE_TOPICS, FREE_TALK_TOPICS } from '@/lib/config';
import type { Mode } from '@/lib/types';

interface TopicPickerProps {
  mode: Mode;
  onSelect: (value: string) => void;
  selectedValue?: string;
}

export function TopicPicker({ mode, onSelect, selectedValue }: TopicPickerProps) {
  if (mode === 'FREE_TALK') {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-3">
          Choose a Topic (Optional)
        </h3>
        <div className="flex flex-wrap gap-2">
          {FREE_TALK_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => onSelect(topic)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedValue === topic
                  ? 'bg-[#3c83f6] text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'ROLE_PLAY') {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-3">
          Choose a Scenario
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCENARIOS.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => onSelect(scenario.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedValue === scenario.id
                  ? 'border-[#3c83f6] bg-[#3c83f6]/5 dark:bg-[#3c83f6]/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-medium">{scenario.title}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {scenario.description}
              </div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                You: {scenario.userRole} | AI: {scenario.aiRole}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === 'DEBATE') {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-3">
          Choose a Debate Topic
        </h3>
        <div className="flex flex-col gap-3">
          {DEBATE_TOPICS.map((item, index) => (
            <button
              key={index}
              onClick={() => onSelect(item.topic)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedValue === item.topic
                  ? 'border-[#3c83f6] bg-[#3c83f6]/5 dark:bg-[#3c83f6]/10'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-medium">&ldquo;{item.topic}&rdquo;</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Difficulty: {item.level}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// Position selector for debate
interface DebatePositionProps {
  onSelect: (position: 'for' | 'against') => void;
  selectedPosition?: string;
}

export function DebatePositionSelector({
  onSelect,
  selectedPosition,
}: DebatePositionProps) {
  return (
    <div className="px-6 pb-6">
      <h3 className="text-lg font-semibold mb-3">
        Your Position
      </h3>
      <div className="flex gap-4">
        <button
          onClick={() => onSelect('for')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            selectedPosition === 'for'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2 mx-auto">
            <span className="material-symbols-outlined">thumb_up</span>
          </div>
          <div className="font-medium text-center">For</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center">I agree with this statement</div>
        </button>
        <button
          onClick={() => onSelect('against')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            selectedPosition === 'against'
              ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center mb-2 mx-auto">
            <span className="material-symbols-outlined">thumb_down</span>
          </div>
          <div className="font-medium text-center">Against</div>
          <div className="text-sm text-slate-500 dark:text-slate-400 text-center">I disagree with this statement</div>
        </button>
      </div>
    </div>
  );
}
