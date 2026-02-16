import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  validatePassword,
  validateEmail,
  validatePhone,
  type JWTPayload,
} from '../auth';

describe('Auth Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
      expect(hashed).toMatch(/^\$2[ayb]\$.{56}$/); // bcrypt hash pattern
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Salt should make them different
    });

    it('should hash empty string', async () => {
      const hashed = await hashPassword('');
      expect(hashed).toBeDefined();
      expect(hashed.length).toBeGreaterThan(0);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'correctPassword123';
      const hashed = await hashPassword(password);
      const result = await comparePassword(password, hashed);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'correctPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashed = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hashed);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = 'correctPassword123';
      const hashed = await hashPassword(password);
      const result = await comparePassword('', hashed);

      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = 'Password123';
      const hashed = await hashPassword(password);
      const result = await comparePassword('password123', hashed);

      expect(result).toBe(false);
    });
  });

  describe('generateToken', () => {
    const mockPayload: JWTPayload = {
      userId: 'user123',
      email: 'test@example.com',
      name: 'Test User',
    };

    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate token with 7-day expiry by default', () => {
      const token = generateToken(mockPayload, false);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.name).toBe(mockPayload.name);
    });

    it('should generate token with 30-day expiry when rememberMe is true', () => {
      const token = generateToken(mockPayload, true);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });

    it('should include all payload fields in token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).toMatchObject({
        userId: mockPayload.userId,
        email: mockPayload.email,
        name: mockPayload.name,
      });
    });
  });

  describe('verifyToken', () => {
    const mockPayload: JWTPayload = {
      userId: 'user456',
      email: 'verify@example.com',
      name: 'Verify User',
    };

    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.name).toBe(mockPayload.name);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should return null for malformed token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should return null for empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('should return null for token with wrong signature', () => {
      const token = generateToken(mockPayload);
      // Tamper with the token
      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.${parts[1]}.wrongsignature`;
      const decoded = verifyToken(tamperedToken);

      expect(decoded).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password (8+ characters)', () => {
      const result = validatePassword('validPass123');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept exactly 8 characters', () => {
      const result = validatePassword('12345678');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept long passwords', () => {
      const longPassword = 'a'.repeat(100);
      const result = validatePassword(longPassword);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePassword('short');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('should reject exactly 7 characters', () => {
      const result = validatePassword('1234567');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });

    it('should reject empty password', () => {
      const result = validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Password must be at least 8 characters long');
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'first+last@company.org',
        'email123@test-domain.com',
        'a@b.co',
      ];

      validEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@domain',
        'user.example.com',
        '',
      ];

      invalidEmails.forEach((email) => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid email format');
      });
    });

    it('should reject email with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should reject empty email', () => {
      const result = validateEmail('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('validatePhone', () => {
    it('should accept valid Indian phone numbers', () => {
      const validPhones = [
        '9876543210',
        '8123456789',
        '7890123456',
        '6234567890',
        '+919876543210',
        '+918123456789',
      ];

      validPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should accept phone numbers with formatting', () => {
      const formattedPhones = [
        '987-654-3210',
        '(987) 654-3210',
        '987 654 3210',
        '+91 987 654 3210',
        '+91-987-654-3210',
      ];

      formattedPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject phone numbers not starting with 6-9', () => {
      const invalidPhones = [
        '5876543210', // starts with 5
        '1234567890', // starts with 1
        '0123456789', // starts with 0
      ];

      invalidPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid phone number format (must be 10 digits starting with 6-9)');
      });
    });

    it('should reject phone numbers with wrong length', () => {
      const invalidPhones = [
        '987654321', // 9 digits
        '98765432101', // 11 digits
        '12345', // too short
      ];

      invalidPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid phone number format (must be 10 digits starting with 6-9)');
      });
    });

    it('should reject non-numeric phone numbers', () => {
      const invalidPhones = [
        'abcdefghij',
        '987abc3210',
        'notaphone',
        '',
      ];

      invalidPhones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid phone number format (must be 10 digits starting with 6-9)');
      });
    });

    it('should reject empty phone number', () => {
      const result = validatePhone('');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid phone number format (must be 10 digits starting with 6-9)');
    });
  });
});
