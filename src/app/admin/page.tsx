'use client';

import { useState, useEffect, useCallback } from 'react';
import RequireAdmin from '@/components/auth/RequireAdmin';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import UserTable from '@/components/admin/UserTable';
import { api } from '@/lib/api-client';

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingUsers, setPendingUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, usersData] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers({ status: 'PENDING', pageSize: 10 }),
      ]);
      setStats(statsData);
      setPendingUsers(usersData.data as unknown as UserRow[]);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    await api.admin.updateUserStatus(id, 'APPROVED');
    fetchData();
  };

  const handleReject = async (id: string) => {
    await api.admin.updateUserStatus(id, 'REJECTED');
    fetchData();
  };

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-[#f5f7f8] dark:bg-[#101722]">
        <AdminHeader />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
              </div>
            </div>
          ) : stats ? (
            <div className="space-y-8">
              {/* Stats Cards */}
              <section>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Platform Overview
                </h2>
                <AdminStatsCards stats={stats} />
              </section>

              {/* Pending Users */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Pending Approvals
                    {stats.users.pending > 0 && (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                        {stats.users.pending}
                      </span>
                    )}
                  </h2>
                </div>

                <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <UserTable
                    users={pendingUsers}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </RequireAdmin>
  );
}
