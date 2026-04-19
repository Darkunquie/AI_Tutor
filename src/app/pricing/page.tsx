import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingShell } from '@/components/marketing/MarketingShell';

export const metadata: Metadata = {
  title: 'Pricing — Free to Start, Simple Plans',
  description:
    'Start free with a 3-day trial. Upgrade to unlimited English speaking practice with Talkivo. Simple monthly and yearly plans, cancel anytime.',
  alternates: { canonical: '/pricing' },
  openGraph: {
    title: 'Talkivo Pricing',
    description: 'Free trial, simple plans, cancel anytime.',
    url: 'https://talkivo.in/pricing',
  },
};

const PLANS = [
  {
    name: 'Free Trial',
    price: '\u20B90',
    period: 'for 3 days',
    tagline: 'Everything unlocked. No credit card.',
    cta: 'Start free',
    href: '/signup',
    features: [
      'All 5 modes unlocked',
      'Unlimited sessions during trial',
      'Full grammar, pronunciation, and role play feedback',
      'No credit card required',
    ],
    highlighted: false,
  },
  {
    name: 'Monthly',
    price: '\u20B9499',
    period: 'per month',
    tagline: 'Daily practice. Cancel anytime.',
    cta: 'Start monthly',
    href: '/signup?plan=monthly',
    features: [
      'Unlimited sessions, all modes',
      'Memory across sessions \u2014 tutor learns your patterns',
      'Progress reports every week',
      'Priority support',
    ],
    highlighted: true,
  },
  {
    name: 'Yearly',
    price: '\u20B94,999',
    period: 'per year',
    tagline: 'Two months free. Best for consistent learners.',
    cta: 'Start yearly',
    href: '/signup?plan=yearly',
    features: [
      'Everything in Monthly',
      '2 months free (16% savings)',
      'Deeper progress tracking across the year',
      'Priority support',
    ],
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <MarketingShell>
      <main className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10 lg:py-28">
        <div className="mx-auto max-w-[720px] text-center">
          <div className="mb-6 text-[12px] uppercase tracking-[0.12em] text-[#D4A373]">Pricing</div>
          <h1 className="font-serif-display text-[56px] leading-[1.05] tracking-[-0.02em] text-[#F5F2EC] lg:text-[72px]">
            Simple plans. Cancel any time.
          </h1>
          <p className="mt-6 text-[18px] leading-[1.6] text-[#9A948A]">
            Start free. If you like it, keep going with a plan that costs less than a coffee a week.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-8 ${p.highlighted ? 'border-[#D4A373] bg-[#17171A]' : 'border-[#2A2A2E] bg-[#121215]'}`}
            >
              {p.highlighted && (
                <div className="mb-4 inline-block rounded-full bg-[#D4A373]/20 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#D4A373]">
                  Most popular
                </div>
              )}
              <h3 className="font-serif-display text-[28px] text-[#F5F2EC]">{p.name}</h3>
              <p className="mt-2 text-[13px] text-[#9A948A]">{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif-display text-[48px] text-[#F5F2EC]">{p.price}</span>
                <span className="text-[13px] text-[#6B665F]">{p.period}</span>
              </div>
              <ul className="mt-8 space-y-3 text-[14px] text-[#9A948A]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-[#D4A373]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={p.href}
                className={`mt-8 block w-full rounded-md px-5 py-[12px] text-center text-[14px] font-medium transition-colors ${p.highlighted ? 'bg-[#D4A373] text-[#0E0E10] hover:bg-[#DDB389]' : 'border border-[#2A2A2E] text-[#F5F2EC] hover:border-[#3A3A3F]'}`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <section className="mt-24 mx-auto max-w-[720px]">
          <h2 className="font-serif-display mb-8 text-center text-[32px] text-[#F5F2EC]">Common questions</h2>
          <dl className="space-y-6">
            <div>
              <dt className="text-[16px] font-medium text-[#F5F2EC]">Is there really a free trial?</dt>
              <dd className="mt-2 text-[14px] leading-[1.6] text-[#9A948A]">Yes. Three days, all five modes unlocked, no credit card needed.</dd>
            </div>
            <div>
              <dt className="text-[16px] font-medium text-[#F5F2EC]">Can I cancel anytime?</dt>
              <dd className="mt-2 text-[14px] leading-[1.6] text-[#9A948A]">Yes. Cancel in one click from your account. No questions, no retention calls.</dd>
            </div>
            <div>
              <dt className="text-[16px] font-medium text-[#F5F2EC]">Do I need to install anything?</dt>
              <dd className="mt-2 text-[14px] leading-[1.6] text-[#9A948A]">No. Talkivo runs in your browser on any modern phone or laptop.</dd>
            </div>
            <div>
              <dt className="text-[16px] font-medium text-[#F5F2EC]">What payment methods do you accept?</dt>
              <dd className="mt-2 text-[14px] leading-[1.6] text-[#9A948A]">UPI, all major credit and debit cards, and netbanking for Indian customers.</dd>
            </div>
          </dl>
        </section>
      </main>
    </MarketingShell>
  );
}
