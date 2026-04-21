'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { GridBackground } from '@/components/ui/grid-background';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0D131B] text-[#E6EEF8] antialiased grid-bg-40">
      <GridBackground />
      {/* Faint hairline grid overlay */}
      <div className="grid-bg-overlay" />

      {/* Top bar — brand */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="font-sora text-[20px] font-bold tracking-[0.08em] text-[#4FD1FF]">TALKIVO</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#4FD1FF] hud-dot-pulse" />
          <span className="hidden sm:inline font-jetbrains-mono text-[10px] tracking-widest text-[#4FD1FF]/60">[ LIVE ]</span>
        </Link>
        <Link
          href="/"
          className="font-jetbrains-mono text-[11px] tracking-[0.15em] uppercase text-[#E6EEF8]/50 transition-colors hover:text-[#4FD1FF]"
        >
          [ ← RETURN ]
        </Link>
      </header>

      {/* Centered auth rack */}
      <main className="relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[480px] relative">
          {/* Corner ticks */}
          <div className="absolute -top-1 -left-1 w-4 h-4 corner-tick-tl" />
          <div className="absolute -top-1 -right-1 w-4 h-4 corner-tick-tr" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 corner-tick-bl" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 corner-tick-br" />

          <div className="bg-[#141A22] border-[0.5px] border-[#4FD1FF]/20 p-8 sm:p-10">
            <div className="module-header mb-8">UNIT: AUTH // SECURE_CHANNEL</div>
            <div className="mb-5 font-jetbrains-mono text-[10px] uppercase tracking-[0.2em] text-[#4FD1FF]">
              // {eyebrow}
            </div>
            <h1 className="font-sora text-[32px] leading-[1.1] tracking-[-0.02em] text-[#E6EEF8] sm:text-[36px] font-bold">
              {title}
            </h1>
            <p className="mt-4 text-[14px] leading-[1.6] text-[#BCC8CF]">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-8 border-t-[0.5px] border-[#4FD1FF]/20 pt-5 text-[13px] text-[#BCC8CF]">
              {footer}
            </div>
          </div>
        </div>
      </main>

      {/* Footer status line */}
      <footer className="relative z-10 mx-auto hidden max-w-[1400px] px-6 pb-6 sm:block sm:px-10">
        <div className="flex items-end justify-between gap-6">
          <div className="inline-flex items-center gap-2 border-[0.5px] border-[#4FD1FF]/20 bg-[#1F242D] px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4FD1FF] hud-dot-pulse" />
            <span className="font-jetbrains-mono text-[10px] tracking-[0.15em] uppercase text-[#4FD1FF]">SYSTEM_OPTIMAL · ENCRYPTED</span>
          </div>
          <div className="flex items-center gap-6 font-jetbrains-mono text-[10px] tracking-[0.2em] uppercase text-[#879299]">
            <span>© {new Date().getFullYear()} TALKIVO_CORE</span>
            <span className="hidden md:inline">NODE: HYD-01</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
