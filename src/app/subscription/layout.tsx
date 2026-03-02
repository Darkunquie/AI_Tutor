import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Subscription - Talkivo',
  description: 'View your subscription status and trial information.',
};

export default function SubscriptionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
