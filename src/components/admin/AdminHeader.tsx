'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'health_and_safety' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-8 h-20 bg-[#0E0E10]/70 backdrop-blur-xl border-b border-[#50453B]/30 shadow-[0_20px_50px_rgba(212,163,115,0.05)]">
      <div className="flex items-center gap-8">
        <div className="flex flex-col">
          <span className="text-2xl font-serif italic tracking-tight text-[#D4A373]">The Scholar</span>
          <span className="text-[10px] uppercase tracking-widest text-[#9A948A]">Admin Command</span>
        </div>
        <nav className="hidden md:flex gap-6 ml-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActive
                    ? 'text-[#D4A373] border-b-2 border-[#D4A373] pb-1 font-serif'
                    : 'text-[#9A948A] hover:text-[#E5E1E4]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={logout}
          className="px-4 py-2 rounded-full bg-[#1B1B1D] border border-[#50453B]/20 text-[#9A948A] hover:text-[#ffb4ab] transition-colors"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
        </button>
        <div className="h-10 w-10 rounded-full bg-[#353437] flex items-center justify-center text-[#D4A373] text-xs font-bold border border-[#D4A373]/30">
          {initials}
        </div>
      </div>
    </header>
  );
}
