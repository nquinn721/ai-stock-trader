---
applyTo: "**"
---

# AI Assistant Development Guidelines

## Overview

This document provides quick reference guidelines for AI assistants working on the Stock Trading App project. For detailed information, see the [comprehensive documentation](../../docs/).

## Quick Reference

⚠️ **IMPORTANT**: This is NOT a Python project - it's TypeScript/JavaScript with NestJS and React.

⚠️ **CRITICAL**: When using run_in_terminal tool, NEVER open new terminals. Always use the existing terminal sessions. Commands should run in the current working directory context.

### Environment Requirements

- **Shell**: PowerShell commands only
- **Project Root**: `Stock-Trading-App-Nest`
- **Backend Port**: 8000 (NestJS API server)
- **Frontend Port**: 3000 (React development server)
- **Project Management**: 5000 (React dashboard for project tracking)

### Core Principles

1. **Don't break working code** - Test changes before committing
2. **Use TypeScript everywhere** - No `.js` files in React app
3. **Keep servers running** - Hot reload enabled, no restarts needed
4. **Clean as you go** - Close files after editing, organize project structure
5. **Test after changes** - Run relevant tests after modifying code chunks
6. **Update documentation** - Keep project stories and docs current
7. **NO MOCK DATA** - Never use mock/fake data in the app. Always show proper "no data" states on the client and handle empty responses gracefully
8. **PROTECT OUTGOING APIs** - Never break Yahoo Finance API, News API, or any external API integrations. These are critical for real-time data
9. **PERSISTENT DEVELOPMENT SERVERS** - Keep client and server running in separate terminals. Hot reload handles updates automatically - no manual restarts needed

### Testing Workflow

**After making code changes, run these tests in order:**

```powershell
# 1. Quick unit tests (during development)
.\quick-test.ps1

# 2. Full test suite (before committing)
.\run-all-tests.ps1

# 3. Manual API testing
curl http://localhost:8000/stocks
curl http://localhost:8000/paper-trading/portfolios
```

### Data Flow Architecture

**Live Stock Data:**

- Source: Yahoo Finance API (real-time)
- Backend: `/stocks` and `/stocks/with-signals/all` endpoints
- Frontend: REST API + WebSocket updates
- Update: Every 2 minutes via cron job

**Portfolio Performance:**

- Source: Backend paper trading service
- Endpoints: `/paper-trading/portfolios/{id}/performance`
- Features: Historical performance, P&L tracking, trade history
- Real-time: WebSocket updates for live portfolio changes

## Documentation Links

📚 **Comprehensive Documentation**: [../../docs/README.md](../../docs/README.md)

📋 **Architecture Decision Records**:

- [ADR-001: Development Environment Standards](../../docs/adrs/001-development-environment-standards.md)
- [ADR-002: Code Style Standards](../../docs/adrs/002-code-style-standards.md)
- [ADR-003: Workflow Standards](../../docs/adrs/003-workflow-standards.md)
- [ADR-004: AI Assistant Guidelines](../../docs/adrs/004-ai-assistant-guidelines.md)
- [ADR-005: API Design Standards](../../docs/adrs/005-api-design-standards.md)
- [ADR-006: Real-Time Data Integration](../../docs/adrs/006-real-data-integration.md)
- [ADR-007: Testing Infrastructure Standards](../../docs/adrs/007-testing-infrastructure-standards.md)
- [ADR-008: GitHub Workflow Standards](../../docs/adrs/008-github-workflow-standards.md)
- [ADR-009: WebSocket Architecture](../../docs/adrs/009-websocket-architecture.md)

## Pre-Approved Commands

The following PowerShell commands are always permitted:

```powershell
Remove-Item, Get-ChildItem, Move-Item, Copy-Item, cd, netstat, taskkill, curl, Invoke-WebRequest, Get-Process
```

## Quick Commands

