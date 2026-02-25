// Word-by-word transcript comparison for pronunciation mode

export interface WordResult {
  word: string;
  status: 'correct' | 'incorrect' | 'missed';
}

export interface ComparisonResult {
  words: WordResult[];
  accuracy: number;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, '') // keep apostrophes for contractions
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text).split(' ').filter(Boolean);
}

/**
 * Compare a target sentence with what the user actually spoke.
 * Uses sequential matching: walks through target words and tries to find
 * each one in the spoken words (in order), tolerating missing/extra words.
 */
export function compareTranscripts(target: string, spoken: string): ComparisonResult {
  const targetWords = tokenize(target);
  const spokenWords = tokenize(spoken);

  if (targetWords.length === 0) {
    return { words: [], accuracy: 0 };
  }

  const results: WordResult[] = [];
  let spokenIdx = 0;

  for (const targetWord of targetWords) {
    // Look ahead in spoken words to find a match (within a window)
    let found = false;
    const maxLookahead = Math.min(spokenIdx + 3, spokenWords.length);

    for (let j = spokenIdx; j < maxLookahead; j++) {
      if (spokenWords[j] === targetWord) {
        // Mark any skipped spoken words (extra words the user said)
        spokenIdx = j + 1;
        results.push({ word: targetWord, status: 'correct' });
        found = true;
        break;
      }
    }

    if (!found) {
      // Check if user said something close (off by one character - common STT errors)
      let closeMatch = false;
      for (let j = spokenIdx; j < maxLookahead; j++) {
        if (isCloseMatch(targetWord, spokenWords[j])) {
          spokenIdx = j + 1;
          results.push({ word: targetWord, status: 'correct' });
          closeMatch = true;
          break;
        }
      }

      if (!closeMatch) {
        results.push({ word: targetWord, status: spokenIdx < spokenWords.length ? 'incorrect' : 'missed' });
        // Advance spoken index if there's a word that was likely the attempt
        if (spokenIdx < spokenWords.length) {
          spokenIdx++;
        }
      }
    }
  }

  const correctCount = results.filter((r) => r.status === 'correct').length;
  const accuracy = Math.round((correctCount / targetWords.length) * 100);

  return { words: results, accuracy };
}

/**
 * Check if two words are close enough to be considered a match.
 * Handles common speech-to-text transcription differences.
 */
function isCloseMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;

  // Simple edit distance check (allow 1 edit for short words, 2 for longer)
  const maxEdits = a.length <= 4 ? 1 : 2;
  return editDistance(a, b) <= maxEdits;
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
