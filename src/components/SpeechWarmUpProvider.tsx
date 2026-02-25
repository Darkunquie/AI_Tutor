'use client';

import { useSpeechWarmUp } from '@/hooks/useSpeechWarmUp';

export function SpeechWarmUpProvider({ children }: { children: React.ReactNode }) {
  useSpeechWarmUp();
  return <>{children}</>;
}
