'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminHeader() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { href: '/admin/users', label: 'Users', icon: 'group' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#131315]/80 backdrop-blur-md border-b border-[#50453B]/15">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl text-[#D4A373] tracking-tight">Talkivo</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#9A948A] border-l border-[#50453B] pl-3">Admin</span>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-all duration-300 ${
                    isActive
                      ? 'bg-[#D4A373]/10 text-[#f2be8c] text-[11px] tracking-widest uppercase font-bold'
                      : 'text-[#D4C4B7] opacity-60 text-[11px] tracking-widest uppercase hover:text-[#f2be8c] hover:bg-[#201F21]'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded text-[11px] tracking-widest uppercase text-[#D4C4B7] opacity-60 hover:text-[#ffb4ab] hover:bg-[#ffb4ab]/5 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
