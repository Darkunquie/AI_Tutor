'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import {
  OrganizationJsonLd,
  WebSiteJsonLd,
  SoftwareAppJsonLd,
  FaqJsonLd,
} from './JsonLd';

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) router.replace('/app');
  }, [isAuthenticated, router]);

  return (
    <MarketingShell showBackground={false}>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <SoftwareAppJsonLd />
      <FaqJsonLd />

      <main>
        {/* ── HERO ── */}
        <section
          className="relative min-h-screen flex flex-col items-center justify-start pt-36 px-6 text-center overflow-hidden"
        >

          {/* Badge */}
          <div className="relative z-10 inline-flex items-center gap-2 border border-[#3D484E] bg-[#141A22] px-4 py-1.5 text-[13px] text-[#BCC8CF] mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7A9A6B] shadow-[0_0_6px_#7A9A6B]" />
            AI-powered English tutor for professionals
          </div>

          {/* Heading */}
          <h1 className="relative z-10 font-[Sora] text-[clamp(48px,7vw,80px)] font-extrabold leading-[1.05] tracking-[-0.03em] max-w-[900px] mb-5">
            Practice English that<br />
            <span className="bg-gradient-to-r from-[#4FD1FF] to-[#7A9A6B] bg-clip-text text-transparent">
              actually matters.
            </span>
          </h1>

          {/* Subtext */}
          <p className="relative z-10 text-[17px] text-[#879299] max-w-[520px] leading-[1.7] mb-8">
            Stop memorizing grammar rules. Master professional communication with an AI that corrects in real time, tracks your patterns, and adapts to your level.
          </p>

          {/* CTAs */}
          <div className="relative z-10 flex flex-wrap gap-3 justify-center mb-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 bg-[#4FD1FF] text-[#0D131B] px-8 py-3.5 text-[15px] font-semibold transition-all hover:bg-[#7DD3FC] hover:-translate-y-px"
            >
              Start practicing free
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <Link
              href="/features"
              className="border border-[#3D484E] text-[#BCC8CF] px-8 py-3.5 text-[15px] font-medium transition-all hover:border-[#4FD1FF]/40 hover:text-[#E6EEF8]"
            >
              See how it works
            </Link>
          </div>

          {/* Trust */}
          <p className="relative z-10 text-[13px] text-[#879299]/60 mb-16">
            No credit card · Works in any browser · Voice is never stored
          </p>

          {/* Product Mockup */}
          <div className="relative z-10 w-full max-w-[960px] mx-auto" style={{ maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}>
            {/* Glow effects */}
            <div className="absolute -top-10 -right-10 w-[200px] h-[200px] rounded-full bg-[#4FD1FF]/[0.08] blur-[60px]" />
            <div className="absolute -bottom-10 -left-10 w-[260px] h-[260px] rounded-full bg-[#7A9A6B]/[0.06] blur-[80px]" />

            <div className="relative z-10 bg-[#141A22] border border-[#3D484E] shadow-[0_0_80px_-20px_rgba(79,209,255,0.25)] overflow-hidden">
              {/* Title bar */}
              <div className="bg-[#1C232B] border-b border-[#3D484E] px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2F38]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2F38]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2A2F38]" />
                  </div>
                  <span className="text-[13px] text-[#879299]">Free Talk · Session 47</span>
                </div>
                <div className="inline-flex items-center gap-1.5 border border-[#4FD1FF]/15 bg-[#4FD1FF]/[0.08] px-2.5 py-1 text-[10px] font-semibold text-[#4FD1FF] tracking-wider">
                  <span className="w-[5px] h-[5px] rounded-full bg-[#4FD1FF] animate-pulse" />
                  ANALYZING
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="text-[11px] font-medium text-[#879299] uppercase tracking-wider mb-2.5">Your message</div>
                <p className="text-[18px] text-[#E6EEF8] leading-[1.6] max-w-[640px] mb-6">
                  &ldquo;I am thinking about{' '}
                  <span className="bg-[#F87171]/[0.08] text-[#F87171] border-b-2 border-[#F87171]/40 px-0.5">to apply</span>
                  {' '}for the senior architect role at the{' '}
                  <span className="bg-[#F87171]/[0.08] text-[#F87171] border-b-2 border-[#F87171]/40 px-0.5">next week meeting</span>.&rdquo;
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Grammar correction */}
                  <div className="bg-[#0D131B] border border-[#E8B64C]/20 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-symbols-outlined text-[#E8B64C] text-[20px]">lightbulb</span>
                      <span className="text-[10px] font-semibold bg-[#E8B64C]/10 text-[#E8B64C] px-2 py-0.5 tracking-wider">GRAMMAR</span>
                    </div>
                    <div className="font-[Sora] text-[15px] font-semibold text-[#E6EEF8] mb-1.5">Infinitive vs Gerund</div>
                    <p className="text-[13px] text-[#879299] leading-[1.5] mb-3">After &ldquo;thinking about&rdquo;, use the gerund form (-ing).</p>
                    <div className="flex items-center gap-2 font-mono text-[13px]">
                      <span className="text-[#F87171] line-through">to apply</span>
                      <span className="text-[#879299]">→</span>
                      <span className="text-[#E8B64C] font-semibold">applying</span>
                    </div>
                  </div>

                  {/* Clarity correction */}
                  <div className="bg-[#0D131B] border border-[#7A9A6B]/20 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="material-symbols-outlined text-[#7A9A6B] text-[20px]">bolt</span>
                      <span className="text-[10px] font-semibold bg-[#7A9A6B]/10 text-[#7A9A6B] px-2 py-0.5 tracking-wider">CLARITY</span>
                    </div>
                    <div className="font-[Sora] text-[15px] font-semibold text-[#E6EEF8] mb-1.5">Word Order</div>
                    <p className="text-[13px] text-[#879299] leading-[1.5] mb-3">Time reference goes after the noun, not before.</p>
                    <div className="flex items-center gap-2 font-mono text-[13px]">
                      <span className="text-[#F87171] line-through">next week meeting</span>
                      <span className="text-[#879299]">→</span>
                      <span className="text-[#7A9A6B] font-semibold">meeting next week</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="grid grid-cols-2 md:grid-cols-4 border border-[#3D484E]">
            {[
              { value: '12.4K', label: 'Active learners', color: '#4FD1FF' },
              { value: '892M', label: 'Sentences corrected', color: '#E6EEF8' },
              { value: '4ms', label: 'Response latency', color: '#E6EEF8' },
              { value: '0', label: 'Voice recordings stored', color: '#7A9A6B' },
            ].map((s, i) => (
              <div key={s.label} className={`p-12 text-center ${i < 3 ? 'border-r border-[#3D484E]' : ''} ${i < 2 ? 'border-b md:border-b-0 border-[#3D484E]' : ''}`}>
                <div className="font-[Sora] text-[40px] font-extrabold tracking-[-0.02em] mb-2" style={{ color: s.color }}>{s.value}</div>
                <p className="text-[13px] text-[#879299] uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="mb-12">
            <p className="text-[13px] font-semibold text-[#4FD1FF] uppercase tracking-widest mb-3">Practice modes</p>
            <h2 className="font-[Sora] text-[32px] font-bold tracking-[-0.01em]">Five ways to practice</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-[#3D484E]">
            {[
              { icon: 'forum', color: '#4FD1FF', name: 'Free Talk', desc: 'Open conversation on any topic. Grammar, vocabulary, and structure corrections in real time.' },
              { icon: 'groups', color: '#E8B64C', name: 'Role Play', desc: 'Rehearse interviews, client calls, negotiations. The tutor plays the other side — patient and consistent.' },
              { icon: 'swords', color: '#7A9A6B', name: 'Debate', desc: 'Defend your position on real topics. Build persuasive argument structure in English.' },
              { icon: 'spellcheck', color: '#BCC8CF', name: 'Grammar Fix', desc: 'Write any sentence. Every error caught and explained with the rule behind it.' },
              { icon: 'record_voice_over', color: '#ffb4ab', name: 'Pronunciation', desc: 'Drills targeting the 18 sounds Indian speakers commonly avoid. Real-time accent feedback.' },
            ].map((m) => (
              <Link key={m.name} href={`/features/${m.name.toLowerCase().replace(' ', '-')}`} className="p-10 border-r border-b border-[#3D484E] hover:bg-[#141A22] transition-colors block">
                <span className="material-symbols-outlined text-3xl mb-6" style={{ color: m.color }}>{m.icon}</span>
                <h3 className="font-[Sora] text-xl font-bold mb-2">{m.name}</h3>
                <p className="text-[14px] text-[#BCC8CF] leading-relaxed">{m.desc}</p>
              </Link>
            ))}
            <div className="p-10 border-r border-b border-[#3D484E] bg-[#4FD1FF] flex flex-col justify-center items-center text-center">
              <p className="font-[Sora] font-bold text-lg text-[#0D131B] mb-4">Ready to start?</p>
              <Link href="/signup" className="bg-[#0D131B] text-[#4FD1FF] px-8 py-3 text-sm font-semibold hover:bg-[#141A22] transition-colors">
                Get Started →
              </Link>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24 border-t border-[#3D484E]/50">
          <h2 className="font-[Sora] text-[32px] font-bold text-center mb-16">Four steps to better English</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {[
              { n: '01', title: 'Pick a mode', desc: 'Choose Free Talk, Role Play, Debate, Grammar Fix, or Pronunciation. Set your level.' },
              { n: '02', title: 'Start speaking', desc: 'Talk naturally. Talkivo transcribes in real time and waits for your pauses.' },
              { n: '03', title: 'Get corrections', desc: 'Grammar, vocabulary, structure feedback inline. With explanations, not just red marks.' },
              { n: '04', title: 'Track progress', desc: 'Weekly reports show the patterns you keep repeating and how to fix them.' },
            ].map((s) => (
              <div key={s.n}>
                <div className="font-[Sora] text-[40px] font-extrabold text-[#3D484E] mb-4">{s.n}</div>
                <h4 className="font-[Sora] text-lg font-bold mb-2">{s.title}</h4>
                <p className="text-[14px] text-[#879299] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TRUST ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <p className="text-[13px] font-semibold text-[#4FD1FF] uppercase tracking-widest mb-3">Our commitment</p>
            <h2 className="font-[Sora] text-[32px] font-bold">What we do and don&apos;t do</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#3D484E]">
            <div className="bg-[#0D131B] p-10">
              <h3 className="font-[Sora] text-lg font-bold text-[#E8B64C] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">cancel</span> We don&apos;t
              </h3>
              <div className="space-y-4">
                {['Gamify learning with streaks and points', 'Store raw audio recordings of your voice', 'Use pre-recorded scripted scenarios', 'Pretend to be a human teacher'].map((t) => (
                  <div key={t} className="flex items-start gap-3 text-[14px] text-[#BCC8CF]">
                    <span className="text-[#E8B64C] font-bold shrink-0">—</span> {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0D131B] p-10">
              <h3 className="font-[Sora] text-lg font-bold text-[#4FD1FF] mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> We do
              </h3>
              <div className="space-y-4">
                {['Correct grammar in real time with explanations', 'Track patterns you keep repeating', 'Adapt voice, pace, and accent to you', 'Give weekly pattern reports'].map((t) => (
                  <div key={t} className="flex items-start gap-3 text-[14px] text-[#BCC8CF]">
                    <span className="text-[#4FD1FF] font-bold shrink-0">+</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── TESTIMONIAL ── */}
        <section className="max-w-[720px] mx-auto px-6 py-24 text-center border-t border-[#3D484E]/50">
          <span className="material-symbols-outlined text-6xl text-[#4FD1FF]/20 mb-8">format_quote</span>
          <blockquote className="font-[Sora] text-[22px] font-medium italic leading-relaxed mb-8">
            &ldquo;I used Talkivo for two weeks before my H1B visa interview. The Role Play mode let me rehearse until my answers felt natural. Passed on the first try.&rdquo;
          </blockquote>
          <p className="text-[14px] font-semibold">Priya M.</p>
          <p className="text-[13px] text-[#879299]">Senior PM, Hyderabad · 47 sessions</p>
        </section>

        {/* ── FAQ ── */}
        <section className="max-w-[640px] mx-auto px-6 py-24">
          <h2 className="font-[Sora] text-[32px] font-bold text-center mb-12">Common questions</h2>
          {[
            { q: 'How is my voice data protected?', a: 'Audio is processed in memory and discarded when you disconnect. Only text transcripts are kept. We never store raw audio.' },
            { q: 'Which accents are supported?', a: 'All major variants — Indian English, American, British, Australian. The tutor adapts to your preference.' },
            { q: 'Can I cancel anytime?', a: 'One click from the dashboard. No questions. Export your transcripts and vocabulary anytime.' },
            { q: 'How much does it cost?', a: 'Free to start. No credit card required. Practice as much as you want during the trial.' },
          ].map((item) => (
            <div key={item.q} className="border-b border-[#3D484E]/50 py-6">
              <h4 className="font-[Sora] text-[15px] font-semibold mb-2">{item.q}</h4>
              <p className="text-[14px] text-[#879299] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </section>

        {/* ── FINAL CTA ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-24">
          <div className="relative bg-[#4FD1FF] p-12 md:p-20 text-center overflow-hidden">
            <div className="pointer-events-none absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 2px, transparent 2px, transparent 10px)' }} />
            <div className="relative z-10">
              <h2 className="font-[Sora] text-[clamp(28px,4vw,40px)] font-extrabold text-[#0D131B] mb-4">
                Your English has a pattern.<br />Let&apos;s fix it.
              </h2>
              <p className="text-[#0D131B]/70 text-lg mb-8 max-w-lg mx-auto">Two minutes to set up. No credit card. No gamification.</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Link href="/signup" className="bg-[#0D131B] text-[#4FD1FF] px-10 py-4 font-bold text-[15px] hover:bg-[#141A22] transition-colors">
                  Get Started Free →
                </Link>
                <Link href="/features" className="border border-[#0D131B]/30 text-[#0D131B] px-10 py-4 font-bold text-[15px] hover:bg-[#0D131B]/10 transition-colors">
                  See all features
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
