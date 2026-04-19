'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
}

const NAV = [
  { href: '/app', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '??';


  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F5F2EC] font-geist antialiased">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="sticky top-0 flex h-screen w-[240px] flex-col border-r border-[#2A2A2E] bg-[#17171A] px-6 py-8">
          <Link href="/app" className="flex items-center gap-2">
            <span className="font-serif-display text-[20px] tracking-tight">Talkivo</span>
            <span className="h-[6px] w-[6px] rounded-full bg-[#D4A373]" />
          </Link>

          <div className="mt-10 mb-3 text-[11px] uppercase tracking-[0.14em] text-[#6B665F]">
            Navigate
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    'group flex items-center gap-3 rounded-md px-2 py-2 text-[14px] transition-colors ' +
                    (active
                      ? 'text-[#F5F2EC]'
                      : 'text-[#9A948A] hover:bg-[#1E1E22] hover:text-[#F5F2EC]')
                  }
                >
                  <span
                    className={
                      'h-[5px] w-[5px] rounded-full transition-colors ' +
                      (active ? 'bg-[#D4A373]' : 'bg-transparent group-hover:bg-[#6B665F]')
                    }
                  />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                href="/admin"
                className={
                  'group mt-1 flex items-center gap-3 rounded-md px-2 py-2 text-[14px] transition-colors ' +
                  (pathname?.startsWith('/admin')
                    ? 'text-[#F5F2EC]'
                    : 'text-[#9A948A] hover:bg-[#1E1E22] hover:text-[#F5F2EC]')
                }
              >
                <span
                  className={
                    'h-[5px] w-[5px] rounded-full transition-colors ' +
                    (pathname?.startsWith('/admin') ? 'bg-[#D4A373]' : 'bg-transparent group-hover:bg-[#6B665F]')
                  }
                />
                Admin
              </Link>
            )}
          </nav>

          {/* Account cluster — bottom */}
          <div className="mt-auto border-t border-[#2A2A2E] pt-5">
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D4A373] text-[12px] font-medium text-[#0E0E10]">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-[#F5F2EC]">{user.name}</div>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                logout();
                router.replace('/login');
              }}
              className="mt-4 text-[12px] text-[#6B665F] transition-colors hover:text-[#B5564C]"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
