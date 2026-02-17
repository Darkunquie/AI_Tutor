// Filler word detection utility
// Detects common verbal fillers in English speech

import type { FillerWordDetection } from './types';

// Common filler words and phrases
export const FILLER_WORDS = [
  // Hesitation sounds
  'um', 'uh', 'uhh', 'umm', 'er', 'err', 'ah', 'ahh', 'hmm',
  // Verbal fillers
  'like', 'you know', 'basically', 'actually', 'literally',
  'so', 'well', 'right', 'okay', 'ok',
  // Hedge phrases
  'kind of', 'sort of', 'i mean', 'you see', 'i guess',
  // Discourse markers (when overused)
  'anyway', 'whatever', 'honestly', 'totally',
];

// Single-word fillers for quick matching
export const SINGLE_WORD_FILLERS = [
  'um', 'uh', 'uhh', 'umm', 'er', 'err', 'ah', 'ahh', 'hmm',
  'like', 'basically', 'actually', 'literally',
  'so', 'well', 'right', 'okay', 'ok',
  'anyway', 'whatever', 'honestly', 'totally',
];

// Multi-word fillers
export const MULTI_WORD_FILLERS = [
  'you know', 'kind of', 'sort of', 'i mean', 'you see', 'i guess',
];

/**
 * Detect filler words in a transcript
 * @param transcript - The text to analyze
 * @returns Array of filler word detections with counts and positions
 */
export function detectFillerWords(transcript: string): FillerWordDetection[] {
  const detections: FillerWordDetection[] = [];
  const lowerTranscript = transcript.toLowerCase();

  // First, detect multi-word fillers (to avoid double-counting)
  for (const filler of MULTI_WORD_FILLERS) {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = [...lowerTranscript.matchAll(regex)];

    if (matches.length > 0) {
      detections.push({
        word: filler,
        count: matches.length,
        positions: matches.map(m => m.index!),
      });
    }
  }

  // Then detect single-word fillers
  for (const filler of SINGLE_WORD_FILLERS) {
    // Skip if it's part of a multi-word filler already detected
    // For example, "you" in "you know"
    const isPartOfMultiWord = MULTI_WORD_FILLERS.some(mw =>
      mw.split(' ').includes(filler) && detections.some(d => d.word === mw)
    );

    // Special handling for common words that can be legitimate
    // "so" at the beginning of a sentence is often a filler
    // "like" as a comparison is not a filler
    let regex: RegExp;

    if (filler === 'so') {
      // Match "so" at the start of a sentence or after a pause
      regex = new RegExp(`(?:^|[.!?,]\\s*)\\bso\\b`, 'gi');
    } else if (filler === 'like') {
      // Match "like" when it's not followed by "this", "that", "a", "the"
      // This is a simple heuristic - not perfect but catches many cases
      regex = new RegExp(`\\blike\\b(?!\\s+(this|that|a|an|the|it|him|her|them|us|me)\\b)`, 'gi');
    } else {
      regex = new RegExp(`\\b${filler}\\b`, 'gi');
    }

    const matches = [...lowerTranscript.matchAll(regex)];

    if (matches.length > 0 && !isPartOfMultiWord) {
      detections.push({
        word: filler,
        count: matches.length,
        positions: matches.map(m => m.index!),
      });
    }
  }

  return detections;
}

/**
 * Get total filler word count from detections
 * @param detections - Array of filler word detections
 * @returns Total count of all filler words
 */
export function getTotalFillerCount(detections: FillerWordDetection[]): number {
  return detections.reduce((sum, d) => sum + d.count, 0);
}

/**
 * Get a friendly message about filler word usage
 * @param count - Total filler word count
 * @param wordCount - Total word count in transcript
 * @returns Feedback message
 */
export function getFillerFeedback(count: number, wordCount: number): string {
  if (wordCount === 0) return '';

  const percentage = (count / wordCount) * 100;

  if (count === 0) {
    return 'Great job! No filler words detected.';
  } else if (percentage < 2) {
    return `Minimal filler words (${count}). Good fluency!`;
  } else if (percentage < 5) {
    return `${count} filler word${count > 1 ? 's' : ''} detected. Try pausing instead of using fillers.`;
  } else if (percentage < 10) {
    return `${count} filler words detected. Practice speaking more slowly and deliberately.`;
  } else {
    return `High filler word usage (${count}). Take a breath and pause when you need to think.`;
  }
}

/**
 * Get tips for reducing filler words
 * @param mostCommon - The most commonly used filler word
 * @returns Array of tips
 */
export function getFillerReductionTips(mostCommon?: string): string[] {
  const tips = [
    'Pause silently instead of saying "um" or "uh" - silence is powerful.',
    'Slow down your speaking pace to give yourself time to think.',
    'Practice your responses to build confidence.',
    'Record yourself speaking and listen for patterns.',
  ];

  if (mostCommon) {
    const specificTips: Record<string, string> = {
      'like': 'Be specific with comparisons. Instead of "like", use "similar to" or "such as".',
      'you know': 'Your listener may not know - explain your point clearly.',
      'basically': 'Skip "basically" - get straight to your main point.',
      'actually': '"Actually" often adds nothing. Remove it and your sentence usually sounds better.',
      'so': 'Start sentences with the subject, not "So..."',
      'i mean': 'Be direct with your first statement instead of rephrasing.',
    };

    if (specificTips[mostCommon]) {
      tips.unshift(specificTips[mostCommon]);
    }
  }

  return tips;
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Highlight filler words in a transcript for display
 * @param transcript - Original transcript
 * @param detections - Filler word detections
 * @returns HTML string with highlighted fillers (XSS-safe)
 */
export function highlightFillerWords(
  transcript: string,
  detections: FillerWordDetection[]
): string {
  if (detections.length === 0) return escapeHtml(transcript);

  // Collect all positions and sort from first to last
  const allPositions: { start: number; end: number }[] = [];

  for (const detection of detections) {
    for (const pos of detection.positions) {
      allPositions.push({
        start: pos,
        end: pos + detection.word.length,
      });
    }
  }

  allPositions.sort((a, b) => a.start - b.start);

  // Build result by escaping each segment individually
  const parts: string[] = [];
  let lastEnd = 0;

  for (const { start, end } of allPositions) {
    if (start > lastEnd) {
      parts.push(escapeHtml(transcript.slice(lastEnd, start)));
    }
    const filler = escapeHtml(transcript.slice(start, end));
    parts.push(`<mark class="filler-word">${filler}</mark>`);
    lastEnd = end;
  }

  if (lastEnd < transcript.length) {
    parts.push(escapeHtml(transcript.slice(lastEnd)));
  }

  return parts.join('');
}
