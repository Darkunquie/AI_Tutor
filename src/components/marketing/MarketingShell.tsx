import Link from 'next/link';
import { Mail } from 'lucide-react';
import { GridBackground } from '@/components/ui/grid-background';
import { Footer } from '@/components/ui/modem-animated-footer';

export function MarketingShell({
  children,
  showBackground = true,
}: {
  children: React.ReactNode;
  showBackground?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#0D131B] text-[#E6EEF8] antialiased">
      {showBackground && <GridBackground />}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0D131B]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4FD1FF] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4FD1FF]" />
            </span>
            <span className="font-sora text-[19px] font-bold tracking-tight text-[#E6EEF8]">
              Talkivo
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { href: '/features', label: 'Features' },
              { href: '/blog', label: 'Blog' },
              { href: '/locations', label: 'Locations' },
              { href: '/about', label: 'About' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 text-[14px] font-medium text-[#E6EEF8]/80 transition-colors hover:bg-white/5 hover:text-[#E6EEF8]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="hidden rounded-md px-3 py-2 text-[14px] font-medium text-[#E6EEF8]/80 transition-colors hover:text-[#E6EEF8] sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#4FD1FF] px-4 py-2 text-[14px] font-semibold text-[#0D131B] transition-all hover:bg-[#4FD1FF]/90 hover:shadow-[0_0_24px_rgba(79,209,255,0.35)]"
            >
              Get started
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <Footer
        className="relative z-10"
        brandName="TALKIVO"
        brandDescription="An instrument for speaking. High-fidelity linguistic calibration for non-native professionals."
        socialLinks={[
          { icon: <Mail className="w-6 h-6" />, href: 'mailto:hello@talkivo.in', label: 'Email' },
        ]}
        navLinks={[
          { label: 'Features', href: '/features' },
          { label: 'Blog', href: '/blog' },
          { label: 'Locations', href: '/locations' },
          { label: 'About', href: '/about' },
          { label: 'Sign in', href: '/login' },
        ]}
      />
    </div>
  );
}
