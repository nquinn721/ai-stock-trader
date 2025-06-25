# 🏗️ Stock Trading App Architecture Documentation

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [API Documentation](#api-documentation)
6. [Database Schema](#database-schema)
7. [WebSocket Architecture](#websocket-architecture)
8. [Deployment Architecture](#deployment-architecture)

---

## 🌟 System Overview

The Stock Trading App is a full-stack TypeScript application built with **NestJS** (backend) and **React** (frontend) that provides real-time stock trading capabilities with AI-powered insights.

### 🎯 Key Features

- **Real-time Stock Data** - Yahoo Finance API integration
- **Paper Trading** - Risk-free trading simulation
- **AI Recommendations** - ML-powered trading signals
- **Portfolio Management** - Multi-portfolio support with analytics
- **Real-time Updates** - WebSocket-based live data
- **Advanced Order Management** - Multiple order types and conditions
- **News Integration** - Sentiment analysis and market news

### 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    STOCK TRADING PLATFORM                      │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React)     │  Backend (NestJS)     │  External APIs  │
│  Port: 3000          │  Port: 8000           │                 │
├─────────────────────────────────────────────────────────────────┤
│  • Dashboard         │  • REST API           │  • Yahoo Finance │
│  • Trading Interface │  • WebSocket Gateway  │  • News API      │
│  • Portfolio Manager │  • Business Logic     │  • ML Services   │
│  • Charts & Analytics│  • Database Layer     │                 │
│  • MobX State Mgmt  │  • Cron Jobs          │                 │
└─────────────────────────────────────────────────────────────────┘
            │                        │                        │
            └───────── HTTP/WS ──────┴──── External APIs ────┘
                    Real-time Data Flow
```

---

## 🔧 Backend Architecture

### 🏗️ Backend Structure Diagram

```
                    🔺 NestJS Backend Architecture 🔺
    ┌─────────────────────────────────────────────────────────────────┐
    │                         main.ts                                │
    │                    (Bootstrap App)                             │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                     app.module.ts                              │
    │                 (Root Application Module)                      │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │              Configuration                              │   │
    │  │  • ConfigModule (Environment Variables)                 │   │
    │  │  • TypeOrmModule (Database Connection)                  │   │
    │  │  • ScheduleModule (Cron Jobs)                          │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                   🔥 MODULES LAYER 🔥                          │
    ├─────────────────────────────────────────────────────────────────┤
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
    │  │ StockModule │ │NewsModule   │ │TradingModule│ │MLModule   │ │
    │  │             │ │             │ │             │ │           │ │
    │  │ • Controller│ │ • Controller│ │ • Controller│ │ • Services│ │
    │  │ • Service   │ │ • Service   │ │ • Service   │ │ • Models  │ │
    │  │ • Entity    │ │ • Entity    │ │ • Entity    │ │ • Analytics│ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
    │                                                                 │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
    │  │PaperTrading │ │OrderMgmt    │ │Notification │ │WebSocket  │ │
    │  │Module       │ │Module       │ │Module       │ │Module     │ │
    │  │             │ │             │ │             │ │           │ │
    │  │ • Portfolio │ │ • Orders    │ │ • Alerts    │ │ • Gateway │ │
    │  │ • Positions │ │ • Execution │ │ • Preferences│ │ • Events  │ │
    │  │ • Trades    │ │ • Risk Mgmt │ │ • Templates │ │ • Clients │ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                🗃️ DATABASE LAYER 🗃️                            │
    ├─────────────────────────────────────────────────────────────────┤
    │                      TypeORM                                   │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │                   MySQL Database                        │   │
    │  │                                                         │   │
    │  │  📊 Core Tables:      🤖 ML Tables:      🔔 Others:     │   │
    │  │  • stocks            • ml_models         • notifications│   │
    │  │  • portfolios        • ml_predictions    • orders       │   │
    │  │  • positions         • ml_metrics        • news         │   │
    │  │  • trades            • ml_ab_tests       • signals      │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │              🌐 EXTERNAL INTEGRATIONS 🌐                       │
    ├─────────────────────────────────────────────────────────────────┤
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
    │  │Yahoo Finance│ │News APIs    │ │ML Services  │ │Schedulers │ │
    │  │API          │ │             │ │             │ │           │ │
    │  │             │ │ • Sentiment │ │ • Inference │ │ • Cron    │ │
    │  │ • Prices    │ │ • Articles  │ │ • Training  │ │ • Updates │ │
    │  │ • Historical│ │ • Sources   │ │ • Analytics │ │ • Cleanup │ │
    │  │ • Real-time │ │ • Analysis  │ │ • Signals   │ │ • Alerts  │ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
    └─────────────────────────────────────────────────────────────────┘
```

### 📂 Backend Module Breakdown

#### 🏛️ Core Application Modules

1. **StockModule** (`/modules/stock/`)
   - **Controller**: REST endpoints for stock data
   - **Service**: Yahoo Finance integration, data processing
   - **Entity**: Stock model with price, volume, technical indicators
   - **Features**: Real-time price updates, historical data, technical analysis

2. **PaperTradingModule** (`/modules/paper-trading/`)
   - **Portfolio Management**: Create, manage multiple portfolios
   - **Position Tracking**: Real-time position values and P&L
   - **Trade Execution**: Simulated trade processing
   - **Performance Analytics**: Historical performance tracking

3. **TradingModule** (`/modules/trading/`)
   - **Signal Generation**: AI-powered trading recommendations
   - **Risk Management**: Position sizing, stop-loss calculations
   - **Strategy Execution**: Automated trading logic
   - **Backtesting**: Historical strategy performance

4. **MLModule** (`/modules/ml/`)
   - **Feature Engineering**: Technical indicator calculations
   - **Model Training**: ML model management and training
   - **Inference Service**: Real-time predictions
   - **A/B Testing**: Model performance comparison

#### 🔌 Integration Modules

5. **WebSocketModule** (`/modules/websocket/`)
   - **Gateway**: Real-time client connections
   - **Event Handling**: Stock updates, portfolio changes
   - **Room Management**: Client-specific data streams
   - **Error Handling**: Connection recovery and retries

6. **NewsModule** (`/modules/news/`)
   - **Article Fetching**: News API integration
   - **Sentiment Analysis**: NLP-powered sentiment scoring
   - **Stock Association**: Link news to specific stocks
   - **Real-time Updates**: Live news feed

7. **NotificationModule** (`/modules/notification/`)
   - **Alert System**: Price alerts, signal notifications
   - **Preference Management**: User notification settings
   - **Template Engine**: Customizable notification formats
   - **Delivery System**: Email, WebSocket, push notifications

8. **OrderManagementModule** (`/modules/order-management/`)
   - **Order Processing**: Market, limit, stop orders
   - **Execution Engine**: Order routing and fills
   - **Risk Checks**: Pre-trade risk validation
   - **Audit Trail**: Complete order history

### 🔄 Backend Data Flow

```
    📡 External Data Sources
           │
           ▼
    🔄 Scheduled Jobs (Cron)
           │
           ▼
    📊 Data Processing Layer
           │
           ├─► 🧠 ML Analysis
           ├─► 💹 Technical Indicators  
           ├─► 📈 Signal Generation
           └─► 🔔 Notifications
           │
           ▼
    🗃️ Database Storage
           │
           ▼
    🌐 WebSocket Broadcasting
           │
           ▼
    📱 Frontend Updates
```

### 🕒 Scheduled Services

```typescript
// Cron Job Schedule
@Cron('0 */2 * * * *') // Every 2 minutes
async updateStockPrices() {
  // 1. Fetch latest prices from Yahoo Finance
  // 2. Update database with new data
  // 3. Calculate technical indicators
  // 4. Generate trading signals
  // 5. Broadcast updates via WebSocket
}

@Cron('0 0 */6 * * *') // Every 6 hours
async updateNewsAndSentiment() {
  // 1. Fetch latest news articles
  // 2. Perform sentiment analysis
  // 3. Associate with relevant stocks
  // 4. Update sentiment scores
}
```

---

## ⚛️ Frontend Architecture

### 🎨 Frontend Structure Diagram

```
                    ⚛️ React Frontend Architecture ⚛️
    ┌─────────────────────────────────────────────────────────────────┐
    │                        index.tsx                               │
    │                    (Application Entry)                         │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                      App.tsx                                   │
    │                  (Main Application)                            │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │                  🔧 Providers                           │   │
    │  │  • ErrorBoundary                                        │   │
    │  │  • StoreProvider (MobX)                                │   │
    │  │  • SocketProvider (WebSocket)                          │   │
    │  │  • NotificationProvider                                │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                  📊 DASHBOARD LAYER 📊                         │
    ├─────────────────────────────────────────────────────────────────┤
    │                   Dashboard.tsx                                │
    │                 (Main Interface)                               │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │              🎛️ Navigation & Layout                     │   │
    │  │  • Portfolio Selector                                   │   │
    │  │  • Tab Navigation                                       │   │
    │  │  • Search Interface                                     │   │
    │  │  • Notification Center                                  │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │               🧩 COMPONENT ECOSYSTEM 🧩                        │
    ├─────────────────────────────────────────────────────────────────┤
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
    │  │Portfolio    │ │Stock        │ │Trading      │ │Analytics  │ │
    │  │Components   │ │Components   │ │Components   │ │Components │ │
    │  │             │ │             │ │             │ │           │ │
    │  │ • Portfolio │ │ • StockCard │ │ • QuickTrade│ │ • Charts  │ │
    │  │ • Positions │ │ • StockModal│ │ • OrderForm │ │ • Metrics │ │
    │  │ • Summary   │ │ • PriceChart│ │ • TradeList │ │ • Reports │ │
    │  │ • Analytics │ │ • Sentiment │ │ • RiskMgmt  │ │ • Compare │ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
    │                                                                 │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
    │  │UI/UX        │ │Notification │ │Modal        │ │Utility    │ │
    │  │Components   │ │Components   │ │Components   │ │Components │ │
    │  │             │ │             │ │             │ │           │ │
    │  │ • EmptyState│ │ • Toast     │ │ • Dialogs   │ │ • Loading │ │
    │  │ • Loading   │ │ • Center    │ │ • Forms     │ │ • Error   │ │
    │  │ • Buttons   │ │ • Settings  │ │ • Overlays  │ │ • Helpers │ │
    │  │ • Forms     │ │ • History   │ │ • Drawers   │ │ • Guards  │ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                📦 STATE MANAGEMENT 📦                          │
    ├─────────────────────────────────────────────────────────────────┤
    │                      MobX Stores                               │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │                   RootStore                             │   │
    │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
    │  │  │StockStore   │ │PortfolioStore│ │TradeStore   │       │   │
    │  │  │             │ │             │ │             │       │   │
    │  │  │ • Stocks    │ │ • Portfolios│ │ • Orders    │       │   │
    │  │  │ • Prices    │ │ • Positions │ │ • Trades    │       │   │
    │  │  │ • History   │ │ • Analytics │ │ • History   │       │   │
    │  │  │ • Signals   │ │ • Performance│ │ • Status    │       │   │
    │  │  └─────────────┘ └─────────────┘ └─────────────┘       │   │
    │  │                                                         │   │
    │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │   │
    │  │  │WebSocketStore│ │ApiStore     │ │UserStore    │       │   │
    │  │  │             │ │             │ │             │       │   │
    │  │  │ • Connection│ │ • Requests  │ │ • Settings  │       │   │
    │  │  │ • Events    │ │ • Cache     │ │ • Preferences│      │   │
    │  │  │ • Listeners │ │ • Loading   │ │ • Session   │       │   │
    │  │  │ • Retry     │ │ • Errors    │ │ • Auth      │       │   │
    │  │  └─────────────┘ └─────────────┘ └─────────────┘       │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │              🌐 COMMUNICATION LAYER 🌐                         │
    ├─────────────────────────────────────────────────────────────────┤
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
    │  │HTTP Client  │ │WebSocket    │ │Services     │ │Context    │ │
    │  │(Axios)      │ │Connection   │ │Layer        │ │Providers  │ │
    │  │             │ │             │ │             │ │           │ │
    │  │ • API Calls │ │ • Real-time │ │ • Stock API │ │ • Socket  │ │
    │  │ • Auth      │ │ • Events    │ │ • Portfolio │ │ • Notify  │ │
    │  │ • Error     │ │ • Reconnect │ │ • Trading   │ │ • Theme   │ │
    │  │ • Retry     │ │ • Fallback  │ │ • Analytics │ │ • Error   │ │
    │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
    └─────────────────────────────────────────────────────────────────┘
```

### 🗂️ Frontend Component Structure

#### 📊 Core Dashboard Components

1. **Dashboard.tsx** - Main application interface
   - Portfolio selector and navigation
   - Tab management (Stocks, Portfolio, Trading)
   - Real-time data display
   - Responsive layout management

2. **Portfolio Components**
   - `Portfolio.tsx` - Main portfolio view
   - `PortfolioChart.tsx` - Performance visualization
   - `PortfolioSummary.tsx` - Key metrics display
   - `PortfolioCreator.tsx` - New portfolio creation

3. **Stock Components**
   - `StockCard.tsx` - Individual stock display
   - `StockModal.tsx` - Detailed stock analysis
   - `PriceChart.tsx` - Price visualization
   - `SentimentDisplay.tsx` - News sentiment

#### 🎛️ Trading Interface Components

4. **Trading Components**
   - `QuickTrade.tsx` - Fast trade execution
   - `CreateOrderForm.tsx` - Detailed order entry
   - `OrderManagement.tsx` - Order tracking
   - `RiskManagement.tsx` - Risk calculation display

5. **Analysis Components**
   - `RecommendationPanel.tsx` - AI recommendations
   - `BreakoutDisplay.tsx` - Technical analysis
   - `DayTradingPatterns.tsx` - Pattern recognition

#### 🔔 System Components

6. **Notification System**
   - `NotificationCenter.tsx` - Notification hub
   - `NotificationToast.tsx` - Real-time alerts
   - `NotificationSettings.tsx` - User preferences

7. **Utility Components**
   - `ErrorBoundary.tsx` - Error handling
   - `EmptyState.tsx` - No data displays
   - `Loading.tsx` - Loading states

### 📦 MobX State Management

```typescript
// RootStore Structure
class RootStore {
  apiStore: ApiStore           // API communication
  webSocketStore: WebSocketStore // Real-time updates
  stockStore: StockStore       // Stock data and prices
  portfolioStore: PortfolioStore // Portfolio management
  tradeStore: TradeStore       // Trading operations
  recommendationStore: RecommendationStore // AI recommendations
  userStore: UserStore         // User preferences
}

// State Flow Example
stockStore.updatePrice(symbol, price)
  ↓
portfolioStore.updatePositionPrice(symbol, price)
  ↓
Dashboard re-renders with new values
```

---

## 🔄 Data Flow Diagrams

### 📈 Real-Time Stock Data Flow

```
    🕐 Every 2 Minutes (Cron Job)
           │
           ▼
    📡 Yahoo Finance API
           │ (Fetch latest prices)
           ▼
    🔧 Backend Processing
           │ (Calculate indicators)
           ▼
    🗃️ Database Update
           │ (Store new data)
           ▼
    🌐 WebSocket Broadcast
           │ (Send to all clients)
           ▼
    📦 Frontend Store Update
           │ (Update MobX stores)
           ▼
    🎨 Component Re-render
           │ (Update UI)
           ▼
    📱 User Sees Live Data
```

### 💼 Portfolio Management Flow

```
    👤 User Action
           │
           ▼
    🎯 Frontend Component
           │ (Buy/Sell request)
           ▼
    📡 HTTP Request
           │ (API call)
           ▼
    🔧 Backend Validation
           │ (Risk checks)
           ▼
    💹 Trade Execution
           │ (Update positions)
           ▼
    🗃️ Database Update
           │ (Store trade)
           ▼
    🌐 WebSocket Notification
           │ (Confirm trade)
           ▼
    📦 Portfolio Refresh
           │ (Update stores)
           ▼
    📊 UI Update
```

### 🤖 AI Recommendation Flow

```
    📊 Market Data + Portfolio
           │
           ▼
    🧠 ML Feature Engineering
           │ (Technical indicators)
           ▼
    🤖 Model Inference
           │ (Generate signals)
           ▼
    📈 Risk Assessment
           │ (Position sizing)
           ▼
    🎯 Recommendation Generation
           │ (Buy/Sell/Hold)
           ▼
    🔔 User Notification
           │ (Alert + explanation)
           ▼
    📱 Display in UI
```

---

## 🔌 API Documentation

### 📋 REST API Endpoints

#### Stock Endpoints
```
GET    /stocks                    // Get all stocks
GET    /stocks/:symbol           // Get specific stock
GET    /stocks/:symbol/history   // Get price history
GET    /stocks/with-signals/all  // Get stocks with AI signals
POST   /stocks/search           // Search stocks
```

#### Portfolio Endpoints
```
GET    /paper-trading/portfolios              // Get user portfolios
POST   /paper-trading/portfolios              // Create portfolio
GET    /paper-trading/portfolios/:id         // Get portfolio details
GET    /paper-trading/portfolios/:id/performance // Get performance metrics
POST   /paper-trading/portfolios/:id/trades  // Execute trade
GET    /paper-trading/portfolios/:id/positions // Get positions
```

#### Trading Endpoints
```
POST   /trading/signals         // Get trading recommendations
POST   /trading/analyze         // Analyze stock for patterns
GET    /trading/strategies      // Get available strategies
POST   /trading/backtest        // Backtest strategy
```

#### Order Management
```
POST   /orders                  // Create order
GET    /orders                  // Get user orders
PUT    /orders/:id             // Modify order
DELETE /orders/:id             // Cancel order
GET    /orders/:id/status      // Get order status
```

### 🌐 WebSocket Events

#### Incoming Events (Server → Client)
```typescript
stock_updates: Stock[]          // Bulk stock price updates
stock_update: {symbol, data}    // Individual stock update
portfolio_update: Portfolio     // Portfolio value changes
trading_signal: TradingSignal  // New AI recommendation
news_update: News              // Latest news article
order_executed: Order          // Order fill confirmation
```

#### Outgoing Events (Client → Server)
```typescript
subscribe_stocks: string[]      // Subscribe to stock updates
subscribe_portfolio: number     // Subscribe to portfolio updates
unsubscribe_stocks: string[]    // Unsubscribe from stocks
heartbeat: {}                  // Keep connection alive
```

---

## 🗃️ Database Schema

### 📊 Core Tables

```sql
-- Stocks Table
CREATE TABLE stocks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  symbol VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  currentPrice DECIMAL(10,2),
  previousClose DECIMAL(10,2),
  changePercent DECIMAL(5,2),
  volume BIGINT,
  marketCap BIGINT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolios Table
CREATE TABLE portfolios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  portfolioType ENUM('DAY_TRADING_PRO', 'DAY_TRADING_STANDARD', 'SMALL_ACCOUNT_BASIC', 'MICRO_ACCOUNT_STARTER'),
  initialCash DECIMAL(15,2) NOT NULL,
  currentCash DECIMAL(15,2) NOT NULL,
  totalValue DECIMAL(15,2) NOT NULL,
  totalPnL DECIMAL(15,2) DEFAULT 0,
  totalReturn DECIMAL(10,4) DEFAULT 0,
  dayTradingEnabled BOOLEAN DEFAULT FALSE,
  dayTradeCount INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Positions Table
CREATE TABLE positions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  portfolioId INT NOT NULL,
  stockId INT NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  quantity INT NOT NULL,
  averagePrice DECIMAL(10,2) NOT NULL,
  totalCost DECIMAL(15,2) NOT NULL,
  currentValue DECIMAL(15,2) NOT NULL,
  unrealizedPnL DECIMAL(15,2) NOT NULL,
  unrealizedReturn DECIMAL(10,4) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolioId) REFERENCES portfolios(id),
  FOREIGN KEY (stockId) REFERENCES stocks(id)
);

-- Trades Table
CREATE TABLE trades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  portfolioId INT NOT NULL,
  stockId INT NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  type ENUM('buy', 'sell') NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  totalValue DECIMAL(15,2) NOT NULL,
  commission DECIMAL(8,2) DEFAULT 0,
  status ENUM('pending', 'executed', 'cancelled', 'failed') DEFAULT 'pending',
  executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (portfolioId) REFERENCES portfolios(id),
  FOREIGN KEY (stockId) REFERENCES stocks(id)
);
```

### 🤖 ML Tables

```sql
-- ML Models Table
CREATE TABLE ml_models (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  type ENUM('neural_network', 'random_forest', 'svm', 'ensemble') NOT NULL,
  version VARCHAR(50) NOT NULL,
  status ENUM('training', 'active', 'deprecated') DEFAULT 'training',
  accuracy DECIMAL(5,4),
  parameters JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ML Predictions Table
CREATE TABLE ml_predictions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  modelId INT NOT NULL,
  stockId INT NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  prediction DECIMAL(5,4) NOT NULL,
  confidence DECIMAL(5,4) NOT NULL,
  features JSON,
  actualOutcome DECIMAL(5,4),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (modelId) REFERENCES ml_models(id),
  FOREIGN KEY (stockId) REFERENCES stocks(id)
);
```

---

## 🌐 WebSocket Architecture

### 🔗 Connection Management

```typescript
// WebSocket Gateway (Backend)
@WebSocketGateway({
  cors: { origin: 'http://localhost:3000' },
  transports: ['websocket']
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  // Client connection handling
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.join('stocks'); // Auto-join stock updates room
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Portfolio subscription
  @SubscribeMessage('subscribe_portfolio')
  handlePortfolioSubscription(client: Socket, portfolioId: number) {
    client.join(`portfolio_${portfolioId}`);
  }
}
```

### 📡 Real-Time Broadcasting

```typescript
// Stock price broadcasting (Backend Service)
async broadcastStockUpdates(stocks: Stock[]) {
  this.gateway.server.to('stocks').emit('stock_updates', stocks);
}

// Portfolio update broadcasting
async broadcastPortfolioUpdate(portfolioId: number, update: PortfolioUpdate) {
  this.gateway.server.to(`portfolio_${portfolioId}`).emit('portfolio_update', update);
}
```

### 🔄 Frontend WebSocket Integration

```typescript
// WebSocket Store (Frontend)
class WebSocketStore {
  private socket: io.Socket;
  private listeners = new Map<string, Function[]>();

  connect() {
    this.socket = io('http://localhost:8000');
    
    // Set up event listeners
    this.socket.on('stock_updates', (stocks) => {
      this.emit('stock_updates', stocks);
    });

    this.socket.on('portfolio_update', (update) => {
      this.emit('portfolio_update', update);
    });
  }

  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}
```

---

## 🚀 Deployment Architecture

### 🏗️ Production Deployment Diagram

```
                    🌐 Production Environment
    ┌─────────────────────────────────────────────────────────────────┐
    │                      Load Balancer                             │
    │                   (nginx/AWS ALB)                              │
    └─────────────────────┬───────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌─────────┐      ┌─────────┐      ┌─────────┐
    │Frontend │      │Backend  │      │Backend  │
    │(React)  │      │Instance │      │Instance │
    │Port 3000│      │Port 8000│      │Port 8000│
    └─────────┘      └─────────┘      └─────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                    🗃️ Database Cluster                         │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
    │  │MySQL Master │ │MySQL Slave  │ │Redis Cache  │              │
    │  │(Write)      │ │(Read)       │ │(Sessions)   │              │
    │  └─────────────┘ └─────────────┘ └─────────────┘              │
    └─────────────────────────────────────────────────────────────────┘
                          │
    ┌─────────────────────▼───────────────────────────────────────────┐
    │                🌐 External Services                            │
    │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │
    │  │Yahoo Finance│ │News APIs    │ │ML Services  │              │
    │  │API          │ │             │ │(Cloud)      │              │
    │  └─────────────┘ └─────────────┘ └─────────────┘              │
    └─────────────────────────────────────────────────────────────────┘
```

### 🔧 Environment Configuration

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://backend:8000
      - REACT_APP_WS_URL=ws://backend:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_HOST=mysql
      - DATABASE_PORT=3306
      - REDIS_HOST=redis
      - YAHOO_FINANCE_API_KEY=${YAHOO_API_KEY}
      - NEWS_API_KEY=${NEWS_API_KEY}
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=stock_trading
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mysql_data:
```

### 📊 Performance Monitoring

- **Application Metrics**: Response times, error rates, throughput
- **Database Metrics**: Query performance, connection pool usage
- **WebSocket Metrics**: Connection count, message latency
- **External API Metrics**: Rate limits, response times, error rates
- **Business Metrics**: Trading volume, user engagement, system reliability

---

## 🎯 Key Architectural Decisions

### ✅ Technology Choices

1. **TypeScript Everywhere**: Type safety across frontend and backend
2. **NestJS Backend**: Scalable, modular architecture with decorators
3. **React + MobX**: Reactive UI with observable state management
4. **WebSocket Integration**: Real-time data without polling
5. **MySQL Database**: ACID compliance for financial data
6. **Modular Design**: Clear separation of concerns

### 🚀 Performance Optimizations

1. **Caching Strategy**: Redis for session data, API response caching
2. **Database Optimization**: Indexed queries, connection pooling
3. **WebSocket Efficiency**: Room-based broadcasting, connection management
4. **Frontend Optimization**: Code splitting, lazy loading, memoization
5. **API Rate Limiting**: Respect external API limits, implement backoff

### 🔒 Security Measures

1. **Input Validation**: DTOs with class-validator decorators
2. **CORS Configuration**: Strict origin controls
3. **Environment Variables**: Sensitive data in environment files
4. **Error Handling**: Sanitized error responses
5. **Rate Limiting**: Prevent API abuse

---

*This documentation provides a comprehensive overview of the Stock Trading App architecture. For specific implementation details, refer to the individual module documentation and code comments.*
