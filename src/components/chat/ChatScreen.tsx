'use client';

import { useRef, useEffect, useState } from 'react';
import { VoiceInput } from './VoiceInput';
import { useChatStore, messagesToHistory } from '@/stores/chatStore';
import { useSessionStore, formatDuration } from '@/stores/sessionStore';
import {
  speakText,
  stopSpeaking,
  loadVoices,
  isTTSSupported,
  warmUpSpeechEngine,
  isSpeechWarmedUp,
} from '@/lib/speech';
import { api } from '@/lib/api-client';
import type { Message, PronunciationResult, FillerWordDetection, Correction } from '@/lib/types';
import { CorrectionParser } from '@/lib/services/CorrectionParser';
import { logger } from '@/lib/utils';

interface ChatScreenProps {
  onEndSession?: () => void;
}

const MODE_LABEL: Record<string, string> = {
  FREE_TALK: 'Free Talk',
  ROLE_PLAY: 'Role Play',
  DEBATE: 'Debate',
  GRAMMAR_FIX: 'Grammar Fix',
  PRONUNCIATION: 'Pronunciation',
};

export function ChatScreen({ onEndSession }: ChatScreenProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isSpeakingState, setIsSpeakingState] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [textInput, setTextInput] = useState('');
  const stopSpeakingRef = useRef<(() => void) | null>(null);
  const sendingRef = useRef(false);
  const greetingRequestedRef = useRef(false);

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
    streamingMessageId,
    startStreaming,
    appendStreamToken,
    finishStreaming,
  } = useChatStore();

  const {
    duration,
    isActive,
    updateDuration,
    incrementMessageCount,
    addCorrection,
    addVocabulary,
    addFillerCount,
    addPronunciationScore,
  } = useSessionStore();

  useEffect(() => {
    const initTTS = async () => {
      const supported = isTTSSupported();
      setTtsSupported(supported);
      if (supported) await loadVoices();
    };
    initTTS();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [isActive, updateDuration]);

  useEffect(() => {
    return () => {
      if (stopSpeakingRef.current) stopSpeakingRef.current();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    if (
      mode === 'GRAMMAR_FIX' &&
      sessionId &&
      messages.length === 0 &&
      !isLoading &&
      !greetingRequestedRef.current
    ) {
      greetingRequestedRef.current = true;
      requestGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, sessionId, messages.length, isLoading]);

  const requestGreeting = async () => {
    if (!sessionId || !mode) return;
    setLoading(true);
    try {
      const { reply } = await api.chat.send({
        message: '[GREETING]',
        mode,
        level,
        sessionId,
        context,
        history: [],
      });
      const aiMessage: Message = {
        id: `ai-greeting-${Date.now()}`,
        role: 'AI',
        content: reply,
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      api.messages.save({ sessionId, role: 'AI', content: reply })
        .catch(err => logger.error('Failed to save greeting:', err));
      handleSpeak(reply);
    } catch (err) {
      logger.error('Failed to get greeting:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!ttsEnabled || !ttsSupported || !text) return;
    if (!isSpeechWarmedUp()) return;
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
    if (!sessionId || !mode || isLoading || sendingRef.current) return;
    sendingRef.current = true;

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

    const aiMessageId = `ai-${Date.now()}`;

    try {
      const currentMessages = useChatStore.getState().messages;
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'AI',
        content: '',
        timestamp: new Date(),
      };
      addMessage(aiMessage);
      startStreaming(aiMessageId);

      let reply = '';
      try {
        for await (const token of api.chat.stream({
          message: text,
          mode,
          level,
          sessionId,
          context,
          history: messagesToHistory(currentMessages),
        })) {
          reply += token;
          appendStreamToken(token);
        }
      } catch {
        if (!reply) {
          const result = await api.chat.send({
            message: text,
            mode,
            level,
            sessionId,
            context,
            history: messagesToHistory(currentMessages),
          });
          reply = result.reply;
          useChatStore.getState().updateMessage(aiMessageId, { content: reply });
        }
      } finally {
        finishStreaming();
      }

      const corrections = CorrectionParser.parse(reply);
      useChatStore.getState().updateMessage(userMessage.id, {
        corrections,
        hasBeenChecked: true,
      });
      if (corrections.length > 0) {
        corrections.forEach(addCorrection);
        corrections.forEach(c => {
          if (c.corrected && c.corrected.trim()) {
            c.corrected.trim().split(/\s+/).forEach(token => {
              if (token) addVocabulary(token);
            });
          }
        });
      }

      const fillerCount = fillerWords?.reduce((sum, f) => sum + f.count, 0) || 0;
      try {
        await Promise.all([
          api.messages.save({
            sessionId,
            role: 'USER',
            content: text,
            corrections: corrections.length > 0 ? corrections : undefined,
            pronunciationScore: pronunciationData?.score,
            fillerWordCount: fillerCount,
          }),
          api.messages.save({
            sessionId,
            role: 'AI',
            content: reply,
          }),
        ]);
      } catch (saveErr) {
        logger.error('Failed to save messages:', saveErr);
      }

      if (fillerCount > 0) addFillerCount(fillerCount);
      if (pronunciationData?.score !== undefined) addPronunciationScore(pronunciationData.score);
      if (reply) handleSpeak(reply);
    } catch (err) {
      logger.error('Chat error:', err);
      setError('Failed to send message. Please try again.');
      useChatStore.getState().removeMessage(aiMessageId);
    } finally {
      setLoading(false);
      sendingRef.current = false;
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
      warmUpSpeechEngine();
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
    warmUpSpeechEngine();
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

  const modeLabel = MODE_LABEL[mode ?? ''] ?? 'Practice';

  return (
    <div className="flex h-screen flex-col bg-[#0E0E10] text-[#F5F2EC] font-geist antialiased">
      {/* Top bar */}
      <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#2A2A2E] bg-[#0E0E10] px-8">
        <div className="flex items-center gap-3">
          <span className="font-serif-display text-[18px] tracking-tight">Talkivo</span>
          <span className="h-[5px] w-[5px] rounded-full bg-[#D4A373]" />
          <span className="ml-2 text-[12px] uppercase tracking-[0.14em] text-[#6B665F]">
            {modeLabel}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A373] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#D4A373]" />
            </span>
            <span className="tabular-nums text-[#D4A373]">{formatDuration(duration)}</span>
          </div>
          {ttsSupported && (
            <button
              onClick={toggleTTS}
              className="text-[12px] uppercase tracking-[0.12em] text-[#9A948A] transition-colors hover:text-[#F5F2EC]"
            >
              {ttsEnabled ? 'Voice · on' : 'Voice · off'}
            </button>
          )}
          <button
            onClick={onEndSession}
            className="text-[13px] text-[#B5564C] transition-colors hover:text-[#C56A60]"
          >
            End session
          </button>
        </div>
      </header>

      {/* Speaking indicator */}
      {isSpeakingState && (
        <div className="flex items-center justify-between border-b border-[#2A2A2E] bg-[#D4A373]/5 px-8 py-2 text-[12px] text-[#D4A373]">
          <div className="flex items-center gap-2">
            <span className="flex items-end gap-0.5">
              <span className="h-2 w-0.5 animate-pulse bg-[#D4A373]" />
              <span className="h-3 w-0.5 animate-pulse bg-[#D4A373] [animation-delay:0.1s]" />
              <span className="h-2 w-0.5 animate-pulse bg-[#D4A373] [animation-delay:0.2s]" />
              <span className="h-4 w-0.5 animate-pulse bg-[#D4A373] [animation-delay:0.3s]" />
            </span>
            <span>Tutor is speaking…</span>
          </div>
          <button
            onClick={handleStopSpeaking}
            className="text-[11px] uppercase tracking-[0.12em] hover:text-[#F2C38E]"
          >
            Stop
          </button>
        </div>
      )}

      {/* Transcript */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[760px] px-8 py-20" aria-live="polite">
          {messages.length === 0 && (
            <div className="max-w-[520px]">
              <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                {modeLabel}
              </div>
              <h2 className="font-serif-display text-[32px] leading-[1.15] tracking-[-0.01em] text-[#F5F2EC]">
                {mode === 'FREE_TALK' && 'Say anything. The tutor is listening.'}
                {mode === 'ROLE_PLAY' && 'The scene has started. Jump in.'}
                {mode === 'DEBATE' && 'Make your opening argument.'}
                {mode === 'GRAMMAR_FIX' && 'Write a sentence. Any sentence.'}
              </h2>
              {(context.topic || context.scenario || context.debateTopic) && (
                <div className="mt-6 border-l border-[#D4A373] pl-4 text-[14px] italic leading-[1.5] text-[#9A948A] font-serif-display">
                  {context.topic && <>Topic: <span className="text-[#F5F2EC]">{context.topic}</span></>}
                  {context.scenario && <>Scenario: <span className="text-[#F5F2EC]">{context.scenario}</span></>}
                  {context.debateTopic && (
                    <>Position: <span className="text-[#F5F2EC]">{context.debatePosition}</span> — {context.debateTopic}</>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-12">
            {messages.map((msg) => (
              <EditorialMessage key={msg.id} message={msg} streaming={msg.id === streamingMessageId} />
            ))}

            {isLoading && !streamingMessageId && (
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
                  <span className="h-1 w-1 rounded-full bg-[#D4A373]" />
                  Tutor
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373] animate-pulse" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373] animate-pulse [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4A373] animate-pulse [animation-delay:0.3s]" />
                  <span className="ml-3 text-[12px] italic text-[#9A948A] font-serif-display">
                    thinking…
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between border-l-2 border-[#B5564C] bg-[#B5564C]/10 px-4 py-3 text-[13px] text-[#F5F2EC]">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-[12px] text-[#9A948A] hover:text-[#F5F2EC]"
                >
                  dismiss
                </button>
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input row */}
      <footer className="shrink-0 border-t border-[#2A2A2E] bg-[#0E0E10] px-8 py-5">
        <div className="mx-auto flex max-w-[760px] items-center gap-4">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={isLoading || isSpeakingState}
          />
          <div className="relative flex-1">
            <input
              className="w-full border-0 border-b border-[#3A3A3F] bg-transparent px-0 py-3 text-[15px] text-[#F5F2EC] placeholder-[#6B665F] outline-none transition-colors focus:border-[#D4A373]"
              placeholder={
                mode === 'GRAMMAR_FIX' ? 'Write a sentence to check…' : 'Or type your reply…'
              }
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleTextKeyDown}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleTextSend}
            disabled={isLoading || !textInput.trim()}
            className={
              'text-[11px] uppercase tracking-[0.14em] transition-colors ' +
              (textInput.trim() && !isLoading
                ? 'text-[#D4A373] hover:text-[#DDB389]'
                : 'text-[#3A3A3F]')
            }
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Editorial message — serif for Tutor, sans for User, marginalia     */
/* corrections in the right gutter                                    */
/* ------------------------------------------------------------------ */

function EditorialMessage({ message, streaming }: { message: Message; streaming?: boolean }) {
  const isTutor = message.role === 'AI';
  const corrections: Correction[] = message.corrections ?? [];

  if (isTutor) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#D4A373]">
          <span className="h-1 w-1 rounded-full bg-[#D4A373]" />
          Tutor
        </div>
        <p className="font-serif-display text-[19px] leading-[1.55] text-[#F5F2EC]">
          {message.content || (streaming ? '…' : '')}
        </p>
      </div>
    );
  }

  // User message with optional marginalia corrections
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#6B665F]">You</div>
        <p className="text-[17px] leading-[1.6] text-[#F5F2EC]">
          {renderUserContent(message.content, corrections)}
        </p>
        {message.hasBeenChecked && corrections.length === 0 && (
          <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#7A9A6B]">
            · Clean
          </div>
        )}
      </div>
      {corrections.length > 0 && (
        <div className="col-span-4 pt-7">
          <div className="border-l border-[#D4A373] pl-4 space-y-3">
            {corrections.map((c, i) => (
              <p
                key={i}
                className="font-serif-display text-[13px] italic leading-[1.5] text-[#9A948A]"
              >
                <span className="text-[#F5F2EC]">“{c.corrected}”</span>
                {c.explanation ? ` — ${c.explanation}` : ''}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderUserContent(content: string, corrections: Correction[]): React.ReactNode {
  if (!corrections.length) return content;
  // Find original phrases in the content and underline them
  let rendered: React.ReactNode[] = [content];
  corrections.forEach((c) => {
    if (!c.original) return;
    const next: React.ReactNode[] = [];
    rendered.forEach((chunk) => {
      if (typeof chunk !== 'string') {
        next.push(chunk);
        return;
      }
      const parts = chunk.split(c.original);
      parts.forEach((p, i) => {
        if (i > 0) {
          next.push(
            <span key={`c-${c.original}-${i}`} className="border-b border-[#D4A373]/60">
              {c.original}
            </span>,
          );
        }
        next.push(p);
      });
    });
    rendered = next;
  });
  return rendered;
}
