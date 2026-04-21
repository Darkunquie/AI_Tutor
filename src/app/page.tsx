'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { MarketingShell } from '@/components/marketing/MarketingShell';
import { BeamsBackground } from '@/components/ui/beams-background';
import { ModuleRack } from '@/components/landing/ModuleRack';
import { ReactorOrb } from '@/components/landing/ReactorOrb';
import { WaveformStrip } from '@/components/landing/WaveformStrip';
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

      {/* Fixed ambient beams layer */}
      <BeamsBackground className="fixed inset-0 z-0" intensity="subtle" />
      {/* Faint 20px grid overlay on top of everything (but under content) */}
      <div className="grid-bg-overlay" />

      <main className="relative z-10 space-y-32 pb-32">
        {/* UNIT 01 // CORE_RESONANCE — hero */}
        <section className="min-h-[90vh] grid-bg-40 px-8 md:px-12 py-20 md:py-28 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="module-header">UNIT: 01 // CORE_RESONANCE</div>
            <h1 className="font-sora font-extrabold text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[1.02] text-[#E6EEF8]">
              ORCHESTRATING
              <br />
              <span className="text-[#4FD1FF]">INTELLIGENCE</span>
            </h1>
            <p className="font-geist text-[#BCC8CF] text-lg max-w-lg leading-relaxed">
              A high-precision instrument for practicing spoken English. Talkivo listens, corrects with reason, and remembers the patterns you keep missing.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="bg-[#4FD1FF] text-[#0D131B] px-7 py-4 font-sora font-bold text-[14px] tracking-[0.08em] uppercase hover:bg-[#4FD1FF]/90 transition-colors"
              >
                INITIALIZE_SYSTEM
              </Link>
              <Link
                href="/features"
                className="border-[0.5px] border-[#4FD1FF]/40 text-[#4FD1FF] px-7 py-4 font-jetbrains-mono font-bold text-[12px] tracking-[0.15em] uppercase hover:bg-[#4FD1FF]/10 transition-colors"
              >
                REF_DOCS
              </Link>
            </div>
            <div className="font-serif italic text-[13px] tracking-[0.02em] text-[#BCC8CF]/90">
              No card required · Works in any browser · Voice is never stored
            </div>
          </div>

          <div className="flex flex-col items-center gap-10">
            <ReactorOrb size={520} />
            <WaveformStrip className="max-w-[520px] h-16" />
          </div>
        </section>

        {/* UNIT 02 // SYSTEM_STATUS — stat row */}
        <ModuleRack unit="02" name="SYSTEM_STATUS">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[0.5px] bg-[#4FD1FF]/10 border-[0.5px] border-[#4FD1FF]/20">
            {[
              { ref: 'REF_001', label: 'ACTIVE_USERS', value: '12.4K', fill: 62 },
              { ref: 'REF_002', label: 'SENTENCES_PARSED', value: '892M', fill: 100 },
              { ref: 'REF_003', label: 'NET_LATENCY', value: '04MS', fill: 4 },
              { ref: 'REF_004', label: 'VOICE_STORED', value: '0', fill: 0 },
            ].map((s) => (
              <div key={s.ref} className="bg-[#141A22] p-8 relative">
                <div className="absolute top-2 right-2 font-jetbrains-mono text-[11px] font-bold text-[#4FD1FF]/60">{s.ref}</div>
                <div className="font-jetbrains-mono text-[13px] font-bold text-[#4FD1FF]/90 mb-2 tracking-widest">// {s.label}</div>
                <div className="font-jetbrains-mono text-3xl text-[#4FD1FF]">{s.value}</div>
                <div className="mt-4 w-full h-1 bg-[#4FD1FF]/10">
                  <div className="h-full bg-[#4FD1FF]" style={{ width: `${s.fill}%` }} />
                </div>
              </div>
            ))}
          </div>
        </ModuleRack>

        {/* UNIT 03 // MODE_MATRIX — 3 cards, middle inverted cyan */}
        <ModuleRack unit="03" name="MODE_MATRIX">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#141A22] border-[0.5px] border-[#4FD1FF]/10 p-8 space-y-4">
              <div className="font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF] tracking-widest">[ MODE_01 ]</div>
              <h3 className="font-sora text-xl font-bold text-[#E6EEF8]">Free Talk</h3>
              <p className="font-geist text-sm text-[#BCC8CF] leading-relaxed">
                Open conversation on any topic. Real-time grammar + vocabulary + structure corrections.
              </p>
              <Link href="/features/free-talk" className="inline-block pt-4 font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF] tracking-widest uppercase hover:underline">+ ACTIVATE_NODE</Link>
            </div>

            <div className="bg-[#4FD1FF] p-8 space-y-4 text-[#0D131B]">
              <div className="font-jetbrains-mono text-[12px] font-bold tracking-widest">[ MODE_02 · PROTOCOL_X ]</div>
              <h3 className="font-sora text-xl font-bold">Role Play</h3>
              <p className="font-geist text-sm text-[#0D131B]/80 leading-relaxed">
                Rehearse the conversation before it happens. Interviews, negotiations, difficult calls.
              </p>
              <Link href="/features/role-play" className="inline-block pt-4 font-jetbrains-mono text-[12px] font-bold tracking-widest uppercase hover:underline">+ ENGAGE</Link>
            </div>

            <div className="bg-[#141A22] border-[0.5px] border-[#4FD1FF]/10 p-8 space-y-4">
              <div className="font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF] tracking-widest">[ MODE_03 ]</div>
              <h3 className="font-sora text-xl font-bold text-[#E6EEF8]">Debate</h3>
              <p className="font-geist text-sm text-[#BCC8CF] leading-relaxed">
                Hold a position against a patient opponent. Sharpens argument structure and persuasion.
              </p>
              <Link href="/features/debate" className="inline-block pt-4 font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF] tracking-widest uppercase hover:underline">+ ACTIVATE_NODE</Link>
            </div>
          </div>
        </ModuleRack>

        {/* UNIT 04 // ENGAGEMENT_CONTRACT — trust centerpiece */}
        <ModuleRack unit="04" name="ENGAGEMENT_CONTRACT">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[3px] bg-[#3D484E]">
            <div className="bg-[#141A22] p-10 md:p-12">
              <div className="font-jetbrains-mono text-[15px] font-bold text-[#E8B64C] mb-10 tracking-[0.2em] uppercase">[ SYSTEM_REFUSES ]</div>
              <ul className="space-y-6">
                {[
                  'NO GAMIFIED STREAKS OR POINT-HUNTING.',
                  'NO STORAGE OF RAW AUDIO RECORDINGS.',
                  'NO PRE-RECORDED "COFFEE-ORDER" SCENARIOS.',
                  'NO PRETENDING TO BE A HUMAN TEACHER.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-4">
                    <span className="font-jetbrains-mono text-[#E8B64C]">—</span>
                    <span className="font-jetbrains-mono text-sm text-[#E6EEF8]/70 uppercase tracking-tight leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#141A22] p-10 md:p-12">
              <div className="font-jetbrains-mono text-[15px] font-bold text-[#4FD1FF] mb-10 tracking-[0.2em] uppercase">[ SYSTEM_DOES ]</div>
              <ul className="space-y-6">
                {[
                  'CORRECT GRAMMAR IN REAL TIME, QUIETLY.',
                  'TRACK THE PATTERNS YOU KEEP MISSING.',
                  'ADAPT VOICE, PACE, AND ACCENT ON REQUEST.',
                  'EXPLAIN WHY EACH CORRECTION WAS MADE.',
                ].map((line) => (
                  <li key={line} className="flex items-start gap-4">
                    <span className="font-jetbrains-mono text-[#4FD1FF]">+</span>
                    <span className="font-jetbrains-mono text-sm text-[#E6EEF8] uppercase tracking-tight leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ModuleRack>

        {/* UNIT 05 // SESSION_FLOW — 4-step pipeline */}
        <ModuleRack unit="05" name="SESSION_FLOW">
          <div className="p-8 md:p-12 bg-[#141A22] hairline-bracing grid grid-cols-1 md:grid-cols-4 gap-0 divide-x-[0.5px] divide-dashed divide-[#4FD1FF]/30">
            {[
              { n: '01', title: 'INITIALIZATION', body: 'PICK A MODE, TOPIC, OR SCENARIO. CALIBRATE VOICE AND PACE PARAMETERS.' },
              { n: '02', title: 'SYNC_PHASE', body: 'SPEAK NATURALLY. TALKIVO TRANSCRIBES IN THE MARGIN AND WAITS FOR A PAUSE.' },
              { n: '03', title: 'ANALYSIS', body: 'GRAMMAR, STRUCTURE, VOCAB, PRONUNCIATION — INLINE MARGINALIA, NOT POPUPS.' },
              { n: '04', title: 'REFINEMENT', body: 'A WRITTEN REPORT, EVERY WEEK, ON THE 2-3 PATTERNS YOU KEEP REPEATING.' },
            ].map((s, i) => (
              <div key={s.n} className={i === 0 ? 'pr-6' : i === 3 ? 'pl-6' : 'px-6'}>
                <div className="w-10 h-10 border-[1px] border-[#4FD1FF] flex items-center justify-center font-jetbrains-mono text-[#4FD1FF] mb-6">{s.n}</div>
                <h4 className="font-sora font-bold text-base mb-3 uppercase text-[#E6EEF8]">{s.title}</h4>
                <p className="font-jetbrains-mono text-[11px] text-[#BCC8CF]/80 leading-relaxed uppercase">{s.body}</p>
              </div>
            ))}
          </div>
        </ModuleRack>

        {/* UNIT 06 // TELEMETRY_FEED + UNIT 07 // SPECTROGRAM */}
        <div className="px-8 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="module-header">UNIT: 06 // TELEMETRY_FEED</div>
            <div className="font-jetbrains-mono text-[11px] text-[#BCC8CF] space-y-3 p-6 bg-[#141A22] hairline-bracing leading-relaxed">
              <div>[ 14:02:11 ] <span className="text-[#4FD1FF]">SYSTEM_BOOT:</span> KERNEL_INIT_OK</div>
              <div>[ 14:02:12 ] <span className="text-[#4FD1FF]">NEURAL_MAP:</span> LOADING_WEIGHTS_V2.0</div>
              <div>[ 14:02:13 ] <span className="text-[#E8B64C]">WARNING:</span> LATENCY_SPIKE_NODE_04</div>
              <div>[ 14:02:14 ] <span className="text-[#4FD1FF]">AUTO_REROUTE:</span> OPTIMIZING_PATHS</div>
              <div>[ 14:02:15 ] <span className="text-[#4FD1FF]">SYSTEM_READY:</span> LISTENING_PORT_8080</div>
              <div>[ 14:02:16 ] <span className="text-[#4FD1FF]">HEARTBEAT:</span> SIG_STABLE [04ms]</div>
              <div>[ 14:02:17 ] <span className="text-[#4FD1FF]">DATA_IN:</span> 14KB_ENCRYPTED</div>
              <div>[ 14:02:18 ] <span className="text-[#4FD1FF]">DECRYPT_OK:</span> 256bit_AES_SECURE</div>
              <div>[ 14:02:19 ] <span className="text-[#4FD1FF]">PROCESS:</span> NLP_PARSE_INITIATED</div>
            </div>
          </div>
          <div>
            <div className="module-header">UNIT: 07 // SPECTROGRAM</div>
            <div className="h-[260px] bg-[#141A22] hairline-bracing relative overflow-hidden grid-bg-40">
              <div className="absolute inset-6 border-[0.5px] border-[#4FD1FF]/10" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-[#4FD1FF]/40" />
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#4FD1FF]/40" />
              <WaveformStrip bars={40} className="absolute bottom-8 left-8 right-8" />
            </div>
          </div>
        </div>

        {/* UNIT 08 // ARCHIVE_INDEX */}
        <ModuleRack unit="08" name="ARCHIVE_INDEX">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { idx: 'IDX_MODES', title: 'MODE_REFERENCE', href: '/features' },
              { idx: 'IDX_BLOG', title: 'FIELD_NOTES', href: '/blog' },
              { idx: 'IDX_GEO', title: 'LOCATION_INDEX', href: '/locations' },
              { idx: 'IDX_MAKER', title: 'THE_MAKER', href: '/about' },
            ].map((a) => (
              <Link
                key={a.idx}
                href={a.href}
                className="border-[0.5px] border-[#4FD1FF]/20 p-6 space-y-2 hover:bg-[#4FD1FF]/5 transition-colors block"
              >
                <div className="font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF]/70 tracking-widest">{a.idx}</div>
                <div className="font-sora text-lg font-bold text-[#E6EEF8]">{a.title}</div>
                <div className="font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF] tracking-widest">+ OPEN_FILE</div>
              </Link>
            ))}
          </div>
        </ModuleRack>

        {/* UNIT 09 // OPERATOR_LOG — testimonial */}
        <ModuleRack unit="09" name="OPERATOR_LOG">
          <div className="py-20 px-8 text-center max-w-4xl mx-auto relative">
            <span className="material-symbols-outlined absolute top-0 right-0 text-[160px] text-[#4FD1FF] opacity-5 pointer-events-none" aria-hidden>format_quote</span>
            <blockquote className="font-sora font-light text-2xl md:text-3xl italic text-[#E6EEF8] leading-tight mb-10">
              &ldquo;Talkivo isn&apos;t an app. It&apos;s a mirror. It showed me precisely where my language was failing and gave me the tools to rebuild it from the ground up.&rdquo;
            </blockquote>
            <div className="flex flex-col items-center">
              <div className="w-16 h-[0.5px] bg-[#4FD1FF] mb-4" />
              <cite className="font-jetbrains-mono text-[13px] font-bold text-[#4FD1FF] uppercase tracking-[0.2em] not-italic">
                DR. ELARA VOSS // CTO, NEXUS DYNAMICS
              </cite>
            </div>
          </div>
        </ModuleRack>

        {/* UNIT 10 + 11 — docs + comms */}
        <div className="px-8 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <div className="module-header">UNIT: 10 // DOCUMENTATION</div>
            <div className="p-8 bg-[#141A22] hairline-bracing space-y-6">
              {[
                { q: 'How is my voice data protected?', a: 'Session audio is processed in memory and discarded on disconnect. Only the transcript is retained.' },
                { q: 'Which English accents are supported?', a: 'All major variants. The tutor adapts its voice and pace to your preference — you pick, not us.' },
                { q: 'Can I cancel anytime?', a: 'From the dashboard, one click. No questions asked. Export your transcripts anytime.' },
              ].map((item) => (
                <div key={item.q} className="pb-6 border-b-[0.5px] border-[#4FD1FF]/10 last:border-0 last:pb-0">
                  <div className="font-jetbrains-mono text-[13px] font-bold text-[#4FD1FF] mb-2 uppercase tracking-widest">{item.q}</div>
                  <p className="font-geist text-sm text-[#BCC8CF] leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="module-header">UNIT: 11 // COMMS_STATUS</div>
            <div className="h-[300px] flex flex-col justify-between p-8 bg-[#141A22] hairline-bracing">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-[#4FD1FF] hud-dot-pulse" />
                  <div className="font-jetbrains-mono text-[13px] font-bold text-[#E6EEF8]">UPLINK_01: ESTABLISHED</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-[#4FD1FF]/20" />
                  <div className="font-jetbrains-mono text-[13px] font-bold text-[#879299]">UPLINK_02: STANDBY</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-[#4FD1FF]" />
                  <div className="font-jetbrains-mono text-[13px] font-bold text-[#E6EEF8]">ENCRYPTION: AES-256</div>
                </div>
              </div>
              <div className="font-jetbrains-mono text-[12px] font-bold text-[#4FD1FF] leading-relaxed">
                LAT: 17.3850 N<br />
                LNG: 78.4867 E<br />
                NODE: HYD-01
              </div>
            </div>
          </div>
        </div>

        {/* UNIT 12 // TERMINATION_SEQ — final CTA */}
        <section className="px-8 md:px-12 pt-24 pb-8 grid-bg-40 border-t-[0.5px] border-[#4FD1FF]/20">
          <div className="module-header">UNIT: 12 // TERMINATION_SEQ</div>
          <div className="flex flex-col items-center text-center space-y-10 py-16">
            <h2 className="font-sora font-extrabold text-4xl md:text-6xl text-[#E6EEF8] tracking-tighter max-w-4xl leading-tight">
              SYSTEM READY FOR <span className="text-[#4FD1FF]">DEPLOYMENT</span>
            </h2>
            <p className="font-geist text-[#BCC8CF] text-lg md:text-xl max-w-2xl">
              Initialize your first session. No card required. Two minutes to set up.
            </p>
            <div className="flex flex-col md:flex-row gap-4 w-full max-w-md">
              <Link
                href="/signup"
                className="flex-1 text-center bg-[#4FD1FF] text-[#0D131B] px-6 py-5 font-jetbrains-mono font-bold text-xs tracking-[0.2em] uppercase hover:bg-[#4FD1FF]/90 transition-colors"
              >
                START_INSTANCE
              </Link>
              <Link
                href="/features"
                className="flex-1 text-center border-[1px] border-[#4FD1FF]/40 text-[#4FD1FF] px-6 py-5 font-jetbrains-mono text-xs tracking-[0.2em] uppercase hover:bg-[#4FD1FF]/10 transition-colors"
              >
                VIEW_DOCS
              </Link>
            </div>
            <div className="font-jetbrains-mono text-[11px] font-bold text-[#4FD1FF]/60 mt-8 tracking-[0.5em]">
              END_OF_SEQUENCE // REF_TALKIVO
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}
