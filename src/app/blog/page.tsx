import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { POSTS } from '@/content/posts';

export const metadata: Metadata = {
  title: 'Blog — Practical English Speaking Advice',
  description:
    'Practical English speaking guides — fluency habits, IELTS prep, pronunciation drills, interview English, and more. Written for serious learners.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Talkivo Blog',
    description: 'Practical English speaking advice for serious learners.',
    url: 'https://talkivo.in/blog',
  },
};

export default function BlogIndex() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[760px] text-center">
          <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#4FD1FF]">Blog</div>
          <h1 className="font-sora text-[56px] leading-[1.05] tracking-[-0.02em] text-[#E6EEF8] lg:text-[72px]">
            Practical English, written plainly.
          </h1>
          <p className="mt-6 text-[18px] leading-[1.6] text-[#BCC8CF]">
            Fluency habits, IELTS strategy, pronunciation drills, interview English. No filler.
          </p>
        </div>

        <div className="mt-20 grid gap-10 md:grid-cols-2">
          {POSTS.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group rounded-2xl border border-[#4FD1FF]/20 bg-[#121215] p-8 transition-colors hover:border-[#4FD1FF]/60 hover:bg-[#141A22]"
            >
              <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.12em] text-[#879299]">
                <time dateTime={p.date}>{new Date(p.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
                <span>\u00B7</span>
                <span>{p.readMinutes} min read</span>
              </div>
              <h2 className="font-sora mt-4 text-[28px] leading-[1.2] text-[#E6EEF8]">{p.title}</h2>
              <p className="mt-4 text-[14px] leading-[1.65] text-[#BCC8CF]">{p.description}</p>
              <div className="mt-6 text-[14px] text-[#4FD1FF] transition-transform group-hover:translate-x-1">Read \u2192</div>
            </Link>
          ))}
        </div>
      </main>
    </MarketingShell>
  );
}
