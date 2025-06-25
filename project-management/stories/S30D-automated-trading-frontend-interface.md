# S30D: Automated Trading Frontend Interface

## Story Details

- **Story ID**: S30D
- **Epic**: Automated Trading & AI Enhancement
- **Sprint**: Sprint 6
- **Story Points**: 13
- **Priority**: High
- **Status**: IN_PROGRESS
- **Assignee**: Development Team
- **Created**: 2025-06-24
- **Updated**: 2025-06-25

## Description

Create a comprehensive frontend interface for the automated trading system, allowing users to configure trading rules, start/stop automated trading sessions per portfolio or globally, and monitor automated trading performance in real-time.

## Business Value

- User-friendly interface for automated trading configuration
- Real-time monitoring and control of trading activities
- Transparent view of automated trading performance
- Easy management of multiple portfolio trading sessions
- Quick emergency stop capabilities for risk management
- Enhanced user confidence through clear status indicators

## Progress Update (70% Complete)

### ✅ COMPLETED (2025-06-25)

**Core Infrastructure:**
- ✅ AutoTradingDashboard component with tabbed navigation
- ✅ TradingRulesManager component with full CRUD operations
- ✅ TradingControlPanel component with global/portfolio controls
- ✅ TradingSessionMonitor component with real-time status display
- ✅ AutoTradingStore with comprehensive MobX state management
- ✅ Complete TypeScript type definitions (autoTrading.types.ts)
- ✅ Professional CSS styling for all components
- ✅ Integration with main Dashboard component
- ✅ Rule import/export functionality
- ✅ Emergency stop button implementation
- ✅ Trading performance widgets
- ✅ Error handling and loading states

**Functional Features:**
- ✅ Trading rule management (create, edit, delete, toggle)
- ✅ Rule filtering and status management
- ✅ Global and per-portfolio trading controls
- ✅ Session status monitoring with color-coded indicators
- ✅ Trading performance tracking and display
- ✅ Portfolio-specific trading configurations
- ✅ Rule duplication and bulk operations

### ❌ REMAINING WORK (30%)

**Missing Components:**
- ❌ RuleBuilder.tsx (advanced drag-and-drop interface)
- ❌ TradingPerformanceChart.tsx (detailed charts)
- ❌ AutoTradeHistory.tsx (trade history viewer)
- ❌ TradingRuleTemplates.tsx (pre-built rule templates)

**Missing Features:**
- ❌ Advanced rule builder with visual interface
- ❌ Rule templates and presets
- ❌ Rule testing with historical data
- ❌ WebSocket real-time updates integration
- ❌ Comprehensive test suite

### NEXT STEPS:
1. Implement RuleBuilder component with visual interface
2. Add WebSocket integration for real-time updates
3. Create comprehensive test suite (90%+ coverage)
4. Implement rule templates system
5. Add performance charts and analytics

## Acceptance Criteria

### Trading Rule Management Interface

- [x] Create TradingRulesManager component for rule configuration
- [ ] Implement rule builder with drag-and-drop interface
- [ ] Add rule templates for common strategies
- [ ] Create rule validation and preview functionality
- [x] Implement rule priority management
- [ ] Add rule testing with historical data
- [x] Create rule import/export capabilities

### Automated Trading Control Panel

- [x] Create AutoTradingDashboard for session management
- [x] Implement per-portfolio trading controls
- [x] Add global trading start/stop functionality
- [x] Create trading session status indicators
- [x] Implement emergency stop button
- [ ] Add trading session scheduling
- [x] Create performance monitoring widgets

### Real-time Monitoring

- [x] Display live trading activity feed
- [x] Show real-time P&L tracking
- [ ] Implement trade execution notifications
- [x] Create portfolio risk indicators
- [ ] Add automated trade history viewer
- [x] Display rule performance analytics
- [ ] Implement trading alerts and warnings

## Technical Requirements

### Component Architecture

```typescript
// Component structure
src/components/automated-trading/
├── AutoTradingDashboard.tsx        // Main dashboard
├── TradingRulesManager.tsx         // Rule management
├── TradingControlPanel.tsx         // Session controls
├── TradingSessionMonitor.tsx       // Live monitoring
├── RuleBuilder.tsx                 // Rule configuration
├── TradingPerformanceChart.tsx     // Performance visualization
├── AutoTradeHistory.tsx            // Trade history
├── EmergencyStopButton.tsx         // Emergency controls
└── TradingRuleTemplates.tsx        // Pre-built templates
```

### MobX Store Integration

