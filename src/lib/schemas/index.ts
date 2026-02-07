// Barrel export for all Zod validation schemas

// Enums (single source of truth)
export {
  LevelSchema,
  ModeSchema,
  RoleSchema,
  ErrorTypeSchema,
  VocabSourceSchema,
  type Level,
  type Mode,
  type Role,
  type ErrorType,
  type VocabSource,
} from './enums';

// Chat schemas
export {
  ChatRequestSchema,
  ChatContextSchema,
  ChatHistoryItemSchema,
  CorrectionSchema,
  type ChatRequest,
  type ChatContext,
  type ChatHistoryItem,
  type Correction,
} from './chat.schema';

// Session schemas
export {
  CreateSessionSchema,
  UpdateSessionSchema,
  SessionQuerySchema,
  type CreateSessionInput,
  type UpdateSessionInput,
  type SessionQuery,
} from './session.schema';

// Message schemas
export {
  SaveMessageSchema,
  type SaveMessageInput,
} from './message.schema';

// Stats schemas
export {
  StatsQuerySchema,
  ProgressQuerySchema,
  type StatsQuery,
  type ProgressQuery,
} from './stats.schema';

// Vocabulary schemas
export {
  SaveVocabularySchema,
  UpdateVocabularySchema,
  VocabularyQuerySchema,
  type SaveVocabularyInput,
  type UpdateVocabularyInput,
  type VocabularyQuery,
} from './vocabulary.schema';
