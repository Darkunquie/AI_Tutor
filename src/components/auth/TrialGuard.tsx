'use client';
// TrialGuard — isolated trial enforcement for the frontend.
// To fully remove trial enforcement: delete this file and remove <TrialGuard> from layout.tsx.

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Pages that are always accessible regardless of subscription status.
const ALLOWED_PATHS = ['/subscription', '/login', '/signup', '/pending'];

export default function TrialGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin, isPending, hasActiveSubscription } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) { return; }
    if (!isAuthenticated) { return; }      // not logged in — other guards handle this
    if (isAdmin) { return; }               // admins always have access
    if (isPending) { return; }             // pending — already redirected by RequireAuth
    if (ALLOWED_PATHS.some(p => pathname.startsWith(p))) { return; } // already on allowed page

    if (!hasActiveSubscription) {
      router.replace('/subscription');
    }
  }, [isLoading, isAuthenticated, isAdmin, isPending, hasActiveSubscription, pathname, router]);

  return <>{children}</>;
}
