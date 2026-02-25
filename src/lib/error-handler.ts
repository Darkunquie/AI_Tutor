// Centralized error handling for Next.js API routes
// Wraps route handlers with consistent error handling and logging

import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './errors/ApiError';
import { ValidationError } from './errors/ValidationError';
import { verifyToken } from './auth';
import { db } from './db';

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
  // Always log errors for production visibility
  console.error('[API Error]', error instanceof Error ? error.message : error);

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
    case 'P2002': // Unique constraint violation (409 Conflict)
      return new ApiError('A record with this value already exists', 409, 'BAD_REQUEST').toResponse();
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

/**
 * Wraps a route handler with JWT authentication.
 * Verifies the Bearer token from the Authorization header directly in Node.js
 * (not Edge Runtime), then injects x-user-id/email/name headers for the handler.
 *
 * Use this instead of withErrorHandling for any protected API route.
 */
export function withAuth(handler: RouteHandler): RouteHandler {
  return withErrorHandling(async (request, context) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    // Verify user still exists and check current status (catches changes since token was issued)
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId },
      select: { status: true, role: true },
    });

    if (!currentUser) {
      throw ApiError.unauthorized('User no longer exists');
    }

    if (currentUser.role !== 'ADMIN' && currentUser.status !== 'APPROVED') {
      throw ApiError.forbidden('Your account is not approved');
    }

    // Clone request with user identity headers set
    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-email', payload.email);
    headers.set('x-user-name', payload.name);
    headers.set('x-user-role', currentUser.role);
    headers.set('x-user-status', currentUser.status);

    // Clone request to avoid ReadableStream double-consumption issues
    const clonedRequest = request.clone();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authedRequest = new NextRequest(clonedRequest.url, {
      method: clonedRequest.method,
      headers,
      body: clonedRequest.body,
    } as any);

    return handler(authedRequest, context);
  });
}

/**
 * Wraps a route handler with admin-only authentication.
 * Verifies JWT token AND checks that the user has ADMIN role.
 */
export function withAdmin(handler: RouteHandler): RouteHandler {
  return withErrorHandling(async (request, context) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      throw ApiError.unauthorized('Invalid or expired token');
    }

    // Verify user exists and has admin role
    const currentUser = await db.user.findUnique({
      where: { id: payload.userId },
      select: { status: true, role: true },
    });

    if (!currentUser) {
      throw ApiError.unauthorized('User no longer exists');
    }

    if (currentUser.role !== 'ADMIN') {
      throw ApiError.forbidden('Admin access required');
    }

    const headers = new Headers(request.headers);
    headers.set('x-user-id', payload.userId);
    headers.set('x-user-email', payload.email);
    headers.set('x-user-name', payload.name);
    headers.set('x-user-role', currentUser.role);
    headers.set('x-user-status', currentUser.status);

    const clonedRequest = request.clone();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authedRequest = new NextRequest(clonedRequest.url, {
      method: clonedRequest.method,
      headers,
      body: clonedRequest.body,
    } as any);

    return handler(authedRequest, context);
  });
}
