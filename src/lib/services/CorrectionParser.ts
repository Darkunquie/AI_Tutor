// CorrectionParser service
// Replaces fragile regex-based parsing with robust correction extraction
// Supports both structured JSON corrections and legacy text parsing

import type { Correction, ErrorType } from '@/lib/types';

// Raw correction from API (may have string or enum type)
interface RawCorrection {
  type?: string | ErrorType;
  original: string;
  corrected: string;
  explanation?: string;
}

// Patterns for detecting error types from context
const ERROR_TYPE_PATTERNS: Record<ErrorType, RegExp[]> = {
  GRAMMAR: [
    /\b(grammar|tense|verb|subject|agreement|article|preposition|conjugat)/i,
    /\b(is|are|was|were|have|has|had)\b.*\bshould\b/i,
    /\b(singular|plural|past|present|future)\b/i,
  ],
  VOCABULARY: [
    /\b(word|vocabulary|meaning|synonym|definition|term|phrase)\b/i,
    /\b(better word|more appropriate|instead of|word choice)\b/i,
    /\b(means|refers to|is called)\b/i,
  ],
  STRUCTURE: [
    /\b(structure|order|placement|position|arrangement|sentence)\b/i,
    /\b(word order|sentence structure|rearrange|reorganize)\b/i,
    /\b(beginning|ending|middle|start|end)\b.*\b(of|the)\b.*\b(sentence)\b/i,
  ],
  FLUENCY: [
    /\b(fluency|natural|native|smooth|flow|rhythm)\b/i,
    /\b(sounds|more natural|native speaker|idiomatic)\b/i,
    /\b(casual|formal|polite|appropriate|register)\b/i,
  ],
};

// Regex patterns for extracting corrections from text
const TEXT_CORRECTION_PATTERNS = [
  // Pattern: "X" → "Y" or 'X' → 'Y'
  {
    regex: /["']([^"']+)["']\s*(?:→|->)+\s*["']([^"']+)["']/g,
    type: 'GRAMMAR' as ErrorType,
  },
  // Pattern: ✏️ Small fix: X → Y — explanation
  {
    regex: /✏️\s*(?:Small fix|Fix|Correction)?:?\s*["']?([^"'→\n]+)["']?\s*(?:→|->)+\s*["']?([^"'—\n]+)["']?\s*(?:—|--|-)\s*(.+?)(?:\n|$)/gi,
    type: 'GRAMMAR' as ErrorType,
    hasExplanation: true,
  },
  // Pattern: instead of "X", try/say "Y"
  {
    regex: /instead of\s+["']([^"']+)["'],?\s*(?:you could|try|say|use)\s+["']([^"']+)["']/gi,
    type: 'VOCABULARY' as ErrorType,
  },
  // Pattern: "X" should be "Y"
  {
    regex: /["']([^"']+)["']\s*should\s*(?:be|have been)\s*["']([^"']+)["']/gi,
    type: 'GRAMMAR' as ErrorType,
  },
  // Pattern: X (→ Y) or X (-> Y)
  {
    regex: /\b(\w+(?:\s+\w+)?)\s*\((?:→|->)+\s*(\w+(?:\s+\w+)?)\)/g,
    type: 'GRAMMAR' as ErrorType,
  },
  // Pattern: [original] → [corrected] (bracketed style)
  {
    regex: /\[([^\]]+)\]\s*(?:→|->)+\s*\[([^\]]+)\]/g,
    type: 'GRAMMAR' as ErrorType,
  },
];

