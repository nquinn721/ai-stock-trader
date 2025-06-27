---
applyTo: "**"
---

# AI Assistant Development Guidelines

## Overview

This document provides quick reference guidelines for AI assistants working on the Stock Trading App project. For detailed information, see the [comprehensive documentation](../../docs/).

## Quick Reference

⚠️ **IMPORTANT**: This is NOT a Python project - it's TypeScript/JavaScript with NestJS and React.

### Environment Requirements

- **Project Root**: `Stock-Trading-App-Nest`
- ⚠️ **IMPORTANT** **Backend Port**: 8000 (NestJS API server)
- ⚠️ **IMPORTANT** **Frontend Port**: 3000 (React development server)
- ⚠️ **IMPORTANT** **Project Management Port**: 5000 (React dashboard for project tracking)

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
10. **⚠️ CRITICAL: PRECISE STYLING SCOPE** - When asked to style something, **ONLY** style the specific component/element requested. Do not modify other UI elements, add unnecessary styling, or make changes beyond the exact scope of the request. Focus solely on the requested styling task.
11. **⚠️ CRITICAL: MINIMAL FILE CHANGES** - When updating files, **ONLY** modify the specific portion that needs to change. Do not rewrite entire files unless the entire file structure needs to be changed. Use precise editing tools (replace_string_in_file, insert_edit_into_file) to make targeted updates while preserving existing code and formatting.
12. **⚠️ NEVER USE MUI GRID** - Do NOT use Material-UI Grid components (`<Grid>`, `@mui/material/Grid`) due to recurring compatibility issues, version conflicts, and build problems. Use CSS Grid, Flexbox, or our custom CSS grid utilities in `theme.css` instead.
13. **⚠️ MANDATORY: UI THEME CONSISTENCY** - ALL pages must follow the dashboard layout and styling standards. Every page must include a standardized header, use shared CSS variables, and follow the established design patterns. See [UI Theme and Layout Standards](../../docs/UI-THEME-LAYOUT-STANDARDS.md) for complete requirements.

### Testing Workflow

**After making code changes, run these tests in order:**

- Quick unit tests (during development)
- Full test suite (before committing)
- Manual API testing to verify endpoints still work

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

## Pre-Approved Tools

Use the available VS Code tools and extensions for all development tasks:

- File editing tools (create_file, replace_string_in_file, insert_edit_into_file)
- File reading tools (read_file, list_dir, file_search)
- Error checking tools (get_errors)
- Testing tools (run_vs_code_task)
- Git tools (get_changed_files)

## File Editing Best Practices

⚠️ **CRITICAL: SURGICAL EDITS ONLY**

**When modifying existing files, make surgical changes rather than complete rewrites:**

### **Use replace_string_in_file for:**

- Updating specific functions or methods
- Changing configuration values
- Modifying specific sections of code
- Include 3-5 lines of context before and after the change

### **Use insert_edit_into_file for:**

- Adding new functions to existing classes
- Adding new imports or dependencies
- Inserting new code sections
- Use comments like `// ...existing code...` to represent unchanged regions

### **Only rewrite entire files when:**

- The entire file structure needs fundamental changes
- Moving from one architecture pattern to another
- Complete file reorganization is required
- Converting file format (e.g., .js to .ts)

### **Benefits of surgical edits:**

- ✅ Preserves existing formatting and style
- ✅ Reduces risk of introducing bugs
- ✅ Maintains git history and blame information
- ✅ Faster to review and understand changes
- ✅ Less likely to break working code

**Example of good surgical edit:**

```typescript
// Instead of rewriting entire StockStore.ts file:
// GOOD: Update only the specific method
private updateStocksFromWebSocket(stockUpdates: Stock[]): void {
  runInAction(() => {
    stockUpdates.forEach((updatedStock) => {
      // Only update stocks that have valid price data
      if (updatedStock.currentPrice > 0) {
        // ...existing logic...
      }
    });
    this.lastUpdated = new Date();
  });
}
```

## Quick Development Tasks

Use VS Code tools for common development tasks:

