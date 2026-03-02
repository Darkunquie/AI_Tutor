'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading, user, hasActiveSubscription } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    // Redirect pending/rejected users to the pending page
    if (!isLoading && isAuthenticated && user && user.status !== 'APPROVED' && user.role !== 'ADMIN') {
      router.push('/pending');
    }
    // Redirect approved users without active subscription to subscription page
    if (!isLoading && isAuthenticated && user && user.role !== 'ADMIN' &&
        user.status === 'APPROVED' && !hasActiveSubscription) {
      router.push('/subscription');
    }
  }, [isAuthenticated, isLoading, user, hasActiveSubscription, router]);

  // Show loading state while checking authentication
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

  if (!isAuthenticated) {
    return null;
  }

  // Block non-approved, non-admin users
  if (user && user.status !== 'APPROVED' && user.role !== 'ADMIN') {
    return null;
  }

  // Block users without active subscription
  if (user && user.role !== 'ADMIN' && user.status === 'APPROVED' && !hasActiveSubscription) {
    return null;
  }

  return <>{children}</>;
}
