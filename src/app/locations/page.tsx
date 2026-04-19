import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { CITIES } from '@/content/cities';

export const metadata: Metadata = {
  title: 'English Speaking Classes Across India — Talkivo',
  description:
    'Practice spoken English online from any city in India with Talkivo. AI tutor available in Hyderabad, Bangalore, Delhi, Mumbai, Chennai, Pune, Kolkata and beyond.',
  alternates: { canonical: '/locations' },
  openGraph: {
    title: 'English Speaking Classes Across India',
    description: 'AI English tutor for professionals in every Indian city.',
    url: 'https://talkivo.in/locations',
  },
};

export default function LocationsIndex() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">Locations</div>
          <h1 className="font-serif-display text-[56px] leading-[1.05] tracking-[-0.02em] text-[#F5F2EC] lg:text-[72px]">
            English speaking practice, every Indian city.
          </h1>
          <p className="mt-6 text-[18px] leading-[1.6] text-[#9A948A]">
            Talkivo runs online \u2014 wherever you are in India, you can practice English speaking from your phone. Pages tailored to major cities below.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/locations/${c.slug}`}
              className="group rounded-2xl border border-[#2A2A2E] bg-[#121215] p-8 transition-colors hover:border-[#D4A373]/60 hover:bg-[#17171A]"
            >
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">{c.state}</div>
              <h2 className="font-serif-display mt-3 text-[28px] text-[#F5F2EC]">{c.name}</h2>
              <p className="mt-4 text-[14px] leading-[1.65] text-[#9A948A] line-clamp-3">{c.intro}</p>
              <div className="mt-6 text-[14px] text-[#D4A373] transition-transform group-hover:translate-x-1">Learn more \u2192</div>
            </Link>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
