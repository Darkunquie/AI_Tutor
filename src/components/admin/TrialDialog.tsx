'use client';

import { useState, useEffect } from 'react';

interface TrialDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (trial: { enabled: boolean; days: number }) => void;
  title: string;
  description: string;
  loading?: boolean;
}

const DURATION_OPTIONS = [
  { value: 3, label: '3 days' },
  { value: 6, label: '6 days' },
  { value: 14, label: '14 days' },
];

export default function TrialDialog({ open, onClose, onConfirm, title, description, loading }: TrialDialogProps) {
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [days, setDays] = useState(3);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTrialEnabled(true);
      setDays(3);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
          {description}
        </p>

        {/* Trial Checkbox */}
        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={trialEnabled}
            onChange={(e) => setTrialEnabled(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#3c83f6] focus:ring-[#3c83f6]"
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Apply free trial
          </span>
        </label>

        {/* Duration Picker */}
        <div className={`space-y-2 ml-7 mb-6 ${!trialEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Trial duration
          </p>
          {DURATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="trial-days"
                value={opt.value}
                checked={days === opt.value}
                onChange={() => setDays(opt.value)}
                className="w-4 h-4 border-slate-300 text-[#3c83f6] focus:ring-[#3c83f6]"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ enabled: trialEnabled, days })}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#3c83f6] text-white hover:bg-[#3c83f6]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
