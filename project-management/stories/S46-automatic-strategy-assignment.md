# Story S46: Automatic Strategy Assignment Based on Portfolio Balance

## Overview

**Epic**: E1 - Core Trading Infrastructure  
**Priority**: High  
**Story Points**: 8  
**Sprint**: 3  
**Status**: TODO

## User Story

**As a** trader using the autonomous trading system  
**I want** automatic strategy assignment when I start trading  
**So that** I don't need to manually deploy strategies and the system automatically complies with Pattern Day Trader (PDT) regulations

## Problem Statement

Currently, users must manually deploy trading strategies before starting autonomous trading on portfolios. This creates unnecessary friction and complexity. Additionally, the system doesn't automatically consider Pattern Day Trader (PDT) rules, which require different trading approaches based on account balance.

### Current Flow Issues:

- ❌ Manual strategy deployment required
- ❌ No automatic PDT compliance checking
- ❌ Users must understand strategy types to choose correctly
- ❌ Risk of selecting inappropriate strategy for account balance
- ❌ Complex UI with multiple deployment steps

## Acceptance Criteria

### Core Functionality

#### AC1: Automatic Strategy Assignment

- **GIVEN** a user clicks "Start Trading" on any portfolio
- **WHEN** the portfolio balance is ≥ $25,000
- **THEN** the system automatically assigns a day trading strategy
- **AND** displays "Day Trading Strategy (PDT Eligible)" in the UI

#### AC2: Non-Day Trading Assignment

- **GIVEN** a user clicks "Start Trading" on any portfolio
- **WHEN** the portfolio balance is < $25,000
- **THEN** the system automatically assigns a non-day trading strategy
- **AND** displays "Swing Trading Strategy (Non-PDT)" in the UI

#### AC3: Strategy Configuration

- **GIVEN** automatic strategy assignment occurs
- **WHEN** the strategy is created
- **THEN** it uses appropriate risk parameters for the strategy type:
  - **Day Trading (≥$25k)**: Max 4 day trades, higher position turnover
  - **Non-Day Trading (<$25k)**: Max 3 day trades per 5 business days, longer holds

### UI/UX Requirements

#### AC4: Simplified Start Trading Flow

- **GIVEN** a user views a portfolio card
- **WHEN** no strategy is assigned
- **THEN** show single "Start Trading" button (no "Deploy Strategy" needed)
- **AND** button tooltip explains automatic assignment

#### AC5: Strategy Display

- **GIVEN** automatic strategy assignment completes
- **WHEN** viewing portfolio status
- **THEN** display strategy type clearly:
  - "Day Trading (Balance: $XX,XXX)" for PDT accounts
  - "Swing Trading (Balance: $XX,XXX)" for non-PDT accounts

#### AC6: Balance Change Handling

- **GIVEN** a portfolio has an active strategy
- **WHEN** the balance crosses the $25,000 threshold
- **THEN** display notification suggesting strategy change
- **AND** provide option to automatically switch strategy type

### Technical Requirements

#### AC7: Strategy Factory Pattern

- **GIVEN** the system needs to create a strategy
- **WHEN** `createAutomaticStrategy(portfolioId)` is called
- **THEN** return appropriate strategy configuration based on balance
- **AND** include all required risk parameters and constraints

#### AC8: PDT Compliance Integration

- **GIVEN** strategy assignment logic
- **WHEN** determining strategy type
- **THEN** check current portfolio balance from live data
- **AND** apply appropriate PDT rules and day trade counting

#### AC9: Backward Compatibility

- **GIVEN** existing manual strategy deployment still exists
- **WHEN** users access advanced settings
- **THEN** manual strategy options remain available for power users
- **AND** automatic assignment is the default simplified flow

## Implementation Details

### Backend Changes Required

#### 1. Strategy Factory Service

```typescript
// New service: auto-trading/strategy-factory.service.ts
class StrategyFactoryService {
  createAutomaticStrategy(portfolioId: string): StrategyConfig {
    const portfolio = await this.getPortfolioBalance(portfolioId);
    const isPDTEligible = portfolio.totalValue >= 25000;

    return isPDTEligible
      ? this.createDayTradingStrategy(portfolioId)
      : this.createSwingTradingStrategy(portfolioId);
  }

  private createDayTradingStrategy(portfolioId: string): StrategyConfig {
    return {
      strategyType: "day-trading",
      maxDayTrades: 4,
      maxHoldingPeriod: "1d",
      maxPositions: 8,
      positionSizing: 0.1, // 10% per position
      riskLimits: {
        maxDrawdown: 5,
        maxPositionSize: 15,
        dailyLossLimit: 3,
      },
    };
  }

  private createSwingTradingStrategy(portfolioId: string): StrategyConfig {
    return {
      strategyType: "swing-trading",
      maxDayTrades: 3,
      maxHoldingPeriod: "7d",
      maxPositions: 5,
      positionSizing: 0.15, // 15% per position
      riskLimits: {
        maxDrawdown: 8,
        maxPositionSize: 20,
        dailyLossLimit: 2,
      },
    };
  }
}
```

