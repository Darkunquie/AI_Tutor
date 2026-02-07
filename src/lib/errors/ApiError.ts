// Custom API Error class for structured error handling
// Provides consistent error format across all API routes

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'BAD_REQUEST';

export interface ApiErrorDetails {
  field?: string;
  message: string;
  code?: string;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details?: ApiErrorDetails[];
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ApiErrorCode = 'INTERNAL_ERROR',
    details?: ApiErrorDetails[]
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  // Factory methods for common error types
  static badRequest(message: string, details?: ApiErrorDetails[]): ApiError {
    return new ApiError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource: string = 'Resource'): ApiError {
    return new ApiError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static rateLimited(message: string = 'Too many requests'): ApiError {
    return new ApiError(message, 429, 'RATE_LIMITED');
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(message, 500, 'INTERNAL_ERROR');
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(message, 503, 'SERVICE_UNAVAILABLE');
  }

  // Convert to JSON response format
  toJSON() {
    return {
      error: {
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp.toISOString(),
      },
    };
  }

  // Create Response object for Next.js API routes
  toResponse(): Response {
    return Response.json(this.toJSON(), { status: this.statusCode });
  }
}
