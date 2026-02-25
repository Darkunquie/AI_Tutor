'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChatScreen } from '@/components/chat/ChatScreen';
import { PronunciationScreen } from '@/components/pronunciation/PronunciationScreen';
import { SessionReport } from '@/components/session/SessionReport';
import { useChatStore } from '@/stores/chatStore';
import { useSessionStore } from '@/stores/sessionStore';
import { api } from '@/lib/api-client';
import type { Mode, Level, ChatContext, ErrorType, Correction } from '@/lib/types';
import { logBackgroundError } from '@/lib/utils';
import RequireAuth from '@/components/auth/RequireAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useToastStore } from '@/stores/toastStore';
import { ACHIEVEMENT_MAP } from '@/lib/config/achievements';

interface ReportData {
  score: number;
  duration: number;
  messageCount: number;
  mode: Mode;
  level: Level;
  context: ChatContext;
  errorCounts: Record<ErrorType, number>;
  corrections: Correction[];
  vocabularyGained: string[];
}

export default function TutorPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { sessionId, mode, level, context, reset: resetChat } = useChatStore();
  const {
    endSession,
    duration,
    messageCount,
    errorCounts,
    corrections,
    vocabularyGained,
    reset: resetSession,
    getScore,
  } = useSessionStore();

  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Redirect if no active session and not showing report
  useEffect(() => {
    if (!sessionId && !mode && !showReport) {
      router.push('/');
    }
  }, [sessionId, mode, showReport, router]);

  const handleEndSession = () => {
    endSession();

    // Capture snapshot of all session data before any reset
    const data: ReportData = {
      score: getScore(),
      duration: useSessionStore.getState().duration,
      messageCount,
      mode: mode ?? 'FREE_TALK',
      level,
      context,
      errorCounts: { ...errorCounts },
      corrections: [...corrections],
      vocabularyGained: [...vocabularyGained],
    };

    // Persist session stats to DB (fire-and-forget)
    if (sessionId) {
      api.sessions.update(sessionId, {
        duration: data.duration,
        score: data.score,
        vocabularyJson: data.vocabularyGained,
      }).catch(logBackgroundError('update session'));

      // Save vocabulary words to DB
      for (const word of data.vocabularyGained) {
        api.vocabulary.save({
          userId: user?.id || '',
          word,
          context: `Learned during ${data.mode} session`,
          source: 'CORRECTION',
        }).catch(logBackgroundError('save vocabulary'));
      }

      // Check for new achievements (non-blocking)
      api.achievements.check().then(({ newlyUnlocked }) => {
        const items = newlyUnlocked ?? [];
        for (const type of items) {
          const def = ACHIEVEMENT_MAP[type];
          if (def) {
            useToastStore.getState().addToast(`Achievement Unlocked: ${def.title}`, def.icon);
          }
        }
      }).catch(logBackgroundError('check achievements'));
    }

    setReportData(data);
    setShowReport(true);
  };

  const handleGoHome = () => {
    resetChat();
    resetSession();
    router.push('/');
  };

  const handleViewDashboard = () => {
    resetChat();
    resetSession();
    router.push('/dashboard');
  };

  return (
    <RequireAuth>
      {/* Show report screen */}
      {showReport && reportData ? (
        <SessionReport
          {...reportData}
          onGoHome={handleGoHome}
          onViewDashboard={handleViewDashboard}
        />
      ) : !sessionId || !mode ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600">Loading session...</p>
          </div>
        </div>
      ) : mode === 'PRONUNCIATION' ? (
        <div className="h-screen flex flex-col">
          <PronunciationScreen onEndSession={handleEndSession} />
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          <ChatScreen onEndSession={handleEndSession} />
        </div>
      )}
    </RequireAuth>
  );
}
