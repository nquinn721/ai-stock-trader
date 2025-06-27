# S53: Multi-Asset Paper Trading Account Isolation System

**Epic**: Cross-Asset Trading Infrastructure  
**Priority**: High  
**Points**: 13  
**Status**: READY  
**Sprint**: Sprint 5  
**Created**: 2025-06-26  
**Updated**: 2025-06-26

## Overview

Implement comprehensive paper trading account system supporting Forex and Crypto assets alongside existing Stock trading, with strict account isolation to prevent cross-contamination of trading activities and ensure proper risk management across different asset classes.

## Business Value

**Problem Statement:**

- Current paper trading system only supports stocks
- No dedicated account isolation for different asset classes
- Risk of unintended cross-asset trading activities
- Lack of proper segregation for automated trading strategies

**Expected Outcomes:**

- Separate paper trading accounts for Stock, Forex, and Crypto
- Strict account isolation preventing cross-asset contamination
- Enhanced risk management through asset-class specific controls
- Foundation for multi-asset automated trading strategies
- Compliance with financial industry segregation standards

## Technical Requirements

### 1. Database Schema Extensions

#### New Account Types

```sql
-- Extend portfolio types
ALTER TABLE portfolios ADD COLUMN asset_class ENUM('STOCK', 'FOREX', 'CRYPTO') DEFAULT 'STOCK';
ALTER TABLE portfolios ADD COLUMN base_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE portfolios ADD COLUMN is_isolated BOOLEAN DEFAULT TRUE;

-- Account isolation constraints
ALTER TABLE portfolios ADD CONSTRAINT unique_user_asset_class
  UNIQUE(user_id, asset_class, account_type);

-- New forex pairs table
CREATE TABLE forex_pairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  base_currency VARCHAR(3) NOT NULL,
  quote_currency VARCHAR(3) NOT NULL,
  symbol VARCHAR(7) NOT NULL UNIQUE, -- e.g., 'EUR/USD'
  pip_size DECIMAL(10,8) NOT NULL,
  min_lot_size DECIMAL(10,4) NOT NULL,
  max_lot_size DECIMAL(10,4) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New crypto pairs table
CREATE TABLE crypto_pairs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  base_asset VARCHAR(10) NOT NULL, -- e.g., 'BTC'
  quote_asset VARCHAR(10) NOT NULL, -- e.g., 'USD', 'BTC'
  symbol VARCHAR(20) NOT NULL UNIQUE, -- e.g., 'BTC/USD'
  min_order_size DECIMAL(18,8) NOT NULL,
  max_order_size DECIMAL(18,8) NOT NULL,
  price_precision INT NOT NULL,
  quantity_precision INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Account Isolation Rules

```sql
-- Trading activity isolation
ALTER TABLE trades ADD COLUMN asset_class ENUM('STOCK', 'FOREX', 'CRYPTO');
ALTER TABLE orders ADD COLUMN asset_class ENUM('STOCK', 'FOREX', 'CRYPTO');

-- Performance tracking isolation
CREATE TABLE asset_class_performance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  portfolio_id INT NOT NULL,
  asset_class ENUM('STOCK', 'FOREX', 'CRYPTO') NOT NULL,
  date DATE NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  daily_pnl DECIMAL(15,2) NOT NULL,
  total_pnl DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (portfolio_id) REFERENCES portfolios(id),
  UNIQUE KEY unique_portfolio_asset_date (portfolio_id, asset_class, date)
);
```

### 2. Backend API Extensions

#### Account Management Service

```typescript
// backend/src/modules/paper-trading/account-isolation.service.ts
@Injectable()
export class AccountIsolationService {
  async createAssetClassAccount(
    userId: string,
    assetClass: AssetClass,
    initialBalance: number,
    baseCurrency: string = "USD"
  ): Promise<Portfolio> {
    // Validate no existing account for this asset class
    await this.validateUniqueAssetClass(userId, assetClass);

    // Create isolated portfolio
    return this.portfolioService.createIsolatedPortfolio({
      userId,
      assetClass,
      initialBalance,
      baseCurrency,
      isIsolated: true,
      accountType: "paper",
    });
  }

  async validateTradingIsolation(
    portfolioId: string,
    symbol: string,
    assetClass: AssetClass
  ): Promise<void> {
    const portfolio = await this.getPortfolio(portfolioId);

    if (portfolio.assetClass !== assetClass) {
      throw new ForbiddenException(
        `Cannot trade ${assetClass} assets in ${portfolio.assetClass} account`
      );
    }
  }

