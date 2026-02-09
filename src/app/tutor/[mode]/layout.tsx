import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Practice Session - AI English Tutor',
  description: 'Practice your English speaking skills with an AI tutor in real-time.',
};

export default function TutorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
