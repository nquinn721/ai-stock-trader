# Testing Practices for Stock Trading App

## Overview

This document outlines best practices for testing in the Stock Trading App project to ensure code quality, prevent regressions, and maintain system reliability.

## Core Testing Principles

### 1. **Test After Every Code Change**

- Run relevant tests immediately after making changes
- Use `quick-test.ps1` for rapid feedback during development
- Run full test suite before committing major changes

### 2. **Test Pyramid Strategy**

```
         /\
        /  \    E2E Tests (Few, Slow, Expensive)
       /____\
      /      \   Integration Tests (Some, Medium)
     /________\
    /          \  Unit Tests (Many, Fast, Cheap)
   /____________\
```

### 3. **Test-Driven Development (TDD)**

- Write tests before implementing features
- Red → Green → Refactor cycle
- Ensures testable code design

## Testing Workflow

### Development Cycle

1. **Before Starting Work**

   ```powershell
   # Ensure all tests pass
   .\quick-test.ps1
   ```

2. **During Development**

   ```powershell
   # Run tests for specific module
   cd backend
   npm test -- --testPathPattern=stock.service.spec.ts

   # Run frontend tests for specific component
   cd frontend
   npm test -- Dashboard.test.tsx --watchAll=false
   ```

3. **After Code Changes**

   ```powershell
   # Quick validation
   .\quick-test.ps1

   # Full validation before commit
   .\run-all-tests.ps1
   ```

4. **Before Deployment**
   ```powershell
   # Complete test suite + E2E
   .\run-all-tests.ps1
   ```

## Test Categories

### Backend Tests

#### Unit Tests (`*.spec.ts`)

- **Location**: `backend/src/**/*.spec.ts`
- **Purpose**: Test individual functions, services, controllers
- **Run**: `npm test`
- **Coverage**: Aim for >80% code coverage

**Example Structure**:

```typescript
describe("StockService", () => {
  beforeEach(() => {
    // Setup mocks and dependencies
  });

  it("should fetch live stock data", async () => {
    // Arrange, Act, Assert
  });

  it("should handle API errors gracefully", async () => {
    // Test error scenarios
  });
});
```

#### Integration Tests (`*.integration.spec.ts`)

- **Location**: `backend/test/`
- **Purpose**: Test API endpoints, database interactions
- **Run**: `npm run test:e2e`
- **Focus**: Real API calls, data flow

### Frontend Tests

#### Component Tests (`*.test.tsx`)

- **Location**: `frontend/src/**/*.test.tsx`
- **Purpose**: Test React components, hooks, context
- **Run**: `npm test`
- **Tools**: Jest, React Testing Library

**Best Practices**:

```typescript
// Test user interactions, not implementation
it("should display stock data when loaded", () => {
  render(<Dashboard />);
  expect(screen.getByText(/stock data/i)).toBeInTheDocument();
});

// Mock external dependencies
jest.mock("../context/SocketContext", () => ({
  useSocket: () => mockSocketData,
}));
```

### End-to-End Tests

#### Playwright Tests (`*.spec.ts`)

- **Location**: `e2e-tests/tests/`
- **Purpose**: Test complete user workflows
- **Run**: `npx playwright test`
- **Focus**: User journeys, cross-browser compatibility

## Test Data Management

### Live Data vs Mock Data

- **Development**: Use live APIs with proper error handling
- **Testing**: Mock external APIs for reliability
- **E2E**: Test against real endpoints when possible

### Test Environment Setup

```typescript
// Backend test setup
beforeEach(async () => {
  // Clear database
  // Reset mocks
  // Initialize test data
});

// Frontend test setup
beforeEach(() => {
  // Reset component state
  // Mock API responses
  // Setup test context
});
```

