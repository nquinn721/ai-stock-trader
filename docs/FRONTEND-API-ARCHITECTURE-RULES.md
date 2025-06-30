# Frontend API Architecture Rules

## Overview

This document establishes architectural rules for API calls and data transformation in the Stock Trading App frontend. All API communication must follow these guidelines to ensure consistency, maintainability, and proper error handling.

## Core Architectural Rule

**ALL API CALLS AND DATA TRANSFORMATION LOGIC MUST RESIDE IN MOBX STORES**

No API calls are allowed in the following locations:

- Services (except for pure business logic without API calls)
- Components
- Pages
- Hooks (custom hooks)
- Utility functions

## Store-Based Architecture

### 1. API Store (ApiStore.ts)

The central store for all HTTP requests. All other stores must use ApiStore for API communication.

**Available methods:**

- `get<T>(url: string): Promise<T>`
- `post<T>(url: string, data?: any): Promise<T>`
- `put<T>(url: string, data?: any): Promise<T>`
- `patch<T>(url: string, data?: any): Promise<T>`
- `delete(url: string): Promise<void>`

### 2. Domain-Specific Stores

Each business domain has its own store that handles related API calls and data transformation:

#### Core Stores

- **StockStore** - Stock prices, market data, signals
- **PortfolioStore** - Portfolio management, positions, performance
- **TradeStore** - Trade execution, history, orders
- **UserStore** - User authentication, preferences

#### Trading Stores

- **AutoTradingStore** - Automated trading rules, sessions, autonomous strategies
- **OrderManagementStore** - Advanced order types, order tracking
- **RecommendationStore** - Trading recommendations, analysis

#### Data & Intelligence Stores

- **AIStore** - AI-powered analysis, recommendations
- **NotificationStore** - User notifications, alerts
- **MacroIntelligenceStore** - Economic analysis, market intelligence
- **MultiAssetStore** - Forex, crypto, cross-asset analytics
- **TradingAssistantStore** - AI chat, portfolio analysis

#### Technical Stores

- **WebSocketStore** - Real-time data subscriptions

## Implementation Guidelines

### 1. Store Structure

All stores must follow this pattern:

```typescript
import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

export class ExampleStore {
  // Observable data
  data: DataType[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  // API methods
  async fetchData(): Promise<DataType[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<DataType[]>("/endpoint");

      runInAction(() => {
        this.data = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch data";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Data transformation methods
  transformData(rawData: any): DataType {
    // All data transformation logic here
    return transformedData;
  }

  // Computed getters
  get hasData(): boolean {
    return this.data.length > 0;
  }

  // Utility methods
  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }
}
```

### 2. Error Handling

All stores must:

- Set loading states properly
- Handle errors consistently
- Provide meaningful error messages
- Clear errors when appropriate

### 3. Data Transformation

All data transformation logic must be in stores:

- Raw API response → Domain models
- Format conversion (dates, currencies, etc.)
- Data aggregation and calculations
- Business logic computations

### 4. Component Usage

Components must only:

- Call store methods
- Observe store data
- Handle UI interactions

```typescript
// ✅ CORRECT - Using store
const MyComponent: React.FC = observer(() => {
  const { stockStore } = useStore();

  useEffect(() => {
    stockStore.fetchStocks();
  }, [stockStore]);

  return (
    <div>
      {stockStore.isLoading ? (
        <div>Loading...</div>
      ) : (
        stockStore.stocks.map(stock => (
          <div key={stock.id}>{stock.symbol}</div>
        ))
      )}
    </div>
  );
});

// ❌ WRONG - Direct API call
const MyComponent: React.FC = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(setData);
  }, []);

  return <div>{/* render data */}</div>;
};
```

## Migration Status

### ✅ Completed Stores

- **ApiStore** - Core HTTP client with all methods
- **NotificationStore** - All notification API logic moved from services
- **AIStore** - AI API logic moved from aiService
- **MacroIntelligenceStore** - Economic and market intelligence APIs
- **TradingAssistantStore** - AI chat and analysis APIs
- **MultiAssetStore** - Forex, crypto, and cross-asset APIs
- **OrderManagementStore** - Advanced order management APIs
- **AutoTradingStore** - Enhanced with autonomous trading APIs

### ✅ Updated Components

- **QuickTradeContent** - Now uses TradeStore.executeTrade()
- **PortfolioCreator** - Now uses PortfolioStore.createPortfolio()

### 🔄 In Progress

- **ForexDashboard** - Updating to use MultiAssetStore
- **CryptoDashboard** - Needs MultiAssetStore integration
- **AnalyticsPage** - Partially updated, needs portfolio analytics in store

### ❌ Remaining Work

- **CrossAssetAnalytics** - Convert fetch calls to MultiAssetStore
- **AdvancedOrderEntry** - Convert to OrderManagementStore
- **MultiAssetDashboard** - Convert to MultiAssetStore
- Remove all remaining service files after API migration
- Update RootStore to include all new stores properly

## Forbidden Patterns

### ❌ Direct fetch/axios in components

```typescript
// WRONG
const response = await fetch("/api/data");
const result = await axios.get("/api/data");
```

### ❌ API calls in services (unless pure business logic)

```typescript
// WRONG - Services should not make API calls
class DataService {
  async getData() {
    return await fetch("/api/data");
  }
}
```

### ❌ Data transformation in components

```typescript
// WRONG - Transform in store, not component
const transformedData = rawData.map((item) => ({
  ...item,
  formattedPrice: formatCurrency(item.price),
}));
```

## Approved Patterns

### ✅ Store-based API calls

```typescript
// CORRECT
class DataStore {
  async fetchData(): Promise<DataType[]> {
    return await this.apiStore.get<DataType[]>("/api/data");
  }
}
```

### ✅ Store-based data transformation

```typescript
// CORRECT
class DataStore {
  transformApiResponse(rawData: any): DataType {
    return {
      id: rawData.id,
      name: rawData.name,
      formattedPrice: this.formatCurrency(rawData.price),
      // ... other transformations
    };
  }
}
```

### ✅ Component store usage

```typescript
// CORRECT
const Component = observer(() => {
  const { dataStore } = useStore();

  useEffect(() => {
    dataStore.fetchData();
  }, [dataStore]);

  return <div>{dataStore.data.map(...)}</div>;
});
```

## Enforcement

This architecture is enforced through:

1. **Code Reviews** - All PRs must follow these patterns
2. **ESLint Rules** - Custom rules to detect forbidden patterns
3. **TypeScript** - Strong typing prevents incorrect usage
4. **Documentation** - This document serves as the source of truth

## Benefits

1. **Consistency** - All API calls follow the same pattern
2. **Testability** - Stores can be easily mocked and tested
3. **Maintainability** - Single source of truth for each domain
4. **Error Handling** - Centralized error handling in stores
5. **Type Safety** - Strong TypeScript support throughout
6. **Real-time Updates** - MobX reactivity for automatic UI updates
7. **Performance** - Efficient data caching and updates

## Exception Policy

No exceptions are allowed to this architecture. If a use case cannot be handled by the current store structure, the appropriate store must be extended or a new store must be created following the established patterns.

For questions or clarifications, refer to the store implementations or update this documentation.

---

**Last Updated:** June 30, 2025  
**Compliance:** Mandatory for all frontend code
