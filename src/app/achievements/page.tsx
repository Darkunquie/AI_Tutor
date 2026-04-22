'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import RequireAuth from '@/components/auth/RequireAuth';
import { AppShell } from '@/components/app/AppShell';
import { ACHIEVEMENTS } from '@/lib/config/achievements';
import type { AchievementDefinition } from '@/lib/config/achievements';

interface UnlockedAchievement {
  id: string;
  type: string;
  unlockedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  streak: 'Streak',
  sessions: 'Sessions',
  vocabulary: 'Vocabulary',
  score: 'Score',
  modes: 'Modes',
};

const CATEGORY_ORDER = ['streak', 'sessions', 'vocabulary', 'score', 'modes'];

export default function AchievementsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [unlocked, setUnlocked] = useState<UnlockedAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !user) { return; }
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const res = await api.achievements.list() as unknown as { data: { unlocked: UnlockedAchievement[]; locked: unknown[] } };
        if (!cancelled) {
          setUnlocked(res.data?.unlocked ?? []);
        }
      } catch {
        if (!cancelled) { setError(true); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, isAuthenticated, user, fetchKey]);

  const unlockedTypes = new Set(unlocked.map((a) => a.type));
  const unlockedCount = unlockedTypes.size;
  const totalCount = ACHIEVEMENTS.length;

  const getUnlockDate = (type: string) => {
    const a = unlocked.find((u) => u.type === type);
    if (!a) { return null; }
    return new Date(a.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Group by category
  const grouped: Record<string, AchievementDefinition[]> = {};
  for (const a of ACHIEVEMENTS) {
    if (!grouped[a.category]) { grouped[a.category] = []; }
    grouped[a.category].push(a);
  }

  // Find next achievement to unlock
  const nextToUnlock = ACHIEVEMENTS.find((a) => !unlockedTypes.has(a.type));

  return (
    <RequireAuth>
      <AppShell>
        <div className="max-w-[960px] px-8 py-10">

          {/* Header */}
          <header className="mb-10">
            <h1 className="font-[Sora] text-3xl font-bold tracking-[-0.02em] text-[#e6eef8]">
              Achievements
            </h1>
            <div 
              className="mt-4 h-2 w-full max-w-[400px] overflow-hidden rounded-full bg-[#1f242d]"
              role="progressbar"
              aria-valuenow={unlockedCount}
              aria-valuemin={0}
              aria-valuemax={totalCount}
              aria-label={`${unlockedCount} of ${totalCount} achievements unlocked`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#4fd1ff] to-[#2a6c88] transition-all duration-500"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>
          </header>

          {/* Next to unlock */}
          {nextToUnlock && !loading && (
            <div className="mb-8 flex items-center gap-4 rounded border border-[#4fd1ff]/20 bg-[#4fd1ff]/[0.04] p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-[#4fd1ff]/10">
                <span className="material-symbols-outlined text-2xl text-[#4fd1ff]">
                  {nextToUnlock.icon}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-medium text-[#4fd1ff]">Next to unlock</div>
                <div className="text-[15px] font-semibold text-[#e6eef8]">{nextToUnlock.title}</div>
                <div className="text-[13px] text-[#879299]">{nextToUnlock.description}</div>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[140px] animate-pulse rounded border border-[#3d484e] bg-[#141a22]" />
              ))}
            </div>
          )}

          {/* Categories */}
          {!loading && CATEGORY_ORDER.map((cat) => {
            const items = grouped[cat];
            if (!items) { return null; }
            return (
              <section key={cat} className="mb-10">
                <h2 className="mb-4 text-[14px] font-semibold text-[#e6eef8]">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {items.map((achievement) => {
                    const isUnlocked = unlockedTypes.has(achievement.type);
                    const date = getUnlockDate(achievement.type);
                    return (
                      <div
                        key={achievement.type}
                        className={`relative flex flex-col border p-5 transition-all ${
                          isUnlocked
                            ? 'border-[#4fd1ff]/30 bg-[#141a22]'
                            : 'border-[#3d484e]/50 bg-[#0d131b] opacity-50'
                        }`}
                      >
                        {/* Icon */}
                        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded ${
                          isUnlocked ? 'bg-[#4fd1ff]/10' : 'bg-[#1f242d]'
                        }`}>
                          {isUnlocked ? (
                            <span className="material-symbols-outlined text-2xl text-[#4fd1ff]">
                              {achievement.icon}
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-2xl text-[#3d484e]">
                              lock
                            </span>
                          )}
                        </div>

                        {/* Title + description */}
                        <h3 className={`text-[14px] font-semibold ${
                          isUnlocked ? 'text-[#e6eef8]' : 'text-[#879299]'
                        }`}>
                          {achievement.title}
                        </h3>
                        <p className="mt-1 text-[12px] text-[#879299]">
                          {achievement.description}
                        </p>

                        {/* Unlock date or locked indicator */}
                        <div className="mt-auto pt-3">
                          {isUnlocked ? (
                            <span className="text-[11px] text-[#7a9a6b]">
                              Unlocked {date}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#3d484e]">
                              Locked
                            </span>
                          )}
                        </div>

                        {/* Unlocked badge */}
                        {isUnlocked && (
                          <div className="absolute right-3 top-3">
                            <span className="material-symbols-outlined text-[16px] text-[#4fd1ff]">check_circle</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* Error state */}
          {!loading && error && (
            <div className="mt-8 text-center">
              <p className="text-[15px] text-[#879299]">
                Could not load achievements.
              </p>
              <button
                onClick={() => setFetchKey((k) => k + 1)}
                className="mt-4 rounded bg-[#4fd1ff] px-5 py-2 font-mono text-[12px] font-medium text-[#0d131b] transition-colors hover:bg-[#7dd3fc]"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && unlockedCount === 0 && (
            <div className="mt-8 text-center">
              <p className="text-[15px] text-[#879299]">
                Complete your first session to start unlocking achievements.
              </p>
            </div>
          )}

        </div>
      </AppShell>
    </RequireAuth>
  );
}