```powershell
# Navigate to project
cd c:\Projects\Stock-Trading-App-Nest

# Build backend
cd backend; npm run build

# Start backend (background)
cd backend; npm run start:dev

# Start frontend (background)
cd frontend; npm start

# Run tests after code changes
.\quick-test.ps1          # Unit tests only
.\run-all-tests.ps1       # Complete test suite

# Check port usage (backend on 8000, frontend on 3000, project mgmt on 5000)
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Test API endpoints
curl http://localhost:8000/stocks/with-signals/all
curl http://localhost:8000/paper-trading/portfolios

# Start project management dashboard
cd project-management; npm start

# Kill hanging processes
taskkill /F /PID <process_id>
```

## Development Workflow Standards

⚠️ **CRITICAL: PERSISTENT SERVER SETUP**

⚠️ **CRITICAL: NO NEW TERMINALS** - When using run_in_terminal tool, NEVER open new terminal windows or sessions. Always use the existing terminal context provided by the tool. Commands should execute in the current working directory without spawning new processes.

**Maintain two persistent terminal sessions:**

### **Terminal 1 - Backend Server (Port 8000)**

```powershell
cd c:\Projects\Stock-Trading-App-Nest\backend
npm run start:dev
```

### **Terminal 2 - Frontend Client (Port 3000)**

```powershell
cd c:\Projects\Stock-Trading-App-Nest\frontend
npm start
```

### **Hot Reload Benefits:**

1. **No manual restarts** - Code changes automatically refresh
2. **Faster development** - Immediate feedback on changes
3. **Preserved state** - WebSocket connections and data remain intact
4. **Error visibility** - Real-time compilation errors in terminals

### **When to Restart (Only if necessary):**

- **Build errors** that prevent hot reload
- **Environment variable changes** (.env modifications)
- **Package installations** (new npm dependencies)
- **Server crashes** (check terminal for error logs)
- **Port conflicts** (use netstat to identify issues)

### **Development Best Practices:**

- ✅ Keep both terminals visible while coding
- ✅ Monitor console outputs for errors
- ✅ Use browser dev tools for frontend debugging
- ✅ Check terminal logs for backend issues
- ✅ Let hot reload handle most changes automatically
- ❌ Don't restart servers unless absolutely necessary

## Project Management System

⚠️ **CRITICAL: CODE-BASED PROJECT TRACKING**

**The project includes a comprehensive project management system:**

### **Project Management Dashboard (Port 5000)**

```powershell
cd c:\Projects\Stock-Trading-App-Nest\project-management
npm start
```

### **System Overview:**

- **Code-based Management**: All project data stored in markdown files
- **Version Controlled**: Full Git integration for tracking changes
- **React Dashboard**: Material-UI dark theme on port 5000
- **Automation**: PowerShell scripts for story/sprint management

### **Current Project Status:**

- **Sprint 4**: Testing & Performance Enhancement (90% complete)
- **Phase Progress**: Foundation 100%, Testing 90%, ML Integration 40%
- **Test Coverage**: Backend 85%, Frontend 80%, E2E 90%
- **Stories**: 25/40 completed (63%)

### **Directory Structure:**

```
project-management/
├── dashboard/         # React dashboard (port 5000)
├── epics/             # Epic markdown files
├── stories/           # Story markdown files
├── sprints/           # Sprint markdown files
├── scripts/           # PowerShell automation
├── backlog.md         # Product backlog
├── roadmap.md         # High-level roadmap
├── progress.md        # Progress tracking
```

### **Port Allocation:**

- **Backend**: 8000 (NestJS API)
- **Frontend**: 3000 (React trading app)
- **Project Management**: 5000 (React dashboard)

### **Key Features:**

- **Multi-tab Interface**: Stories, Epics, Sprints, Actions
- **Real-time Data**: Reads from markdown files
- **Progress Tracking**: Visual sprint progress and metrics
- **Automated Reporting**: PowerShell scripts for story creation

## Ticket Management Processes

⚠️ **CRITICAL: COMPLETE TICKET WORKFLOW**

