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
          <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#4FD1FF]">Locations</div>
          <h1 className="font-sora text-[56px] leading-[1.05] tracking-[-0.02em] text-[#E6EEF8] lg:text-[72px]">
            English speaking practice, every Indian city.
          </h1>
          <p className="mt-6 text-[18px] leading-[1.6] text-[#BCC8CF]">
            Talkivo runs online \u2014 wherever you are in India, you can practice English speaking from your phone. Pages tailored to major cities below.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CITIES.map((c) => (
            <Link
              key={c.slug}
              href={`/locations/${c.slug}`}
              className="group rounded-2xl border border-[#4FD1FF/20] bg-[#121215] p-8 transition-colors hover:border-[#4FD1FF]/60 hover:bg-[#141A22]"
            >
              <div className="text-[11px] uppercase tracking-[0.12em] text-[#4FD1FF]">{c.state}</div>
              <h2 className="font-sora mt-3 text-[28px] text-[#E6EEF8]">{c.name}</h2>
              <p className="mt-4 text-[14px] leading-[1.65] text-[#BCC8CF] line-clamp-3">{c.intro}</p>
              <div className="mt-6 text-[14px] text-[#4FD1FF] transition-transform group-hover:translate-x-1">Learn more \u2192</div>
            </Link>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
