import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'About Talkivo — The Patient AI English Tutor',
  description:
    'Talkivo is an AI English tutor built for ambitious professionals. Our mission: help serious learners stop rehearsing and start speaking.',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'About Talkivo',
    description: 'The patient AI English tutor for ambitious professionals.',
    url: 'https://talkivo.in/about',
  },
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[1100px] px-6 py-20 lg:px-10 lg:py-32">
        <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#4FD1FF]">About Talkivo</div>
        <h1 className="font-sora text-[56px] leading-[1.05] tracking-[-0.02em] text-[#E6EEF8] lg:text-[72px]">
          The patient tutor that never gets tired of listening.
        </h1>
        <p className="mt-8 max-w-[720px] text-[18px] leading-[1.6] text-[#BCC8CF]">
          Talkivo was built for the person who knows English but freezes the moment the room gets quiet. The engineer who rehearses every standup in their head. The founder who drafts the email six times before hitting send. The student who reads every answer perfectly — and stumbles when asked to say it aloud.
        </p>

        <section className="mt-20 grid gap-16 lg:grid-cols-2">
          <div>
            <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">Why we built it</h2>
            <p className="mt-4 text-[15px] leading-[1.7] text-[#BCC8CF]">
              India has the world\u2019s largest English-speaking student population \u2014 and still, most working professionals hesitate to speak. Not because they don\u2019t know the grammar. Because they\u2019ve never had enough low-pressure speaking time with someone patient enough to let them finish a thought.
            </p>
            <p className="mt-4 text-[15px] leading-[1.7] text-[#BCC8CF]">
              Classes move at the speed of the loudest student. Tutors cost money and meet once a week. Apps drill flashcards instead of fluency. We wanted something calmer. Something that listens first, explains every correction, and remembers the mistakes that follow you around for years.
            </p>
          </div>

          <div>
            <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">What we believe</h2>
            <ul className="mt-4 space-y-4 text-[15px] leading-[1.7] text-[#BCC8CF]">
              <li><span className="text-[#E6EEF8]">Fluency is built in minutes a day, not hours a week.</span> Daily beats intense every time.</li>
              <li><span className="text-[#E6EEF8]">Every correction should come with a reason.</span> A red line teaches nothing.</li>
              <li><span className="text-[#E6EEF8]">Patience beats pressure.</span> Good tutors wait for the full thought.</li>
              <li><span className="text-[#E6EEF8]">Clarity, not imitation.</span> The goal is to be understood \u2014 not to sound like someone else.</li>
            </ul>
          </div>
        </section>

        <section className="mt-24 rounded-2xl border border-[#4FD1FF/20] bg-[#141A22] p-10 lg:p-14">
          <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">Built in India, for the world</h2>
          <p className="mt-4 max-w-[720px] text-[15px] leading-[1.7] text-[#BCC8CF]">
            Talkivo is built in India by a small team that has lived the problem. We understand the specific sounds Indian speakers avoid, the grammar patterns that get reinforced at school, the pressure of the next job interview. The tutor is tuned accordingly \u2014 but the product works for any serious English learner, anywhere.
          </p>
        </section>

        <section className="mt-24">
          <h2 className="font-sora text-[32px] leading-[1.15] text-[#E6EEF8]">Start where you are</h2>
          <p className="mt-4 max-w-[640px] text-[15px] leading-[1.7] text-[#BCC8CF]">
            You don\u2019t need to be good yet. You don\u2019t need to prepare. You don\u2019t need a schedule. Open the app, pick a mode, and speak for five minutes. That is the whole commitment.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-md bg-[#4FD1FF] px-7 py-[14px] text-[17px] font-medium text-[#0D131B] transition-colors hover:bg-[#4FD1FF]"
          >
            Start your first session
          </Link>
        </section>
      </main>
    </MarketingShell>
  );
}
