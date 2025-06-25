# 🔧 Backend Flow Diagram

## 🏗️ NestJS Backend Architecture

The backend is built with NestJS, providing a scalable, modular architecture with TypeScript, decorators, and dependency injection.

### 🔺 Backend Structure Diagram

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

## 📂 Backend Module Breakdown

### 🏛️ Core Application Modules

#### 1. **StockModule** (`/modules/stock/`)

```
stock/
├── stock.controller.ts       // REST endpoints for stock data
├── stock.service.ts          // Yahoo Finance integration
├── stock.entity.ts           // Stock data model
├── stock.repository.ts       // Database operations
└── dto/
    ├── stock.dto.ts          // Data transfer objects
    └── stock-query.dto.ts    // Query parameters
```

**Key Features:**

- Real-time price updates from Yahoo Finance API
- Historical data retrieval and storage
- Technical indicator calculations
- Stock search and filtering

#### 2. **PaperTradingModule** (`/modules/paper-trading/`)

```
paper-trading/
├── portfolio.controller.ts   // Portfolio management endpoints
├── portfolio.service.ts      // Portfolio business logic
├── position.service.ts       // Position tracking
├── trade.service.ts          // Trade execution
├── entities/
│   ├── portfolio.entity.ts   // Portfolio model
│   ├── position.entity.ts    // Position model
│   └── trade.entity.ts       // Trade model
└── dto/
    ├── portfolio.dto.ts      // Portfolio data transfer
    ├── trade.dto.ts          // Trade data transfer
    └── position.dto.ts       // Position data transfer
```

**Key Features:**

- Multi-portfolio management
- Real-time position tracking
- P&L calculations
- Trade execution simulation
- Performance analytics

#### 3. **TradingModule** (`/modules/trading/`)

```
trading/
├── trading.controller.ts     // Trading signal endpoints
├── signal.service.ts         // Signal generation
├── strategy.service.ts       // Trading strategies
├── risk.service.ts           // Risk management
├── entities/
│   ├── signal.entity.ts      // Trading signal model
│   └── strategy.entity.ts    // Strategy model
└── dto/
    ├── signal.dto.ts         // Signal data transfer
    └── strategy.dto.ts       // Strategy data transfer
```

**Key Features:**

- AI-powered trading signal generation
- Risk management calculations
- Strategy backtesting
- Performance monitoring

### 🔌 Integration Modules

#### 4. **WebSocketModule** (`/modules/websocket/`)

```
websocket/
├── app.gateway.ts            // WebSocket gateway
├── websocket.service.ts      // Connection management
├── room.service.ts           // Room-based broadcasting
└── dto/
    └── websocket-events.dto.ts // Event data structures
```

**Key Features:**

- Real-time client connections
- Room-based data streaming
- Auto-reconnection handling
- Event broadcasting

#### 5. **NewsModule** (`/modules/news/`)

```
news/
├── news.controller.ts        // News endpoints
├── news.service.ts           // News API integration
├── sentiment.service.ts      // Sentiment analysis
├── news.entity.ts            // News article model
└── dto/
    └── news.dto.ts           // News data transfer
```

**Key Features:**

- Financial news aggregation
- Sentiment analysis using NLP
- Stock-news association
- Real-time news updates

## 🔄 Backend Data Flow

### 📊 Stock Data Processing Flow

```
    ⏰ Cron Job Trigger (Every 2 minutes)
           │
           ▼
    📡 Yahoo Finance API Call
           │ (Fetch latest prices)
           ▼
    🔧 StockService.updateStockPrices()
           │ (Process raw data)
           ▼
    📈 Technical Indicator Calculation
           │ (RSI, MACD, Moving Averages)
           ▼
    🗃️ Database Update (TypeORM)
           │ (Store processed data)
           ▼
    🤖 ML Signal Generation
           │ (AI analysis)
           ▼
    🌐 WebSocket Broadcast
           │ (Notify connected clients)
           ▼
    📱 Frontend Update
```

### 💹 Trading Execution Flow

```
    👤 User Trade Request
           │
           ▼
    🎯 Trading Controller
           │ (Receive trade order)
           ▼
    ✅ Input Validation (DTOs)
           │ (Validate order parameters)
           ▼
    🔒 Risk Management Check
           │ (Position size, buying power)
           ▼
    💼 Portfolio Service
           │ (Update positions)
           ▼
    🗃️ Database Transaction
           │ (Atomic trade execution)
           ▼
    📊 Performance Calculation
           │ (Update P&L, returns)
           ▼
    🔔 Notification Service
           │ (Trade confirmation)
           ▼
    🌐 WebSocket Broadcast
           │ (Real-time update)
           ▼
    📱 Frontend Confirmation
```

### 🧠 ML Pipeline Flow

```
    📊 Historical Stock Data
           │
           ▼
    🔧 Feature Engineering
           │ (Technical indicators, patterns)
           ▼
    🤖 ML Model Training
           │ (Neural networks, ensemble)
           ▼
    📈 Model Evaluation
           │ (Accuracy, precision, recall)
           ▼
    🎯 Signal Generation
           │ (Buy/Sell/Hold predictions)
           ▼
    📊 Risk Assessment
           │ (Confidence scores, position sizing)
           ▼
    🔔 Recommendation Service
           │ (Generate user alerts)
           ▼
    📱 Frontend Display
```

