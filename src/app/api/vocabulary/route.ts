import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  SaveVocabularySchema,
  UpdateVocabularySchema,
  VocabularyQuerySchema,
} from '@/lib/schemas/vocabulary.schema';
import { ApiError } from '@/lib/errors/ApiError';
import {
  withErrorHandling,
  validateBody,
  validateQuery,
  successResponse,
  paginatedResponse,
} from '@/lib/error-handler';

// Extended query schema with pagination
const VocabularyListQuerySchema = VocabularyQuerySchema.extend({
  sessionId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// PATCH body schema with id
const VocabularyPatchSchema = UpdateVocabularySchema.extend({
  id: z.string().min(1, 'Vocabulary ID is required'),
});

// POST /api/vocabulary - Save a new vocabulary word
async function handlePost(request: NextRequest) {
  const body = await validateBody(request, SaveVocabularySchema);
  const { sessionId, word, definition, context, source } = body;

  // Get authenticated user ID from middleware headers
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw new Error('Unauthorized - User ID not found');
  }

  // Upsert vocabulary (update if exists, create if not)
  const vocabulary = await db.vocabulary.upsert({
    where: {
      userId_word: {
        userId,
        word: word.toLowerCase(),
      },
    },
    update: {
      // Update context if seen again
      context: context,
      // Increase mastery on repeated exposure
      mastery: { increment: 5 },
      reviewedAt: new Date(),
    },
    create: {
      userId,
      sessionId: sessionId || null,
      word: word.toLowerCase(),
      definition: definition || null,
      context: context,
      source: source,
      mastery: 0,
    },
  });

  return successResponse({
    id: vocabulary.id,
    word: vocabulary.word,
    definition: vocabulary.definition,
    context: vocabulary.context,
    source: vocabulary.source,
    mastery: vocabulary.mastery,
    createdAt: vocabulary.createdAt,
  });
}

// GET /api/vocabulary - Get vocabulary list for a user
async function handleGet(request: NextRequest) {
  const query = validateQuery(request, VocabularyListQuerySchema);
  const { sessionId, page, pageSize, sortBy, sortOrder } = query;

  // Get authenticated user ID from middleware headers
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    throw new Error('Unauthorized - User ID not found');
  }

  // Build where clause
  const where: { userId: string; sessionId?: string } = { userId };
  if (sessionId) {
    where.sessionId = sessionId;
  }

  // Get total count
  const total = await db.vocabulary.count({ where });

  // Get paginated vocabulary
  const vocabulary = await db.vocabulary.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return paginatedResponse(
    vocabulary.map((v) => ({
      id: v.id,
      word: v.word,
      definition: v.definition,
      context: v.context,
      source: v.source,
      mastery: v.mastery,
      createdAt: v.createdAt,
      reviewedAt: v.reviewedAt,
    })),
    total,
    page,
    pageSize
  );
}

// PATCH /api/vocabulary - Update vocabulary mastery
async function handlePatch(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    throw new Error('User ID not found in request');
  }

  const body = await validateBody(request, VocabularyPatchSchema);
  const { id, mastery, definition } = body;

  const updateData: { mastery?: number; definition?: string; reviewedAt?: Date } = {};
  if (mastery !== undefined) {
    updateData.mastery = Math.min(100, Math.max(0, mastery));
    updateData.reviewedAt = new Date();
  }
  if (definition !== undefined) {
    updateData.definition = definition;
  }

  // SECURITY: Verify vocabulary belongs to authenticated user
  const vocabulary = await db.vocabulary.update({
    where: {
      id,
      userId, // Only allow updating user's own vocabulary
    },
    data: updateData,
  });

  return successResponse({
    id: vocabulary.id,
    word: vocabulary.word,
    mastery: vocabulary.mastery,
    definition: vocabulary.definition,
    reviewedAt: vocabulary.reviewedAt,
  });
}

export const POST = withErrorHandling(handlePost);
export const GET = withErrorHandling(handleGet);
export const PATCH = withErrorHandling(handlePatch);
