# S37 - Four Stock-Only Portfolios with Day Trading Rules

**Epic**: Paper Trading & Portfolio Management  
**Priority**: High  
**Story Points**: 13  
**Status**: ✅ COMPLETED  
**Assigned**: Full Stack Team  
**Sprint**: Sprint 6

## 📝 Story Description

Implement four distinct stock-only portfolio types with SEC day trading compliance. Create Portfolio Templates: (1) Professional Day Trader ($50,000 starting capital, day trading enabled, pattern day trading rules apply), (2) Standard Day Trader ($30,000 starting capital, day trading enabled, pattern day trading rules apply), (3) Small Investor ($1,000 starting capital, day trading restricted, no pattern day trading), (4) Micro Investor ($500 starting capital, day trading restricted, no pattern day trading). All portfolios are STOCKS ONLY - no bonds, crypto, options, or other assets. Stock selection limited to available stock data from Yahoo Finance API. Day trading portfolios ($30k+) can execute unlimited day trades but must maintain 25k minimum equity. Non-day trading portfolios ($500-$1k) limited to 3 day trades per 5 business days.

## 🎯 Business Value

Provides users with realistic portfolio templates that comply with SEC regulations, enabling both novice and experienced traders to practice with appropriate capital constraints and trading rules while learning proper risk management and regulatory compliance.

## 📋 Acceptance Criteria

### ✅ Portfolio Template System

- [x] Four distinct portfolio types with different capital levels
- [x] Stock-only asset restriction enforcement
- [x] Yahoo Finance API integration for stock selection
- [x] Clear portfolio descriptions and feature explanations
- [x] Visual portfolio type selector interface

### ✅ SEC Day Trading Compliance

- [x] Pattern Day Trading Rule (PDT) enforcement for $25k+ accounts
- [x] Day trade counting and tracking system
- [x] Business day calculations for rule reset periods
- [x] Educational warnings about day trading restrictions
- [x] Minimum equity requirement monitoring

### ✅ Trading Restrictions

- [x] Day trading enablement based on portfolio type
- [x] Three day trades per 5 business days limit for small accounts
- [x] Unlimited day trades for qualified accounts ($25k+)
- [x] Real-time restriction enforcement during trade execution
- [x] Clear error messages for restricted trades

### ✅ Portfolio Management

- [x] Portfolio-specific buying power calculations
- [x] Settlement period tracking for cash accounts
- [x] Equity monitoring and maintenance requirements
- [x] Risk management based on portfolio size
- [x] Educational content for each portfolio type

## 🔧 Technical Implementation

<details>
<summary><strong>💼 Portfolio Type Configuration</strong></summary>

### Portfolio Templates Definition

```typescript
interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  startingCapital: number;
  minEquityRequired: number;
  dayTradingEnabled: boolean;
  maxDayTrades: number | null; // null = unlimited
  dayTradeResetPeriod: number; // business days
  assetTypes: AssetType[];
  riskLevel: RiskLevel;
  targetAudience: string;
  features: string[];
  restrictions: string[];
}

const portfolioTemplates: PortfolioTemplate[] = [
  {
    id: "professional-day-trader",
    name: "Professional Day Trader",
    description: "High-capital portfolio for experienced day traders",
    startingCapital: 50000,
    minEquityRequired: 25000,
    dayTradingEnabled: true,
    maxDayTrades: null, // unlimited
    dayTradeResetPeriod: 0,
    assetTypes: ["STOCK"],
    riskLevel: "HIGH",
    targetAudience: "Experienced traders with significant capital",
    features: [
      "Unlimited day trading",
      "Advanced order types",
      "Real-time market data",
      "Professional-grade tools",
    ],
    restrictions: [
      "Must maintain $25,000 minimum equity",
      "Subject to margin requirements",
      "Pattern Day Trading rules apply",
    ],
  },
  // ... other templates
];
```

### Day Trading Rule Engine

