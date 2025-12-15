import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '../src/db/client';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';

// Global test setup
beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean up database before each test
  // This ensures tests are isolated
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // Disconnect from test database
  await prisma.$disconnect();
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to ignore specific console methods
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};