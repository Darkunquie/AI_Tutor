'use client';

import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] dark:bg-[#101722] px-4">
      <div className="w-full max-w-md">
        {/* Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">
              hourglass_top
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Account Pending Approval
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Your account has been created successfully
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-start gap-3 mb-6">
            <span className="material-symbols-outlined text-[#3c83f6] mt-0.5">
              info
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              An admin will review and approve your account shortly. You will be
              able to log in once your account has been approved.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-sm text-slate-500">
                schedule
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                What happens next
              </span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Admin reviews your account
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                You receive approval
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Start learning English with AI
              </li>
            </ul>
          </div>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#3c83f6] text-white rounded-lg font-bold text-sm hover:bg-[#3c83f6]/90 transition-all"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
