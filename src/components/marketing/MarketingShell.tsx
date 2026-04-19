import Link from 'next/link';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F5F2EC] font-geist antialiased">
      <header className="sticky top-0 z-40 border-b border-[#2A2A2E] bg-[#0E0E10]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1720px] items-center justify-between px-10 lg:px-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif-display text-[20px] tracking-tight">Talkivo</span>
            <span className="h-[6px] w-[6px] rounded-full bg-[#D4A373]" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/features" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">Features</Link>
            <Link href="/pricing" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">Pricing</Link>
            <Link href="/blog" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">Blog</Link>
            <Link href="/about" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">About</Link>
          </nav>

          <div className="flex items-center gap-5">
            <Link href="/login" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">Sign in</Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#D4A373] px-4 py-2 text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
            >
              Start speaking
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-[#2A2A2E]">
        <div className="mx-auto max-w-[1720px] px-10 lg:px-16 py-12">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="font-serif-display text-[20px] tracking-tight">Talkivo</span>
                <span className="h-[6px] w-[6px] rounded-full bg-[#D4A373]" />
              </Link>
              <p className="mt-3 text-[13px] leading-[1.55] text-[#6B665F]">
                A calm, patient AI English tutor for ambitious professionals.
              </p>
            </div>
            <div className="col-span-6 md:col-span-2">
              <div className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">Product</div>
              <ul className="space-y-2 text-[13px] text-[#9A948A]">
                <li><Link href="/features" className="hover:text-[#F5F2EC]">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-[#F5F2EC]">Pricing</Link></li>
                <li><Link href="/features/free-talk" className="hover:text-[#F5F2EC]">Free Talk</Link></li>
                <li><Link href="/features/role-play" className="hover:text-[#F5F2EC]">Role Play</Link></li>
                <li><Link href="/features/pronunciation" className="hover:text-[#F5F2EC]">Pronunciation</Link></li>
              </ul>
            </div>
            <div className="col-span-6 md:col-span-2">
              <div className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">Resources</div>
              <ul className="space-y-2 text-[13px] text-[#9A948A]">
                <li><Link href="/blog" className="hover:text-[#F5F2EC]">Blog</Link></li>
                <li><Link href="/locations/hyderabad" className="hover:text-[#F5F2EC]">Hyderabad</Link></li>
                <li><Link href="/locations/bangalore" className="hover:text-[#F5F2EC]">Bangalore</Link></li>
                <li><Link href="/locations/delhi" className="hover:text-[#F5F2EC]">Delhi</Link></li>
              </ul>
            </div>
            <div className="col-span-6 md:col-span-2">
              <div className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">Company</div>
              <ul className="space-y-2 text-[13px] text-[#9A948A]">
                <li><Link href="/about" className="hover:text-[#F5F2EC]">About</Link></li>
                <li><span className="text-[#6B665F]">Support</span></li>
                <li><span className="text-[#6B665F]">Privacy</span></li>
                <li><span className="text-[#6B665F]">Terms</span></li>
              </ul>
            </div>
            <div className="col-span-6 md:col-span-2">
              <div className="mb-3 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">Get started</div>
              <Link
                href="/signup"
                className="inline-block rounded-md bg-[#D4A373] px-4 py-2 text-[13px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
              >
                Start free →
              </Link>
            </div>
          </div>
          <div className="mt-10 flex items-center justify-between border-t border-[#2A2A2E] pt-5 text-[12px] text-[#6B665F]">
            <span>© {new Date().getFullYear()} Talkivo</span>
            <span>Made in India · English worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
