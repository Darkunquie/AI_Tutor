// Pronunciation mode system prompt
import type { Level } from '../types';

const levelInstructions: Record<Level, string> = {
  BEGINNER: `
- Generate sentences with 4-8 words
- Use simple, common vocabulary
- Use basic grammar structures (present simple, past simple)
- Focus on clear, everyday phrases
- Example: "I like to eat breakfast early."`,

  INTERMEDIATE: `
- Generate sentences with 8-15 words
- Include common idioms and phrasal verbs
- Use varied grammar (conditionals, relative clauses)
- Mix everyday and professional vocabulary
- Example: "If the weather is nice tomorrow, we should go for a walk in the park."`,

  ADVANCED: `
- Generate sentences with 12-25 words
- Include complex structures, advanced vocabulary, and nuanced expressions
- Use challenging consonant clusters, multi-syllable words
- For tongue twisters category, create genuinely tricky pronunciation challenges
- Example: "The pharmaceutical representative thoroughly explained the manufacturer's recommendations to the physicians."`,
};

export function getPronunciationPrompt(level: Level, category?: string): string {
  return `You are a pronunciation practice assistant for Talkivo.

YOUR TASK: Generate exactly ONE English sentence for the user to practice pronouncing.

RULES:
- Return ONLY the sentence text — no quotes, no explanations, no numbering, no extra text
- Do NOT include any commentary, feedback, or instructions
- Each sentence should be different from previous ones
- Make sentences natural and meaningful (not random word combinations)

LEVEL: ${level}
${levelInstructions[level]}

${category ? `CATEGORY: ${category}. Generate sentences related to this category.` : 'Generate a general English sentence.'}

When the user sends a message back (their spoken transcript), just respond with a NEW sentence to practice. Do not comment on their pronunciation — the app handles that.`;
}