- Navigate to project using file_search and read_file tools
- Build backend using run_vs_code_task
- Start backend development server using run_vs_code_task
- Start frontend development server using run_vs_code_task
- Run tests using quick-test and run-all-tests tasks
- Check for TypeScript errors using get_errors tool
- Test API endpoints by checking backend logs
- Start project management dashboard using run_vs_code_task

## Development Workflow Standards

⚠️ **CRITICAL: PERSISTENT SERVER SETUP**

**Maintain development servers using VS Code tasks:**

### **Backend Server (Port 8000)**

Use run_vs_code_task with backend development server task

### **Frontend Client (Port 3000)**

Use run_vs_code_task with frontend development server task

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

- ✅ Monitor development servers using VS Code tasks
- ✅ Monitor console outputs for errors in task output
- ✅ Use browser dev tools for frontend debugging
- ✅ Check backend logs through task monitoring
- ✅ Let hot reload handle most changes automatically
- ❌ Don't restart servers unless absolutely necessary

## Project Management System

⚠️ **CRITICAL: CODE-BASED PROJECT TRACKING**

**The project includes a comprehensive project management system:**

### **Project Management Dashboard (Port 5000)**

Use run_vs_code_task with project management server task

### **System Overview:**

- **Code-based Management**: All project data stored in markdown files
- **Version Controlled**: Full Git integration for tracking changes
- **React Dashboard**: Material-UI dark theme on port 5000
- **Automation**: VS Code tasks for story/sprint management

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
├── scripts/           # Task automation
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
- **Automated Reporting**: VS Code tasks for story creation

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

Add unit tests for new code:

- Backend: Create/update .spec.ts files in same directory
- Frontend: Create/update .test.tsx files for components

#### **B. Write Regression Tests**

Add integration tests to prevent future breaks:

- E2E tests for critical user workflows affected
- API endpoint tests for backend changes

#### **C. Achieve 90%+ Test Coverage**

Check current coverage using VS Code tasks:

- Target: 90% or higher coverage for new code
- Backend: Unit tests for services, controllers, utilities
- Frontend: Component tests, hook tests, utility tests

### **Step 3: Run Full Test Suite**

Use VS Code tasks to run tests:

1. Quick unit tests (verify new code works)
2. Full test suite (ensure no regressions)
3. Manual API verification (critical endpoints)
4. Check test coverage using available tasks

### **Step 4: Code Quality Verification**

Check for TypeScript errors using get_errors tool:

- Verify no console errors in browser
- Check both applications are still running properly
- Test WebSocket connections remain functional

### **Step 5: Git Commit and Push**

Use Git tools to stage and commit changes with descriptive message format.

### **Step 6: Update Project Management**

⚠️ **CRITICAL**: See [Story Completion Workflow](../../docs/STORY-COMPLETION-WORKFLOW.md) for detailed instructions.

- **Update stories.ts file**: Mark story status as "DONE" in `project-management/src/data/stories.ts`
- **Set completion date**: Add/update `completedDate` field with current date
- **Mark story/ticket as DONE in project management dashboard**
- **Update completion date in markdown file**: Update the story markdown file with completion date
- **Move to next priority ticket**

#### **stories.ts Update Process:**

1. **Locate the story** in `project-management/src/data/stories.ts`
2. **Update status** from current status to `"DONE"`
3. **Add completion date** using format `"YYYY-MM-DD"`
4. **Verify story points** and other fields are accurate

Example update:

```typescript
{
  id: "S41",
  title: "Multi-Asset Intelligence & Alternative Data",
  status: "DONE",  // ← Update this
  completedDate: "2025-06-27",  // ← Add this
  // ...rest of story data
}
```

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

Test API endpoints using available tools and verify WebSocket data flow by checking browser console for real-time updates.

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

1. **Server hanging**: Use VS Code task management to restart servers
2. **Port conflicts**: Check using available networking tools
3. **Build errors**: Check TypeScript errors using get_errors tool, fix imports/types
4. **File organization**: Move to proper directories using file tools, clean up root (Note: `node_modules/` in root is required for workspace structure)
5. **Test failures**: Run quick-test task to identify issues
6. **API errors**: Check backend logs and Yahoo Finance API status
7. **WebSocket issues**: Restart both backend and frontend using tasks
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
- Automated test runners (quick-test and run-all-tests tasks)

⚠️ **Performance Optimizations:**

