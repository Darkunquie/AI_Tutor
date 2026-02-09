'use client';

import { useRef, useEffect, useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { VoiceInput } from './VoiceInput';
import { useChatStore, messagesToHistory } from '@/stores/chatStore';
import { useSessionStore, formatDuration } from '@/stores/sessionStore';
import { speakText, stopSpeaking, loadVoices, isTTSSupported } from '@/lib/speech';
import { api } from '@/lib/api-client';
import type { Message, Correction, PronunciationResult, FillerWordDetection } from '@/lib/types';
import { logBackgroundError, logger } from '@/lib/utils';

interface ChatScreenProps {
  onEndSession?: () => void;
}

export function ChatScreen({ onEndSession }: ChatScreenProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [textInput, setTextInput] = useState('');
  const stopSpeakingRef = useRef<(() => void) | null>(null);

  const {
    sessionId,
    mode,
    level,
    context,
    messages,
    isLoading,
    error,
    addMessage,
    setLoading,
    setError,
  } = useChatStore();

  const {
    duration,
    isActive,
    updateDuration,
    incrementMessageCount,
    addCorrection,
  } = useSessionStore();

  // Initialize TTS on mount
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update timer every second
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [isActive, updateDuration]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (stopSpeakingRef.current) {
        stopSpeakingRef.current();
      }
      stopSpeaking();
    };
  }, []);

  const parseCorrections = (response: string): Correction[] => {
    const corrections: Correction[] = [];
    const patterns = [
      /["']([^"']+)["']\s*→\s*["']([^"']+)["']/g,
      /instead of ["']([^"']+)["'],?\s*(?:you could|try|say)\s*["']([^"']+)["']/gi,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        corrections.push({
          type: 'GRAMMAR',
          original: match[1],
          corrected: match[2],
          explanation: 'Suggested correction from your tutor',
        });
      }
    }
    return corrections;
  };

  const handleSpeak = (text: string) => {
    if (!ttsEnabled || !ttsSupported || !text) return;

    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
      stopSpeakingRef.current = null;
    }

    const { stop } = speakText(text, level, {
      onStart: () => setIsSpeakingState(true),
      onEnd: () => {
        setIsSpeakingState(false);
        stopSpeakingRef.current = null;
      },
      onError: () => {
        setIsSpeakingState(false);
        stopSpeakingRef.current = null;
      },
    });

    stopSpeakingRef.current = stop;
  };

  const sendMessage = async (
    text: string,
    pronunciationData?: PronunciationResult,
    fillerWords?: FillerWordDetection[],
  ) => {
    if (!sessionId || !mode || isLoading) return;

    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
      stopSpeakingRef.current = null;
    }
    setIsSpeakingState(false);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'USER',
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    incrementMessageCount();
    setLoading(true);
    setError(null);

    try {
      const { reply } = await api.chat.send({
        message: text,
        mode,
        level,
        sessionId,
        context,
        history: messagesToHistory(messages),
      });

      const corrections = parseCorrections(reply);
      if (corrections.length > 0) {
        userMessage.corrections = corrections;
        corrections.forEach(addCorrection);
      }

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'AI',
        content: reply,
        timestamp: new Date(),
      };
      addMessage(aiMessage);

      // Save user message to DB (fire-and-forget)
      const fillerCount = fillerWords?.reduce((sum, f) => sum + f.count, 0) || 0;
      api.messages.save({
        sessionId,
        role: 'USER',
        content: text,
        corrections: corrections.length > 0 ? corrections : undefined,
        pronunciationScore: pronunciationData?.score,
        fillerWordCount: fillerCount,
      }).catch(logBackgroundError('save user message'));

      // Save AI message to DB (fire-and-forget)
      api.messages.save({
        sessionId,
        role: 'AI',
        content: reply,
      }).catch(logBackgroundError('save AI message'));

      if (reply) {
        handleSpeak(reply);
      }
    } catch (err) {
      logger.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceTranscript = (
    text: string,
    pronunciationData?: PronunciationResult,
    fillerWords?: FillerWordDetection[],
  ) => {
    sendMessage(text, pronunciationData, fillerWords);
  };

  const handleTextSend = () => {
    const trimmed = textInput.trim();
    if (trimmed && !isLoading) {
      sendMessage(trimmed);
      setTextInput('');
    }
  };

  const handleTextKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSend();
    }
  };

  const toggleTTS = () => {
    if (isSpeakingState && stopSpeakingRef.current) {
      stopSpeakingRef.current();
      stopSpeakingRef.current = null;
      setIsSpeakingState(false);
    }
    setTtsEnabled(!ttsEnabled);
  };

  const handleStopSpeaking = () => {
    if (stopSpeakingRef.current) {
      stopSpeakingRef.current();
      stopSpeakingRef.current = null;
    }
    stopSpeaking();
    setIsSpeakingState(false);
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'FREE_TALK': return 'Free Talk';
      case 'ROLE_PLAY': return 'Role Play';
      case 'DEBATE': return 'Debate';
      case 'GRAMMAR_FIX': return 'Grammar Fix';
      default: return 'Practice';
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#f5f7f8] dark:bg-[#101722] text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-[#101722]/80 md:px-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onEndSession}
            aria-label="Go back"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold tracking-tight">AI English Tutor</h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Jarvis AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode badge */}
          <div className="flex items-center gap-2 rounded-full bg-[#3c83f6]/10 px-4 py-1.5 text-[#3c83f6]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#3c83f6] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3c83f6]" />
            </span>
            <span className="text-sm font-semibold">{getModeLabel()}</span>
          </div>

          {/* Timer */}
          <div className="flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* End Session */}
        <button
          onClick={onEndSession}
          className="flex h-10 items-center justify-center rounded-xl bg-red-50 px-4 text-sm font-bold text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 transition-colors"
        >
          <span className="truncate">End Session</span>
        </button>
      </header>

      {/* Speaking indicator */}
      {isSpeakingState && (
        <div className="bg-[#3c83f6]/5 border-b border-[#3c83f6]/20 px-4 py-2 flex items-center justify-between dark:bg-[#3c83f6]/10">
          <div className="flex items-center gap-2 text-[#3c83f6]">
            <div className="flex gap-0.5 items-end h-4">
              <span className="w-1 h-[60%] bg-[#3c83f6] rounded-full animate-pulse" />
              <span className="w-1 h-full bg-[#3c83f6] rounded-full animate-pulse [animation-delay:0.1s]" />
              <span className="w-1 h-[40%] bg-[#3c83f6] rounded-full animate-pulse [animation-delay:0.2s]" />
              <span className="w-1 h-[80%] bg-[#3c83f6] rounded-full animate-pulse [animation-delay:0.3s]" />
            </div>
            <span className="text-sm font-medium">AI is speaking...</span>
          </div>
          <button
            onClick={handleStopSpeaking}
            aria-label="Stop speaking"
            className="text-sm text-[#3c83f6] hover:text-[#3c83f6]/80 font-semibold"
          >
            Stop
          </button>
        </div>
      )}

      {/* Messages area */}
      <main className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-8">
        <div className="mx-auto flex max-w-4xl flex-col gap-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#3c83f6]/10 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-[#3c83f6]">
                  {mode === 'FREE_TALK' ? 'forum' : mode === 'ROLE_PLAY' ? 'theater_comedy' : mode === 'DEBATE' ? 'gavel' : 'spellcheck'}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">Start Your Practice!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                {mode === 'FREE_TALK' && 'Talk about anything you like. Speak or type to begin the conversation.'}
                {mode === 'ROLE_PLAY' && 'Play out the scenario naturally. The AI will stay in character.'}
                {mode === 'DEBATE' && 'State your position on the topic. The AI will argue the opposing side.'}
                {mode === 'GRAMMAR_FIX' && 'Write any sentence and get instant grammar feedback.'}
              </p>
              {context.topic && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[16px]">topic</span>
                  {context.topic}
                </div>
              )}
              {context.scenario && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[16px]">theaters</span>
                  {context.scenario}
                </div>
              )}
              {context.debateTopic && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-sm text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-[16px]">gavel</span>
                  {context.debateTopic}
                </div>
              )}
              {ttsSupported && (
                <p className={`mt-4 text-xs font-medium ${ttsEnabled ? 'text-[#3c83f6]' : 'text-slate-400'}`}>
                  {ttsEnabled ? 'AI voice is enabled' : 'AI voice is muted'}
                </p>
              )}
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3c83f6] text-white shadow-lg shadow-[#3c83f6]/20">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-[13px] font-semibold text-slate-500 dark:text-slate-400 ml-1">Jarvis</p>
                <div className="rounded-2xl rounded-tl-none bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 bg-slate-300 dark:bg-slate-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center gap-2 text-red-500 dark:text-red-400 text-sm font-medium">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
              <button onClick={() => setError(null)} className="ml-1 underline hover:no-underline">
                Dismiss
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Voice & Input Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-[#101722] md:px-10">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex items-center gap-4">
            {/* Text Input */}
            <div className="relative flex-1">
              <input
                className="w-full rounded-xl border-none bg-slate-100 px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-[#3c83f6] dark:bg-slate-800 dark:text-slate-100 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder={mode === 'GRAMMAR_FIX' ? 'Write a sentence to check...' : 'Type your message...'}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleTextKeyDown}
                disabled={isLoading}
              />
              <button
                onClick={handleTextSend}
                disabled={isLoading || !textInput.trim()}
                aria-label="Send message"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3c83f6] text-white hover:bg-[#3c83f6]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>

            {/* Voice Button */}
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={isLoading || isSpeakingState}
            />

            {/* Settings/Tune Button */}
            <button
              onClick={toggleTTS}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 transition-colors"
              aria-label={ttsEnabled ? 'Mute AI voice' : 'Enable AI voice'}
            >
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
