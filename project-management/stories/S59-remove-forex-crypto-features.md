# S59: Remove Forex and Crypto Features - Simplify to Stock Trading Only

## 📋 Story Details

- **Story ID**: S59
- **Epic**: Application Simplification
- **Type**: Technical Debt / Feature Removal
- **Priority**: High
- **Story Points**: 13
- **Assignee**: Full Stack Development Team
- **Status**: TODO
- **Created**: 2025-07-02
- **Sprint**: Sprint 5

## 📝 Description

Remove all forex and cryptocurrency trading features from the application and clean up the database to only include tables necessary for stock trading. This will simplify the application architecture, reduce maintenance overhead, and focus the product on its core stock trading functionality.

## 🎯 Acceptance Criteria

### Backend Cleanup

- [ ] Remove `multi-asset` module completely (`backend/src/modules/multi-asset/`)
  - [ ] Delete `forex.controller.ts`
  - [ ] Delete `crypto.controller.ts`
  - [ ] Delete `multi-asset.controller.ts`
  - [ ] Delete `forex-trading.service.ts`
  - [ ] Delete `crypto-trading.service.ts`
  - [ ] Delete `forex-data.entity.ts`
  - [ ] Delete `crypto-data.entity.ts`
  - [ ] Delete `multi-asset.types.ts`
  - [ ] Delete `multi-asset.module.ts`

### Frontend Cleanup

- [ ] Remove `MultiAssetStore.ts` from frontend stores
- [ ] Delete `multi-asset` component directory (`frontend/src/components/multi-asset/`)
  - [ ] Delete `ForexDashboard.tsx` and `ForexDashboard_fixed.tsx`
  - [ ] Delete `CryptoDashboard.tsx` and `CryptoDashboard.css`
  - [ ] Delete `MultiAssetDashboard.tsx` and `MultiAssetDashboard.css`
  - [ ] Delete `AlternativeDataFeed.tsx`
  - [ ] Delete `CommoditiesDashboard.tsx`
  - [ ] Delete `CrossAssetAnalytics.tsx`

### Database Schema Cleanup

- [ ] Verify current database only contains essential stock trading tables:
  - `portfolios` - Portfolio management
  - `positions` - Stock positions
  - `trades` - Trading history
  - `stocks` - Stock data and metadata
  - `notifications` - User notifications
- [ ] Remove any forex/crypto related tables if they exist
- [ ] Run database cleanup script: `database/cleanup-forex-crypto.sql`
- [ ] Update `init-database.sql` to ensure clean database setup

### Project Management Cleanup

- [ ] Archive outdated stories related to forex/crypto features:
  - [ ] S41: Multi-Asset Intelligence & Alternative Data
  - [ ] S43: Multi-Asset Alternative Data Platform
  - [ ] S53: Multi-Asset Paper Trading Account Isolation
  - [ ] S54: Advanced Forex Trading Features
  - [ ] S55: Crypto DeFi Integration
  - [ ] S56: Multi-Asset Automated Trading
  - [ ] S58: Institutional Multi-Asset APIs

### Configuration and Dependencies Cleanup

- [ ] Remove any forex/crypto related environment variables
- [ ] Remove unused dependencies related to forex/crypto data providers
- [ ] Update API endpoint documentation to remove multi-asset references
- [ ] Clean up any routing configurations for removed features

### Testing Cleanup

- [ ] Remove tests for deleted forex/crypto components and services
- [ ] Update test configurations to exclude removed modules
- [ ] Ensure all remaining tests pass after cleanup

## 🧪 Testing Requirements

### Unit Tests

- [ ] Verify all backend services compile and run without multi-asset dependencies
- [ ] Confirm frontend components render without MultiAssetStore references
- [ ] Test portfolio creation and management still works correctly

### Integration Tests

- [ ] Verify API endpoints for stock trading functionality remain intact
- [ ] Test WebSocket connections for stock data updates
- [ ] Confirm paper trading functionality is unaffected

### Database Tests

- [ ] Test database initialization with cleaned schema
- [ ] Verify portfolio operations work with simplified table structure
- [ ] Confirm stock data operations function correctly

## 📋 Tasks Breakdown

### Phase 1: Backend Cleanup (5 points)

1. **Remove Multi-Asset Module**
   - Delete entire `backend/src/modules/multi-asset/` directory
   - Remove module imports from app module
   - Update any dependent services

2. **Clean Up Dependencies**
   - Remove unused npm packages related to forex/crypto
   - Update import statements throughout backend

### Phase 2: Frontend Cleanup (4 points)

