// Set environment variables for testing - MUST be before any imports that use them
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-32-chars-min';
process.env.DATABASE_URL = 'file:./prisma/test.db';

import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})
