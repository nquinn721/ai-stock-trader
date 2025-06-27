# Stock Trading App Documentation

This directory contains all documentation for the Stock Trading App project, including Architecture Decision Records (ADRs), coding standards, and development guidelines.

## Table of Contents

- [Architecture Decision Records (ADRs)](./adrs/)
- [Development Environment Setup](#development-environment-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)

## Quick Links

### Architecture Decision Records (ADRs)

- [ADR-001: Development Environment and Tooling Standards](./adrs/001-development-environment-standards.md)
- [ADR-002: Code Style and Quality Standards](./adrs/002-code-style-standards.md)
- [ADR-003: Workflow and Process Standards](./adrs/003-workflow-standards.md)
- [ADR-004: AI Assistant Integration Guidelines](./adrs/004-ai-assistant-guidelines.md)
- [ADR-005: API Design and Integration Standards](./adrs/005-api-design-standards.md)
- [ADR-006: Real-Time Data Integration](./adrs/006-real-data-integration.md)
- [ADR-010: UI Theme and Layout Consistency Standards](./adrs/010-ui-theme-layout-standards.md)

### UI and Design Standards

- [UI Theme and Layout Standards](./UI-THEME-LAYOUT-STANDARDS.md) - **Mandatory** styling and layout requirements for all pages

## Development Environment Setup

This project uses:

- **Backend**: NestJS with TypeScript
- **Frontend**: React with TypeScript
- **Database**: MySQL with TypeORM (synchronized)
- **Stock Data**: Yahoo Finance API integration
- **Real-time Updates**: WebSocket connections
- **Environment**: sklearn-env Python environment
- **Shell**: PowerShell

## Project Structure

```
Stock-Trading-App-Nest/
├── backend/          # NestJS backend application
├── frontend/         # React frontend application
├── docs/            # Documentation and ADRs
├── project-management/ # Project tracking and management
├── e2e-tests/       # End-to-end testing suite
├── test-scripts/    # Development testing scripts
├── node_modules/    # Root dependencies (workspace shared dependencies)
├── .github/         # GitHub workflows and templates
├── package.json     # Workspace configuration
└── README.md        # Project overview
```

**Note**: The root `node_modules/` directory is **expected and necessary** for this workspace-based monorepo structure. It contains shared dependencies and workspace management tools.

## API Documentation

The backend provides REST APIs for:

- Stock data and analysis
- Trading signals and ML analysis
- Paper trading functionality
- News sentiment analysis

Swagger documentation is available at `/api` when the backend is running.

## Project Management Dashboard

See [project-management-dashboard.md](./project-management-dashboard.md) for details on the local, code-based project management system and React dashboard (port 5000).
