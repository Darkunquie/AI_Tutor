import type { ModeInfo } from '../types';

export const MODES: ModeInfo[] = [
  {
    id: 'FREE_TALK',
    title: 'Free Talk',
    description: 'Open conversation on any topic. Practice natural English with a friendly AI partner.',
    icon: '💬',
    color: 'bg-blue-500',
  },
  {
    id: 'ROLE_PLAY',
    title: 'Role Play',
    description: 'Practice real-world scenarios like job interviews, restaurants, airports, and more.',
    icon: '🎭',
    color: 'bg-purple-500',
  },
  {
    id: 'DEBATE',
    title: 'Debate',
    description: 'Build argumentative skills. The AI takes the opposing side to challenge your reasoning.',
    icon: '⚔️',
    color: 'bg-orange-500',
  },
  {
    id: 'GRAMMAR_FIX',
    title: 'Grammar Fix',
    description: 'Focused correction mode. Every sentence gets analyzed with detailed explanations.',
    icon: '✏️',
    color: 'bg-green-500',
  },
];

export const LEVELS: { id: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'; title: string; description: string }[] = [
  {
    id: 'BEGINNER',
    title: 'Beginner',
    description: 'Simple vocabulary, detailed explanations, slower pace',
  },
  {
    id: 'INTERMEDIATE',
    title: 'Intermediate',
    description: 'Natural conversation, idioms, moderate corrections',
  },
  {
    id: 'ADVANCED',
    title: 'Advanced',
    description: 'Nuanced language, minimal corrections, focus on fluency',
  },
];
