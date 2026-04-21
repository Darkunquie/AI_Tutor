import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { POSTS, getPost } from '@/content/posts';

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: {
      type: 'article',
      title: p.title,
      description: p.description,
      url: `https://talkivo.in/blog/${p.slug}`,
      publishedTime: p.date,
    },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.date,
    author: { '@type': 'Organization', name: 'Talkivo' },
    publisher: {
      '@type': 'Organization',
      name: 'Talkivo',
      logo: { '@type': 'ImageObject', url: 'https://talkivo.in/logo.png' },
    },
    mainEntityOfPage: `https://talkivo.in/blog/${p.slug}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://talkivo.in/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://talkivo.in/blog' },
      { '@type': 'ListItem', position: 3, name: p.title, item: `https://talkivo.in/blog/${p.slug}` },
    ],
  };

  const related = POSTS.filter((x) => x.slug !== p.slug).slice(0, 2);

  return (
    <MarketingShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <main className="mx-auto max-w-[760px] px-6 py-20 lg:px-10 lg:py-28">
        <nav className="mb-10 text-[13px] text-[#879299]">
          <Link href="/" className="hover:text-[#E6EEF8]">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[#E6EEF8]">Blog</Link>
        </nav>

        <article>
          <header>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-[#879299]">
              <time dateTime={p.date}>
                {new Date(p.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </time>
              <span>\u00B7</span>
              <span>{p.readMinutes} min read</span>
            </div>
            <h1 className="font-sora mt-4 text-[48px] leading-[1.08] tracking-[-0.02em] text-[#E6EEF8] lg:text-[56px]">
              {p.title}
            </h1>
            <p className="mt-6 text-[18px] leading-[1.6] text-[#BCC8CF]">{p.description}</p>
          </header>

          <div className="mt-16 space-y-6">
            {p.body.map((b, idx) => {
              if (b.type === 'h2') {
                return (
                  <h2 key={idx} className="font-sora mt-12 text-[32px] leading-[1.2] text-[#E6EEF8]">
                    {b.text}
                  </h2>
                );
              }
              if (b.type === 'h3') {
                return (
                  <h3 key={idx} className="font-sora mt-8 text-[22px] leading-[1.25] text-[#E6EEF8]">
                    {b.text}
                  </h3>
                );
              }
              if (b.type === 'li') {
                return (
                  <li key={idx} className="ml-6 list-disc text-[16px] leading-[1.7] text-[#C4BFB5]">
                    {b.text}
                  </li>
                );
              }
              if (b.type === 'cta') {
                return (
                  <div key={idx} className="mt-10">
                    <Link
                      href="/signup"
                      className="inline-block rounded-md bg-[#4FD1FF] px-6 py-[12px] text-[15px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF]"
                    >
                      {b.text}
                    </Link>
                  </div>
                );
              }
              return (
                <p key={idx} className="text-[17px] leading-[1.75] text-[#C4BFB5]">
                  {b.text}
                </p>
              );
            })}
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-24 border-t border-[#4FD1FF/20] pt-12">
            <h2 className="font-sora text-[24px] text-[#E6EEF8]">Keep reading</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="rounded-xl border border-[#4FD1FF/20] bg-[#121215] p-6 transition-colors hover:border-[#4FD1FF]/60"
                >
                  <h3 className="font-sora text-[18px] leading-[1.3] text-[#E6EEF8]">{r.title}</h3>
                  <p className="mt-3 text-[13px] leading-[1.55] text-[#BCC8CF] line-clamp-2">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </MarketingShell>
  );
}
