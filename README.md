# AI Stock Trader

A comprehensive stock trading application with real-time data, sentiment analysis, and AI-powered trading signals.

## 🚀 Features

- **Real-time Stock Data**: Live stock prices from Yahoo Finance API
- **WebSocket Integration**: Real-time price updates via Socket.IO
- **AI Trading Signals**: Machine learning-powered BUY/SELL/HOLD recommendations
- **Sentiment Analysis**: News sentiment analysis for trading decisions
- **Technical Analysis**: RSI, moving averages, and breakout detection
- **Modern UI**: Beautiful, responsive React dashboard
- **API Documentation**: Swagger/OpenAPI documentation

## 🏗️ Architecture

### Backend (NestJS)

- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Real-time**: WebSocket support via Socket.IO
- **APIs**: Yahoo Finance integration
- **Documentation**: Swagger UI

### Frontend (React)

- **Framework**: React with TypeScript
- **State Management**: React Context + Socket.IO
- **UI**: Modern CSS with gradient designs
- **Charts**: Recharts for data visualization

### Analysis Engine

- **Language**: Python
- **Libraries**: scikit-learn, pandas, numpy
- **Features**: Technical analysis and sentiment scoring

## 📦 Installation

### Prerequisites

- Node.js (v16 or higher)
- MySQL Server
- Python 3.8+
- Git

### Frontend Setup

```bash
cd frontend
npm install
```

### Database Setup

1. Create MySQL database:

```sql
CREATE DATABASE stock_trading_db;
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON stock_trading_db.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
```

## 🚀 Running the Application

### Start Backend

```bash
cd backend
npm run start:dev
```

### Start Frontend

```bash
cd frontend
npm start
```

The application will be available at:

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api

## 📊 Monitored Stocks

The application tracks these 10 stocks:

- **AAPL** - Apple Inc.
- **GOOGL** - Alphabet Inc.
- **MSFT** - Microsoft Corporation
- **AMZN** - Amazon.com Inc.
- **TSLA** - Tesla Inc.
- **NVDA** - NVIDIA Corporation
- **META** - Meta Platforms Inc.
- **JPM** - JPMorgan Chase & Co.
- **JNJ** - Johnson & Johnson

## 🔌 API Endpoints

### Stocks

- `GET /stocks` - Get all stocks
- `GET /stocks/:symbol` - Get specific stock
- `GET /stocks/:symbol/history` - Get price history
- `PUT /stocks/:symbol/update` - Update stock price

### Trading Signals

- `GET /trading/signals` - Get active trading signals
- `GET /trading/signals/:symbol` - Get signals for specific stock
- `POST /trading/analyze/:symbol` - Generate new signal
- `POST /trading/analyze-all` - Analyze all stocks
- `GET /trading/breakout/:symbol` - Check breakout patterns

### News & Sentiment

- `GET /news/:symbol` - Get news for stock
- `GET /news/:symbol/sentiment` - Get sentiment analysis
- `POST /news/:symbol/fetch` - Fetch and analyze new news

## 🧠 Trading Algorithm

The AI trading system uses multiple indicators:

1. **Technical Analysis**

   - Simple Moving Averages (10, 20 day)
   - Relative Strength Index (RSI)
   - Volume analysis
   - Price breakout detection

2. **Sentiment Analysis**

   - News headline analysis
   - Social media sentiment (future)
   - Market sentiment indicators

3. **Risk Management**
   - Confidence scoring
   - Position sizing recommendations
   - Stop-loss suggestions

## ⚠️ NO MOCK DATA Policy

**CRITICAL**: This application follows a strict **NO MOCK DATA** policy to ensure trading signal integrity:

### What This Means

- All trading recommendations are based on **real market data** from Yahoo Finance API
- **No fake or simulated data** is used in any trading analysis
- When real data is unavailable, the system returns **conservative HOLD recommendations** with low confidence
- The UI shows proper "No data available" states instead of misleading signals

### Impact on Trading Signals

- **Before**: Biased toward BUY signals due to mock data optimism
- **After**: Conservative HOLD approach when no real data is available
- **Result**: More reliable and trustworthy trading recommendations

### For Developers

- Never use `createMockMarketData()` or similar functions
- All ML services must handle real data gracefully
- Default to conservative recommendations when data is unavailable
- See [NO MOCK DATA Policy Documentation](docs/NO-MOCK-DATA-POLICY.md) for full details

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=admin
DATABASE_PASSWORD=password
DATABASE_NAME=stock_trading_db
PORT=3000
```

#### Frontend

- API endpoints are configured to point to `http://localhost:3000`
- WebSocket connection to backend

## 📈 Real-time Features

- **Live Price Updates**: Stocks update every 30 seconds
- **WebSocket Notifications**: Instant trading signal alerts
- **Real-time Dashboard**: Live price changes and trends
- **Signal Broadcasting**: New trading signals pushed to all clients

## 🛠️ Development

### Code Structure

```
├── backend/
│   ├── src/
│   │   ├── entities/          # Database entities
│   │   ├── modules/           # Feature modules
│   │   │   ├── stock/         # Stock management
│   │   │   ├── trading/       # Trading signals
│   │   │   ├── news/          # News & sentiment
│   │   │   └── websocket/     # Real-time updates
│   │   ├── services/          # Business logic
│   │   └── data/              # Static data files
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # React context
│   │   ├── types/             # TypeScript types
│   │   └── App.tsx
│   └── package.json
└── README.md
```

### Adding New Features

1. **New Stock**: Add to `stock-list.json`
2. **New Indicator**: Extend `TradingService`
3. **New Analysis**: Add Python scripts
4. **New UI Component**: Create in `components/`

## 📊 Database Schema

### Tables

- `stocks` - Stock information
- `stock_prices` - Historical price data
- `news` - News articles with sentiment
- `trading_signals` - AI-generated signals

## 🔐 Security

- Environment variable configuration
- Input validation with class-validator
- CORS protection
- Rate limiting (future)

## 🚀 Deployment

### Docker (Future)

```bash
docker-compose up
```

### Manual Deployment

1. Build frontend: `npm run build`
2. Start backend: `npm run start:prod`
3. Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email your-email@example.com or create an issue on GitHub.

---

Built with ❤️ using NestJS, React, and Python
