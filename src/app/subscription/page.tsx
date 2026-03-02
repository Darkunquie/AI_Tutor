'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function SubscriptionPage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Calculate days remaining for active trial
  let daysRemaining = 0;
  if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt) {
    daysRemaining = Math.max(0, Math.ceil(
      (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7f8] dark:bg-[#101722] px-4">
      <div className="w-full max-w-md">
        {/* Admin */}
        {isAdmin && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">
                  admin_panel_settings
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Admin Access
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You have full access as an administrator
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#3c83f6] text-white rounded-lg font-bold text-sm hover:bg-[#3c83f6]/90 transition-all"
              >
                Go to App
              </Link>
            </div>
          </>
        )}

        {/* Active Trial */}
        {!isAdmin && user.subscriptionStatus === 'TRIAL' && daysRemaining > 0 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">
                  verified
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Free Trial Active
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your trial is currently active
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {daysRemaining}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  day{daysRemaining !== 1 ? 's' : ''} remaining
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  Trial ends: {new Date(user.trialEndsAt!).toLocaleDateString()}
                </div>
              </div>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#3c83f6] text-white rounded-lg font-bold text-sm hover:bg-[#3c83f6]/90 transition-all"
              >
                Continue Learning
              </Link>
            </div>
          </>
        )}

        {/* Expired Trial (includes TRIAL with 0 days remaining — client-side expiry) */}
        {!isAdmin && (user.subscriptionStatus === 'EXPIRED' || (user.subscriptionStatus === 'TRIAL' && daysRemaining <= 0)) && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">
                  timer_off
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Trial Expired
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your free trial has ended
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="flex items-start gap-3 mb-6">
                <span className="material-symbols-outlined text-[#3c83f6] mt-0.5">info</span>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your free trial period has ended. Please contact the administrator to extend your trial or get a subscription.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#3c83f6] text-white rounded-lg font-bold text-sm hover:bg-[#3c83f6]/90 transition-all"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}

        {/* No Subscription (NONE) */}
        {!isAdmin && (user.subscriptionStatus === 'NONE' || !user.subscriptionStatus) && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800/50 mb-4">
                <span className="material-symbols-outlined text-4xl text-slate-500 dark:text-slate-400">
                  block
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                No Active Subscription
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You don&apos;t have an active subscription
              </p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="flex items-start gap-3 mb-6">
                <span className="material-symbols-outlined text-[#3c83f6] mt-0.5">info</span>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Please contact the administrator to get a subscription and start learning English with AI.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-[#3c83f6] text-white rounded-lg font-bold text-sm hover:bg-[#3c83f6]/90 transition-all"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