  async getAssetClassAccounts(userId: string): Promise<AssetClassAccount[]> {
    return this.portfolioRepository.find({
      where: { userId, isIsolated: true },
      select: ["id", "assetClass", "balance", "totalValue", "baseCurrency"],
    });
  }
}
```

#### Forex Trading Service

```typescript
// backend/src/modules/forex/forex.service.ts
@Injectable()
export class ForexService {
  async getForexPairs(): Promise<ForexPair[]> {
    return this.forexPairRepository.find({ where: { isActive: true } });
  }

  async getForexPrice(symbol: string): Promise<ForexPrice> {
    // Integration with Forex data provider (e.g., Alpha Vantage, Fixer.io)
    return this.forexDataProvider.getCurrentPrice(symbol);
  }

  async validateForexTrade(
    portfolioId: string,
    symbol: string,
    lotSize: number
  ): Promise<ValidationResult> {
    // Ensure portfolio is forex-enabled
    await this.accountIsolationService.validateTradingIsolation(
      portfolioId,
      symbol,
      AssetClass.FOREX
    );

    // Validate lot size and margin requirements
    return this.validateLotSizeAndMargin(symbol, lotSize);
  }
}
```

#### Crypto Trading Service

```typescript
// backend/src/modules/crypto/crypto.service.ts
@Injectable()
export class CryptoService {
  async getCryptoPairs(): Promise<CryptoPair[]> {
    return this.cryptoPairRepository.find({ where: { isActive: true } });
  }

  async getCryptoPrice(symbol: string): Promise<CryptoPrice> {
    // Integration with crypto data provider (e.g., CoinGecko, Binance API)
    return this.cryptoDataProvider.getCurrentPrice(symbol);
  }

  async validateCryptoTrade(
    portfolioId: string,
    symbol: string,
    quantity: number
  ): Promise<ValidationResult> {
    // Ensure portfolio is crypto-enabled
    await this.accountIsolationService.validateTradingIsolation(
      portfolioId,
      symbol,
      AssetClass.CRYPTO
    );

    // Validate minimum order size and precision
    return this.validateOrderSizeAndPrecision(symbol, quantity);
  }
}
```

### 3. Frontend Account Management Interface

#### Multi-Asset Account Dashboard

```typescript
// frontend/src/components/paper-trading/MultiAssetAccountDashboard.tsx
interface AssetClassAccount {
  id: string;
  assetClass: 'STOCK' | 'FOREX' | 'CRYPTO';
  balance: number;
  totalValue: number;
  dailyPnL: number;
  totalPnL: number;
  baseCurrency: string;
  isActive: boolean;
  createdAt: string;
}

const MultiAssetAccountDashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<AssetClassAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AssetClassAccount | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const assetClassConfig = {
    STOCK: {
      icon: '📈',
      color: '#2196f3',
      label: 'Stock Trading',
      description: 'Equities and ETFs'
    },
    FOREX: {
      icon: '💱',
      color: '#4caf50',
      label: 'Forex Trading',
      description: 'Currency pairs'
    },
    CRYPTO: {
      icon: '₿',
      color: '#ff9800',
      label: 'Crypto Trading',
      description: 'Digital assets'
    }
  };

  return (
    <div className="multi-asset-dashboard">
      <div className="dashboard-header">
        <h2>Paper Trading Accounts</h2>
        <Button onClick={() => setShowCreateModal(true)}>
          Create New Account
        </Button>
      </div>

      <div className="accounts-grid">
        {Object.entries(assetClassConfig).map(([assetClass, config]) => {
          const account = accounts.find(acc => acc.assetClass === assetClass);
          return (
            <AssetClassAccountCard
              key={assetClass}
              assetClass={assetClass as AssetClass}
              account={account}
              config={config}
              onSelect={setSelectedAccount}
              onCreateAccount={() => handleCreateAccount(assetClass)}
            />
          );
        })}
      </div>

      {selectedAccount && (
        <AccountDetailPanel
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
};
```

#### Account Isolation Validation

```typescript
// frontend/src/hooks/useAccountIsolation.ts
export const useAccountIsolation = () => {
  const validateAssetClassTrade = useCallback(
    (portfolioId: string, symbol: string, assetClass: AssetClass) => {
      // Client-side validation before API call
      const portfolio = portfolioStore.getPortfolioById(portfolioId);

      if (!portfolio) {
        throw new Error("Portfolio not found");
      }

      if (portfolio.assetClass !== assetClass) {
        throw new Error(
          `Cannot trade ${assetClass} assets in ${portfolio.assetClass} account. ` +
            `Please switch to the appropriate account.`
        );
      }

      return true;
    },
    []
  );

  const getAvailableAccounts = useCallback((assetClass: AssetClass) => {
    return portfolioStore.portfolios.filter(
      (p) => p.assetClass === assetClass && p.accountType === "paper"
    );
  }, []);

  return {
    validateAssetClassTrade,
    getAvailableAccounts,
  };
};
```

### 4. Trading Interface Updates

#### Asset-Class Aware Order Entry

```typescript
// frontend/src/components/order-management/AssetClassOrderEntry.tsx
const AssetClassOrderEntry: React.FC<{
  symbol: string;
  assetClass: AssetClass;
}> = ({ symbol, assetClass }) => {
  const { validateAssetClassTrade, getAvailableAccounts } = useAccountIsolation();
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');

  const availableAccounts = useMemo(
    () => getAvailableAccounts(assetClass),
    [assetClass, getAvailableAccounts]
  );

  const handleSubmitOrder = useCallback(async (orderData) => {
    try {
      // Validate account isolation
      validateAssetClassTrade(selectedPortfolio, symbol, assetClass);

      // Submit order with asset class validation
      await orderApi.submitOrder({
        ...orderData,
        portfolioId: selectedPortfolio,
        symbol,
        assetClass
      });

    } catch (error) {
      showErrorNotification(error.message);
    }
  }, [selectedPortfolio, symbol, assetClass]);

  return (
    <div className="asset-class-order-entry">
      <div className="account-selector">
        <FormControl fullWidth>
          <InputLabel>Select {assetClass} Account</InputLabel>
          <Select
            value={selectedPortfolio}
            onChange={(e) => setSelectedPortfolio(e.target.value)}
          >
            {availableAccounts.map(account => (
              <MenuItem key={account.id} value={account.id}>
                {account.name} - {formatCurrency(account.balance)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {/* Asset-class specific order form */}
      {assetClass === 'FOREX' && (
        <ForexOrderForm onSubmit={handleSubmitOrder} />
      )}
      {assetClass === 'CRYPTO' && (
        <CryptoOrderForm onSubmit={handleSubmitOrder} />
      )}
      {assetClass === 'STOCK' && (
        <StockOrderForm onSubmit={handleSubmitOrder} />
      )}
    </div>
  );
};
```

## API Endpoints

### Account Management

- `GET /api/paper-trading/accounts` - Get all asset class accounts
- `POST /api/paper-trading/accounts` - Create new asset class account
- `GET /api/paper-trading/accounts/:assetClass` - Get specific asset class account
- `PUT /api/paper-trading/accounts/:id/activate` - Activate/deactivate account
- `DELETE /api/paper-trading/accounts/:id` - Close account (with safeguards)

### Forex Trading

- `GET /api/forex/pairs` - Get available forex pairs
- `GET /api/forex/prices/:symbol` - Get current forex price
- `POST /api/forex/orders` - Place forex order
- `GET /api/forex/portfolio/:id/positions` - Get forex positions

### Crypto Trading

- `GET /api/crypto/pairs` - Get available crypto pairs
- `GET /api/crypto/prices/:symbol` - Get current crypto price
- `POST /api/crypto/orders` - Place crypto order
- `GET /api/crypto/portfolio/:id/positions` - Get crypto positions

### Account Isolation Validation

- `POST /api/paper-trading/validate-trade` - Validate cross-asset trade prevention
- `GET /api/paper-trading/isolation-status` - Check account isolation status

## Security & Compliance

### Account Isolation Rules

1. **Strict Asset Class Separation**: No portfolio can trade multiple asset classes
2. **Cross-Contamination Prevention**: API-level validation prevents incorrect asset trades
3. **Automated Trading Isolation**: Each automated strategy must be tied to specific asset class account
4. **Balance Segregation**: Asset class balances are completely separate
5. **Performance Tracking Isolation**: P&L tracking per asset class

### Risk Management

1. **Asset-Class Specific Risk Limits**: Different risk parameters per asset type
2. **Currency Risk Management**: Proper handling of base currencies
3. **Leverage Controls**: Asset-appropriate leverage limits
4. **Position Size Validation**: Asset-specific position sizing rules

## Testing Requirements

### Unit Tests (Backend)

- [ ] Account isolation service tests
- [ ] Asset class validation tests
- [ ] Forex trading service tests
- [ ] Crypto trading service tests
- [ ] Cross-contamination prevention tests

### Integration Tests

- [ ] Multi-asset account creation flow
- [ ] Asset class switching prevention
- [ ] Order routing to correct accounts
- [ ] Performance tracking isolation
- [ ] Automated trading isolation

### E2E Tests

- [ ] Create accounts for all asset classes
- [ ] Attempt cross-asset trading (should fail)
- [ ] Switch between asset class accounts
- [ ] Place trades in each asset class
- [ ] Verify separate performance tracking

## Implementation Plan

### Phase 1: Database & Backend Core (5 points)

- [ ] Database schema extensions
- [ ] Account isolation service
- [ ] Basic API endpoints
- [ ] Unit tests for core functionality

### Phase 2: Asset Class Services (4 points)

- [ ] Forex trading service
- [ ] Crypto trading service
- [ ] Data provider integrations
- [ ] Validation middleware

### Phase 3: Frontend Integration (4 points)

- [ ] Multi-asset account dashboard
- [ ] Asset-class aware order entry
- [ ] Account isolation hooks
- [ ] UI/UX for account switching

## Acceptance Criteria

### Core Functionality

- [ ] Users can create separate paper trading accounts for Stock, Forex, and Crypto
- [ ] Each account maintains complete isolation from other asset classes
- [ ] Trading orders are automatically routed to the correct asset class account
- [ ] Cross-asset trading attempts are blocked with clear error messages
- [ ] Performance tracking is separate for each asset class

### User Experience

- [ ] Clear visual indication of current active account and asset class
- [ ] Seamless switching between different asset class accounts
- [ ] Comprehensive account overview showing all asset classes
- [ ] Asset-appropriate trading interfaces for each class

### Technical Requirements

- [ ] API-level validation prevents cross-asset contamination
- [ ] Database constraints ensure account isolation
- [ ] Automated trading systems respect account isolation
- [ ] Real-time data feeds are properly segregated by asset class

### Compliance & Security

- [ ] All trades are properly attributed to correct asset class
- [ ] Account balances cannot be mixed between asset classes
- [ ] Risk management is applied per asset class
- [ ] Audit trail maintains asset class separation

## Dependencies

- Paper Trading System (existing)
- Portfolio Management Service (existing)
- Order Management System (existing)
- User Authentication System (existing)
- Forex data provider integration (new)
- Crypto data provider integration (new)

## Risks & Mitigation

### Technical Risks

1. **Data Provider Integration Complexity**
   - Mitigation: Start with reliable providers (Alpha Vantage, CoinGecko)
   - Fallback: Mock data for development

2. **Account Isolation Complexity**
   - Mitigation: Comprehensive testing and validation layers
   - Database constraints as safety net

3. **Performance Impact**
   - Mitigation: Optimize queries and add proper indexing
   - Monitor performance metrics

### Business Risks

1. **User Confusion with Multiple Accounts**
   - Mitigation: Clear UI/UX design with visual indicators
   - Comprehensive user documentation

2. **Regulatory Compliance**
   - Mitigation: Follow financial industry best practices
   - Legal review of account isolation requirements

## Success Metrics

1. **Isolation Effectiveness**: Zero cross-asset contamination incidents
2. **User Adoption**: 80% of active users create multi-asset accounts
3. **System Reliability**: 99.9% uptime for account isolation validations
4. **Performance**: Sub-100ms response time for account validation
5. **Test Coverage**: 95%+ coverage for account isolation logic

## Related Stories

- S30C: Automated Trading System Backend (dependency)
- S35: Advanced Order Management System (enhancement)
- S42: Reinforcement Learning Trading Agent (future enhancement)
- S43: Multi-Asset Alternative Data Platform (integration)

---

**Next Actions:**

1. Technical design review with backend team
2. Database migration planning
3. Data provider evaluation and selection
4. UI/UX mockups for multi-asset interface
5. Security and compliance review
