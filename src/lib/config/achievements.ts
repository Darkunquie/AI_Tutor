// Achievement definitions for the gamification system

export interface AchievementDefinition {
  type: string;
  title: string;
  description: string;
  icon: string; // Material Symbols icon name
  category: 'streak' | 'sessions' | 'vocabulary' | 'score' | 'modes';
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Streak
  { type: 'STREAK_3', title: '3-Day Streak', description: 'Practiced 3 days in a row', icon: 'local_fire_department', category: 'streak' },
  { type: 'STREAK_7', title: 'Week Warrior', description: 'Practiced 7 days in a row', icon: 'local_fire_department', category: 'streak' },
  { type: 'STREAK_30', title: 'Monthly Master', description: 'Practiced 30 days in a row', icon: 'whatshot', category: 'streak' },

  // Sessions
  { type: 'FIRST_SESSION', title: 'First Steps', description: 'Completed your first session', icon: 'flag', category: 'sessions' },
  { type: 'SESSIONS_10', title: 'Getting Serious', description: 'Completed 10 sessions', icon: 'military_tech', category: 'sessions' },
  { type: 'SESSIONS_50', title: 'Dedicated Learner', description: 'Completed 50 sessions', icon: 'emoji_events', category: 'sessions' },

  // Vocabulary
  { type: 'VOCAB_10', title: 'Word Collector', description: 'Learned 10 words', icon: 'dictionary', category: 'vocabulary' },
  { type: 'VOCAB_50', title: 'Wordsmith', description: 'Learned 50 words', icon: 'auto_stories', category: 'vocabulary' },
  { type: 'VOCAB_100', title: 'Lexicon Master', description: 'Learned 100 words', icon: 'school', category: 'vocabulary' },

  // Score
  { type: 'FIRST_A', title: 'Ace!', description: 'Scored 90+ in a session', icon: 'grade', category: 'score' },

  // Modes
  { type: 'ALL_MODES', title: 'Explorer', description: 'Tried all 4 practice modes', icon: 'explore', category: 'modes' },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = Object.fromEntries(
  ACHIEVEMENTS.map(a => [a.type, a])
);
