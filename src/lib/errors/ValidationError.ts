// Validation Error class for Zod schema validation failures
// Converts Zod errors to structured API error format

import { ZodError, ZodIssue } from 'zod';
import { ApiError, ApiErrorDetails } from './ApiError';

export class ValidationError extends ApiError {
  public readonly zodError?: ZodError;

  constructor(message: string, details?: ApiErrorDetails[], zodError?: ZodError) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    this.zodError = zodError;
  }

  // Create from Zod error
  static fromZodError(error: ZodError): ValidationError {
    const details = error.issues.map((issue: ZodIssue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    const message =
      details.length === 1
        ? details[0].message
        : `Validation failed with ${details.length} errors`;

    return new ValidationError(message, details, error);
  }

  // Create from simple field errors
  static fromFields(errors: Record<string, string>): ValidationError {
    const details: ApiErrorDetails[] = Object.entries(errors).map(([field, message]) => ({
      field,
      message,
    }));

    return new ValidationError('Validation failed', details);
  }

  // Create for a single field error
  static field(field: string, message: string): ValidationError {
    return new ValidationError(message, [{ field, message }]);
  }

  // Create for missing required field
  static required(field: string): ValidationError {
    return ValidationError.field(field, `${field} is required`);
  }

  // Create for invalid type
  static invalidType(field: string, expected: string): ValidationError {
    return ValidationError.field(field, `${field} must be a valid ${expected}`);
  }

  // Get errors grouped by field
  getFieldErrors(): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    for (const detail of this.details || []) {
      const field = detail.field || '_root';
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(detail.message);
    }

    return fieldErrors;
  }

  // Get first error for a specific field
  getFieldError(field: string): string | undefined {
    return this.details?.find((d) => d.field === field)?.message;
  }
}
