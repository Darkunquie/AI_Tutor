'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { logger } from '@/lib/utils';

interface Session {
  id: string;
  mode: string;
  level: string;
  duration: number;
  score: number | null;
  fillerWordCount: number;
  avgPronunciation: number | null;
  messageCount: number;
  errorCount: number;
  createdAt: string;
}

interface SessionHistoryProps {
  userId: string;
}

const MODE_LABELS: Record<string, string> = {
  FREE_TALK: 'Free Talk',
  ROLE_PLAY: 'Role Play',
  DEBATE: 'Debate',
  GRAMMAR_FIX: 'Grammar Fix',
};

const MODE_ICONS: Record<string, string> = {
  FREE_TALK: 'forum',
  ROLE_PLAY: 'theater_comedy',
  DEBATE: 'gavel',
  GRAMMAR_FIX: 'spellcheck',
};

const MODE_COLORS: Record<string, string> = {
  FREE_TALK: 'bg-blue-500/10 text-blue-500',
  ROLE_PLAY: 'bg-purple-500/10 text-purple-500',
  DEBATE: 'bg-orange-500/10 text-orange-500',
  GRAMMAR_FIX: 'bg-emerald-500/10 text-emerald-500',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionHistory({ userId }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 5;

  useEffect(() => {
    const fetchSessions = async () => {
      // Ensure auth token is available before making API call
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      if (!token) {
        logger.warn('No auth token available, skipping session fetch');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await api.sessions.list({ userId, page, pageSize });
        setSessions((result as unknown as { data: Session[]; meta: { total: number } }).data || []);
        setTotal((result as unknown as { data: Session[]; meta: { total: number } }).meta?.total || 0);
      } catch (error) {
        logger.error('Failed to fetch sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [userId, page]);

  const totalPages = Math.ceil(total / pageSize);

  if (isLoading && sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Session History
        </h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Session History
        </h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-slate-400">history</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No sessions yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Start practicing to see your history here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-6 pb-0">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Session History
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {total} total session{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Session Topic
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Date &amp; Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                {/* Session Topic */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg ${MODE_COLORS[session.mode] || 'bg-slate-500/10 text-slate-500'} flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {MODE_ICONS[session.mode] || 'chat'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white">
                        {MODE_LABELS[session.mode] || session.mode}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {session.level}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Date & Time */}
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 dark:text-white">
                    {formatDate(session.createdAt)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatTime(session.createdAt)}
                  </div>
                </td>

                {/* Duration */}
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {formatDuration(session.duration)}
                  </span>
                </td>

                {/* Score */}
                <td className="px-6 py-4">
                  {session.score !== null ? (
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        session.score >= 80
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : session.score >= 60
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                      }`}
                    >
                      {session.score}%
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button aria-label="Session options" className="p-1.5 rounded-lg text-slate-400 hover:text-[#3c83f6] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="material-symbols-outlined text-lg">more_horiz</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#3c83f6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-lg">chevron_left</span>
            Previous
          </button>
          <div className="flex items-center gap-1">
            {(() => {
              const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
              const endPage = Math.min(totalPages, startPage + 4);
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
            })().map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                  p === page
                    ? 'bg-[#3c83f6] text-white shadow-lg shadow-[#3c83f6]/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#3c83f6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
}
