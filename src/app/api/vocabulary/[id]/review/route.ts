import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, successResponse, validateBody } from '@/lib/error-handler';
import { ReviewResultSchema } from '@/lib/schemas/review.schema';
import { ApiError } from '@/lib/errors/ApiError';

export const PATCH = withAuth(async (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => {
  const userId = request.headers.get('x-user-id')!;
  const { id } = await context!.params;
  const { correct } = await validateBody(request, ReviewResultSchema);

  // Atomic update with ownership verification
  const delta = correct ? 15 : -10;
  
  const result = await db.$executeRaw`
    UPDATE Vocabulary
    SET mastery = MIN(100, MAX(0, mastery + ${delta})),
        reviewedAt = CURRENT_TIMESTAMP
    WHERE id = ${id} AND userId = ${userId}
  `;

  if (result === 0) {
    throw ApiError.notFound('Vocabulary word');
  }

  // Fetch the updated record
  const updated = await db.vocabulary.findUnique({ where: { id } });

  return successResponse({
    id: updated.id,
    word: updated.word,
    mastery: updated.mastery,
    reviewedAt: updated.reviewedAt?.toISOString() ?? null,
  });
});