**Follow this exact process for every ticket/story completion:**

### **Step 1: Code Implementation**

- Implement the feature/fix according to ticket requirements
- Follow TypeScript best practices and coding standards
- Ensure no mock data is used (follow NO MOCK DATA policy)
- Verify external APIs remain protected and functional

### **Step 2: Testing Requirements (MANDATORY)**

#### **A. Write New Tests**

```powershell
# Add unit tests for new code
# Backend: Create/update .spec.ts files in same directory
# Frontend: Create/update .test.tsx files for components
```

#### **B. Write Regression Tests**

```powershell
# Add integration tests to prevent future breaks
# E2E tests for critical user workflows affected
# API endpoint tests for backend changes
```

#### **C. Achieve 90%+ Test Coverage**

```powershell
# Check current coverage
npm run test:cov

# Target: 90% or higher coverage for new code
# Backend: Unit tests for services, controllers, utilities
# Frontend: Component tests, hook tests, utility tests
```

### **Step 3: Run Full Test Suite**

```powershell
# Navigate to project root
cd c:\Projects\Stock-Trading-App-Nest

# 1. Quick unit tests (verify new code works)
.\quick-test.ps1

# 2. Full test suite (ensure no regressions)
.\run-all-tests.ps1

# 3. Manual API verification (critical endpoints)
curl http://localhost:8000/stocks/with-signals/all
curl http://localhost:8000/paper-trading/portfolios

# 4. Check test coverage
cd backend; npm run test:cov
cd ../frontend; npm run test -- --coverage
```

### **Step 4: Code Quality Verification**

```powershell
# Check for TypeScript errors
cd backend; npm run build
cd ../frontend; npm run build

# Verify no console errors in browser
# Check both applications are still running properly
# Test WebSocket connections remain functional
```

### **Step 5: Git Commit and Push**

```powershell
# Stage changes
git add .

# Commit with descriptive message
git commit -m "[Story ID] Brief description

- Feature/fix implemented
- Tests added (unit + regression)
- Coverage: X% (target: 90%+)
- All tests passing
- No API breaks confirmed"

# Push to repository
git push origin main
```

### **Step 6: Update Project Management**

- Mark story/ticket as DONE in project management dashboard
- Update completion date
- Move to next priority ticket

### **Testing Standards by Component:**

#### **Backend Testing:**

- **Services**: Mock external dependencies, test business logic
- **Controllers**: Test endpoint responses, error handling
- **Modules**: Integration tests for module functionality
- **API**: End-to-end API endpoint testing

#### **Frontend Testing:**

- **Components**: Render tests, user interaction tests
- **Hooks**: Custom hook functionality and state management
- **Utils**: Pure function testing for utilities
- **Integration**: User workflow testing with mocked APIs

### **Test Coverage Requirements:**

- **New Code**: 90% or higher coverage mandatory
- **Modified Code**: Maintain or improve existing coverage
- **Critical Paths**: 100% coverage for trading, API, data handling
- **Overall Project**: Target 85%+ overall coverage

### **Commit Message Format:**

```
[Story ID] Brief description (max 50 chars)

- What was implemented/fixed
- Tests added: unit, integration, e2e
- Coverage: X% (specify actual percentage)
- All tests passing: ✓
- APIs protected: ✓
- No regressions: ✓

Closes #[Story ID]
```

### **Quality Gates (Must Pass):**

1. ✅ All existing tests pass
2. ✅ New tests written and passing
3. ✅ 90%+ coverage for new code
4. ✅ No TypeScript compilation errors
5. ✅ No API functionality broken
6. ✅ WebSocket connections working
7. ✅ Both frontend and backend build successfully
8. ✅ Manual smoke testing completed

## Testing Best Practices

**When to Test:**

- After changing any service or controller logic
- After modifying React components
- After updating WebSocket functionality
- Before committing code changes
- After fixing bugs or adding features

**Test Coverage Requirements:**

