// Centralized error handling for Next.js API routes
// Wraps route handlers with consistent error handling and logging

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './errors/ApiError';
import { ValidationError } from './errors/ValidationError';

// Type for route handler functions
type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

// Type for route params
interface RouteContext {
  params: Promise<Record<string, string>>;
}

/**
 * Wraps an API route handler with error handling
 * Catches all errors and converts them to proper API responses
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context?: RouteContext): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleError(error);
    }
  };
}

/**
 * Converts any error to an appropriate API response
 */
export function handleError(error: unknown): Response {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[API Error]', error);
  }

  // Already an ApiError - return as-is
  if (error instanceof ApiError) {
    return error.toResponse();
  }

  // Zod validation error
  if (error instanceof ZodError) {
    return ValidationError.fromZodError(error).toResponse();
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for specific error types by name/message
    if (error.name === 'PrismaClientKnownRequestError') {
      return handlePrismaError(error);
    }

    // Generic error
    return ApiError.internal(
      process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    ).toResponse();
  }

  // Unknown error type
  return ApiError.internal('An unexpected error occurred').toResponse();
}

/**
 * Type guard to check if error is a Prisma error
 */
function isPrismaError(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    'code' in error &&
    typeof error.code === 'string' &&
    error.code.startsWith('P')
  );
}

/**
 * Handles Prisma-specific errors
 */
function handlePrismaError(error: Error): Response {
  if (!isPrismaError(error)) {
    return ApiError.internal('Database error').toResponse();
  }

  const code = error.code;

  switch (code) {
    case 'P2002': // Unique constraint violation
      return ApiError.badRequest('A record with this value already exists').toResponse();
    case 'P2025': // Record not found
      return ApiError.notFound('Record').toResponse();
    case 'P2003': // Foreign key constraint violation
      return ApiError.badRequest('Referenced record does not exist').toResponse();
    default:
      return ApiError.internal('Database error').toResponse();
  }
}

/**
 * Validates request body against a Zod schema
 * Throws ValidationError if validation fails
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  try {
    const body = await request.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error);
    }
    if (error instanceof SyntaxError) {
      throw ApiError.badRequest('Invalid JSON in request body');
    }
    throw error;
  }
}

/**
 * Validates query parameters against a Zod schema
 * Throws ValidationError if validation fails
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): T {
  const searchParams = request.nextUrl.searchParams;
  const query: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  try {
    return schema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      throw ValidationError.fromZodError(error);
    }
    throw error;
  }
}

/**
 * Creates a successful JSON response
 */
export function successResponse<T>(data: T, status: number = 200): Response {
  return Response.json({ data }, { status });
}

/**
 * Creates a paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): Response {
  return Response.json({
    data,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
