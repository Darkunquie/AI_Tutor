'use client';

import { useState, useEffect, useCallback } from 'react';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import UserTable from '@/components/admin/UserTable';
import type { UserRow } from '@/components/admin/UserTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { api } from '@/lib/api-client';
import { useToastStore } from '@/stores/toastStore';

interface AdminStats {
  users: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  activity: {
    totalSessions: number;
    sessionsThisWeek: number;
    activeUsersThisWeek: number;
    totalPracticeDuration: number;
    averageScore: number;
    totalVocabularyLearned: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectAllDialogOpen, setRejectAllDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [statsData, usersData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers({ status: 'PENDING', pageSize: 10 }),
      ]);
      setStats(statsData as AdminStats);
      setPendingUsers((usersData.data || []) as unknown as UserRow[]);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(id, 'APPROVED');
      addToast('User approved', 'check_circle', 'success');
      fetchData();
    } catch { addToast('Failed to approve user', 'error', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(true);
    try {
      await api.admin.updateUserStatus(id, 'REJECTED');
      addToast('User rejected', 'cancel', 'success');
      fetchData();
    } catch { addToast('Failed to reject user', 'error', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleBulkApprove = async () => {
    setActionLoading(true);
    try {
      const result = await api.admin.bulkAction({ action: 'APPROVE_ALL' });
      if (result.processed < result.total) {
        addToast(`Approved ${result.processed}/${result.total} users`, 'warning', 'warning');
      } else {
        addToast(`Approved all ${result.processed} users`, 'check_circle', 'success');
      }
      fetchData();
    } catch { addToast('Failed to bulk approve', 'error', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleBulkReject = async () => {
    setActionLoading(true);
    try {
      const result = await api.admin.bulkAction({ action: 'REJECT_ALL' });
      setRejectAllDialogOpen(false);
      addToast(`Rejected ${result.processed} users`, 'cancel', 'success');
      fetchData();
    } catch { addToast('Failed to bulk reject', 'error', 'error'); }
    finally { setActionLoading(false); }
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-[#0E0E10]">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#ffb4ab]/5 border border-[#ffb4ab]/20">
              <p className="text-sm text-[#ffb4ab]">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
                <p className="text-[#9A948A] text-sm">Loading dashboard...</p>
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-10">
              <section>
                <h2 className="font-serif italic text-[#f2be8c] text-xl tracking-tight mb-4">Platform Overview</h2>
                <AdminStatsCards stats={stats} />
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif italic text-[#f2be8c] text-xl tracking-tight flex items-center gap-3">
                    Pending Approvals
                    {stats.users.pending > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D4A373] text-[#0E0E10] text-xs font-bold">
                        {stats.users.pending}
                      </span>
                    )}
                  </h2>

                  {stats.users.pending > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBulkApprove}
                        disabled={actionLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#b4e3b2]/10 text-[#b4e3b2] border border-[#b4e3b2]/20 hover:bg-[#b4e3b2]/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">done_all</span>
                        Approve All ({stats.users.pending})
                      </button>
                      <button
                        onClick={() => setRejectAllDialogOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 hover:bg-[#ffb4ab]/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Reject All
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-[#1B1B1D] rounded-xl border border-[#50453B]/10">
                  <UserTable users={pendingUsers} onApprove={handleApprove} onReject={handleReject} />
                </div>
              </section>
            </div>
          ) : null}
        </main>

        <ConfirmDialog
          open={rejectAllDialogOpen}
          onClose={() => setRejectAllDialogOpen(false)}
          onConfirm={handleBulkReject}
          title="Reject All Pending Users"
          message={`Are you sure you want to reject all ${stats?.users.pending ?? 0} pending users? This action cannot be undone.`}
          confirmLabel="Reject All"
          confirmColor="red"
          loading={actionLoading}
        />
      </div>
    </RequireAdmin>
  );
}
