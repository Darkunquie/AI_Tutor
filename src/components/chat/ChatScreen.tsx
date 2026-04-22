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
import { AiOrb } from './AiOrb';
import { ChatWaveform } from './ChatWaveform';
import { Ai3DOrb } from './Ai3DOrb';

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
    corrections: allCorrections,
    vocabularyGained,
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
  const isHudMode = mode === 'ROLE_PLAY' || mode === 'DEBATE';
  const orbState = isSpeakingState ? 'speaking' : streamingMessageId ? 'speaking' : isLoading ? 'thinking' : 'idle';

  return (
    <div className={`flex h-screen bg-[#0d131b] text-[#e6eef8] font-sans antialiased ${isHudMode ? '' : ''}`}>
      {/* Left rail — HUD modes get session stats, others get 3D orb */}
      {isHudMode ? (
        <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-[#1a1a1e] bg-[rgba(9,9,14,0.95)] overflow-y-auto">
          <div className="border-b border-[#3d484e]/50 px-5 py-5">
            <span className="text-lg font-semibold text-[#e6eef8]">Talkivo</span>
          </div>
          <div className="border-b border-[#3d484e]/50 px-5 py-4">
            <div className="text-xs text-[#879299] leading-relaxed">
              <span className="text-[#bcc8cf]">{modeLabel}</span> session<br />
              Elapsed: <span className="text-[#e6eef8]">{formatDuration(duration)}</span>
            </div>
          </div>
          {(context.scenario || context.debateTopic) && (
            <div className="border-b border-[#3d484e]/50 px-5 py-4">
              <div className="mb-1 text-[11px] font-medium text-[#879299]">Scenario</div>
              <div className="text-[15px] font-semibold text-[#e6eef8]">
                {context.scenario || context.debateTopic}
              </div>
              {context.debatePosition && (
                <div className="mt-1 text-[12px] text-[#879299]">Position: <span className="text-[#4fd1ff]">{context.debatePosition}</span></div>
              )}
            </div>
          )}
          <div className="flex-1 px-5 py-4">
            <div className="mb-3 text-[11px] font-medium text-[#879299]">Live Stats</div>
            <div className="space-y-2">
              {[
                { label: 'Duration', value: formatDuration(duration) },
                { label: 'Messages', value: String(messages.length) },
                { label: 'Score', value: isSpeakingState ? '...' : '—' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-[13px]">
                  <span className="text-[#879299]">{s.label}</span>
                  <span className="font-medium text-[#e6eef8]">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[#3d484e]/50 px-5 py-4">
            <button
              onClick={onEndSession}
              className="w-full rounded bg-[#1f242d] py-2.5 text-center text-[13px] font-medium text-[#4fd1ff] transition-all hover:bg-[#2a2f38]"
            >
              End Session
            </button>
          </div>
        </aside>
      ) : (
        <div className="hidden lg:flex w-[380px] shrink-0 items-center justify-center border-r border-[#3d484e]">
          <Ai3DOrb state={orbState} className="w-[340px] h-[340px]" />
        </div>
      )}

      {/* Chat column */}
      <div className="flex flex-1 flex-col min-w-0">
      {/* Top bar */}
      <header className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#3d484e] bg-[#0d131b] px-8">
        <div className="flex items-center gap-3">
          <span className="font-[Sora] text-[18px] tracking-tight">Talkivo</span>
          <span className="h-[5px] w-[5px] rounded-full bg-[#4fd1ff]" />
          <span className="ml-2 text-[12px] uppercase tracking-[0.14em] text-[#879299]">
            {modeLabel}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 text-[13px]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4fd1ff] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4fd1ff]" />
            </span>
            <span className="tabular-nums text-[#4fd1ff]">{formatDuration(duration)}</span>
          </div>
          {ttsSupported && (
            <button
              onClick={toggleTTS}
              className="text-[12px] uppercase tracking-[0.12em] text-[#879299] transition-colors hover:text-[#e6eef8]"
            >
              {ttsEnabled ? 'Voice · on' : 'Voice · off'}
            </button>
          )}
          <button
            onClick={onEndSession}
            className="text-[13px] text-[#ffb4ab] transition-colors hover:text-[#ffb4ab]"
          >
            End session
          </button>
        </div>
      </header>

      {/* Speaking indicator */}
      {isSpeakingState && (
        <div className="flex items-center justify-between border-b border-[#3d484e] bg-[#4fd1ff]/5 px-8 py-2 text-[12px] text-[#4fd1ff]">
          <div className="flex items-center gap-3">
            <AiOrb state="speaking" size={28} />
            <span>Tutor is speaking…</span>
          </div>
          <button
            onClick={handleStopSpeaking}
            className="text-[11px] uppercase tracking-[0.12em] hover:text-[#7dd3fc]"
          >
            Stop
          </button>
        </div>
      )}

      {/* Transcript */}
      <main className="relative flex-1 overflow-y-auto">
        <ChatWaveform active={!!streamingMessageId || isSpeakingState} />
        <div className="mx-auto max-w-[760px] px-8 py-20" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center">
              <AiOrb state={isLoading ? 'thinking' : 'idle'} size={140} className="mb-8" />
              <div className="mb-3 text-[11px] uppercase tracking-[0.14em] text-[#4fd1ff]">
                {modeLabel}
              </div>
              <h2 className="font-[Sora] text-[32px] leading-[1.15] tracking-[-0.01em] text-[#e6eef8] max-w-[520px]">
                {mode === 'FREE_TALK' && 'Say anything. The tutor is listening.'}
                {mode === 'ROLE_PLAY' && 'The scene has started. Jump in.'}
                {mode === 'DEBATE' && 'Make your opening argument.'}
                {mode === 'GRAMMAR_FIX' && 'Write a sentence. Any sentence.'}
                {mode === 'PRONUNCIATION' && 'Speak clearly. Your tutor will listen.'}
              </h2>
              {(context.topic || context.scenario || context.debateTopic) && (
                <div className="mt-6 border-l border-[#4fd1ff] pl-4 text-left text-[14px] italic leading-[1.5] text-[#879299] font-[Sora]">
                  {context.topic && <>Topic: <span className="text-[#e6eef8]">{context.topic}</span></>}
                  {context.scenario && <>Scenario: <span className="text-[#e6eef8]">{context.scenario}</span></>}
                  {context.debateTopic && (
                    <>Position: <span className="text-[#e6eef8]">{context.debatePosition}</span> — {context.debateTopic}</>
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
              <div className="flex items-center gap-4">
                <AiOrb state="thinking" size={48} />
                <span className="text-[13px] italic text-[#879299] font-[Sora]">
                  thinking…
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-between border-l-2 border-[#ffb4ab] bg-[#ffb4ab]/10 px-4 py-3 text-[13px] text-[#e6eef8]">
                <span>{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-[12px] text-[#879299] hover:text-[#e6eef8]"
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
      <footer className="shrink-0 border-t border-[#3d484e] bg-[#0d131b] px-8 py-5">
        <div className="mx-auto flex max-w-[760px] items-center gap-4">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            onError={setError}
            disabled={isLoading || isSpeakingState}
          />
          <div className="relative flex-1">
            <input
              className="w-full border-0 border-b border-[#3d484e] bg-transparent px-0 py-3 text-[15px] text-[#e6eef8] placeholder-[#879299] outline-none transition-colors focus:border-[#4fd1ff]"
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
                ? 'text-[#4fd1ff] hover:text-[#7dd3fc]'
                : 'text-[#3d484e]')
            }
          >
            Send
          </button>
        </div>
      </footer>
    </div>

      {/* Right pane — HUD modes only */}
      {isHudMode && (
        <aside className="hidden lg:flex w-[280px] shrink-0 flex-col border-l border-[#1a1a1e] bg-[rgba(9,9,14,0.95)] overflow-y-auto">
          {/* Live orb */}
          <div className="flex flex-col items-center border-b border-[rgba(79,209,255,0.2)] px-6 py-6">
            <div className="relative h-[100px] w-[100px]">
              <Ai3DOrb state={orbState} className="h-full w-full" />
            </div>
            <div className="mt-3 text-center text-[11px] text-[#879299]">
              Live Signal<br />
              <span className={isSpeakingState || streamingMessageId ? 'text-[#7a9a6b] font-medium' : 'text-[#879299]'}>
                {isSpeakingState || streamingMessageId ? 'Active' : 'Standby'}
              </span>
            </div>
          </div>

          {/* Realtime gauges */}
          <div className="border-b border-[rgba(79,209,255,0.2)] px-4 py-4">
            <div className="mb-3 text-[11px] font-medium text-[#879299]">Realtime Gauges</div>
            {[
              { label: 'Messages', value: String(messages.length), pct: Math.min(100, messages.length * 5), color: '#4fd1ff' },
              { label: 'Duration', value: formatDuration(duration), pct: Math.min(100, Math.round(duration / 9)), color: '#4fd1ff' },
              { label: 'Corrections', value: String(allCorrections.length), pct: Math.min(100, allCorrections.length * 10), color: allCorrections.length > 5 ? '#e8b64c' : '#4fd1ff' },
              { label: 'Vocab', value: String(vocabularyGained.length), pct: Math.min(100, vocabularyGained.length * 12), color: '#7a9a6b' },
            ].map((g) => (
              <div key={g.label} className="mb-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-[#879299]">{g.label}</span>
                  <span className="text-[12px] font-medium text-[#e6eef8]" style={{ color: g.color === '#e8b64c' ? '#e8b64c' : undefined }}>{g.value}</span>
                </div>
                <div className="h-[2px] overflow-hidden bg-[#3d484e]">
                  <div className="h-full transition-all duration-300" style={{ width: `${g.pct}%`, background: g.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Flagged errors */}
          <div className="border-b border-[rgba(79,209,255,0.2)] px-4 py-4">
            <div className="mb-3 text-[11px] font-medium text-[#879299]">Top Errors</div>
            {allCorrections.length > 0 ? (() => {
              const counts: Record<string, number> = {};
              allCorrections.forEach((c) => {
                const cat = c.type || 'GRAMMAR';
                counts[cat] = (counts[cat] || 0) + 1;
              });
              const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return sorted.map(([cat, count], i) => (
                <div
                  key={cat}
                  className={`mb-1 flex items-center justify-between rounded px-2.5 py-2 text-[12px] transition-colors hover:bg-[#1f242d] ${
                    i === 0 ? 'border-l-2 border-[#e8b64c] text-[#e8b64c]' : 'border-l-2 border-[#4fd1ff] text-[#4fd1ff]'
                  }`}
                >
                  <span>{cat}</span>
                  <span>{count}</span>
                </div>
              ));
            })() : (
              <div className="text-[12px] text-[#879299]">No errors yet</div>
            )}
          </div>

          {/* Vocab earned */}
          <div className="flex-1 px-4 py-4">
            <div className="mb-3 text-[11px] font-medium text-[#879299]">
              New Words ({vocabularyGained.length})
            </div>
            {vocabularyGained.length > 0 ? (
              <div className="space-y-1">
                {vocabularyGained.slice(-8).map((word) => (
                  <div key={word} className="flex items-center justify-between py-1">
                    <span className="font-[Sora] text-[13px] text-[#e6eef8]">{word}</span>
                    <div className="flex gap-[3px]">
                      <span className="h-[6px] w-[6px] rounded-full bg-[#4fd1ff]" />
                      <span className="h-[6px] w-[6px] rounded-full bg-[#3d484e]" />
                      <span className="h-[6px] w-[6px] rounded-full bg-[#3d484e]" />
                      <span className="h-[6px] w-[6px] rounded-full bg-[#3d484e]" />
                      <span className="h-[6px] w-[6px] rounded-full bg-[#3d484e]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[12px] text-[#879299]">Awaiting input</div>
            )}
          </div>
        </aside>
      )}
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
      <div className="flex gap-4">
        <div className="shrink-0 pt-1">
          <AiOrb state={streaming ? 'speaking' : 'idle'} size={36} />
        </div>
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#4fd1ff]">
            Tutor
          </div>
          <p className="font-[Sora] text-[19px] leading-[1.55] text-[#e6eef8]">
            {message.content || (streaming ? '…' : '')}
          </p>
        </div>
      </div>
    );
  }

  // User message with optional marginalia corrections
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-8">
        <div className="mb-2 text-[11px] uppercase tracking-[0.14em] text-[#879299]">You</div>
        <p className="text-[17px] leading-[1.6] text-[#e6eef8]">
          {renderUserContent(message.content, corrections)}
        </p>
        {message.hasBeenChecked && corrections.length === 0 && (
          <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-[#7a9a6b]">
            · Clean
          </div>
        )}
      </div>
      {corrections.length > 0 && (
        <div className="col-span-4 pt-7">
          <div className="border-l border-[#4fd1ff] pl-4 space-y-3">
            {corrections.map((c, i) => (
              <p
                key={i}
                className="font-[Sora] text-[13px] italic leading-[1.5] text-[#879299]"
              >
                <span className="text-[#e6eef8]">“{c.corrected}”</span>
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
            <span key={`c-${c.original}-${i}`} className="border-b border-[#4fd1ff]/60">
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
