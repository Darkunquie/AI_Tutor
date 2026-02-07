// Export all prompt generators
export { getFreeTalkPrompt } from './free-talk';
export { getRolePlayPrompt } from './role-play';
export { getDebatePrompt } from './debate';
export { getGrammarFixPrompt } from './grammar-fix';

import type { Level, Mode, ChatContext, Scenario } from '../types';
import { getFreeTalkPrompt } from './free-talk';
import { getRolePlayPrompt } from './role-play';
import { getDebatePrompt } from './debate';
import { getGrammarFixPrompt } from './grammar-fix';

// Helper to get the right prompt based on mode
export function getSystemPrompt(
  mode: Mode,
  level: Level,
  context?: ChatContext,
  scenarios?: Scenario[]
): string {
  switch (mode) {
    case 'FREE_TALK':
      return getFreeTalkPrompt(level, context?.topic);

    case 'ROLE_PLAY':
      if (context?.scenario && scenarios) {
        const scenario = scenarios.find((s) => s.id === context.scenario);
        if (scenario) {
          return getRolePlayPrompt(level, scenario);
        }
      }
      // Default scenario if none provided
      return getRolePlayPrompt(level, {
        id: 'default',
        title: 'General Conversation',
        description: 'A friendly conversation',
        aiRole: 'friendly local',
        userRole: 'visitor',
        starterPrompt: 'Hello! How can I help you today?',
      });

    case 'DEBATE':
      return getDebatePrompt(
        level,
        context?.debateTopic || 'Technology makes our lives better',
        context?.debatePosition
      );

    case 'GRAMMAR_FIX':
      return getGrammarFixPrompt(level);

    default:
      return getFreeTalkPrompt(level);
  }
}
