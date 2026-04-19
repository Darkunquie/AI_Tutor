'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceInput } from '@/components/chat/VoiceInput';
import { usePronunciationStore } from '@/stores/pronunciationStore';
import { useSessionStore, formatDuration } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { speakText, stopSpeaking, loadVoices, isTTSSupported, warmUpSpeechEngine } from '@/lib/speech';
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
    targetSentence, spokenTranscript, results, accuracy, attempts,
    isGenerating, hasResult, setTarget, setGenerating, clearResult,
  } = usePronunciationStore();

  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  useEffect(() => {
    const initTTS = async () => {
      const supported = isTTSSupported();
      setTtsSupported(supported);
      if (supported) { await loadVoices(); }
    };
    initTTS();
  }, []);

  useEffect(() => {
    if (!isActive) { return; }
    const interval = setInterval(() => updateDuration(), 1000);
    return () => clearInterval(interval);
  }, [isActive, updateDuration]);

  useEffect(() => {
    if (!targetSentence && !isGenerating && sessionId) { generateSentence(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const generateSentence = useCallback(async () => {
    if (!sessionId || isGenerating) { return; }
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
      historyRef.current = [
        ...historyRef.current,
        { role: 'user' as const, content: 'Generate a sentence.' },
        { role: 'assistant' as const, content: sentence },
      ];
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
    warmUpSpeechEngine();
    if (isSpeakingState) {
      stopSpeakingRef.current?.();
      stopSpeaking();
      setIsSpeakingState(false);
      return;
    }
    if (!targetSentence) { return; }
    const { stop } = speakText(targetSentence, level, {
      onStart: () => setIsSpeakingState(true),
      onEnd: () => setIsSpeakingState(false),
    });
    stopSpeakingRef.current = stop;
  };

  const handleTranscript = (text: string, pronunciationData?: PronunciationResult, _fillerWords?: FillerWordDetection[]) => {
    if (pronunciationData) { addPronunciationScore(pronunciationData.score); }
    incrementMessageCount();
    usePronunciationStore.getState().setSpoken(text);
    usePronunciationStore.getState().evaluate();
  };

  const handleTryAgain = () => { clearResult(); };
  const handleNextSentence = () => { clearResult(); generateSentence(); };
  const handleEndSession = () => { stopSpeaking(); onEndSession?.(); };

  const getAccuracyStyle = (acc: number) => {
    if (acc >= 80) { return { color: 'text-[#b4e3b2]', bg: 'bg-[#b4e3b2]/10', label: 'Excellent!' }; }
    if (acc >= 60) { return { color: 'text-[#f2be8c]', bg: 'bg-[#f2be8c]/10', label: 'Good effort!' }; }
    return { color: 'text-[#ffb4ab]', bg: 'bg-[#ffb4ab]/10', label: 'Keep practicing!' };
  };

  const avgAccuracy = attempts.length > 0
    ? Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)
    : 0;

  return (
    <div className="flex h-full flex-col bg-[#0E0E10] text-[#E5E1E4]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#50453B]/20 px-6 py-3 bg-[#131315]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#D4A373]/10 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A373] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D4A373]" />
            </span>
            <span className="text-sm font-semibold text-[#D4A373]">Pronunciation</span>
          </div>
          {context?.topic && (
            <span className="rounded-full bg-[#201F21] px-3 py-1 text-xs text-[#D4C4B7] border border-[#50453B]/20">
              {context.topic}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex h-10 items-center gap-2 rounded-full bg-[#1B1B1D] px-4 text-sm text-[#E5E1E4] border border-[#50453B]/20">
            <span className="material-symbols-outlined text-[18px] text-[#D4A373]">schedule</span>
            {formatDuration(duration)}
          </div>
          {attempts.length > 0 && (
            <div className="flex h-10 items-center gap-2 rounded-full bg-[#1B1B1D] px-4 text-sm text-[#E5E1E4] border border-[#50453B]/20">
              <span className="material-symbols-outlined text-[18px] text-[#D4A373]">trending_up</span>
              {avgAccuracy}% avg
            </div>
          )}
          <button
            onClick={handleEndSession}
            className="flex h-10 items-center gap-2 rounded-full bg-[#ffb4ab]/10 px-4 text-sm font-bold text-[#ffb4ab] hover:bg-[#ffb4ab]/20 transition-colors border border-[#ffb4ab]/20"
          >
            <span className="material-symbols-outlined text-[18px]">stop_circle</span>
            End
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
          {/* Target sentence card */}
          <div className="bg-[#1B1B1D] rounded-xl border border-[#50453B]/15 p-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4C4B7]">
                Read this sentence aloud
              </h3>
              <span className="text-xs text-[#50453B]">#{attempts.length + 1}</span>
            </div>

            {isGenerating ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-[#D4A373] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <p className="font-serif text-2xl text-[#F5F2EC] leading-relaxed">
                {targetSentence || 'Loading...'}
              </p>
            )}

            {targetSentence && ttsSupported && (
              <button
                onClick={handleListen}
                className={`mt-5 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  isSpeakingState
                    ? 'bg-[#D4A373] text-[#0E0E10]'
                    : 'bg-[#D4A373]/10 text-[#D4A373] hover:bg-[#D4A373]/20 border border-[#D4A373]/20'
                }`}
              >
                <span className="material-symbols-outlined text-lg">
                  {isSpeakingState ? 'stop' : 'volume_up'}
                </span>
                {isSpeakingState ? 'Stop' : 'Listen'}
              </button>
            )}
          </div>

          {/* Mic area */}
          {targetSentence && !hasResult && !isGenerating && (
            <div className="flex flex-col items-center py-6">
              <p className="text-sm text-[#9A948A] mb-4">Tap the mic and read the sentence above</p>
              <VoiceInput onTranscript={handleTranscript} disabled={isGenerating} />
            </div>
          )}

          {/* Results */}
          {hasResult && (
            <div className="space-y-6">
              {/* Accuracy score */}
              <div className={`rounded-xl p-8 text-center ${getAccuracyStyle(accuracy).bg} border border-[#50453B]/10`}>
                <div className={`font-serif text-6xl font-bold ${getAccuracyStyle(accuracy).color}`}>
                  {accuracy}%
                </div>
                <p className={`mt-2 text-sm font-semibold ${getAccuracyStyle(accuracy).color}`}>
                  {getAccuracyStyle(accuracy).label}
                </p>
              </div>

              {/* Word breakdown */}
              <div className="bg-[#1B1B1D] rounded-xl border border-[#50453B]/15 p-6">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4C4B7] mb-4">
                  Word-by-word results
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.map((result, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1.5 rounded text-sm font-medium ${
                        result.status === 'correct'
                          ? 'bg-[#b4e3b2]/10 text-[#b4e3b2] border border-[#b4e3b2]/20'
                          : result.status === 'incorrect'
                          ? 'bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/20 line-through'
                          : 'bg-[#353437] text-[#50453B] line-through'
                      }`}
                    >
                      {result.word}
                    </span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-[#50453B]/15">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4C4B7] mb-2">What you said</p>
                  <p className="text-sm text-[#9A948A] italic font-serif">&ldquo;{spokenTranscript}&rdquo;</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleTryAgain}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#201F21] text-[#D4C4B7] font-semibold text-sm hover:bg-[#2A2A2C] transition-colors border border-[#50453B]/20"
                >
                  <span className="material-symbols-outlined text-lg">replay</span>
                  Try Again
                </button>
                <button
                  onClick={handleNextSentence}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#D4A373] text-[#0E0E10] font-semibold text-sm hover:bg-[#DDB389] transition-colors"
                >
                  Next Sentence
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Attempt history */}
          {attempts.length > 0 && (
            <div className="bg-[#1B1B1D] rounded-xl border border-[#50453B]/15 p-6">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4C4B7] mb-4">
                Session Progress ({attempts.length} attempt{attempts.length !== 1 ? 's' : ''})
              </h4>
              <div className="space-y-2">
                {attempts.slice().reverse().map((attempt, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#201F21]/50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                      attempt.accuracy >= 80
                        ? 'bg-[#b4e3b2]/10 text-[#b4e3b2]'
                        : attempt.accuracy >= 60
                        ? 'bg-[#f2be8c]/10 text-[#f2be8c]'
                        : 'bg-[#ffb4ab]/10 text-[#ffb4ab]'
                    }`}>
                      {attempt.accuracy}%
                    </div>
                    <p className="flex-1 text-sm text-[#D4C4B7] truncate">{attempt.sentence}</p>
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
