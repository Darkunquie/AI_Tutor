'use client';

import { useEffect } from 'react';
import { warmUpSpeechEngine, isTTSSupported, loadVoices } from '@/lib/speech';

/**
 * Attaches a one-time global event listener that warms up the
 * Web Speech API on the user's first tap/click/keypress.
 *
 * Required on tablets (iPadOS Safari, Android Chrome) where
 * speechSynthesis.speak() silently fails unless called within
 * a user gesture context first.
 */
export function useSpeechWarmUp(): void {
  useEffect(() => {
    if (!isTTSSupported()) return;

    let warmedUp = false;

    const handleUserGesture = () => {
      if (warmedUp) return;
      warmedUp = true;

      warmUpSpeechEngine();
      loadVoices();

      document.removeEventListener('click', handleUserGesture, true);
      document.removeEventListener('touchstart', handleUserGesture, true);
      document.removeEventListener('keydown', handleUserGesture, true);
    };

    // Use capture phase to fire before other handlers
    document.addEventListener('click', handleUserGesture, true);
    document.addEventListener('touchstart', handleUserGesture, true);
    document.addEventListener('keydown', handleUserGesture, true);

    return () => {
      document.removeEventListener('click', handleUserGesture, true);
      document.removeEventListener('touchstart', handleUserGesture, true);
      document.removeEventListener('keydown', handleUserGesture, true);
    };
  }, []);
}
