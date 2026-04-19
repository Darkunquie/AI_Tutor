'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Waveform } from '@/components/landing/Waveform';
import { GlowCard } from '@/components/ui/spotlight-card';
import { TestimonialSlider } from '@/components/ui/testimonial-slider-1';

const MODES = [
  { name: 'Free Talk', tagline: 'Pick any topic. Just talk.' },
  { name: 'Role Play', tagline: 'Rehearse the conversation before it happens.' },
  { name: 'Debate', tagline: 'Defend a position. Sharpen your thinking.' },
  { name: 'Grammar Fix', tagline: 'Bring a paragraph. Leave it better.' },
  { name: 'Pronunciation', tagline: 'The sounds you avoid, practised with care.' },
];

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/app');
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F5F2EC] font-geist antialiased">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-[#2A2A2E] bg-[#0E0E10]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] max-w-[1720px] items-center justify-between px-10 lg:px-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-serif-display text-[20px] tracking-tight">Talkivo</span>
            <span className="h-[6px] w-[6px] rounded-full bg-[#D4A373]" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#modes" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">Modes</a>
            <a href="#why" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">Why Talkivo</a>
            <a href="#how" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">How it works</a>
          </nav>

          <div className="flex items-center gap-5">
            <Link href="/login" className="text-[14px] text-[#9A948A] transition-colors hover:text-[#F5F2EC]">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-[#D4A373] px-4 py-2 text-[14px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
            >
              Start speaking
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Custom waveform — amber ribbon behind hero text */}
        <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-0 h-[820px]">
          <Waveform />
          {/* Left fade — keeps headline legible */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(14,14,16,0.72) 0%, rgba(14,14,16,0.35) 35%, rgba(14,14,16,0.05) 65%, rgba(14,14,16,0) 100%)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-[1720px] px-10 lg:px-16 pt-[128px] pb-[96px]">
        <div className="mb-8 text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">
          AI English Tutor · Beta
        </div>

        <h1 className="font-serif-display max-w-[1050px] text-[88px] leading-[1.02] tracking-[-0.03em] text-[#F5F2EC]">
          Speak English like you <em className="italic">think</em> — not like you <em className="italic">rehearse</em>.
        </h1>

        <p className="mt-10 max-w-[580px] text-[18px] leading-[1.55] text-[#9A948A]">
          Talkivo is a calm, patient AI tutor that listens, corrects, and helps you find your voice. Built for professionals who refuse to sound uncertain in the room that matters.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-md bg-[#D4A373] px-7 py-[14px] text-[17px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
          >
            Begin your first session
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-[#2A2A2E] px-6 py-[13px] text-[15px] text-[#F5F2EC] transition-colors hover:border-[#3A3A3F] hover:bg-[#17171A]"
          >
            <svg width="11" height="12" viewBox="0 0 11 12" fill="none" aria-hidden>
              <path d="M10 5.13397C10.6667 5.51887 10.6667 6.48113 10 6.86603L1.75 11.6292C1.08333 12.0141 0.25 11.5329 0.25 10.7631L0.25 1.23686C0.25 0.467059 1.08333 -0.0140659 1.75 0.37083L10 5.13397Z" fill="#F5F2EC"/>
            </svg>
            Watch a 90-second tour
          </button>
        </div>

        <p className="mt-8 text-[13px] text-[#6B665F]">
          7-day free trial · No credit card · Cancel anytime
        </p>

        {/* Hero demo panel */}
        <div className="mt-[72px] rounded-2xl border border-[#2A2A2E] bg-[#17171A] p-10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.3)]">
          {/* Session header */}
          <div className="flex items-center justify-between border-b border-[#2A2A2E] pb-5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A373] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D4A373]" />
              </span>
              <span className="text-[13px] text-[#D4A373] tabular-nums">Recording · 02:14</span>
            </div>
            <div className="text-[12px] uppercase tracking-[0.1em] text-[#6B665F]">
              Free Talk · Intermediate
            </div>
          </div>

          {/* Messages */}
          <div className="relative grid grid-cols-12 gap-6 pt-8">
            <div className="col-span-8 space-y-8">
              {/* AI */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">
                  <span className="h-1 w-1 rounded-full bg-[#D4A373]" />
                  Tutor
                </div>
                <p className="font-serif-display text-[19px] leading-[1.5] text-[#F5F2EC]">
                  What&apos;s something you&apos;re working on this quarter?
                </p>
              </div>

              {/* User */}
              <div>
                <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">You</div>
                <p className="text-[17px] leading-[1.55] text-[#F5F2EC]">
                  <span className="border-b border-[#D4A373]/60">I am</span> working on launching a new product line for mid-market customers.
                </p>
              </div>

              {/* AI follow-up */}
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">
                  <span className="h-1 w-1 rounded-full bg-[#D4A373]" />
                  Tutor
                </div>
                <p className="font-serif-display text-[19px] leading-[1.5] text-[#F5F2EC]">
                  Nice — tell me more about who the mid-market customer is.
                </p>
              </div>
            </div>

            {/* Marginalia */}
            <div className="col-span-4 pt-1">
              <div className="mt-[88px] border-l border-[#D4A373] pl-4">
                <p className="font-serif-display italic text-[13px] leading-[1.5] text-[#9A948A]">
                  noticed: drop &ldquo;I am&rdquo; → use contraction <span className="text-[#F5F2EC]">&ldquo;I&rsquo;m&rdquo;</span> for natural rhythm.
                </p>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Three-column feature strip */}
      <section id="how" className="mx-auto max-w-[1720px] border-t border-[#2A2A2E] px-10 lg:px-16 py-[96px]">
        <div className="mb-12 text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">
          What makes it different
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#2A2A2E]">
          {[
            {
              h: 'Listens first',
              b: 'It doesn\u2019t interrupt. It hears your whole thought \u2014 grammar, hesitation, filler \u2014 and responds like a good tutor should.',
            },
            {
              h: 'Corrects with reason',
              b: 'Every correction comes with why. Not a red line. A note in the margin, like a teacher you\u2019d actually want to work with.',
            },
            {
              h: 'Remembers you',
              b: 'Over time, Talkivo learns the mistakes that haunt you \u2014 the ones you keep making \u2014 and quietly works them out of your speech.',
            },
          ].map((c, i) => (
            <div key={c.h} className={i === 0 ? 'pr-10' : i === 2 ? 'pl-10' : 'px-10'}>
              <h3 className="font-serif-display mb-4 text-[22px] leading-tight text-[#F5F2EC]">{c.h}</h3>
              <p className="text-[14px] leading-[1.6] text-[#9A948A]">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modes */}
      <section id="modes" className="mx-auto max-w-[1720px] border-t border-[#2A2A2E] px-10 lg:px-16 py-[128px]">
        <div className="mb-4 text-center text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">
          Five ways to practise
        </div>
        <h2 className="font-serif-display mx-auto mb-4 max-w-[700px] text-center text-[48px] leading-[1.08] tracking-[-0.02em] text-[#F5F2EC]">
          Five ways to practise.
        </h2>
        <p className="mb-16 text-center text-[15px] text-[#9A948A]">
          Pick a mode. Pick a level. Start speaking in under a minute.
        </p>

        <div className="grid grid-cols-5 gap-4">
          {MODES.map((m, i) => (
            <GlowCard
              key={m.name}
              customSize
              glowColor="orange"
              className="group p-6"
            >
              <div>
                <div className="mb-4 text-[11px] tabular-nums text-[#6B665F]">0{i + 1}</div>
                <h4 className="font-geist mb-3 text-[16px] font-medium text-[#F5F2EC]">{m.name}</h4>
                <p className="font-serif-display text-[15px] italic leading-[1.45] text-[#9A948A]">
                  {m.tagline}
                </p>
              </div>
              <div className="mt-8 text-[14px] text-[#D4A373] opacity-0 transition-opacity group-hover:opacity-100">
                →
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* Why Talkivo — GlowCards */}
      <section id="why" className="mx-auto max-w-[1720px] border-t border-[#2A2A2E] px-10 lg:px-16 py-[128px]">
        <div className="mb-4 text-center text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">
          Why Talkivo
        </div>
        <h2 className="font-serif-display mx-auto mb-4 max-w-[720px] text-center text-[48px] leading-[1.08] tracking-[-0.02em] text-[#F5F2EC]">
          Built for the room that matters.
        </h2>
        <p className="mx-auto mb-16 max-w-[560px] text-center text-[15px] text-[#9A948A]">
          Three quiet promises we make to every learner who shows up to practise.
        </p>

        <div className="flex flex-wrap items-stretch justify-center gap-8">
          <GlowCard glowColor="orange" customSize width={320} height={400} className="flex flex-col justify-between">
            <div>
              <div className="mb-4 text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">01 · Calm</div>
              <h3 className="font-serif-display text-[26px] leading-[1.15] text-[#F5F2EC]">
                No judgement. Ever.
              </h3>
            </div>
            <p className="text-[14px] leading-[1.6] text-[#9A948A]">
              Stumble, restart, pause — Talkivo waits. The pressure of being corrected mid-sentence is gone.
            </p>
          </GlowCard>

          <GlowCard glowColor="purple" customSize width={320} height={400} className="flex flex-col justify-between">
            <div>
              <div className="mb-4 text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">02 · Honest</div>
              <h3 className="font-serif-display text-[26px] leading-[1.15] text-[#F5F2EC]">
                Every correction has a reason.
              </h3>
            </div>
            <p className="text-[14px] leading-[1.6] text-[#9A948A]">
              No vague &ldquo;good job.&rdquo; You&apos;ll know exactly what shifted, and why it sounds more natural.
            </p>
          </GlowCard>

          <GlowCard glowColor="blue" customSize width={320} height={400} className="flex flex-col justify-between">
            <div>
              <div className="mb-4 text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">03 · Yours</div>
              <h3 className="font-serif-display text-[26px] leading-[1.15] text-[#F5F2EC]">
                It remembers your patterns.
              </h3>
            </div>
            <p className="text-[14px] leading-[1.6] text-[#9A948A]">
              The mistakes you keep making are the ones Talkivo will quietly help you retire — over weeks, not hours.
            </p>
          </GlowCard>
        </div>

        <div
          className="relative mt-24 overflow-hidden rounded-2xl border border-[#0B2A2E] px-10 py-14 lg:px-16 lg:py-16"
          style={{
            backgroundImage:
              'radial-gradient(120% 140% at 85% 10%, rgba(45,212,191,0.25) 0%, rgba(13,148,136,0.18) 28%, rgba(6,78,87,0.85) 60%, #031B1F 100%), radial-gradient(80% 100% at 15% 90%, rgba(8,51,68,0.6) 0%, transparent 60%)',
          }}
        >
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
            <div>
              <h3 className="font-serif-display text-[48px] leading-[1.05] tracking-[-0.02em] text-white lg:text-[56px]">
                Let&apos;s build from here.
              </h3>
              <p className="mt-5 max-w-[520px] text-[15px] leading-[1.6] text-[#B5C8CB]">
                Harnessed for progress. Designed for conversation. Celebrated for the quiet discipline of showing up daily. Welcome to the practice professionals love.
              </p>
            </div>

            <form
              action="/signup"
              method="get"
              className="flex w-full flex-col items-stretch gap-3 sm:flex-row lg:justify-end"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="Email address"
                className="w-full max-w-[320px] rounded-md border border-white/15 bg-black/30 px-4 py-[13px] text-[15px] text-white placeholder:text-white/50 outline-none transition-colors focus:border-white/40"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-[13px] text-[15px] font-medium text-[#031B1F] transition-colors hover:bg-white/90"
              >
                Start your free trial
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer — Testimonials */}
      <footer className="border-t border-[#2A2A2E]">
        <div className="mx-auto max-w-[1720px] px-10 lg:px-16 pt-[96px] pb-6">
          <div className="mb-12 grid grid-cols-12 items-end gap-8">
            <div className="col-span-12 md:col-span-8">
              <div className="mb-4 text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">
                Spoken by
              </div>
              <h2 className="font-serif-display text-[48px] leading-[1.08] tracking-[-0.02em] text-[#F5F2EC] lg:text-[56px]">
                People who stopped rehearsing.
              </h2>
            </div>
            <div className="col-span-12 flex items-center gap-2 md:col-span-4 md:justify-end">
              <span className="font-serif-display text-[18px]">Talkivo</span>
              <span className="h-[5px] w-[5px] rounded-full bg-[#D4A373]" />
            </div>
          </div>

          <TestimonialSlider
            reviews={[
              {
                id: 1,
                name: 'Ananya Rao',
                affiliation: 'Product Manager · Bangalore',
                quote:
                  'I used to prepare every meeting in my head, word by word. After six weeks of Talkivo, I stopped rehearsing. I just talked.',
                imageSrc: '/testimonials/portrait-1.jpg',
                thumbnailSrc: '/testimonials/portrait-1.jpg',
              },
              {
                id: 2,
                name: 'Rahul Gupta',
                affiliation: 'Management Consultant · Mumbai',
                quote:
                  'Client calls used to leave me exhausted. Now I close my laptop at the end of a pitch and actually remember what I said.',
                imageSrc: '/testimonials/portrait-2.jpg',
                thumbnailSrc: '/testimonials/portrait-2.jpg',
              },
              {
                id: 3,
                name: 'Priya Shah',
                affiliation: 'Founder · Delhi NCR',
                quote:
                  'No tutor I hired ever gave me the patience Talkivo does. It just listens, then quietly shows me what I would have said if I were clearer.',
                imageSrc: '/testimonials/portrait-3.jpg',
                thumbnailSrc: '/testimonials/portrait-3.jpg',
              },
              {
                id: 4,
                name: 'Arjun Krishnan',
                affiliation: 'Staff Engineer · Pune',
                quote:
                  'I speak English every day at work, but I always felt second-language. After a month of sessions, the hesitation just isn\u2019t there.',
                imageSrc: '/testimonials/portrait-4.jpg',
                thumbnailSrc: '/testimonials/portrait-4.jpg',
              },
              {
                id: 5,
                name: 'Meera Iyer',
                affiliation: 'Journalist · Chennai',
                quote:
                  'Grammar Fix is the best editor I\u2019ve ever worked with. It explains why, not just what. My drafts land cleaner on the first read.',
                imageSrc: '/testimonials/portrait-5.jpg',
                thumbnailSrc: '/testimonials/portrait-5.jpg',
              },
            ]}
          />

          <div className="mt-16 grid grid-cols-12 gap-8 border-t border-[#2A2A2E] pt-8">
            <div className="col-span-12 md:col-span-4">
              <p className="text-[13px] leading-[1.55] text-[#6B665F]">
                A calm, patient AI tutor for ambitious professionals.
              </p>
            </div>
            <div className="col-span-6 md:col-span-4">
              <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">
                Product
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#9A948A]">
                <li><a href="#modes" className="hover:text-[#F5F2EC]">Modes</a></li>
                <li><a href="#why" className="hover:text-[#F5F2EC]">Why Talkivo</a></li>
                <li><a href="#how" className="hover:text-[#F5F2EC]">How it works</a></li>
                <li><a href="#testimonials" className="hover:text-[#F5F2EC]">Testimonials</a></li>
              </ul>
            </div>
            <div className="col-span-6 md:col-span-4">
              <div className="mb-2 text-[11px] uppercase tracking-[0.12em] text-[#6B665F]">
                Company
              </div>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-[#9A948A]">
                <li><span className="hover:text-[#F5F2EC]">About</span></li>
                <li><span className="hover:text-[#F5F2EC]">Support</span></li>
                <li><span className="hover:text-[#F5F2EC]">Privacy</span></li>
                <li><span className="hover:text-[#F5F2EC]">Terms</span></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[#2A2A2E] pt-5 text-[12px] text-[#6B665F]">
            <span>© {new Date().getFullYear()} Talkivo</span>
            <span>Made in India · English worldwide</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
