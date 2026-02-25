// Pronunciation mode store
import { create } from 'zustand';
import { compareTranscripts, type WordResult } from '@/lib/transcript-compare';

export interface PronunciationAttempt {
  sentence: string;
  spoken: string;
  accuracy: number;
  words: WordResult[];
}

interface PronunciationState {
  targetSentence: string;
  spokenTranscript: string;
  results: WordResult[];
  accuracy: number;
  attempts: PronunciationAttempt[];
  currentCategory: string;
  isGenerating: boolean;
  hasResult: boolean;

  // Actions
  setTarget: (sentence: string) => void;
  setSpoken: (transcript: string) => void;
  evaluate: () => void;
  setGenerating: (value: boolean) => void;
  setCategory: (category: string) => void;
  clearResult: () => void;
  reset: () => void;
}

export const usePronunciationStore = create<PronunciationState>((set, get) => ({
  targetSentence: '',
  spokenTranscript: '',
  results: [],
  accuracy: 0,
  attempts: [],
  currentCategory: '',
  isGenerating: false,
  hasResult: false,

  setTarget: (sentence) => set({ targetSentence: sentence, hasResult: false, spokenTranscript: '', results: [], accuracy: 0 }),

  setSpoken: (transcript) => set({ spokenTranscript: transcript }),

  evaluate: () => {
    const { targetSentence, spokenTranscript } = get();
    if (!targetSentence || !spokenTranscript) return;

    const { words, accuracy } = compareTranscripts(targetSentence, spokenTranscript);

    const attempt: PronunciationAttempt = {
      sentence: targetSentence,
      spoken: spokenTranscript,
      accuracy,
      words,
    };

    set((state) => ({
      results: words,
      accuracy,
      hasResult: true,
      attempts: [...state.attempts, attempt],
    }));
  },

  setGenerating: (value) => set({ isGenerating: value }),

  setCategory: (category) => set({ currentCategory: category }),

  clearResult: () => set({ hasResult: false, spokenTranscript: '', results: [], accuracy: 0 }),

  reset: () => set({
    targetSentence: '',
    spokenTranscript: '',
    results: [],
    accuracy: 0,
    attempts: [],
    currentCategory: '',
    isGenerating: false,
    hasResult: false,
  }),
}));