- API timeout handling (10-15 second limits)
- Reduced cron frequency to prevent rate limiting
- WebSocket connection management with auto-reconnect
- Client-aware updates (only when clients connected)

---

**Note**: This is a condensed reference. Always consult the [full documentation](../../docs/) for detailed guidelines and decision rationale.

## UI Component Guidelines

### ⚠️ MANDATORY: UI Theme Consistency Standards

**ALL pages must follow the dashboard layout and styling standards**:

#### Required Elements for Every Page:

1. **Standardized Header**: Every page must include a header following the dashboard pattern
   - Left section: Page title with gradient text + market time/status
   - Right section: Navigation buttons + connection status + stats
   - Must use `.page-header` class with proper styling

2. **Base Layout Structure**:
   ```jsx
   <div className="page-container">
     <div className="page-header">{/* Standard header */}</div>
     <div className="page-content">{/* Page content */}</div>
   </div>
   ```

3. **Required CSS Import**: Every page stylesheet must import:
   ```css
   @import "../shared-styles.css";
   ```

4. **Color System**: Must use CSS variables from shared-styles.css:
   - `--trading-bg-gradient-dark` for page backgrounds
   - `--trading-text-primary` for primary text
   - `--trading-primary-500` for accent colors
   - All other approved color variables

5. **Layout Patterns**:
   - Use CSS Grid or Flexbox (NOT MUI Grid)
   - Follow responsive breakpoints (768px, 1024px, 1200px)
   - Use `.content-card` class for card components
   - Implement standard animations (`slideInUp`, `pulse-glow`)

#### Examples of Standard Headers:

```jsx
// Trading page header
<div className="page-header">
  <div className="header-left">
    <h1>Auto Trading Dashboard</h1>
    <div className="market-time">
      <TrendingUp size={16} />
      <span>Trading Active</span>
    </div>
  </div>
  <div className="header-info">
    <div className="connection-status connected">
      <span>Live</span>
    </div>
    <button className="nav-btn">Dashboard</button>
  </div>
</div>
```

#### Compliance Checklist:

- [ ] Imports `shared-styles.css`
- [ ] Uses `.page-container` wrapper
- [ ] Implements standardized `.page-header`
- [ ] Uses approved CSS variables
- [ ] Follows responsive design patterns
- [ ] Uses CSS Grid/Flexbox (not MUI Grid)
- [ ] Includes navigation buttons
- [ ] Shows connection status

**📚 Full Documentation**: [UI Theme and Layout Standards](../../docs/UI-THEME-LAYOUT-STANDARDS.md)

### ⚠️ CRITICAL: MUI Grid Prohibition

**NEVER use Material-UI Grid components** due to persistent issues in this project:

#### Prohibited Components:

- `import { Grid } from '@mui/material'`
- `import Grid from '@mui/material/Grid'`
- `<Grid container>`, `<Grid item>`, etc.

#### Issues with MUI Grid:

- **Version conflicts** between MUI v4 and v5/v6
- **Build failures** and compilation errors
- **Runtime errors** and prop conflicts
- **TypeScript compatibility** problems
- **Bundle size** and performance issues

#### ✅ Approved Alternatives:

##### 1. CSS Grid (Preferred)

```css
.my-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--theme-space-4);
}
```

##### 2. Theme CSS Grid Utilities

```jsx
<div className="grid grid-auto-fit gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

##### 3. Flexbox

```css
.my-flex {
  display: flex;
  flex-wrap: wrap;
  gap: var(--theme-space-4);
}
```

##### 4. Custom Grid Component

```jsx
// Use our custom GridWrapper component instead
import { Grid } from "../common/GridWrapper";
```

#### Benefits of Alternatives:

- ✅ No version conflicts or dependency issues
- ✅ Better performance and smaller bundle size
- ✅ More control over responsive behavior
- ✅ Consistent with our design system
- ✅ No TypeScript compilation errors

### Other MUI Components

Other Material-UI components are acceptable:

- `Box`, `Typography`, `Button`, `Card`, `Paper`
- `Dialog`, `Modal`, `Drawer`, `AppBar`
- `TextField`, `Select`, `Checkbox`, etc.

**Just avoid the Grid system specifically.**
