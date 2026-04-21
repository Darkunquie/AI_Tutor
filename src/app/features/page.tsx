import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MODES } from '@/content/modes';

export const metadata: Metadata = {
  title: 'Features — Five Modes for English Speaking Practice',
  description:
    'Five focused modes for English speaking practice: Free Talk, Role Play, Debate, Grammar Fix, and Pronunciation. Each tuned to a different way of getting fluent.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'Talkivo Features',
    description: 'Five modes for English speaking practice, all in one AI tutor.',
    url: 'https://talkivo.in/features',
  },
};

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <main className="relative z-10 mx-auto max-w-[1200px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#4FD1FF]">Features</div>
          <h1 className="font-sora text-[56px] leading-[1.05] tracking-[-0.02em] text-[#E6EEF8] lg:text-[72px]">
            Five modes. One patient tutor.
          </h1>
          <p className="mt-6 text-[18px] leading-[1.6] text-[#BCC8CF]">
            Each mode is tuned to a different way of getting fluent — unscripted conversation, scenario rehearsal, structured argument, written correction, and sound-level pronunciation work.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MODES.map((m, i) => (
            <Link
              key={m.slug}
              href={`/features/${m.slug}`}
              className="group rounded-2xl border border-[#4FD1FF]/20 bg-[#121215] p-8 transition-colors hover:border-[#4FD1FF]/60 hover:bg-[#141A22]"            >
              <div className="mb-4 text-[11px] tabular-nums text-[#879299]">0{i + 1}</div>
              <h2 className="font-sora text-[28px] text-[#E6EEF8]">{m.name}</h2>
              <p className="mt-3 font-sora italic text-[15px] leading-[1.45] text-[#BCC8CF]">{m.tagline}</p>
              <p className="mt-6 text-[14px] leading-[1.6] text-[#BCC8CF] line-clamp-3">{m.intro}</p>
              <div className="mt-8 text-[14px] text-[#4FD1FF] transition-transform group-hover:translate-x-1">Learn more →</div>
            </Link>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