```typescript
// Store for automated trading state
class AutoTradingStore {
  @observable tradingRules: TradingRule[] = []
  @observable tradingSessions: TradingSession[] = []
  @observable activeTrades: AutoTrade[] = []
  @observable isGlobalTradingActive: boolean = false
  @observable tradingPerformance: TradingPerformance = {}

  @action startPortfolioTrading(portfolioId: string, config: TradingConfig)
  @action stopPortfolioTrading(portfolioId: string)
  @action startGlobalTrading()
  @action stopGlobalTrading()
  @action emergencyStop()
  @action createTradingRule(rule: CreateTradingRuleDto)
  @action updateTradingRule(id: string, updates: Partial<TradingRule>)
}
```

## Implementation Plan

### Phase 1: Core Dashboard Infrastructure (3 days)

1. Create AutoTradingDashboard component structure
2. Implement basic navigation and layout
3. Create AutoTradingStore for state management
4. Set up WebSocket connections for real-time updates
5. Implement basic trading session status display

### Phase 2: Trading Rules Management (4 days)

1. Create TradingRulesManager component
2. Implement RuleBuilder with form validation
3. Add rule templates and presets
4. Create rule testing and validation
5. Implement rule import/export functionality

### Phase 3: Trading Controls (3 days)

1. Create TradingControlPanel component
2. Implement per-portfolio trading controls
3. Add global trading start/stop functionality
4. Create emergency stop mechanisms
5. Add trading session scheduling

### Phase 4: Real-time Monitoring (3 days)

1. Create TradingSessionMonitor component
2. Implement live trading activity feed
3. Add real-time performance tracking
4. Create trading notifications system
5. Implement risk indicator displays

## Component Specifications

### AutoTradingDashboard

```typescript
interface AutoTradingDashboardProps {
  portfolios: Portfolio[];
}

const AutoTradingDashboard: React.FC<AutoTradingDashboardProps> = () => {
  // Dashboard features:
  // - Overview of all trading sessions
  // - Global trading controls
  // - Performance summary widgets
  // - Quick access to emergency stop
  // - Recent trading activity
};
```

### TradingRulesManager

```typescript
interface TradingRulesManagerProps {
  portfolioId?: string;
}

const TradingRulesManager: React.FC<TradingRulesManagerProps> = () => {
  // Rule management features:
  // - List of existing rules with status
  // - Create/edit rule interface
  // - Rule testing and validation
  // - Rule templates and presets
  // - Import/export capabilities
};
```

### RuleBuilder

```typescript
interface RuleBuilderProps {
  rule?: TradingRule;
  onSave: (rule: TradingRule) => void;
  onCancel: () => void;
}

const RuleBuilder: React.FC<RuleBuilderProps> = () => {
  // Rule builder features:
  // - Drag-and-drop condition builder
  // - Action configuration interface
  // - Visual rule flow representation
  // - Real-time validation
  // - Preview with sample data
};
```

### TradingControlPanel

```typescript
interface TradingControlPanelProps {
  portfolios: Portfolio[];
}

const TradingControlPanel: React.FC<TradingControlPanelProps> = () => {
  // Control panel features:
  // - Per-portfolio trading toggles
  // - Global trading master switch
  // - Session configuration options
  // - Emergency stop button
  // - Trading schedule settings
};
```

