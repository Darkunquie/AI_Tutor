'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] dark:bg-[#101722]">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-red-500">error</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Dashboard Error</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {error.message || 'Failed to load dashboard data.'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-[#3c83f6] text-white rounded-lg font-bold text-sm hover:bg-[#3c83f6]/90 transition-all"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
