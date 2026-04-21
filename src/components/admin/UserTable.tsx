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

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
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
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#131315]/40 border-b border-[#50453B]/10">
            {['User', 'Status', 'Level', 'Sessions', 'Actions'].map((h, i) => (
              <th key={h} className={`px-6 py-4 text-[10px] uppercase tracking-widest text-[#9A948A] ${i === 4 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#50453B]/5">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#353437] flex items-center justify-center text-[#D4A373] text-xs font-bold">
                    {getInitials(user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#E5E1E4]">{user.name}</p>
                    <p className="text-[10px] text-[#9A948A]">{user.phone}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5"><StatusBadge status={user.status} /></td>
              <td className="px-6 py-5 text-sm text-[#D4C4B7]">{user.level}</td>
              <td className="px-6 py-5 text-sm text-[#D4C4B7]">{user._count.sessions}</td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2">
                  {user.status !== 'REJECTED' && (
                    <button
                      onClick={() => handleAction(user.id, 'reject')}
                      disabled={actionLoading === `${user.id}-reject`}
                      className="w-8 h-8 flex items-center justify-center rounded border border-[#50453B]/20 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors disabled:opacity-50"
                      aria-label={`Reject ${user.name}`}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                  {user.status === 'PENDING' && (
                    <button
                      onClick={() => handleAction(user.id, 'approve')}
                      disabled={actionLoading === `${user.id}-approve`}
                      className="w-8 h-8 flex items-center justify-center rounded border border-[#50453B]/20 text-[#f2be8c] hover:bg-[#f2be8c]/10 transition-colors disabled:opacity-50"
                      aria-label={`Approve ${user.name}`}
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
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
