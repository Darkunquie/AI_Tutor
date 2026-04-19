'use client';

import { useEffect } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: 'red' | 'blue';
  loading?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmColor = 'red', loading,
}: ConfirmDialogProps) {
  const dialogRef = useFocusTrap<HTMLDivElement>(open);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) { onClose(); }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, loading, onClose]);

  if (!open) { return null; }

  const colorClasses = confirmColor === 'red'
    ? 'bg-[#ffb4ab] text-[#0E0E10] hover:bg-[#ffb4ab]/80'
    : 'bg-[#D4A373] text-[#0E0E10] hover:bg-[#DDB389]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0E0E10]/80 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="relative w-full max-w-sm bg-[#17171A] rounded-xl shadow-xl border border-[#50453B]/20 p-6"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-serif text-[#E5E1E4] mb-2">
          {title}
        </h3>
        <p id="confirm-dialog-message" className="text-sm text-[#9A948A] mb-6">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded text-sm text-[#D4C4B7] hover:bg-[#2A2A2C] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 ${colorClasses}`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-[#0E0E10] border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