- Backend: Unit tests for services and controllers
- Frontend: Component tests with proper mocking
- Integration: API endpoint testing
- E2E: User workflow validation with Playwright

## Data Handling Standards

⚠️ **CRITICAL: NO MOCK DATA POLICY**

**Never use mock/fake data in the application. Instead:**

1. **Always handle empty/null data gracefully**
2. **Show proper "No data available" messages**
3. **Display loading states while fetching real data**
4. **Handle API failures with user-friendly error messages**
5. **Use skeleton loaders or empty state components**

**Examples of proper handling:**

```typescript
// ✅ GOOD - Handle empty data
{
  stocks.length === 0 ? (
    <div className="no-data">No stocks available</div>
  ) : (
    stocks.map((stock) => <StockCard key={stock.id} stock={stock} />)
  );
}

// ❌ BAD - Using mock data
const mockStocks = [{ id: 1, symbol: "FAKE", price: 100 }];
```

**Backend API responses should:**

- Return empty arrays `[]` for no data (not null)
- Include proper HTTP status codes
- Provide meaningful error messages
- Never return hardcoded fake data

## External API Protection Standards

⚠️ **CRITICAL: PROTECT OUTGOING APIs**

**Never break or modify external API integrations:**

### **Protected APIs:**

1. **Yahoo Finance API** - Stock prices, historical data, market data
2. **News API** - Financial news and sentiment analysis
3. **Any third-party data providers**

### **Safety Guidelines:**

1. **Test API endpoints before changes** - Always verify external APIs work
2. **Preserve API key configurations** - Don't modify .env API settings
3. **Maintain error handling** - Keep existing timeout and retry logic
4. **Validate API responses** - Ensure data formats remain consistent
5. **Monitor rate limits** - Don't increase API call frequency without testing

### **Before modifying API-related code:**

```powershell
# Test Yahoo Finance API
curl "http://localhost:8000/stocks/with-signals/all"

# Test News API endpoints
curl "http://localhost:8000/news/AAPL"

# Verify WebSocket data flow
# Check browser console for real-time updates
```

### **API Integration Files to Handle Carefully:**

- `backend/src/modules/stock/stock.service.ts` - Yahoo Finance integration
- `backend/src/modules/news/news.service.ts` - News API integration
- `backend/src/services/` - External API service layers
- Any files with `yahoo-finance2` or news API calls

### **Warning Signs of Broken APIs:**

- Empty stock data arrays when market is open
- Missing price updates in WebSocket streams
- News sentiment showing as null/undefined
- Console errors about API timeouts or failures

## Emergency Procedures

1. **Server hanging**: Kill with `taskkill /F /IM node.exe`
2. **Port conflicts**: Check with `netstat`, kill specific PID
3. **Build errors**: Check TypeScript errors, fix imports/types
4. **File organization**: Move to proper directories, clean up root
5. **Test failures**: Run `.\quick-test.ps1` to identify issues
6. **API errors**: Check backend logs and Yahoo Finance API status
7. **WebSocket issues**: Restart both backend and frontend
8. **Performance issues**: Check cron job frequency and API timeouts

## Current Architecture Status

✅ **Live Data Integration:**

- Yahoo Finance API for real stock prices
- WebSocket real-time updates (every 2 minutes)
- Paper trading portfolio with backend persistence
- Portfolio performance tracking via `/paper-trading/portfolios/{id}/performance`

✅ **Testing Infrastructure:**

- Backend unit tests for all services/controllers
- Frontend component tests with proper mocking
- Playwright E2E tests for user workflows
- API integration tests for all endpoints
- Automated test runners (`quick-test.ps1`, `run-all-tests.ps1`)

⚠️ **Performance Optimizations:**

- API timeout handling (10-15 second limits)
- Reduced cron frequency to prevent rate limiting
- WebSocket connection management with auto-reconnect
- Client-aware updates (only when clients connected)

---

**Note**: This is a condensed reference. Always consult the [full documentation](../../docs/) for detailed guidelines and decision rationale.
