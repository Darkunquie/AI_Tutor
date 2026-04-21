import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { MODES, getMode } from '@/content/modes';

export async function generateStaticParams() {
  return MODES.map((m) => ({ mode: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ mode: string }>;
}): Promise<Metadata> {
  const { mode } = await params;
  const m = getMode(mode);
  if (!m) return {};
  return {
    title: m.metaTitle,
    description: m.metaDescription,
    alternates: { canonical: `/features/${m.slug}` },
    openGraph: {
      title: m.metaTitle,
      description: m.metaDescription,
      url: `https://talkivo.in/features/${m.slug}`,
    },
  };
}

export default async function ModePage({
  params,
}: {
  params: Promise<{ mode: string }>;
}) {
  const { mode } = await params;
  const m = getMode(mode);
  if (!m) notFound();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: m.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://talkivo.in/' },
      { '@type': 'ListItem', position: 2, name: 'Features', item: 'https://talkivo.in/features' },
      { '@type': 'ListItem', position: 3, name: m.name, item: `https://talkivo.in/features/${m.slug}` },
    ],
  };

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main className="relative z-10 mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
        <nav className="mb-10 text-[13px] text-[#879299]">
          <Link href="/" className="hover:text-[#E6EEF8]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/features" className="hover:text-[#E6EEF8]">Features</Link>
          <span className="mx-2">/</span>
          <span className="text-[#BCC8CF]">{m.name}</span>
        </nav>

        <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#4FD1FF]">{m.name}</div>
        <h1 className="font-sora text-[56px] leading-[1.05] tracking-[-0.02em] text-[#E6EEF8] lg:text-[72px]">
          {m.hero}
        </h1>
        <p className="mt-8 max-w-[760px] text-[18px] leading-[1.6] text-[#BCC8CF]">{m.intro}</p>

        <div className="mt-10">
          <Link
            href="/signup"
            className="inline-block rounded-md bg-[#4FD1FF] px-7 py-[14px] text-[17px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF]"
          >
            Try {m.name} free
          </Link>
        </div>

        <section className="mt-24 space-y-16">
          {m.sections.map((s) => (
            <div key={s.h} className="max-w-[760px]">
              <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">{s.h}</h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-[#BCC8CF]">{s.b}</p>
            </div>
          ))}
        </section>

        <section className="mt-24 rounded-2xl border border-[#4FD1FF/20] bg-[#141A22] p-10 lg:p-14">
          <h2 className="font-sora text-[28px] leading-[1.15] text-[#E6EEF8]">Who it\u2019s for</h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-2">
            {m.useCases.map((u) => (
              <li key={u} className="flex items-start gap-3 text-[15px] text-[#BCC8CF]">
                <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-[#4FD1FF]" />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-24 max-w-[760px]">
          <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">Common questions</h2>
          <dl className="mt-8 space-y-6">
            {m.faqs.map((f) => (
              <div key={f.q}>
                <dt className="text-[16px] font-medium text-[#E6EEF8]">{f.q}</dt>
                <dd className="mt-2 text-[14px] leading-[1.6] text-[#BCC8CF]">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-24">
          <h2 className="font-sora text-[32px] text-[#E6EEF8]">Explore other modes</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {MODES.filter((x) => x.slug !== m.slug).map((x) => (
              <Link
                key={x.slug}
                href={`/features/${x.slug}`}
                className="rounded-xl border border-[#4FD1FF/20] bg-[#121215] p-5 transition-colors hover:border-[#4FD1FF]/60"
              >
                <div className="text-[13px] text-[#E6EEF8]">{x.name}</div>
                <div className="mt-1 text-[12px] text-[#879299] line-clamp-2">{x.tagline}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-24 text-center">
          <h2 className="font-sora text-[40px] leading-[1.1] text-[#E6EEF8]">
            Start with {m.name} today
          </h2>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-[#4FD1FF] px-7 py-[14px] text-[17px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF]"
          >
            Try it free
          </Link>
        </section>
      </main>
    </MarketingShell>
  );
}
