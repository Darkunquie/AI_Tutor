'use client';

import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';

export default function PendingApprovalPage() {
  return (
    <AuthShell
      eyebrow="Almost there"
      title="Your account is pending approval."
      subtitle="An admin will review and approve your account shortly. You&rsquo;ll be able to log in once it&rsquo;s approved — usually within a business day."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>
            Already approved?{' '}
            <Link href="/login" className="text-[#D4A373] hover:text-[#DDB389]">
              Log in
            </Link>
          </span>
          <Link href="/" className="text-[13px] text-white/55 hover:text-white/80">
            ← Back to home
          </Link>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="border-l border-[#D4A373] pl-5">
          <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
            What happens next
          </div>
          <ol className="space-y-3 text-[14px] leading-[1.55] text-white/75">
            <li className="flex gap-3">
              <span className="font-serif-display tabular-nums text-[#D4A373]">01</span>
              <span>An admin reviews your submission — checks the email and phone.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif-display tabular-nums text-[#D4A373]">02</span>
              <span>You&rsquo;re approved and a 7-day trial is activated on your account.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-serif-display tabular-nums text-[#D4A373]">03</span>
              <span>You log in and start your first session. No card, no commitment.</span>
            </li>
          </ol>
        </div>

        <Link
          href="/login"
          className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-[#D4A373] px-6 py-[14px] text-[15px] font-medium text-[#0E0E10] transition-colors hover:bg-[#DDB389]"
        >
          Back to log in
        </Link>
      </div>
    </AuthShell>
  );
}
