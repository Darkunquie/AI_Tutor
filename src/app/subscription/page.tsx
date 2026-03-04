'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const PLAN_FEATURES = [
  'Unlimited AI conversation sessions',
  'All 5 learning modes (Free Talk, Role Play, Debate & more)',
  'Real-time grammar & pronunciation corrections',
  'Vocabulary tracking with spaced repetition',
  'Progress dashboard & session history',
  'Streak tracking & achievements',
];

function PricingCard() {
  return (
    <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Card header */}
      <div className="bg-gradient-to-r from-primary to-[#2563eb] px-8 py-6 text-white text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-100 mb-1">Talkivo Pro</p>
        <div className="flex items-end justify-center gap-1">
          <span className="text-2xl font-bold">₹</span>
          <span className="text-5xl font-extrabold tracking-tight">399</span>
          <span className="text-blue-200 mb-1">/month</span>
        </div>
        <p className="text-blue-100 text-xs mt-2">Everything you need to master English</p>
      </div>

      {/* Features list */}
      <div className="px-8 py-6">
        <ul className="space-y-3 mb-6">
          {PLAN_FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <span className="material-symbols-outlined text-green-500 text-base flex-shrink-0">check_circle</span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Subscribe button — payment integration coming soon */}
        <div className="relative group">
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary/50 text-white rounded-lg font-bold text-sm cursor-not-allowed select-none"
          >
            <span className="material-symbols-outlined text-sm">lock</span>{' '}
            Subscribe Now — ₹399/month
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 hidden group-hover:flex items-center whitespace-nowrap bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg">
            Payment integration coming soon
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-800 rotate-45" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { user, isAuthenticated, isLoading, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

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

  if (!user) { return null; }

  // Calculate days remaining for active trial
  let daysRemaining = 0;
  if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt) {
    daysRemaining = Math.max(0, Math.ceil(
      (new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
  }

  const isActuallyExpired =
    user.subscriptionStatus === 'EXPIRED' ||
    (user.subscriptionStatus === 'TRIAL' && daysRemaining <= 0);

  const isExpiredOrNone =
    isActuallyExpired ||
    user.subscriptionStatus === 'NONE' ||
    !user.subscriptionStatus;

  const expiredIconName = isActuallyExpired ? 'timer_off' : 'workspace_premium';
  const expiredHeading  = isActuallyExpired ? 'Your Trial Has Ended' : 'Get Full Access';

  return (
    <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#101722]">

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#101722]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary rounded-xl text-white">
              <span className="material-symbols-outlined block text-xl">school</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Talkivo</span>
          </div>

          {/* Profile button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-[#8b5cf6] flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.name}
              </span>
              <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
            </button>

            {/* Click-outside overlay */}
            {showMenu && (
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            )}

            {/* Dropdown */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    Admin Portal
                  </Link>
                )}
                <button
                  onClick={() => { setShowMenu(false); logout(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span className="material-symbols-outlined text-sm">logout</span>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Centered content */}
      <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* ── Admin ─────────────────────────────────────────────── */}
        {isAdmin && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-blue-600 dark:text-blue-400">
                  admin_panel_settings
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Admin Access</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">You have full access as an administrator</p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
              >
                Go to App
              </Link>
            </div>
          </>
        )}

        {/* ── Active Subscription (paid) ─────────────────────────── */}
        {!isAdmin && user.subscriptionStatus === 'ACTIVE' && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">
                  workspace_premium
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">You&apos;re Subscribed</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">You have full access to Talkivo Pro</p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
              >
                Continue Learning
              </Link>
            </div>
          </>
        )}

        {/* ── Active Trial ───────────────────────────────────────── */}
        {!isAdmin && user.subscriptionStatus === 'TRIAL' && daysRemaining > 0 && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">verified</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Free Trial Active</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your trial is currently active</p>
            </div>
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-green-600 dark:text-green-400 mb-1">{daysRemaining}</p>
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
                className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-all"
              >
                Continue Learning
              </Link>
            </div>
          </>
        )}

        {/* ── Expired Trial / No Subscription — show ₹399 plan ─── */}
        {!isAdmin && isExpiredOrNone && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                <span className="material-symbols-outlined text-4xl text-amber-600 dark:text-amber-400">
                  {expiredIconName}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {expiredHeading}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Subscribe to continue practising English with AI
              </p>
            </div>

            <PricingCard />
          </>
        )}

      </div>
      </div>
    </div>
  );
}
