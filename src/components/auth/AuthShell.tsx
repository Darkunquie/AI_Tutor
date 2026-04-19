'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

const COSMOS_IMAGE = '/earth-cosmos.jpg';

export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0E0E10] text-[#F5F2EC] font-geist antialiased">
      {/* Full-screen cosmos background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${COSMOS_IMAGE})` }}
      />
      {/* Tonal darkening so form stays legible */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 72% 55%, rgba(14,14,16,0.25) 0%, rgba(14,14,16,0.6) 60%, rgba(14,14,16,0.88) 100%)',
        }}
      />
      <div aria-hidden className="absolute inset-0 ring-1 ring-inset ring-black/30" />

      {/* Top bar — brand */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif-display text-[22px] tracking-tight text-white">Talkivo</span>
          <span className="h-[7px] w-[7px] rounded-full bg-[#D4A373]" />
        </Link>
        <Link
          href="/"
          className="rounded-full bg-white/10 px-4 py-2 text-[13px] text-white/80 ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-white/15 hover:text-white"
        >
          ← Back to home
        </Link>
      </header>

      {/* Centered form — frosted glass card over the cosmos */}
      <main className="relative z-10 flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-[480px] rounded-2xl bg-[#0E0E10]/55 p-8 ring-1 ring-white/10 backdrop-blur-xl sm:p-10">
          <div className="mb-5 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
            {eyebrow}
          </div>
          <h1 className="font-serif-display text-[36px] leading-[1.1] tracking-[-0.02em] text-white sm:text-[40px]">
            {title}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.55] text-white/70">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 border-t border-white/10 pt-5 text-[14px] text-white/70">
            {footer}
          </div>
        </div>
      </main>

      {/* Footer — editorial quote + copyright */}
      <footer className="relative z-10 mx-auto hidden max-w-[1400px] px-6 pb-6 sm:block sm:px-10">
        <div className="flex items-end justify-between gap-6">
          <blockquote className="max-w-[360px] text-[13px] leading-[1.5] text-white/55">
            <span className="font-serif-display text-[#D4A373]">&ldquo;</span>{' '}
            <span className="font-serif-display italic">Speak English like you think — not like you rehearse.</span>
          </blockquote>
          <div className="flex items-center gap-6 text-[12px] text-white/45">
            <span>© {new Date().getFullYear()} Talkivo</span>
            <span className="hidden md:inline">Made in India · English worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
