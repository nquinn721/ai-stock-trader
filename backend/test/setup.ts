// Jest setup file for backend tests
global.console = {
  ...console,
  // Suppress console logs during tests unless needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
