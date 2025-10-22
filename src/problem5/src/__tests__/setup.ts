/**
 * Test setup and global configuration
 */

/**
 * Test setup and configuration
 * This file runs before all tests to configure the test environment
 */
import Database from '../database/database.js';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for tests

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
};

// Initialize database before all tests
beforeAll(async () => {
  // Wait for database initialization
  await new Promise(resolve => setTimeout(resolve, 100));
  Database.getInstance();
});

// Close database after all tests
afterAll(() => {
  const db = Database.getInstance();
  db.close();
});