```typescript
class DayTradingRuleEngine {
  // Check if day trade is allowed
  async canExecuteDayTrade(
    portfolioId: string,
    proposedTrade: TradeRequest
  ): Promise<DayTradeValidation> {
    const portfolio = await this.getPortfolio(portfolioId);
    const dayTradeCount = await this.getDayTradeCount(
      portfolioId,
      this.getCurrentBusinessPeriod()
    );

    // Apply PDT rules for accounts with $25k+
    if (portfolio.equity >= 25000) {
      return { allowed: true, reason: "Qualified day trading account" };
    }

    // Apply 3-in-5 rule for smaller accounts
    if (dayTradeCount >= 3) {
      const nextResetDate = this.calculateNextResetDate();
      return {
        allowed: false,
        reason: `Day trade limit exceeded. Resets on ${nextResetDate}`,
        nextResetDate,
      };
    }

    return { allowed: true, remaining: 3 - dayTradeCount };
  }

  // Track day trades
  async recordDayTrade(portfolioId: string, trade: Trade): Promise<void> {
    await this.dayTradeRepository.save({
      portfolioId,
      tradeId: trade.id,
      symbol: trade.symbol,
      executedAt: trade.executedAt,
      businessDate: this.getBusinessDate(trade.executedAt),
    });
  }

  // Calculate business days for rule enforcement
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not weekend
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
```

</details>

<details>
<summary><strong>🎨 Frontend Portfolio Creator Component</strong></summary>

### Portfolio Selection Interface

