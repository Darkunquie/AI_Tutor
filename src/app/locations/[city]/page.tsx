import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { CITIES, getCity } from '@/content/cities';
import { MODES } from '@/content/modes';

export async function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const c = getCity(city);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/locations/${c.slug}` },
    openGraph: {
      title: c.metaTitle,
      description: c.metaDescription,
      url: `https://talkivo.in/locations/${c.slug}`,
    },
  };
}

export default async function CityPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const c = getCity(city);
  if (!c) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://talkivo.in/' },
      { '@type': 'ListItem', position: 2, name: 'Locations', item: 'https://talkivo.in/locations' },
      { '@type': 'ListItem', position: 3, name: c.name, item: `https://talkivo.in/locations/${c.slug}` },
    ],
  };

  const localSchema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: `Talkivo \u2014 English Speaking Practice in ${c.name}`,
    url: `https://talkivo.in/locations/${c.slug}`,
    areaServed: {
      '@type': 'City',
      name: c.name,
      containedInPlace: { '@type': 'AdministrativeArea', name: c.state },
    },
    description: c.metaDescription,
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localSchema) }} />
      <main className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
        <nav className="mb-10 text-[13px] text-[#879299]">
          <Link href="/" className="hover:text-[#E6EEF8]">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-[#BCC8CF]">{c.name}</span>
        </nav>

        <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#4FD1FF]">{c.state}</div>
        <h1 className="font-sora text-[52px] leading-[1.05] tracking-[-0.02em] text-[#E6EEF8] lg:text-[64px]">
          English Speaking Practice in {c.name}
        </h1>
        <p className="mt-8 max-w-[760px] text-[17px] leading-[1.65] text-[#BCC8CF]">{c.intro}</p>
        <p className="mt-5 max-w-[760px] text-[17px] leading-[1.65] text-[#BCC8CF]">{c.localAngle}</p>

        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-block rounded-md bg-[#4FD1FF] px-7 py-[14px] text-[17px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF]"
          >
            Start practising \u2014 free
          </Link>
          <p className="mt-3 text-[13px] text-[#879299]">No credit card \u00B7 3-day free trial</p>
        </div>

        <section className="mt-24">
          <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">
            Why Talkivo works for {c.name} professionals
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { h: 'Fits your schedule', b: `From morning commutes on ${c.name} metro to late-night prep after work, sessions are 5-15 minutes. You practise when you want, not when a class is scheduled.` },
              { h: 'Built for Indian English speakers', b: 'Pronunciation drills target the 18 sounds Indian speakers most commonly avoid. Corrections explain the Indian English grammar patterns that get reinforced at school.' },
              { h: 'Cheaper than a tutor, patient like a friend', b: 'A live tutor in India costs \u20B9500-\u20B92000 per hour and meets once a week. Talkivo is \u20B9499 per month, unlimited, and never tired.' },
            ].map((x) => (
              <div key={x.h} className="rounded-2xl border border-[#4FD1FF/20] bg-[#121215] p-6">
                <h3 className="font-sora text-[20px] leading-[1.2] text-[#E6EEF8]">{x.h}</h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-[#BCC8CF]">{x.b}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-24">
          <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">Five ways to practise</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {MODES.map((m) => (
              <Link
                key={m.slug}
                href={`/features/${m.slug}`}
                className="rounded-xl border border-[#4FD1FF/20] bg-[#121215] p-5 transition-colors hover:border-[#4FD1FF]/60"
              >
                <div className="text-[14px] font-medium text-[#E6EEF8]">{m.name}</div>
                <div className="mt-2 text-[12px] leading-[1.5] text-[#879299] line-clamp-3">{m.tagline}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-24 rounded-2xl border border-[#4FD1FF/20] bg-[#141A22] p-10 lg:p-14">
          <h2 className="font-sora text-[28px] leading-[1.15] text-[#E6EEF8]">
            Who is Talkivo for in {c.name}?
          </h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {[
              'Software engineers and PMs preparing for client-facing roles',
              'BPO and call-center trainees working toward neutral accent',
              'Students preparing for IELTS, TOEFL, or study-abroad interviews',
              'Founders and sales leaders pitching to international clients',
              'UPSC and civil services aspirants building interview English',
              'Working professionals who want to sound sharper in meetings',
            ].map((x) => (
              <li key={x} className="flex items-start gap-3 text-[14px] leading-[1.6] text-[#BCC8CF]">
                <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-[#4FD1FF]" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24 text-center">
          <h2 className="font-sora text-[36px] leading-[1.1] text-[#E6EEF8]">
            Ready to practise in {c.name}?
          </h2>
          <p className="mt-4 text-[15px] text-[#BCC8CF]">Three-day free trial. No credit card.</p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-[#4FD1FF] px-7 py-[14px] text-[17px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF]"
          >
            Start free
          </Link>
        </section>

        <section className="mt-24 border-t border-[#4FD1FF/20] pt-12">
          <h2 className="font-sora text-[24px] text-[#E6EEF8]">Other cities</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {CITIES.filter((x) => x.slug !== c.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/locations/${x.slug}`}
                className="rounded-full border border-[#4FD1FF/20] bg-[#121215] px-4 py-2 text-[13px] text-[#BCC8CF] transition-colors hover:border-[#4FD1FF]/60 hover:text-[#E6EEF8]"
              >
                {x.name}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
