import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withErrorHandling, successResponse, validateBody } from '@/lib/error-handler';
import { ReviewResultSchema } from '@/lib/schemas/review.schema';
import { ApiError } from '@/lib/errors/ApiError';
import { requireAuth } from '@/server/http/auth-context';

async function handlePatch(
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) {
  const ctx = await requireAuth(request);
  const userId = ctx.userId;
  const { id } = await context!.params;
  const { correct } = await validateBody(request, ReviewResultSchema);

  const delta = correct ? 15 : -10;

  // Verify ownership first
  const vocab = await db.vocabulary.findFirst({
    where: { id, userId },
  });

  if (!vocab) {
    throw ApiError.notFound('Vocabulary word');
  }

  // Update mastery with clamping
  const newMastery = Math.min(100, Math.max(0, vocab.mastery + delta));

  const updated = await db.vocabulary.update({
    where: { id },
    data: {
      mastery: newMastery,
      reviewedAt: new Date(),
    },
  });

  return successResponse({
    id: updated.id,
    word: updated.word,
    mastery: updated.mastery,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
  });
}

export const PATCH = withErrorHandling(handlePatch);
