import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal - Talkivo',
  description: 'Manage users and view platform analytics.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