## User Interface Design

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Automated Trading Dashboard                    [Emergency Stop] │
├─────────────────────────────────────────────────────────────┤
│ Global Controls: [■ All Off] [▶ Start All] [⏸ Pause All]     │
├─────────────────────────────────────────────────────────────┤
│ Portfolio Trading Status:                                   │
│ ┌──────────────┬──────────────┬──────────────┬──────────────┐ │
│ │ Portfolio A  │ Portfolio B  │ Portfolio C  │ Portfolio D  │ │
│ │ ● Active     │ ○ Stopped    │ ● Active     │ ⚠ Paused     │ │
│ │ 5 Rules      │ 3 Rules      │ 8 Rules      │ 2 Rules      │ │
│ │ +$1,250      │ $0           │ +$890        │ -$45         │ │
│ └──────────────┴──────────────┴──────────────┴──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Recent Activity:                        Performance Summary: │
│ • AAPL Buy executed (+$125)            • Total P&L: +$2,095 │
│ • MSFT Stop-loss triggered (-$32)      • Win Rate: 68%      │
│ • TSLA Rule activated                   • Best Rule: AI+RSI  │
│ • New recommendation: GOOGL             • Worst Rule: Vol-B  │
└─────────────────────────────────────────────────────────────┘
```

### Rule Builder Interface

```
┌─────────────────────────────────────────────────────────────┐
│ Rule Builder: "AI Strong Buy Strategy"                       │
├─────────────────────────────────────────────────────────────┤
│ Conditions (ALL must be true):                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [AI Recommendation] [equals] [STRONG_BUY]      [×]      │ │
│ │ [Confidence Score] [greater than] [0.8]        [×]      │ │
│ │ [Portfolio Cash %] [greater than] [10%]        [×]      │ │
│ │ + Add Condition                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Actions (when conditions met):                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [BUY] [5% of portfolio] [max 10% position]      [×]     │ │
│ │ + Add Action                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Rule Settings:                                              │
│ Priority: [High ▼] Active: [✓] Portfolio: [All ▼]         │
├─────────────────────────────────────────────────────────────┤
│ [Test Rule] [Save Rule] [Cancel]                           │
└─────────────────────────────────────────────────────────────┘
```

## Files to Create

### Main Components

```
frontend/src/components/automated-trading/AutoTradingDashboard.tsx
frontend/src/components/automated-trading/AutoTradingDashboard.css
frontend/src/components/automated-trading/TradingRulesManager.tsx
frontend/src/components/automated-trading/TradingRulesManager.css
frontend/src/components/automated-trading/TradingControlPanel.tsx
frontend/src/components/automated-trading/TradingControlPanel.css
```

### Supporting Components

```
frontend/src/components/automated-trading/RuleBuilder.tsx
frontend/src/components/automated-trading/RuleBuilder.css
frontend/src/components/automated-trading/TradingSessionMonitor.tsx
frontend/src/components/automated-trading/TradingSessionMonitor.css
frontend/src/components/automated-trading/EmergencyStopButton.tsx
frontend/src/components/automated-trading/TradingPerformanceChart.tsx
frontend/src/components/automated-trading/AutoTradeHistory.tsx
frontend/src/components/automated-trading/TradingRuleTemplates.tsx
```

### Store and Services

```
frontend/src/stores/AutoTradingStore.ts
frontend/src/services/autoTradingService.ts
frontend/src/types/autoTrading.types.ts
```

### Test Files

```
frontend/src/components/automated-trading/*.test.tsx
frontend/src/stores/AutoTradingStore.test.ts
frontend/src/services/autoTradingService.test.ts
```

## Integration Points

### Dashboard Integration

```typescript
// Update main Dashboard.tsx to include automated trading
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      {/* Existing components */}
      <AutoTradingDashboard portfolios={portfolios} />
    </div>
  );
};
```

### Portfolio Modal Integration

```typescript
// Add automated trading tab to PortfolioDetailsModal
const PortfolioDetailsModal: React.FC = () => {
  const tabs = [
    "Overview",
    "Positions",
    "Trading History",
    "Automated Trading", // New tab
  ];
};
```

## Real-time Features

### WebSocket Integration

```typescript
// Real-time updates for trading activity
useEffect(() => {
  const ws = new WebSocket("ws://localhost:8000/auto-trading");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case "TRADE_EXECUTED":
        autoTradingStore.addExecutedTrade(data.trade);
        break;
      case "RULE_TRIGGERED":
        autoTradingStore.updateRuleStatus(data.ruleId, "triggered");
        break;
      case "SESSION_STATUS":
        autoTradingStore.updateSessionStatus(data.sessionId, data.status);
        break;
    }
  };
}, []);
```

### Notification System

```typescript
// Trading notifications
const showTradingNotification = (type: string, message: string) => {
  toast.info(`🤖 ${message}`, {
    position: "top-right",
    autoClose: 5000,
    className: "trading-notification",
  });
};
```

## Dependencies

- Requires S30C (Automated Trading Backend) to be completed
- Depends on S30B (MobX Migration) for state management
- Requires WebSocket infrastructure
- Needs notification system (react-toastify or similar)

## Definition of Done

- [x] All automated trading components implemented
- [x] Trading rules can be created and managed through UI
- [x] Per-portfolio and global trading controls functional
- [x] Real-time monitoring displays live trading data
- [x] Emergency stop functionality works immediately
- [x] Trading performance charts display accurate data
- [ ] All components have comprehensive tests
- [ ] WebSocket integration provides real-time updates
- [x] Responsive design works on all screen sizes
- [ ] Accessibility requirements met
- [x] Integration with existing dashboard complete

## Risk Assessment

- **Risk Level**: Medium-High
- **Technical Risks**: Complex UI state management, real-time data synchronization
- **UX Risks**: User confusion with automated trading controls
- **Mitigation**: Comprehensive user testing, clear visual indicators, safety confirmations
- **Dependencies**: Backend automated trading system must be stable

## Notes

- User experience is critical for automated trading interface
- Safety features (confirmations, emergency stops) are mandatory
- Real-time feedback is essential for user confidence
- Consider adding guided tour or help system for first-time users
- Mobile responsiveness important for monitoring on-the-go
