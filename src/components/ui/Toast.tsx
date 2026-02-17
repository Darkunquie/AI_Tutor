'use client';

import { useToastStore } from '@/stores/toastStore';

function ToastItem({ id, message, icon }: { id: string; message: string; icon?: string }) {
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="animate-slide-in flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 min-w-[280px] max-w-[400px]">
      {icon && (
        <span className="material-symbols-outlined text-amber-500 text-xl">{icon}</span>
      )}
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}
