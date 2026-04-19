import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up Free — Start Practicing English Today',
  description:
    'Create your free Talkivo account. Practice English speaking with AI in under a minute. No credit card needed.',
  alternates: { canonical: '/signup' },
  openGraph: {
    title: 'Sign Up Free — Start Practicing English with AI',
    description: 'Create a free Talkivo account. Practice English speaking with AI.',
    url: 'https://talkivo.in/signup',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
