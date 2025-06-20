# ADR-001: Development Environment and Tooling Standards

## Status

Accepted

## Context

The Stock Trading App project requires consistent development environment standards to ensure all developers and AI assistants can work effectively. The project involves both backend (NestJS) and frontend (React) development with specific tooling requirements.

## Decision

We adopt the following development environment standards:

### Primary Technologies

- **Backend Framework**: NestJS with TypeScript
- **Frontend Framework**: React with TypeScript
- **Database Strategy**: MySQL with TypeORM (enabled for real-time data)
- **Stock Data API**: Yahoo Finance API integration
- **Shell Environment**: PowerShell for all command-line operations
- **Python Environment**: sklearn-env (for ML components)

### Development Tools

- **Package Manager**: npm
- **Build System**: NestJS CLI for backend, Create React App for frontend
- **Code Editor**: Visual Studio Code (recommended)
- **Version Control**: Git

### Environment Configuration

- Backend runs on port 8000
- Frontend runs on port 3000
- Hot reload enabled for both backend and frontend
- Real-time stock data from Yahoo Finance API
- Database persistence for trading signals and portfolios
- TypeORM synchronization enabled for development

## Consequences

### Positive

- Consistent development environment across all contributors
- Faster development cycle with hot reload
- Real-time stock data for accurate trading simulations
- Database persistence for reliable data storage
- PowerShell ensures Windows compatibility
- Production-ready data architecture from development stage

### Negative

- Database setup required for initial development
- Network dependency on Yahoo Finance API
- PowerShell dependency may be unfamiliar to some developers
- API rate limiting considerations for Yahoo Finance

## Implementation Notes

- All terminal commands must use PowerShell syntax
- Use semicolon (`;`) instead of `&&` for command chaining in PowerShell
- Environment variables stored in `.env` files
- Database configuration required for TypeORM connection
- Yahoo Finance API provides real-time stock prices and historical data
- WebSocket connections enabled for live price updates
