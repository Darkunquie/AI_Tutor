// Text-to-Speech utilities using Web Speech API
// 100% FREE - runs in browser, no API keys needed

import type { Level } from './types';
import { logger } from './utils';

// Store loaded voices
let cachedVoices: SpeechSynthesisVoice[] = [];

// Load voices (needed because getVoices() is async in some browsers)
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve([]);
      return;
    }

    const loadVoiceList = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      return cachedVoices;
    };

    // Try to get voices immediately
    const voices = loadVoiceList();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load (async in Chrome)
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(loadVoiceList());
      };
    }

    // Fallback timeout
    setTimeout(() => resolve(loadVoiceList()), 500);
  });
}

// Get the best English voice
function getBestVoice(): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  const voices = cachedVoices.length > 0 ? cachedVoices : synth?.getVoices() || [];

  if (voices.length === 0) return null;

  // Try to find a good Indian English voice
  const englishVoice =
    voices.find(v => v.lang === 'en-IN' && v.name.includes('Google')) ||
    voices.find(v => v.lang === 'en-IN' && v.name.includes('Microsoft')) ||
    voices.find(v => v.lang === 'en-IN') ||
    voices.find(v => v.lang.startsWith('en')) ||
    voices[0];

  return englishVoice;
}

// Clean text for TTS
function cleanTextForSpeech(text: string): string {
  return text
    // Remove common emojis and symbols
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[✅📝💪🌟✏️💡🗣️🎭⚔️🔊🎤⌨️]/g, '')
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    // Replace special characters
    .replace(/→/g, ' to ')
    .replace(/—/g, ', ')
    // Clean whitespace
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get speech rate based on level
function getRate(level: Level): number {
  switch (level) {
    case 'BEGINNER': return 0.9;
    case 'INTERMEDIATE': return 1.0;
    case 'ADVANCED': return 1.05;
    default: return 1.0;
  }
}

// Main speak function - simplified and robust
export function speakText(
  text: string,
  level: Level,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }
): { stop: () => void } {
  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  // No-op if not supported
  if (!synth) {
    callbacks?.onEnd?.();
    return { stop: () => {} };
  }

  // Clean text
  const cleanText = cleanTextForSpeech(text);
  if (!cleanText) {
    callbacks?.onEnd?.();
    return { stop: () => {} };
  }

  // Cancel any previous speech
  synth.cancel();

  // Create utterance
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'en-IN';
  utterance.rate = getRate(level);
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Set voice
  const voice = getBestVoice();
  if (voice) {
    utterance.voice = voice;
  }

  let started = false;
  let ended = false;

  // Event handlers
  utterance.onstart = () => {
    if (!started) {
      started = true;
      callbacks?.onStart?.();
    }
  };

  utterance.onend = () => {
    if (resumeTimer) clearInterval(resumeTimer);
    if (!ended) {
      ended = true;
      callbacks?.onEnd?.();
    }
  };

  utterance.onerror = (event) => {
    if (resumeTimer) clearInterval(resumeTimer);
    // Only log real errors, not cancellations
    if (event.error && event.error !== 'interrupted' && event.error !== 'canceled') {
      logger.warn('TTS warning:', event.error);
    }
    if (!ended) {
      ended = true;
      callbacks?.onEnd?.();
    }
  };

  // Chrome workaround: speech can get stuck, need to resume periodically
  let resumeTimer: NodeJS.Timeout | null = null;

  const startResumeTimer = () => {
    resumeTimer = setInterval(() => {
      if (synth.speaking && synth.paused) {
        synth.resume();
      }
      if (!synth.speaking && started && !ended) {
        // Speech finished but onend didn't fire
        ended = true;
        callbacks?.onEnd?.();
        if (resumeTimer) clearInterval(resumeTimer);
      }
    }, 500);
  };

  // Start speaking
  try {
    synth.speak(utterance);
    startResumeTimer();

    // Fallback: ensure onStart fires even if the event doesn't
    setTimeout(() => {
      if (synth.speaking && !started) {
        started = true;
        callbacks?.onStart?.();
      }
    }, 100);
  } catch (err) {
    logger.warn('TTS speak error:', err);
    callbacks?.onEnd?.();
  }

  // Return stop function
  return {
    stop: () => {
      if (resumeTimer) clearInterval(resumeTimer);
      synth.cancel();
      if (!ended) {
        ended = true;
        callbacks?.onEnd?.();
      }
    }
  };
}

// Stop all speech
export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// Check if TTS is supported
export function isTTSSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Check if currently speaking
export function isSpeaking(): boolean {
  if (typeof window === 'undefined') return false;
  return window.speechSynthesis?.speaking ?? false;
}