## Continuous Integration

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:quick",
      "pre-push": "npm run test:full"
    }
  }
}
```

### CI/CD Pipeline

1. **Code Push** → Trigger CI
2. **Install Dependencies** → `npm ci`
3. **Lint & Type Check** → `npm run lint`
4. **Unit Tests** → `npm test`
5. **Integration Tests** → `npm run test:e2e`
6. **E2E Tests** → `npx playwright test`
7. **Deploy** → Only if all tests pass

## Performance Testing

### Load Testing

- Test API endpoints under load
- Monitor WebSocket connection limits
- Validate stock data update frequency

### Memory Leak Detection

```typescript
// Monitor memory usage in long-running tests
afterEach(() => {
  // Check for memory leaks
  // Clear timeouts/intervals
  // Close connections
});
```

## Error Handling Tests

### Network Failures

```typescript
it("should handle Yahoo Finance API timeout", async () => {
  // Mock API timeout
  // Verify graceful degradation
  // Check error logging
});
```

### Rate Limiting

```typescript
it("should respect API rate limits", async () => {
  // Simulate rate limiting
  // Verify retry logic
  // Check backoff strategy
});
```

## Testing Tools Configuration

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testTimeout: 30000, // 30 seconds for API tests
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/main.ts"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: 30000,
  retries: 2,
  workers: 1, // Prevent conflicts
  use: {
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
```

## Test Maintenance

### Regular Tasks

- **Weekly**: Review test coverage reports
- **Monthly**: Update test data and scenarios
- **Quarterly**: Refactor slow or flaky tests

### Test Hygiene

- Remove obsolete tests
- Update tests when APIs change
- Keep test data current
- Monitor test execution time

## Debugging Failed Tests

### Backend Test Failures

```bash
# Run specific test with debug info
npm test -- --testNamePattern="should update stock price" --verbose

# Debug with breakpoints
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend Test Failures

```bash
# Run tests with debug output
npm test -- --verbose --no-coverage

# Open browser for debugging
DEBUG_PRINT_LIMIT=0 npm test
```

### E2E Test Failures

```bash
# Run with UI mode
npx playwright test --ui

# Debug specific test
npx playwright test --debug dashboard.spec.ts
```

## Metrics and Reporting

### Test Coverage

- Target: >80% overall coverage
- Critical paths: >95% coverage
- Track coverage trends over time

### Test Performance

- Unit tests: <5 seconds total
- Integration tests: <30 seconds
- E2E tests: <5 minutes
- Full suite: <10 minutes

### Quality Metrics

- Test reliability: >95% pass rate
- Flaky test ratio: <2%
- Test maintenance time: <10% of development time

## Best Practices Summary

### DO ✅

- Write tests first (TDD)
- Test behavior, not implementation
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies
- Run tests frequently
- Maintain test documentation

### DON'T ❌

- Skip tests for "quick fixes"
- Test implementation details
- Share state between tests
- Ignore flaky tests
- Commit failing tests
- Write tests without assertions
- Test everything at E2E level

## Example Test Scenarios

### Stock Service Tests

```typescript
describe("Stock Service Live Data", () => {
  it("should fetch real-time prices from Yahoo Finance");
  it("should handle API rate limiting gracefully");
  it("should cache stock data appropriately");
  it("should broadcast updates via WebSocket");
  it("should handle network timeouts");
});
```

### Dashboard Component Tests

```typescript
describe("Dashboard Component", () => {
  it("should display loading state initially");
  it("should show stock data when loaded");
  it("should handle empty data gracefully");
  it("should update with real-time WebSocket data");
  it("should display error messages appropriately");
});
```

### E2E Workflow Tests

```typescript
describe("Complete Trading Workflow", () => {
  it("should load dashboard with live stock data");
  it("should execute paper trades successfully");
  it("should update portfolio performance");
  it("should handle WebSocket reconnection");
  it("should work across different screen sizes");
});
```

---

**Remember**: Good tests are investments in code quality, not overhead. They enable confident refactoring, prevent regressions, and improve development velocity over time.
