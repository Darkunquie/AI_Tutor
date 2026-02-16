import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT Secret from environment variable - REQUIRED
// Type assertion is safe because we throw if undefined
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
})();

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

// Auth user interface (returned from verification)
export interface AuthUser {
  userId: string;
  email: string;
  name: string;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 * @param payload - User data to include in token
 * @param rememberMe - If true, token expires in 30 days; otherwise 7 days
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? '30d' : '7d';

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Extract and verify authentication from request headers
 * @param request - Next.js request object
 * @returns Authenticated user data or null if not authenticated
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
  // Get token from Authorization header (format: "Bearer <token>")
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  };
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePassword(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  return { isValid: true };
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }

  return { isValid: true };
}

/**
 * Validate phone number format (Indian format)
 * @param phone - Phone number to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  error?: string;
} {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Check if it's a valid 10-digit number or 10 digits with country code
  const phoneRegex = /^(\+91)?[6-9]\d{9}$/;

  if (!phoneRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Invalid phone number format (must be 10 digits starting with 6-9)',
    };
  }

  return { isValid: true };
}
