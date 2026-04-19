'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AdminHeader from '@/components/admin/AdminHeader';
import UserTable from '@/components/admin/UserTable';
import type { UserRow } from '@/components/admin/UserTable';
import { api } from '@/lib/api-client';
import { useToastStore } from '@/stores/toastStore';

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);
  const fetchVersionRef = useRef(0);

  const fetchUsers = useCallback(async () => {
    const version = ++fetchVersionRef.current;
    try {
      setLoading(true);
      const params: Record<string, string | number> = { page, pageSize: 20 };
      if (statusFilter) { params.status = statusFilter; }
      if (search) { params.search = search; }
      const result = await api.admin.getUsers(params);
      if (version !== fetchVersionRef.current) { return; }
      setUsers(result.data as unknown as UserRow[]);
      setTotalPages(result.meta.totalPages);
      setTotal(result.meta.total);
    } catch {
      if (version !== fetchVersionRef.current) { return; }
      addToast('Failed to load users', 'error', 'error');
    } finally {
      if (version === fetchVersionRef.current) { setLoading(false); }
    }
  }, [statusFilter, search, page, addToast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(id, 'APPROVED');
      addToast('User approved', 'check_circle', 'success');
      fetchUsers();
    } catch { addToast('Failed to approve user', 'error', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(id, 'REJECTED');
      addToast('User rejected', 'cancel', 'success');
      fetchUsers();
    } catch { addToast('Failed to reject user', 'error', 'error'); }
    finally { setActionLoading(false); }
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-[#0E0E10]">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif italic text-[#f2be8c] text-xl tracking-tight">User Management</h2>
            <p className="text-sm text-[#9A948A]">{total} user{total !== 1 ? 's' : ''} total</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-1 bg-[#1B1B1D] rounded-lg border border-[#50453B]/15 p-1">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-widest transition-all ${
                    statusFilter === tab.value
                      ? 'bg-[#D4A373]/10 text-[#f2be8c]'
                      : 'text-[#D4C4B7] opacity-60 hover:text-[#f2be8c] hover:bg-[#201F21]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 max-w-sm">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#50453B] text-lg">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#50453B]/20 bg-[#1B1B1D] text-sm text-[#E5E1E4] placeholder-[#50453B] focus:outline-none focus:border-[#D4A373]/40 transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#1B1B1D] rounded-xl border border-[#50453B]/10">
            <UserTable users={users} onApprove={handleApprove} onReject={handleReject} loading={loading} />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded text-sm border border-[#50453B]/20 bg-[#1B1B1D] text-[#D4C4B7] hover:bg-[#2A2A2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-[#9A948A]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded text-sm border border-[#50453B]/20 bg-[#1B1B1D] text-[#D4C4B7] hover:bg-[#2A2A2C] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </RequireAdmin>
  );
}