// Vocabulary teaching patterns (to extract new words)
const VOCABULARY_PATTERNS = [
  /(?:the word|term)\s+["'](\w+)["']\s+means?\s+["']([^"']+)["']/gi,
  /["'](\w+)["']\s+(?:means|refers to|is|describes)\s+["']?([^"'.]+)["']?/gi,
];

/**
 * CorrectionParser class
 * Provides robust parsing of corrections from AI responses
 */
export class CorrectionParser {
  /**
   * Parse corrections from API response
   * Prefers structured JSON corrections, falls back to text parsing
   */
  static parse(response: string, apiCorrections?: RawCorrection[]): Correction[] {
    // If API provided structured corrections, use those
    if (apiCorrections && apiCorrections.length > 0) {
      return this.normalizeCorrections(apiCorrections, response);
    }

    // Fall back to text parsing
    return this.parseFromText(response);
  }

  /**
   * Normalize raw corrections from API to proper Correction objects
   */
  private static normalizeCorrections(raw: RawCorrection[], context: string): Correction[] {
    return raw.map((c) => ({
      type: this.normalizeErrorType(c.type, c.original, c.corrected, context),
      original: c.original.trim(),
      corrected: c.corrected.trim(),
      explanation: c.explanation?.trim() || this.generateExplanation(c.original, c.corrected),
    }));
  }

  /**
   * Normalize error type from string to ErrorType enum
   */
  private static normalizeErrorType(
    type: string | ErrorType | undefined,
    original: string,
    corrected: string,
    context: string
  ): ErrorType {
    // If already a valid ErrorType, return it
    if (type && ['GRAMMAR', 'VOCABULARY', 'STRUCTURE', 'FLUENCY'].includes(type)) {
      return type as ErrorType;
    }

    // Try to infer type from context
    return this.inferErrorType(original, corrected, context);
  }

  /**
   * Infer error type from the correction context
   */
  private static inferErrorType(
    original: string,
    corrected: string,
    context: string
  ): ErrorType {
    const fullContext = `${original} ${corrected} ${context}`.toLowerCase();

    // Check each error type's patterns
    for (const [type, patterns] of Object.entries(ERROR_TYPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(fullContext)) {
          return type as ErrorType;
        }
      }
    }

    // Heuristic: if words are completely different, it's vocabulary
    const originalWords = original.toLowerCase().split(/\s+/);
    const correctedWords = corrected.toLowerCase().split(/\s+/);
    const commonWords = originalWords.filter((w) => correctedWords.includes(w));

    if (commonWords.length === 0 && originalWords.length <= 2) {
      return 'VOCABULARY';
    }

    // Heuristic: if word order changed, it's structure
    if (
      originalWords.length === correctedWords.length &&
      new Set(originalWords).size === new Set(correctedWords).size &&
      originalWords.join(' ') !== correctedWords.join(' ')
    ) {
      return 'STRUCTURE';
    }

    // Default to grammar
    return 'GRAMMAR';
  }

  /**
   * Parse corrections from text when no structured data available
   */
  private static parseFromText(text: string): Correction[] {
    const corrections: Correction[] = [];
    const seen = new Set<string>(); // Dedupe by "original->corrected"

    for (const pattern of TEXT_CORRECTION_PATTERNS) {
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const original = match[1]?.trim();
        const corrected = match[2]?.trim();
        const explanation = pattern.hasExplanation && match[3] ? match[3].trim() : undefined;

        if (!original || !corrected || original === corrected) {
          continue;
        }

        const key = `${original.toLowerCase()}->${corrected.toLowerCase()}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);

        corrections.push({
          type: this.inferErrorType(original, corrected, explanation || text),
          original,
          corrected,
          explanation: explanation || this.generateExplanation(original, corrected),
        });
      }
    }

    return corrections;
  }

  /**
   * Generate a default explanation for a correction
   */
  private static generateExplanation(original: string, corrected: string): string {
    const originalWords = original.split(/\s+/);
    const correctedWords = corrected.split(/\s+/);

    if (originalWords.length === 1 && correctedWords.length === 1) {
      return `"${corrected}" is the correct form here.`;
    }

    if (originalWords.length !== correctedWords.length) {
      return `The corrected phrase "${corrected}" is more appropriate.`;
    }

    return `Suggested correction from your tutor.`;
  }

  /**
   * Extract vocabulary words being taught in the response
   */
  static extractVocabulary(text: string): Array<{ word: string; definition: string }> {
    const vocabulary: Array<{ word: string; definition: string }> = [];
    const seen = new Set<string>();

    for (const pattern of VOCABULARY_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;

      while ((match = regex.exec(text)) !== null) {
        const word = match[1]?.trim().toLowerCase();
        const definition = match[2]?.trim();

        if (!word || !definition || seen.has(word)) {
          continue;
        }
        seen.add(word);

        vocabulary.push({ word, definition });
      }
    }

    return vocabulary;
  }

  /**
   * Check if a message contains teaching about a specific word
   */
  static containsWordTeaching(text: string, word: string): boolean {
    const patterns = [
      new RegExp(`\\b${word}\\b.*(?:means|refers to|is called|definition)`, 'i'),
      new RegExp(`(?:the word|term)\\s+["']?${word}["']?`, 'i'),
    ];

    return patterns.some((p) => p.test(text));
  }
}

export default CorrectionParser;
