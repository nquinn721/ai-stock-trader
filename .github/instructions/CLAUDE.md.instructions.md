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

### Core Principles

1. **Don't break working code** - Test changes before committing
2. **Use TypeScript everywhere** - No `.js` files in React app
3. **Keep servers running** - Hot reload enabled, no restarts needed
4. **Clean as you go** - Close files after editing, organize project structure

## Documentation Links

📚 **Comprehensive Documentation**: [../../docs/README.md](../../docs/README.md)

📋 **Architecture Decision Records**:

- [ADR-001: Development Environment Standards](../../docs/adrs/001-development-environment-standards.md)
- [ADR-002: Code Style Standards](../../docs/adrs/002-code-style-standards.md)
- [ADR-003: Workflow Standards](../../docs/adrs/003-workflow-standards.md)
- [ADR-004: AI Assistant Guidelines](../../docs/adrs/004-ai-assistant-guidelines.md)
- [ADR-005: API Design Standards](../../docs/adrs/005-api-design-standards.md)
- [ADR-006: Real-Time Data Integration](../../docs/adrs/006-real-data-integration.md)

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

# Check port usage
netstat -ano | findstr :8000

# Kill hanging processes
taskkill /F /PID <process_id>
```

## Emergency Procedures

1. **Server hanging**: Kill with `taskkill /F /IM node.exe`
2. **Port conflicts**: Check with `netstat`, kill specific PID
3. **Build errors**: Check TypeScript errors, fix imports/types
4. **File organization**: Move to proper directories, clean up root

---

**Note**: This is a condensed reference. Always consult the [full documentation](../../docs/) for detailed guidelines and decision rationale.
