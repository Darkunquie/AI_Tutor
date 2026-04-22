'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const NAV = [
  { href: '/app', label: 'Console', icon: 'terminal' },
  { href: '/dashboard', label: 'Dashboard', icon: 'analytics' },
  { href: '/review', label: 'Vocabulary', icon: 'dictionary' },
  { href: '/achievements', label: 'Achievements', icon: 'military_tech' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '??';

  const isActive = (href: string) =>
    pathname === href || (href !== '/app' && pathname?.startsWith(href));

  return (
    <div className="min-h-screen bg-[#0d131b] text-[#e6eef8] antialiased">
      {/* Grid dot background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(79, 209, 255, 0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── Sidebar ── */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col justify-between overflow-y-auto border-r border-[#3d484e]/50 bg-[#0a0f15]/95 backdrop-blur-sm px-5 py-6">
        <div className="flex flex-col">
          {/* Wordmark */}
          <div className="border-b border-[#3d484e]/50 pb-5 mb-6">
            <Link href="/app" className="text-xl font-semibold text-[#e6eef8]">
              Talkivo
            </Link>
            <div className="mt-1 text-[11px] text-[#879299]">
              Operator Console
            </div>
          </div>

          {/* Nav */}
          <nav className="space-y-0.5">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded px-3 py-2.5 text-[13px] transition-colors ${
                    active
                      ? 'bg-[#4fd1ff]/[0.08] font-medium text-[#4fd1ff]'
                      : 'text-[#879299] hover:bg-[#1f242d] hover:text-[#bcc8cf]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-3 rounded px-3 py-2.5 text-[13px] transition-colors ${
                  pathname?.startsWith('/admin')
                    ? 'bg-[#4fd1ff]/[0.08] font-medium text-[#4fd1ff]'
                    : 'text-[#879299] hover:bg-[#1f242d] hover:text-[#bcc8cf]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Bottom: Status + User */}
        <div className="border-t border-[#3d484e]/50 pt-4">
          <div className="flex items-center gap-2 py-2 text-[12px] text-[#7a9a6b]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#7a9a6b]" />
            <span>System Active</span>
          </div>
          {user && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-[#1f242d] border border-[#3d484e] text-[11px] font-semibold text-[#4fd1ff]">
                {initials}
              </div>
              <div>
                <div className="text-[13px] font-medium text-[#e6eef8]">
                  {user.name}
                </div>
                <div className="text-[11px] text-[#879299]">
                  {user.role === 'ADMIN' ? 'Admin' : 'Operator'}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              router.replace('/login');
            }}
            className="mt-3 text-[12px] text-[#879299] transition-colors hover:text-[#ffb4ab]"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Live badges (top-right) ── */}
      <div className="fixed right-4 top-4 z-[100] flex gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-[#3d484e]/50 bg-[#141a22]/90 px-3 py-1 text-[11px] text-[#879299] backdrop-blur-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4fd1ff]" />
          Live
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="relative z-10 ml-[240px] min-w-0">{children}</main>
    </div>
  );
}