## 🕒 Scheduled Services

### ⏰ Cron Job Architecture

```typescript
// Stock price updates - Every 2 minutes
@Cron('0 */2 * * * *')
async updateStockPrices() {
  try {
    // 1. Fetch data from Yahoo Finance API
    const stocks = await this.yahooFinanceService.getQuotes(symbols);

    // 2. Calculate technical indicators
    const processedStocks = await this.technicalAnalysisService.process(stocks);

    // 3. Update database
    await this.stockRepository.bulkUpdate(processedStocks);

    // 4. Generate ML signals
    const signals = await this.mlService.generateSignals(processedStocks);

    // 5. Broadcast updates
    this.websocketGateway.broadcastStockUpdates(processedStocks);

  } catch (error) {
    this.logger.error('Stock update failed:', error);
  }
}

// News and sentiment updates - Every 6 hours
@Cron('0 0 */6 * * *')
async updateNewsAndSentiment() {
  try {
    // 1. Fetch latest news
    const articles = await this.newsService.fetchLatestNews();

    // 2. Perform sentiment analysis
    const sentimentData = await this.sentimentService.analyzeArticles(articles);

    // 3. Associate with stocks
    const stockSentiments = await this.associateNewsWithStocks(sentimentData);

    // 4. Update sentiment scores
    await this.updateStockSentiments(stockSentiments);

  } catch (error) {
    this.logger.error('News update failed:', error);
  }
}
```

## 🔌 API Endpoint Architecture

### 📋 REST API Structure

#### Stock Endpoints

```typescript
@Controller("stocks")
export class StockController {
  @Get() // GET /stocks
  async getAllStocks() {}

  @Get("with-signals/all") // GET /stocks/with-signals/all
  async getStocksWithSignals() {}

  @Get(":symbol") // GET /stocks/:symbol
  async getStock(@Param("symbol") symbol: string) {}

  @Get(":symbol/history") // GET /stocks/:symbol/history
  async getStockHistory(@Param("symbol") symbol: string) {}

  @Post("search") // POST /stocks/search
  async searchStocks(@Body() searchDto: StockSearchDto) {}
}
```

#### Portfolio Endpoints

```typescript
@Controller("paper-trading/portfolios")
export class PortfolioController {
  @Get() // GET /paper-trading/portfolios
  async getUserPortfolios() {}

  @Post() // POST /paper-trading/portfolios
  async createPortfolio(@Body() dto: CreatePortfolioDto) {}

  @Get(":id") // GET /paper-trading/portfolios/:id
  async getPortfolio(@Param("id") id: number) {}

  @Get(":id/performance") // GET /paper-trading/portfolios/:id/performance
  async getPerformance(@Param("id") id: number) {}

  @Post(":id/trades") // POST /paper-trading/portfolios/:id/trades
  async executeTrade(@Param("id") id: number, @Body() dto: TradeDto) {}
}
```

## 🌐 WebSocket Architecture

### 🔗 Gateway Implementation

```typescript
@WebSocketGateway({
  cors: { origin: "http://localhost:3000" },
  transports: ["websocket"],
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Client connection management
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.join("stocks"); // Auto-join global stock updates
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Portfolio subscription
  @SubscribeMessage("subscribe_portfolio")
  handlePortfolioSubscription(client: Socket, portfolioId: number) {
    client.join(`portfolio_${portfolioId}`);
    return { event: "subscribed", data: portfolioId };
  }

  // Broadcasting methods
  broadcastStockUpdates(stocks: Stock[]) {
    this.server.to("stocks").emit("stock_updates", stocks);
  }

  broadcastPortfolioUpdate(portfolioId: number, update: any) {
    this.server.to(`portfolio_${portfolioId}`).emit("portfolio_update", update);
  }
}
```

## 🗃️ Database Schema Architecture

### 📊 Core Database Tables

```sql
-- Stock data with technical indicators
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
  rsi DECIMAL(5,2),                    -- Technical indicators
  macd DECIMAL(8,4),
  movingAverage20 DECIMAL(10,2),
  movingAverage50 DECIMAL(10,2),
  sentimentScore DECIMAL(5,2),         -- News sentiment
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Portfolio management
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

-- Position tracking
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
```

## 🚀 Performance Optimizations

### ⚡ Database Optimizations

- **Indexing Strategy**: Optimized indexes for frequent queries
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized complex joins and aggregations
- **Caching**: Redis for frequently accessed data

### 🔄 API Optimizations

- **Response Caching**: Cache frequently requested data
- **Pagination**: Limit large dataset responses
- **Compression**: Gzip compression for responses
- **Rate Limiting**: Prevent API abuse

### 🌐 WebSocket Optimizations

- **Room Management**: Targeted broadcasting to reduce load
- **Message Batching**: Batch multiple updates together
- **Connection Pooling**: Efficient connection management
- **Heartbeat Monitoring**: Detect and handle dead connections

---

_For complete technical implementation details, see [ARCHITECTURE-DOCUMENTATION.md](./ARCHITECTURE-DOCUMENTATION.md)_
