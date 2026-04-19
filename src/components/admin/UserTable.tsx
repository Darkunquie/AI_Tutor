'use client';

import { useState } from 'react';
import StatusBadge from './StatusBadge';

export interface UserRow {
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
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
  loading?: boolean;
}

export default function UserTable({ users, onApprove, onReject, loading }: UserTableProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(`${id}-${action}`);
    try {
      if (action === 'approve') { await onApprove(id); }
      else { await onReject(id); }
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <span className="material-symbols-outlined text-4xl text-[#50453B]">group_off</span>
        <p className="text-sm text-[#9A948A] mt-2">No users found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#50453B]/20">
            {['User', 'Phone', 'Status', 'Level', 'Sessions', 'Joined', 'Actions'].map((h, i) => (
              <th
                key={h}
                className={`py-3 px-4 text-[10px] font-bold text-[#D4C4B7] uppercase tracking-[0.2em] ${i === 6 ? 'text-right' : 'text-left'}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#50453B]/10">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-[#2A2A2C]/50 transition-colors">
              <td className="py-3 px-4">
                <p className="text-sm font-semibold text-[#E5E1E4]">{user.name}</p>
                <p className="text-xs text-[#9A948A]">{user.email}</p>
              </td>
              <td className="py-3 px-4 text-sm text-[#D4C4B7]">{user.phone}</td>
              <td className="py-3 px-4"><StatusBadge status={user.status} /></td>
              <td className="py-3 px-4 text-sm text-[#D4C4B7] uppercase text-[11px] tracking-wider">{user.level}</td>
              <td className="py-3 px-4 text-sm text-[#D4C4B7]">{user._count.sessions}</td>
              <td className="py-3 px-4 text-sm text-[#9A948A]">
                {(() => {
                  const d = new Date(user.createdAt);
                  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                })()}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-2">
                  {user.status === 'PENDING' && (
                    <button
                      onClick={() => handleAction(user.id, 'approve')}
                      disabled={actionLoading === `${user.id}-approve`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#b4e3b2]/10 text-[#b4e3b2] border border-[#b4e3b2]/20 hover:bg-[#b4e3b2]/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve
                    </button>
                  )}
                  {user.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleAction(user.id, 'reject')}
                      disabled={actionLoading === `${user.id}-reject`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/20 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
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
