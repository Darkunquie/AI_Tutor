// Central type definitions for the AI English Tutor.
// Enum types are derived from Zod schemas in ./schemas/enums.ts
// Config constants are in ./config/

// Re-export all enum types (single source of truth: Zod schemas)
export type { Level, Mode, Role, ErrorType, VocabSource } from './schemas/enums';

import type { ErrorType, Role, VocabSource, Mode, Level } from './schemas/enums';

// ============ Core Domain Types ============

export interface Correction {
  type: ErrorType;
  original: string;
  corrected: string;
  explanation: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  corrections?: Correction[];
  hasBeenChecked?: boolean;
  timestamp: Date;
}

export interface ExtendedMessage extends Message {
  pronunciationScore?: number;
  fillerWordCount?: number;
  fillerWords?: FillerWordDetection[];
}

export interface ChatContext {
  topic?: string;
  scenario?: string;
  character?: string;
  userRole?: string;
  debateTopic?: string;
  debatePosition?: string;
}

// ============ Request/Response Types ============

export interface ChatRequest {
  message: string;
  mode: Mode;
  level: Level;
  sessionId: string;
  context?: ChatContext;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  reply: string;
  corrections: Correction[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============ Session Types ============

export interface Session {
  id: string;
  userId: string;
  mode: Mode;
  level: Level;
  duration: number;
  score: number | null;
  fillerWordCount: number;
  avgPronunciation: number | null;
  messageCount: number;
  errorCount: number;
  createdAt: string;
}

export interface SessionStats {
  score: number;
  duration: number;
  errorBreakdown: ErrorBreakdown;
  commonMistakes: Array<{ error: string; count: number }>;
  vocabularyGained: string[];
  tips: string[];
}

export interface ErrorBreakdown {
  GRAMMAR: number;
  VOCABULARY: number;
  STRUCTURE: number;
  FLUENCY: number;
}

// ============ Feature-Specific Types ============

export interface PronunciationResult {
  transcript: string;
  confidence: number;
  score: number;
  lowConfidenceWords: string[];
}

export interface FillerWordDetection {
  word: string;
  count: number;
  positions: number[];
}

export interface VocabularyItem {
  id?: string;
  word: string;
  definition?: string;
  context: string;
  source: VocabSource;
  mastery: number;
  createdAt?: Date;
}

// ============ UI Config Types ============

export interface ModeInfo {
  id: Mode;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  aiRole: string;
  userRole: string;
  starterPrompt: string;
}

export interface DebateTopic {
  topic: string;
  level: string;
}
