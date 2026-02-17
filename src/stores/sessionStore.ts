// Session store for tracking stats and timer
import { create } from 'zustand';
import type { ErrorType, Correction } from '@/lib/types';
import { ScoreCalculator } from '@/lib/services/ScoreCalculator';

interface SessionState {
  // Timer
  startTime: number | null;
  duration: number; // in seconds
  isActive: boolean;
  timerInterval: NodeJS.Timeout | null;

  // Stats
  messageCount: number;
  errorCounts: Record<ErrorType, number>;
  corrections: Correction[];
  vocabularyGained: string[];

  // Filler & pronunciation tracking (for accurate score preview)
  fillerWordCount: number;
  pronunciationScores: number[];

  // Actions
  startSession: () => void;
  endSession: () => void;
  updateDuration: () => void;
  setTimerInterval: (interval: NodeJS.Timeout) => void;
  clearTimerInterval: () => void;
  incrementMessageCount: () => void;
  addCorrection: (correction: Correction) => void;
  addVocabulary: (word: string) => void;
  addFillerCount: (count: number) => void;
  addPronunciationScore: (score: number) => void;
  reset: () => void;

  // Computed
  getScore: () => number;
  getErrorBreakdown: () => Record<ErrorType, number>;
}

const initialErrorCounts: Record<ErrorType, number> = {
  GRAMMAR: 0,
  VOCABULARY: 0,
  STRUCTURE: 0,
  FLUENCY: 0,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  // Initial state
  startTime: null,
  duration: 0,
  isActive: false,
  timerInterval: null,
  messageCount: 0,
  errorCounts: { ...initialErrorCounts },
  corrections: [],
  vocabularyGained: [],
  fillerWordCount: 0,
  pronunciationScores: [],

  // Actions
  startSession: () =>
    set({
      startTime: Date.now(),
      isActive: true,
      duration: 0,
      messageCount: 0,
      errorCounts: { ...initialErrorCounts },
      corrections: [],
      vocabularyGained: [],
      fillerWordCount: 0,
      pronunciationScores: [],
    }),

  endSession: () => {
    const state = get();
    // Clear timer interval if it exists
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    if (state.startTime) {
      const duration = Math.floor((Date.now() - state.startTime) / 1000);
      set({ isActive: false, duration, timerInterval: null });
    }
  },

  updateDuration: () => {
    const state = get();
    if (state.startTime && state.isActive) {
      const duration = Math.floor((Date.now() - state.startTime) / 1000);
      set({ duration });
    }
  },

  setTimerInterval: (interval) => set({ timerInterval: interval }),

  clearTimerInterval: () => {
    const state = get();
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      set({ timerInterval: null });
    }
  },

  incrementMessageCount: () =>
    set((state) => ({ messageCount: state.messageCount + 1 })),

  addCorrection: (correction) =>
    set((state) => {
      const MAX_CORRECTIONS = 200;
      const updated = [...state.corrections, correction];
      return {
        corrections: updated.length > MAX_CORRECTIONS ? updated.slice(-MAX_CORRECTIONS) : updated,
        errorCounts: {
          ...state.errorCounts,
          [correction.type]: state.errorCounts[correction.type] + 1,
        },
      };
    }),

  addVocabulary: (word) =>
    set((state) => {
      if (!state.vocabularyGained.includes(word.toLowerCase())) {
        return {
          vocabularyGained: [...state.vocabularyGained, word.toLowerCase()],
        };
      }
      return state;
    }),

  addFillerCount: (count) =>
    set((state) => ({ fillerWordCount: state.fillerWordCount + count })),

  addPronunciationScore: (score) =>
    set((state) => ({ pronunciationScores: [...state.pronunciationScores, score] })),

  reset: () => {
    const state = get();
    // Clear timer interval if it exists
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
    }
    set({
      startTime: null,
      duration: 0,
      isActive: false,
      timerInterval: null,
      messageCount: 0,
      errorCounts: { ...initialErrorCounts },
      corrections: [],
      vocabularyGained: [],
      fillerWordCount: 0,
      pronunciationScores: [],
    });
  },

  // Computed values — uses ScoreCalculator for consistency with server
  getScore: () => {
    const state = get();

    // Return 0 if no messages yet (avoid misleading 100 score)
    if (state.messageCount === 0) {
      return 0;
    }

    const avgPronunciation = state.pronunciationScores.length > 0
      ? state.pronunciationScores.reduce((a, b) => a + b, 0) / state.pronunciationScores.length
      : null;

    return ScoreCalculator.calculateSessionScore({
      errorCounts: state.errorCounts,
      messageCount: state.messageCount,
      fillerWordCount: state.fillerWordCount,
      avgPronunciation,
    });
  },

  getErrorBreakdown: () => get().errorCounts,
}));

// Helper to format duration
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
