// ScoreCalculator service
// Fixes score calculation bugs and provides consistent scoring logic
// Implements weighted scoring with proper averaging

import type { ErrorType, ErrorBreakdown } from '@/lib/types';

// Error type weights - determines impact on score
const ERROR_WEIGHTS: Record<ErrorType, number> = {
  GRAMMAR: 3.0,      // Grammar errors impact score the most
  STRUCTURE: 2.5,    // Sentence structure is important
  VOCABULARY: 2.0,   // Word choice errors
  FLUENCY: 1.5,      // Fluency issues are less critical
};

// Scoring configuration
const CONFIG = {
  // Base score before deductions
  BASE_SCORE: 100,

  // Points deducted per weighted error
  POINTS_PER_ERROR: 2,

  // Filler word penalty (per occurrence)
  FILLER_PENALTY: 0.5,

  // Max filler penalty
  MAX_FILLER_PENALTY: 15,

  // Pronunciation bonus/penalty
  PRONUNCIATION_THRESHOLD: 80,
  PRONUNCIATION_BONUS_MAX: 5,
  PRONUNCIATION_PENALTY_MAX: 10,

  // Minimum and maximum scores
  MIN_SCORE: 0,
  MAX_SCORE: 100,

  // Message count thresholds for scaling
  MIN_MESSAGES_FOR_FULL_SCORING: 5,
};

// Session scoring input
export interface SessionScoringInput {
  errorCounts: ErrorBreakdown;
  messageCount: number;
  fillerWordCount: number;
  avgPronunciation?: number | null;
}

// Daily stats update input
export interface DailyStatsInput {
  currentStats: {
    sessionsCount: number;
    avgScore: number;
  };
  newSessionScore: number;
}

/**
 * ScoreCalculator class
 * Provides consistent scoring logic across the application
 */
export class ScoreCalculator {
  /**
   * Calculate session score based on errors and other factors
   */
  static calculateSessionScore(input: SessionScoringInput): number {
    const { errorCounts, messageCount, fillerWordCount, avgPronunciation } = input;

    // Start with base score
    let score = CONFIG.BASE_SCORE;

    // Calculate weighted error penalty
    const weightedErrors = this.calculateWeightedErrors(errorCounts);
    const errorPenalty = weightedErrors * CONFIG.POINTS_PER_ERROR;

    // Scale error penalty by message count (more messages = errors have less impact per message)
    const scaleFactor = Math.sqrt(Math.max(1, messageCount / CONFIG.MIN_MESSAGES_FOR_FULL_SCORING));
    const scaledErrorPenalty = errorPenalty / scaleFactor;

    score -= scaledErrorPenalty;

    // Apply filler word penalty
    const fillerPenalty = Math.min(
      fillerWordCount * CONFIG.FILLER_PENALTY,
      CONFIG.MAX_FILLER_PENALTY
    );
    score -= fillerPenalty;

    // Apply pronunciation bonus/penalty
    if (avgPronunciation !== undefined && avgPronunciation !== null) {
      score += this.calculatePronunciationAdjustment(avgPronunciation);
    }

    // Clamp score to valid range
    return Math.round(Math.max(CONFIG.MIN_SCORE, Math.min(CONFIG.MAX_SCORE, score)));
  }

  /**
   * Calculate weighted error total
   */
  static calculateWeightedErrors(errorCounts: ErrorBreakdown): number {
    return Object.entries(errorCounts).reduce((total, [type, count]) => {
      const weight = ERROR_WEIGHTS[type as ErrorType] || 1;
      return total + count * weight;
    }, 0);
  }

  /**
   * Calculate pronunciation score adjustment
   */
  static calculatePronunciationAdjustment(avgPronunciation: number): number {
    const threshold = CONFIG.PRONUNCIATION_THRESHOLD;

    if (avgPronunciation >= threshold) {
      // Bonus for good pronunciation (up to +5)
      const bonusPercent = (avgPronunciation - threshold) / (100 - threshold);
      return bonusPercent * CONFIG.PRONUNCIATION_BONUS_MAX;
    } else {
      // Penalty for poor pronunciation (up to -10)
      const penaltyPercent = (threshold - avgPronunciation) / threshold;
      return -penaltyPercent * CONFIG.PRONUNCIATION_PENALTY_MAX;
    }
  }

  /**
   * Calculate new average score for daily stats
   * Properly averages instead of replacing
   */
  static calculateNewAverageScore(input: DailyStatsInput): number {
    const { currentStats, newSessionScore } = input;

    // If this is the first session, just use the new score
    if (currentStats.sessionsCount === 0) {
      return newSessionScore;
    }

    // Calculate running average
    const totalScore = currentStats.avgScore * currentStats.sessionsCount + newSessionScore;
    const newCount = currentStats.sessionsCount + 1;

    return Math.round(totalScore / newCount);
  }

  /**
   * Get error breakdown from error records
   */
  static getErrorBreakdown(errors: Array<{ category: ErrorType }>): ErrorBreakdown {
    const breakdown: ErrorBreakdown = {
      GRAMMAR: 0,
      VOCABULARY: 0,
      STRUCTURE: 0,
      FLUENCY: 0,
    };

    for (const error of errors) {
      if (error.category in breakdown) {
        breakdown[error.category]++;
      }
    }

    return breakdown;
  }

  /**
   * Calculate weekly change percentage
   */
  static calculateWeeklyChange(thisWeekAvg: number, lastWeekAvg: number): number {
    if (lastWeekAvg === 0) {
      return thisWeekAvg > 0 ? 100 : 0;
    }

    return Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100);
  }

  /**
   * Get grade letter from score
   */
  static getGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Get performance level description
   */
  static getPerformanceLevel(score: number): {
    level: string;
    color: string;
    description: string;
  } {
    if (score >= 90) {
      return {
        level: 'Excellent',
        color: 'green',
        description: 'Outstanding performance! Keep up the great work.',
      };
    }
    if (score >= 80) {
      return {
        level: 'Good',
        color: 'blue',
        description: 'Good job! Minor improvements will help you reach excellence.',
      };
    }
    if (score >= 70) {
      return {
        level: 'Satisfactory',
        color: 'yellow',
        description: 'You\'re doing okay. Focus on your most common errors.',
      };
    }
    if (score >= 60) {
      return {
        level: 'Needs Work',
        color: 'orange',
        description: 'Keep practicing! Review the corrections carefully.',
      };
    }
    return {
      level: 'Struggling',
      color: 'red',
      description: 'Consider reviewing basic concepts and practicing more frequently.',
    };
  }

  /**
   * Generate improvement tips based on error breakdown
   */
  static generateTips(errorCounts: ErrorBreakdown): string[] {
    const tips: string[] = [];
    const sortedErrors = Object.entries(errorCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    for (const [type, count] of sortedErrors.slice(0, 3)) {
      switch (type) {
        case 'GRAMMAR':
          if (count >= 5) {
            tips.push('Focus on verb tense consistency and subject-verb agreement.');
          } else {
            tips.push('Review your grammar rules, especially articles and prepositions.');
          }
          break;
        case 'VOCABULARY':
          tips.push('Try to learn 5 new words each session and use them in sentences.');
          break;
        case 'STRUCTURE':
          tips.push('Practice building complex sentences with proper clause structure.');
          break;
        case 'FLUENCY':
          tips.push('Read aloud more often to improve natural speech flow.');
          break;
      }
    }

    if (tips.length === 0) {
      tips.push('Great work! Keep practicing to maintain your skills.');
    }

    return tips;
  }
}

export default ScoreCalculator;
