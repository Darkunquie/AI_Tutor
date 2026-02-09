import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - AI English Tutor',
  description: 'Track your English learning progress, session history, and improvement trends.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
