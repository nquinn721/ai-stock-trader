---
applyTo: "**"
---

# AI Assistant Development Guidelines

## Overview

This document provides quick reference guidelines for AI assistants working on the Stock Trading App project. For detailed information, see the [comprehensive documentation](../../docs/).

## Quick Reference

⚠️ **IMPORTANT**: This is NOT a Python project - it's TypeScript/JavaScript with NestJS and React.

### Environment Requirements

- **Shell**: PowerShell commands only
- **Python Env**: sklearn-env (for ML components)
- **Project Root**: `Stock-Trading-App-Nest`
- **Backend Port**: 8000 (NestJS API server)
- **Frontend Port**: 3000 (React development server)

### Core Principles

1. **Don't break working code** - Test changes before committing
2. **Use TypeScript everywhere** - No `.js` files in React app
3. **Keep servers running** - Hot reload enabled, no restarts needed
4. **Clean as you go** - Close files after editing, organize project structure
5. **Test after changes** - Run relevant tests after modifying code chunks
6. **Update documentation** - Keep project stories and docs current

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

# Check port usage (backend on 8000, frontend on 3000)
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Test API endpoints
curl http://localhost:8000/stocks/with-signals/all
curl http://localhost:8000/paper-trading/portfolios

# Kill hanging processes
taskkill /F /PID <process_id>
```

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