#### 2. Enhanced Auto Trading Controller

```typescript
// Update: auto-trading.controller.ts
@Post('start-trading/:portfolioId')
async startTradingWithAutoStrategy(@Param('portfolioId') portfolioId: string) {
  // Automatically create and assign appropriate strategy
  const strategy = await this.strategyFactory.createAutomaticStrategy(portfolioId);
  const deployment = await this.autoTradingService.deployStrategy(
    `auto-strategy-${portfolioId}`,
    strategy
  );

  return {
    success: true,
    strategy: deployment,
    strategyType: strategy.strategyType,
    pdtEligible: strategy.strategyType === 'day-trading'
  };
}
```

### Frontend Changes Required

#### 1. Simplified Portfolio Card Actions

```typescript
// Update: AutonomousTradingPage.tsx
const handleStartTrading = async (portfolioId: string) => {
  try {
    setLoading(true);

    // Single API call - automatic strategy assignment
    const response =
      await autoTradingService.startTradingWithAutoStrategy(portfolioId);

    if (response.success) {
      // Update UI with assigned strategy info
      setPortfolioStatuses((prev) => ({
        ...prev,
        [portfolioId]: {
          ...prev[portfolioId],
          isActive: true,
          assignedStrategyName: response.strategy.strategyId,
          strategyType: response.strategyType,
          pdtEligible: response.pdtEligible,
        },
      }));

      // Show success message with strategy type
      showNotification(
        `${response.strategyType} strategy automatically assigned`
      );
    }
  } catch (error) {
    setError(`Failed to start trading: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

#### 2. Enhanced Status Display

```typescript
// Update: Portfolio status calculation
const getStrategyTypeDisplay = (
  status: PortfolioTradingStatus,
  portfolio: Portfolio
) => {
  if (!status.assignedStrategyName) return "No strategy assigned";

  const balance = portfolio.totalValue;
  const isPDT = balance >= 25000;

  return isPDT
    ? `Day Trading Strategy (Balance: $${balance.toLocaleString()})`
    : `Swing Trading Strategy (Balance: $${balance.toLocaleString()})`;
};
```

### Testing Requirements

#### Unit Tests

- ✅ StrategyFactoryService balance threshold logic
- ✅ PDT vs non-PDT strategy configuration differences
- ✅ Portfolio balance retrieval and caching
- ✅ Strategy assignment API endpoint

#### Integration Tests

- ✅ End-to-end automatic trading start flow
- ✅ Strategy assignment with different portfolio balances
- ✅ UI updates after automatic assignment
- ✅ Error handling for failed strategy deployment

#### E2E Tests

- ✅ User clicks "Start Trading" → strategy auto-assigned → trading begins
- ✅ Portfolio balance changes → strategy type recommendation
- ✅ Manual strategy deployment still works for advanced users

## Success Metrics

### User Experience

- **Reduced clicks**: Starting trading goes from 5+ clicks to 1 click
- **Error reduction**: Eliminate strategy selection errors
- **Compliance**: 100% automatic PDT rule compliance

### Technical Metrics

- **Strategy assignment time**: < 2 seconds
- **Assignment success rate**: > 99%
- **Balance calculation accuracy**: Real-time portfolio values

## Dependencies

- **S41**: Enhanced Auto Trading Strategy Engine (for strategy types)
- **S42**: Portfolio Performance Tracking and Analytics (for balance calculation)

## Definition of Done

- [ ] StrategyFactoryService implemented with PDT/non-PDT logic
- [ ] Auto trading controller updated with automatic assignment
- [ ] Frontend simplified to single "Start Trading" button
- [ ] Portfolio status displays strategy type and balance
- [ ] Balance threshold change notifications implemented
- [ ] Backward compatibility maintained for manual deployment
- [ ] Unit tests achieve 90%+ coverage
- [ ] Integration tests verify end-to-end flow
- [ ] E2E tests validate user experience
- [ ] Documentation updated with new flow
- [ ] Performance benchmarks meet requirements (<2s assignment)

## Technical Notes

### PDT Rule Summary

- **Pattern Day Trader**: Account with ≥$25,000 balance
  - Can make unlimited day trades
  - Higher leverage available
  - More aggressive strategies suitable
- **Non-PDT Account**: Account with <$25,000 balance
  - Limited to 3 day trades per 5 business days
  - Must use swing/position trading strategies
  - More conservative risk management required

### Strategy Configuration Differences

| Aspect         | Day Trading (≥$25k) | Swing Trading (<$25k) |
| -------------- | ------------------- | --------------------- |
| Max Day Trades | 4 per day           | 3 per 5 business days |
| Holding Period | Minutes to hours    | Days to weeks         |
| Position Count | Higher (8+)         | Lower (5-)            |
| Position Size  | Smaller (10%)       | Larger (15-20%)       |
| Risk Tolerance | Moderate            | Conservative          |

This implementation provides a seamless, compliant, and user-friendly automatic strategy assignment system that eliminates manual complexity while ensuring regulatory compliance.