1. **Remove Multi-Asset Components**
   - Delete `frontend/src/components/multi-asset/` directory
   - Remove `MultiAssetStore.ts` from stores
   - Clean up any remaining references

2. **Update Application Structure**
   - Remove any navigation routes to deleted components
   - Clean up import statements and dependencies

### Phase 3: Database and Configuration (2 points)

1. **Database Schema Cleanup**
   - Audit existing database tables
   - Create migration script for any forex/crypto tables
   - Update init-database.sql

2. **Configuration Cleanup**
   - Remove unused environment variables
   - Update API documentation
   - Clean up routing configurations

### Phase 4: Project Management (2 points)

1. **Archive Outdated Stories**
   - Mark forex/crypto stories as ARCHIVED
   - Update project roadmap to remove multi-asset features
   - Update sprint planning to exclude removed features

## 🔗 Dependencies

- **Blocks**: None
- **Blocked By**: S47 (Code Cleanup & Refactoring) - Should be completed first

## 🎯 Definition of Done

- [ ] All forex and crypto related code removed from backend
- [ ] All forex and crypto related code removed from frontend
- [ ] Database contains only essential stock trading tables
- [ ] All tests pass with simplified architecture
- [ ] No broken imports or references to removed features
- [ ] Project management stories archived appropriately
- [ ] Documentation updated to reflect simplified architecture
- [ ] Application builds and runs successfully on all environments
- [ ] Manual testing confirms core stock trading functionality works
- [ ] Performance metrics show no degradation after cleanup

## 📈 Success Metrics

- **Code Reduction**: 15-20% reduction in total codebase size
- **Build Time**: 10-15% improvement in build performance
- **Test Coverage**: Maintain 85%+ coverage for remaining features
- **Startup Time**: 5-10% improvement in application startup time
- **Maintenance**: Reduced complexity for future development

## 📝 Technical Notes

### Database Cleanup Script:

- **Location**: `database/cleanup-forex-crypto.sql`
- **Purpose**: Verify and clean up any forex/crypto tables
- **Usage**: Run after backing up current database

### Files to Remove:

```
backend/src/modules/multi-asset/
├── controllers/
│   ├── forex.controller.ts
│   ├── crypto.controller.ts
│   └── multi-asset.controller.ts
├── entities/
│   ├── forex-data.entity.ts
│   └── crypto-data.entity.ts
├── services/
│   ├── forex-trading.service.ts
│   └── crypto-trading.service.ts
├── types/
│   └── multi-asset.types.ts
└── multi-asset.module.ts

frontend/src/components/multi-asset/
├── ForexDashboard.tsx
├── ForexDashboard_fixed.tsx
├── CryptoDashboard.tsx
├── CryptoDashboard.css
├── MultiAssetDashboard.tsx
├── MultiAssetDashboard.css
├── AlternativeDataFeed.tsx
├── CommoditiesDashboard.tsx
└── CrossAssetAnalytics.tsx

frontend/src/stores/
└── MultiAssetStore.ts

backend/
└── setup-crypto.js
```

### Stories to Archive:

- S41: Multi-Asset Intelligence & Alternative Data
- S43: Multi-Asset Alternative Data Platform
- S53: Multi-Asset Paper Trading Account Isolation
- S54: Advanced Forex Trading Features
- S55: Crypto DeFi Integration
- S56: Multi-Asset Automated Trading
- S58: Institutional Multi-Asset APIs

### Database Tables to Keep:

- `portfolios` - Core portfolio management
- `positions` - Stock position tracking
- `trades` - Trading transaction history
- `stocks` - Stock metadata and pricing
- `notifications` - User notification system

## 🚨 Risk Assessment

**Low Risk** - Forex and crypto features appear to be non-functional placeholders based on file analysis. No active routes or integration detected in main application flow.

**Mitigation**:

- Perform thorough testing after each phase
- Keep git history for potential rollback
- Document all changes for future reference

## 📋 Checklist for Implementation

### Pre-Implementation

- [ ] Verify current application works without multi-asset features
- [ ] Create feature branch for cleanup work
- [ ] Backup current database schema

### Implementation

- [ ] Remove backend multi-asset module
- [ ] Remove frontend multi-asset components and store
- [ ] Clean up database references
- [ ] Update project management stories
- [ ] Run full test suite

### Post-Implementation

- [ ] Verify application functionality
- [ ] Update documentation
- [ ] Deploy to staging for validation
- [ ] Mark story as complete

---

**Impact**: Simplifies application architecture and reduces maintenance overhead while focusing on core stock trading functionality.

**Business Value**: Cleaner codebase, faster development cycles, and reduced complexity for future features.
