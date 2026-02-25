'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceInput } from '@/components/chat/VoiceInput';
import { usePronunciationStore } from '@/stores/pronunciationStore';
import { useSessionStore, formatDuration } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { speakText, stopSpeaking, loadVoices, isTTSSupported } from '@/lib/speech';
import { api } from '@/lib/api-client';
import type { PronunciationResult, FillerWordDetection } from '@/lib/types';
import { logger } from '@/lib/utils';

interface PronunciationScreenProps {
  onEndSession?: () => void;
}

export function PronunciationScreen({ onEndSession }: PronunciationScreenProps) {
  const [ttsSupported, setTtsSupported] = useState(false);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const stopSpeakingRef = useRef<(() => void) | null>(null);

  const { sessionId, level, context } = useChatStore();
  const { duration, isActive, updateDuration, incrementMessageCount, addPronunciationScore } = useSessionStore();

  const {
    targetSentence,
    spokenTranscript,
    results,
    accuracy,
    attempts,
    isGenerating,
    hasResult,
    setTarget,
    setSpoken,
    evaluate,
    setGenerating,
    clearResult,
  } = usePronunciationStore();

  // History for AI context
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Initialize TTS
  useEffect(() => {
    const initTTS = async () => {
      const supported = isTTSSupported();
      setTtsSupported(supported);
      if (supported) {
        await loadVoices();
      }
    };
    initTTS();
  }, []);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => updateDuration(), 1000);
    return () => clearInterval(interval);
  }, [isActive, updateDuration]);

  // Generate first sentence on mount
  useEffect(() => {
    if (!targetSentence && !isGenerating && sessionId) {
      generateSentence();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const generateSentence = useCallback(async () => {
    if (!sessionId || isGenerating) return;

    setGenerating(true);
    try {
      const result = await api.chat.send({
        message: 'Generate a sentence.',
        mode: 'PRONUNCIATION',
        level,
        sessionId,
        context: context || {},
        history: historyRef.current,
      });

      const sentence = result.reply.trim().replace(/^["']|["']$/g, '');
      setTarget(sentence);

      // Track in history so AI doesn't repeat
      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const, content: 'Generate a sentence.' },
        { role: 'assistant' as const, content: sentence },
      ];

      // Keep history manageable
      if (historyRef.current.length > 20) {
        historyRef.current = historyRef.current.slice(-10);
      }
    } catch (err) {
      logger.error('Failed to generate sentence:', err);
    } finally {
      setGenerating(false);
    }
  }, [sessionId, isGenerating, level, context, setTarget, setGenerating]);

  const handleListen = () => {
    if (isSpeakingState) {
      stopSpeakingRef.current?.();
      stopSpeaking();
      setIsSpeakingState(false);
      return;
    }

    if (!targetSentence) return;

    const { stop } = speakText(targetSentence, level, {
      onStart: () => setIsSpeakingState(true),
      onEnd: () => setIsSpeakingState(false),
    });
    stopSpeakingRef.current = stop;
  };

  const handleTranscript = (text: string, pronunciationData?: PronunciationResult, _fillerWords?: FillerWordDetection[]) => {
    setSpoken(text);
    if (pronunciationData) {
      addPronunciationScore(pronunciationData.score);
    }
    incrementMessageCount();

    // Auto-evaluate after receiving transcript
    // Need to call evaluate after state updates
    setTimeout(() => {
      usePronunciationStore.getState().evaluate();
    }, 50);
  };

  const handleTryAgain = () => {
    clearResult();
  };

  const handleNextSentence = () => {
    clearResult();
    generateSentence();
  };

  const handleEndSession = () => {
    stopSpeaking();
    onEndSession?.();
  };

  const getAccuracyStyle = (acc: number) => {
    if (acc >= 80) return { ring: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', label: 'Excellent!' };
    if (acc >= 60) return { ring: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', label: 'Good effort!' };
    return { ring: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', label: 'Keep practicing!' };
  };

  const avgAccuracy = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)
    : 0;

  return (
    <div className="flex h-full flex-col bg-[#f5f7f8] dark:bg-[#101722]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-teal-500/10 px-4 py-1.5 text-teal-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <span className="text-sm font-semibold">Pronunciation</span>
          </div>

          {context?.topic && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {context.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            {formatDuration(duration)}
          </div>

          {/* Attempts counter */}
          {attempts.length > 0 && (
            <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
              {avgAccuracy}% avg
            </div>
          )}

          {/* End session */}
          <button
            onClick={handleEndSession}
            className="flex h-10 items-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">stop_circle</span>
            End
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Target sentence card */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Read this sentence aloud
              </h3>
              <span className="text-xs text-slate-400">
                #{attempts.length + 1}
              </span>
            </div>

            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <p className="text-2xl font-medium text-slate-900 dark:text-white leading-relaxed">
                {targetSentence || 'Loading...'}
              </p>
            )}

            {/* Listen button */}
            {targetSentence && ttsSupported && (
              <button
                onClick={handleListen}
                className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isSpeakingState
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isSpeakingState ? 'stop' : 'volume_up'}
                </span>
                {isSpeakingState ? 'Stop' : 'Listen'}
              </button>
            )}
          </div>

          {/* Mic / recording area */}
          {targetSentence && !hasResult && !isGenerating && (
            <div className="flex flex-col items-center py-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Tap the mic and read the sentence above
              </p>
              <VoiceInput
                onTranscript={handleTranscript}
                disabled={isGenerating}
              />
            </div>
          )}

          {/* Results */}
          {hasResult && (
            <div className="space-y-4">
              {/* Accuracy score */}
              <div className={`rounded-2xl p-6 text-center ${getAccuracyStyle(accuracy).bg}`}>
                <div className={`text-5xl font-black ${getAccuracyStyle(accuracy).ring}`}>
                  {accuracy}%
                </div>
                <p className={`mt-1 text-sm font-semibold ${getAccuracyStyle(accuracy).text}`}>
                  {getAccuracyStyle(accuracy).label}
                </p>
              </div>

              {/* Word-by-word breakdown */}
              <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                  Word-by-word results
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.map((result, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                        result.status === 'correct'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                          : result.status === 'incorrect'
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 line-through'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 line-through'
                      }`}
                    >
                      {result.word}
                    </span>
                  ))}
                </div>

                {/* What you said */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    What you said
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">
                    &ldquo;{spokenTranscript}&rdquo;
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleTryAgain}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">replay</span>
                  Try Again
                </button>
                <button
                  onClick={handleNextSentence}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 text-white font-semibold text-sm hover:bg-teal-600 transition-colors shadow-lg shadow-teal-500/20"
                >
                  Next Sentence
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Attempt history */}
          {attempts.length > 0 && (
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">
                Session Progress ({attempts.length} attempt{attempts.length !== 1 ? 's' : ''})
              </h4>
              <div className="space-y-2">
                {attempts.slice().reverse().map((attempt, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      attempt.accuracy >= 80
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                        : attempt.accuracy >= 60
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                    }`}>
                      {attempt.accuracy}%
                    </div>
                    <p className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">
                      {attempt.sentence}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
