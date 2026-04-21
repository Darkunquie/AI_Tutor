'use client';

import { useState, useEffect, useCallback } from 'react';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import UserTable from '@/components/admin/UserTable';
import type { UserRow } from '@/components/admin/UserTable';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { GridBackground } from '@/components/ui/grid-background';
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
  const [health, setHealth] = useState<{ status: string; uptime: number; memory: { rss: string; heap: string }; groqQueue: number; db: { status: string; latency?: number } } | null>(null);
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

  // Fetch platform health
  useEffect(() => {
    let cancelled = false;
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        if (!cancelled) { setHealth(data); }
      } catch { /* silent */ }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // refresh every 30s
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

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
        <GridBackground />
        <div className="relative z-10">
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
                <h2 className="font-serif text-3xl text-[#E5E1E4] mb-4">Platform Overview</h2>
                <AdminStatsCards stats={stats} />
              </section>

              {/* Platform Health */}
              {health && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[rgba(27,27,29,0.7)] backdrop-blur-[12px] border border-[rgba(80,69,59,0.15)] p-6 rounded-xl">
                    <h4 className="font-serif text-xl text-[#E5E1E4] mb-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#f2be8c]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      Platform Health
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">Groq API</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#f2be8c]">{health.groqQueue > 0 ? `${health.groqQueue} in queue` : 'Idle'}</span>
                          <div className={`w-2 h-2 rounded-full ${health.status === 'ok' ? 'bg-[#b4e3b2] shadow-[0_0_10px_#b4e3b2]' : 'bg-[#ffb4ab]'}`} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">DB Status</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold">{health.db.latency ? `${health.db.latency}ms` : health.db.status}</span>
                          <div className={`w-2 h-2 rounded-full ${health.db.status === 'connected' ? 'bg-[#b4e3b2] shadow-[0_0_10px_#b4e3b2]' : 'bg-[#ffb4ab]'}`} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">Memory</span>
                        <span className="text-xs font-bold">{health.memory.rss} RSS / {health.memory.heap} Heap</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">Uptime</span>
                        <span className="text-xs font-bold">{Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[rgba(27,27,29,0.7)] backdrop-blur-[12px] border border-[rgba(80,69,59,0.15)] p-6 rounded-xl">
                    <h4 className="font-serif text-xl text-[#E5E1E4] mb-5">Quick Stats</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">Approved Users</span>
                        <span className="text-xs font-bold">{stats.users.approved}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">Rejected Users</span>
                        <span className="text-xs font-bold">{stats.users.rejected}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">New This Week</span>
                        <span className="text-xs font-bold">{stats.users.newThisWeek}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-[#D4C4B7] uppercase tracking-wider">Sessions This Week</span>
                        <span className="text-xs font-bold">{stats.activity.sessionsThisWeek}</span>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-serif text-3xl text-[#E5E1E4] flex items-center gap-4">
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

                <div className="bg-[rgba(27,27,29,0.7)] backdrop-blur-[12px] border border-[rgba(80,69,59,0.15)] rounded-xl overflow-hidden">
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
      </div>
    </RequireAdmin>
  );
}
