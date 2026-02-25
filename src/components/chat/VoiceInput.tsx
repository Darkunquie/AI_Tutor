'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PronunciationResult, FillerWordDetection } from '@/lib/types';
import { detectFillerWords } from '@/lib/filler-words';
import { stopSpeaking } from '@/lib/speech';
import { logger } from '@/lib/utils';

interface VoiceInputProps {
  onTranscript: (text: string, pronunciationData?: PronunciationResult, fillerWords?: FillerWordDetection[]) => void;
  onInterimTranscript?: (text: string, confidence?: number) => void;
  disabled?: boolean;
}

// TypeScript declarations for Web Speech API
interface ISpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionResultList {
  length: number;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: ISpeechRecognitionAlternative;
}

interface ISpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: ISpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => void) | null;
  onerror: ((this: ISpeechRecognition, ev: Event & { error: string }) => void) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export function VoiceInput({
  onTranscript,
  onInterimTranscript,
  disabled = false,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Stable refs to avoid recreating recognition when callbacks change
  const onTranscriptRef = useRef(onTranscript);
  const onInterimTranscriptRef = useRef(onInterimTranscript);
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onInterimTranscriptRef.current = onInterimTranscript; }, [onInterimTranscript]);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || disabled) return;

    // Abort any previous recognition instance to avoid "aborted" errors
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }

    // Stop any ongoing TTS — browser can't do TTS and STT simultaneously
    stopSpeaking();

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
    };

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      let finalConfidence = 0;
      let confidenceSum = 0;
      let confidenceCount = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          final += transcript;
          finalConfidence = confidence;
          confidenceSum += confidence;
          confidenceCount++;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
        const currentConfidence = event.results[event.results.length - 1]?.[0]?.confidence;
        onInterimTranscriptRef.current?.(interim, currentConfidence);
      }

      if (final) {
        setInterimText('');

        const avgConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : finalConfidence;
        const score = Math.round(avgConfidence * 100);

        const fillerWords = detectFillerWords(final);

        const pronunciationData: PronunciationResult = {
          transcript: final,
          confidence: avgConfidence,
          score: score,
          lowConfidenceWords: [],
        };

        onTranscriptRef.current(final, pronunciationData, fillerWords);
      }
    };

    recognition.onerror = (event: Event & { error: string }) => {
      // "aborted" and "no-speech" are benign — don't log them as errors
      if (event.error !== 'aborted' && event.error !== 'no-speech') {
        logger.error('Speech recognition error:', event.error);
      }
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, disabled]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400">
        <span className="material-symbols-outlined text-[28px]">mic_off</span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center">
      {/* Interim transcript preview (shown above the button area) */}
      {interimText && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <p className="text-sm italic text-slate-400 animate-pulse">
            &ldquo;{interimText}...&rdquo;
          </p>
        </div>
      )}

      {/* Mic button */}
      <button
        onClick={toggleListening}
        disabled={disabled}
        aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
        className={`group relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all active:scale-95 ${
          isListening
            ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
            : 'bg-[#3c83f6] text-white shadow-[#3c83f6]/20 hover:bg-[#3c83f6]/90'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className="material-symbols-outlined text-[32px]">mic</span>

        {/* Pulse effect when listening */}
        {isListening && (
          <span className="absolute -z-10 h-full w-full animate-ping rounded-full bg-red-500 opacity-30" />
        )}
      </button>

      {/* Status label */}
      {isListening && (
        <span className="mt-2 text-[10px] font-bold uppercase tracking-widest text-red-500">
          Recording
        </span>
      )}
    </div>
  );
}