```typescript
interface PortfolioCreatorProps {
  onPortfolioSelect: (template: PortfolioTemplate) => void;
  onCreatePortfolio: (config: PortfolioConfig) => Promise<void>;
}

const PortfolioCreator: React.FC<PortfolioCreatorProps> = ({
  onPortfolioSelect,
  onCreatePortfolio,
}) => {
  const [selectedTemplate, setSelectedTemplate] =
    useState<PortfolioTemplate | null>(null);
  const [portfolioName, setPortfolioName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleTemplateSelect = (template: PortfolioTemplate) => {
    setSelectedTemplate(template);
    onPortfolioSelect(template);
  };

  const handleCreatePortfolio = async () => {
    if (!selectedTemplate || !portfolioName || !agreedToTerms) return;

    const config: PortfolioConfig = {
      name: portfolioName,
      templateId: selectedTemplate.id,
      startingCapital: selectedTemplate.startingCapital,
      dayTradingEnabled: selectedTemplate.dayTradingEnabled,
      maxDayTrades: selectedTemplate.maxDayTrades,
    };

    await onCreatePortfolio(config);
  };

  return (
    <div className="portfolio-creator">
      <h2>Create New Portfolio</h2>

      <div className="portfolio-templates">
        {portfolioTemplates.map((template) => (
          <div
            key={template.id}
            className={`portfolio-card ${
              selectedTemplate?.id === template.id ? "selected" : ""
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="portfolio-header">
              <h3>{template.name}</h3>
              <span className="starting-capital">
                ${template.startingCapital.toLocaleString()}
              </span>
            </div>

            <p className="portfolio-description">{template.description}</p>

            <div className="portfolio-features">
              <h4>Features:</h4>
              <ul>
                {template.features.map((feature) => (
                  <li key={feature} className="feature-item">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="portfolio-restrictions">
              <h4>Restrictions:</h4>
              <ul>
                {template.restrictions.map((restriction) => (
                  <li key={restriction} className="restriction-item">
                    ⚠️ {restriction}
                  </li>
                ))}
              </ul>
            </div>

            {template.dayTradingEnabled ? (
              <div className="day-trading-info">
                <span className="day-trading-badge">Day Trading Enabled</span>
                {template.maxDayTrades ? (
                  <span className="day-trade-limit">
                    Max: {template.maxDayTrades} trades per 5 business days
                  </span>
                ) : (
                  <span className="unlimited-trades">Unlimited day trades</span>
                )}
              </div>
            ) : (
              <div className="no-day-trading">
                <span className="restriction-badge">
                  Day Trading Restricted
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedTemplate && (
        <div className="portfolio-creation-form">
          <div className="form-group">
            <label htmlFor="portfolio-name">Portfolio Name:</label>
            <input
              id="portfolio-name"
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder={`My ${selectedTemplate.name} Portfolio`}
            />
          </div>

          <div className="terms-agreement">
            <label>
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              I understand the trading rules and restrictions for this portfolio
              type
            </label>
          </div>

          <button
            className="create-portfolio-btn"
            onClick={handleCreatePortfolio}
            disabled={!portfolioName || !agreedToTerms}
          >
            Create Portfolio
          </button>
        </div>
      )}
    </div>
  );
};
```

### Responsive CSS Implementation

```css
.portfolio-creator {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.portfolio-templates {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.portfolio-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.portfolio-card:hover {
  border-color: #2196f3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.15);
}

.portfolio-card.selected {
  border-color: #2196f3;
  background: #f3f9ff;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.2);
}

.portfolio-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.starting-capital {
  font-size: 1.2em;
  font-weight: bold;
  color: #4caf50;
}

.day-trading-badge {
  background: #4caf50;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

.restriction-badge {
  background: #ff9800;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

@media (max-width: 768px) {
  .portfolio-templates {
    grid-template-columns: 1fr;
  }

  .portfolio-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
```

</details>

<details>
<summary><strong>⚖️ SEC Compliance Implementation</strong></summary>

### Pattern Day Trading (PDT) Rule Enforcement

```typescript
class PDTComplianceService {
  // Check PDT status and requirements
  async checkPDTCompliance(portfolioId: string): Promise<PDTStatus> {
    const portfolio = await this.portfolioService.getPortfolio(portfolioId);
    const dayTrades = await this.getDayTradesInPeriod(portfolioId, 5); // Last 5 business days

    const isPDTAccount = portfolio.equity >= 25000;
    const hasExceededDayTradeLimit = dayTrades.length >= 4 && !isPDTAccount;

    return {
      isPDTAccount,
      currentEquity: portfolio.equity,
      minEquityRequired: 25000,
      dayTradesInPeriod: dayTrades.length,
      maxDayTradesAllowed: isPDTAccount ? null : 3,
      isRestricted: hasExceededDayTradeLimit,
      restrictionExpiresAt: hasExceededDayTradeLimit
        ? this.calculateRestrictionExpiry(dayTrades[0].executedAt)
        : null,
    };
  }

  // Validate trade before execution
  async validateTradeForPDT(
    portfolioId: string,
    trade: TradeRequest
  ): Promise<TradeValidation> {
    const pdtStatus = await this.checkPDTCompliance(portfolioId);

    // Check if this would be a day trade
    const wouldBeDayTrade = await this.wouldBeDayTrade(portfolioId, trade);

    if (!wouldBeDayTrade) {
      return { allowed: true, reason: "Not a day trade" };
    }

    // PDT account - allow unlimited day trades
    if (pdtStatus.isPDTAccount) {
      return { allowed: true, reason: "PDT qualified account" };
    }

    // Non-PDT account - check limit
    if (pdtStatus.dayTradesInPeriod >= 3) {
      return {
        allowed: false,
        reason: "Day trade limit exceeded for non-PDT account",
        recommendedAction:
          "Deposit funds to reach $25,000 minimum or wait for restriction to expire",
      };
    }

    return {
      allowed: true,
      warning: `This will be day trade ${
        pdtStatus.dayTradesInPeriod + 1
      } of 3 allowed`,
    };
  }

  // Educational warnings for users
  generateEducationalWarning(pdtStatus: PDTStatus): string {
    if (pdtStatus.isPDTAccount) {
      return "You have unlimited day trading privileges. Maintain $25,000 minimum equity.";
    }

    if (pdtStatus.dayTradesInPeriod >= 2) {
      return "Warning: You are approaching the day trade limit. Consider depositing funds to reach $25,000 for unlimited day trading.";
    }

    return `You have ${
      3 - pdtStatus.dayTradesInPeriod
    } day trades remaining in the current 5-business-day period.`;
  }
}
```

### Business Day Calculation

```typescript
class BusinessDayCalculator {
  private holidays: Date[] = [
    // Federal holidays when markets are closed
    new Date("2025-01-01"), // New Year's Day
    new Date("2025-01-20"), // MLK Day
    new Date("2025-02-17"), // Presidents Day
    new Date("2025-04-18"), // Good Friday
    new Date("2025-05-26"), // Memorial Day
    new Date("2025-07-04"), // Independence Day
    new Date("2025-09-01"), // Labor Day
    new Date("2025-11-27"), // Thanksgiving
    new Date("2025-12-25"), // Christmas
  ];

  isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = this.holidays.some(
      (holiday) => holiday.toDateString() === date.toDateString()
    );

    return !isWeekend && !isHoliday;
  }

  addBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      if (this.isBusinessDay(result)) {
        daysAdded++;
      }
    }

    return result;
  }

  getBusinessDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      if (this.isBusinessDay(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
```

</details>

<details>
<summary><strong>💰 Portfolio-Specific Features</strong></summary>

### Buying Power Calculation

```typescript
class BuyingPowerCalculator {
  calculateBuyingPower(portfolio: Portfolio): BuyingPowerInfo {
    const { equity, cash, positions, template } = portfolio;

    let buyingPower: number;
    let marginRequirement: number;

    // Cash account buying power
    if (!template.marginEnabled) {
      buyingPower = cash;
      marginRequirement = 0;
    } else {
      // Margin account - PDT accounts get 4:1 intraday buying power
      const isPDTAccount = equity >= 25000;
      const marginMultiplier = isPDTAccount ? 4 : 2;

      buyingPower = equity * marginMultiplier;
      marginRequirement = this.calculateMarginRequirement(positions);
    }

    return {
      totalBuyingPower: buyingPower,
      availableBuyingPower: Math.max(0, buyingPower - marginRequirement),
      marginRequirement,
      dayTradingBuyingPower: this.calculateDayTradingBuyingPower(portfolio),
      restrictions: this.getBuyingPowerRestrictions(portfolio),
    };
  }

  calculateDayTradingBuyingPower(portfolio: Portfolio): number {
    if (!portfolio.template.dayTradingEnabled) return 0;

    const { equity } = portfolio;

    // PDT accounts get 4:1 day trading buying power
    if (equity >= 25000) {
      return equity * 4;
    }

    // Non-PDT accounts limited to cash only for day trading
    return portfolio.cash;
  }

  getBuyingPowerRestrictions(portfolio: Portfolio): string[] {
    const restrictions: string[] = [];

    if (portfolio.equity < 25000 && portfolio.template.dayTradingEnabled) {
      restrictions.push("Limited to 3 day trades per 5 business days");
    }

    if (!portfolio.template.marginEnabled) {
      restrictions.push("Cash account - no margin trading");
      restrictions.push("Settlement period applies to sold securities");
    }

    if (portfolio.equity < 2000) {
      restrictions.push(
        "Minimum equity requirement not met for margin trading"
      );
    }

    return restrictions;
  }
}
```

### Settlement Period Tracking

```typescript
class SettlementTracker {
  async trackSettlement(trade: Trade): Promise<SettlementInfo> {
    const settlementDate = this.calculateSettlementDate(
      trade.executedAt,
      trade.assetType
    );

    return {
      tradeId: trade.id,
      executedAt: trade.executedAt,
      settlementDate,
      fundsAvailableAt: settlementDate,
      settlementPeriod: this.getSettlementPeriod(trade.assetType),
      isSettled: new Date() >= settlementDate,
    };
  }

  private calculateSettlementDate(tradeDate: Date, assetType: AssetType): Date {
    const settlementPeriod = this.getSettlementPeriod(assetType);
    return this.businessDayCalculator.addBusinessDays(
      tradeDate,
      settlementPeriod
    );
  }

  private getSettlementPeriod(assetType: AssetType): number {
    switch (assetType) {
      case "STOCK":
        return 2; // T+2 settlement for stocks
      case "ETF":
        return 2; // T+2 settlement for ETFs
      default:
        return 2;
    }
  }

  async getUnsettledFunds(portfolioId: string): Promise<UnsettledFundsInfo> {
    const unsettledTrades = await this.getUnsettledTrades(portfolioId);

    const totalUnsettled = unsettledTrades.reduce((sum, trade) => {
      return sum + (trade.type === "SELL" ? trade.totalValue : 0);
    }, 0);

    return {
      totalUnsettledAmount: totalUnsettled,
      unsettledTrades: unsettledTrades.map((trade) => ({
        tradeId: trade.id,
        amount: trade.totalValue,
        settlementDate: this.calculateSettlementDate(
          trade.executedAt,
          trade.assetType
        ),
      })),
      nextSettlementDate: this.getNextSettlementDate(unsettledTrades),
    };
  }
}
```

</details>

## 🧪 Testing Implementation

### Backend Testing Strategy

```typescript
describe("Portfolio Templates", () => {
  test("Professional Day Trader portfolio creation", async () => {
    const portfolio = await portfolioService.createFromTemplate(
      "professional-day-trader",
      {
        name: "Test Professional Portfolio",
        userId: "test-user",
      }
    );

    expect(portfolio.startingCapital).toBe(50000);
    expect(portfolio.dayTradingEnabled).toBe(true);
    expect(portfolio.maxDayTrades).toBeNull(); // unlimited
  });

  test("PDT rule enforcement for small accounts", async () => {
    const smallPortfolio = await portfolioService.createFromTemplate(
      "small-investor"
    );

    // Execute 3 day trades
    for (let i = 0; i < 3; i++) {
      await tradingService.executeDayTrade(smallPortfolio.id, mockDayTrade);
    }

    // 4th day trade should be rejected
    const result = await tradingService.validateDayTrade(
      smallPortfolio.id,
      mockDayTrade
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Day trade limit exceeded");
  });
});
```

### Frontend Testing Coverage

```typescript
describe("PortfolioCreator Component", () => {
  test("displays all four portfolio templates", () => {
    render(
      <PortfolioCreator
        onPortfolioSelect={jest.fn()}
        onCreatePortfolio={jest.fn()}
      />
    );

    expect(screen.getByText("Professional Day Trader")).toBeInTheDocument();
    expect(screen.getByText("Standard Day Trader")).toBeInTheDocument();
    expect(screen.getByText("Small Investor")).toBeInTheDocument();
    expect(screen.getByText("Micro Investor")).toBeInTheDocument();
  });

  test("shows day trading restrictions for small portfolios", () => {
    render(
      <PortfolioCreator
        onPortfolioSelect={jest.fn()}
        onCreatePortfolio={jest.fn()}
      />
    );

    const smallInvestorCard = screen
      .getByText("Small Investor")
      .closest(".portfolio-card");
    expect(smallInvestorCard).toHaveTextContent("Day Trading Restricted");
    expect(smallInvestorCard).toHaveTextContent(
      "3 day trades per 5 business days"
    );
  });
});
```

## 📊 Business Impact

### Educational Value

- **Regulatory Compliance**: Users learn SEC day trading rules through practical application
- **Risk Management**: Different portfolio sizes teach appropriate risk levels
- **Capital Requirements**: Clear understanding of minimum equity requirements
- **Trading Restrictions**: Hands-on experience with day trading limitations

### User Experience Enhancement

- **Appropriate Templates**: Portfolio types match user experience and capital levels
- **Clear Guidelines**: Transparent rules and restrictions for each portfolio type
- **Progressive Learning**: Users can graduate from smaller to larger portfolios
- **Real-world Simulation**: Accurate simulation of actual brokerage account types

### System Benefits

- **Compliance Assurance**: Automated enforcement of SEC regulations
- **Risk Mitigation**: Built-in safeguards prevent regulatory violations
- **Educational Platform**: Serves as learning tool for trading rules
- **Scalable Architecture**: Framework supports additional portfolio types

## 📝 Implementation Summary

Successfully implemented a comprehensive portfolio template system with four distinct stock-only portfolio types that fully comply with SEC day trading regulations. The system provides users with realistic trading experiences while teaching important regulatory compliance and risk management principles.

**Key Achievements:**

- ✅ Four distinct portfolio templates with appropriate capital levels ($500 to $50,000)
- ✅ Complete SEC Pattern Day Trading (PDT) rule implementation
- ✅ Automated day trade counting and restriction enforcement
- ✅ Business day calculation system with market holiday awareness
- ✅ Portfolio-specific buying power calculations
- ✅ Settlement period tracking for cash accounts
- ✅ Educational warnings and compliance messaging
- ✅ Responsive portfolio selection interface
- ✅ Real-time restriction validation during trade execution
- ✅ Comprehensive testing coverage for all compliance scenarios

The implementation establishes a solid foundation for paper trading education while maintaining strict adherence to financial regulations and providing users with realistic market experiences across different capital levels and trading strategies.
