export { MODES, LEVELS } from './modes';
export { SCENARIOS, DEBATE_TOPICS, FREE_TALK_TOPICS, PRONUNCIATION_CATEGORIES } from './scenarios';
export { ACHIEVEMENTS, ACHIEVEMENT_MAP } from './achievements';
export type { AchievementDefinition } from './achievements';

// Valid trial durations available to admins (days)
export const TRIAL_DAYS = [3, 6, 14] as const;
export type TrialDays = typeof TRIAL_DAYS[number];
