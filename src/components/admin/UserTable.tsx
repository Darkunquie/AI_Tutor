'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  level: string;
  createdAt: string;
  _count: { sessions: number };
}

interface UserTableProps {
  users: UserRow[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading?: boolean;
}

export default function UserTable({ users, onApprove, onReject, loading }: UserTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(`${id}-${action}`);
    try {
      if (action === 'approve') {
        await onApprove(id);
      } else {
        await onReject(id);
      }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600">
          group_off
        </span>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          No users found
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              User
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Phone
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Status
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Level
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Sessions
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Joined
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="py-3 px-4">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {user.phone}
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={user.status} />
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {user.level}
              </td>
              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                {user._count.sessions}
              </td>
              <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  {user.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleAction(user.id, 'approve')}
                      disabled={actionLoading === `${user.id}-approve`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">
                        check_circle
                      </span>
                      Approve
                    </button>
                  )}
                  {user.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleAction(user.id, 'reject')}
                      disabled={actionLoading === `${user.id}-reject`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">
                        cancel
                      </span>
                      Reject
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
