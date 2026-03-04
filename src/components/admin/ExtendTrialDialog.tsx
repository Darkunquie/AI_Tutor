'use client';

import { useState, useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ExtendTrialDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (days: number) => void;
  userName: string;
  currentTrialEnd: string | null;
  subscriptionStatus: string;
  loading?: boolean;
}

const DURATION_OPTIONS = [
  { value: 3, label: '3 days' },
  { value: 6, label: '6 days' },
  { value: 14, label: '14 days' },
];

function getTrialInfo(subscriptionStatus: string, currentTrialEnd: string | null) {
  if (subscriptionStatus === 'TRIAL' && currentTrialEnd) {
    const remaining = Math.ceil((new Date(currentTrialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (remaining > 0) {
      return { label: `Active trial — ${remaining} day${remaining !== 1 ? 's' : ''} remaining`, isActive: true };
    }
  }
  if (subscriptionStatus === 'EXPIRED') {
    return { label: 'Trial expired', isActive: false };
  }
  return { label: 'No active trial', isActive: false };
}

export default function ExtendTrialDialog({
  open, onClose, onConfirm, userName, currentTrialEnd, subscriptionStatus, loading,
}: ExtendTrialDialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(open);
  const [days, setDays] = useState(3);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) setDays(3);
  }, [open]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, loading, onClose]);

  if (!open) return null;

  const trialInfo = getTrialInfo(subscriptionStatus, currentTrialEnd);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="extend-trial-dialog-title"
        className="relative w-full max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6"
      >
        <h3 id="extend-trial-dialog-title" className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Extend Trial
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Extend trial for <span className="font-medium text-slate-700 dark:text-slate-300">{userName}</span>
        </p>

        {/* Current status */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-sm ${trialInfo.isActive ? 'text-green-500' : 'text-slate-400'}`}>
              {trialInfo.isActive ? 'check_circle' : 'info'}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {trialInfo.label}
            </span>
          </div>
        </div>

        {/* Info text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          {trialInfo.isActive
            ? 'Days will be added to the remaining trial time.'
            : 'A new trial will start from today.'}
        </p>

        {/* Duration Picker */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
            Extension duration
          </p>
          {DURATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="extend-days"
                value={opt.value}
                checked={days === opt.value}
                onChange={() => setDays(opt.value)}
                className="w-4 h-4 border-slate-300 text-primary focus:ring-primary"
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
            onClick={() => onConfirm(days)}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Extend Trial
          </button>
        </div>
      </div>
    </div>
  );
}
