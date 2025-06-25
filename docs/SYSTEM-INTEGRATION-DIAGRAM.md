# 🏗️ System Integration Diagram

## 🌟 High-Level Architecture Overview

The Stock Trading App is a full-stack TypeScript application built with **NestJS** (backend) and **React** (frontend) that provides real-time stock trading capabilities with AI-powered insights.

### 🏛️ System Integration Architecture

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

## 🔄 Data Flow Architecture

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

## 🌐 Communication Architecture

### 🔌 API Integration Points

- **REST API**: Standard HTTP endpoints for CRUD operations
- **WebSocket**: Real-time bidirectional communication
- **External APIs**: Yahoo Finance, News APIs, ML services
- **Database**: MySQL for persistent data storage
- **Cache**: Redis for session and temporary data

### 📡 Port Allocation

- **Frontend (React)**: Port 3000
- **Backend (NestJS)**: Port 8000
- **Project Management Dashboard**: Port 5000
- **Database (MySQL)**: Port 3306
- **Cache (Redis)**: Port 6379

## 🏗️ Deployment Architecture

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

## 🎯 Key Integration Features

### ✅ Real-Time Capabilities

- **Live Stock Prices**: Updates every 2 minutes via cron jobs
- **WebSocket Broadcasting**: Instant updates to connected clients
- **Portfolio Sync**: Real-time portfolio value calculations
- **Trade Confirmations**: Immediate feedback on trade execution

### 🔒 Data Protection

- **API Rate Limiting**: Respect external API limits
- **Error Handling**: Graceful fallbacks for API failures
- **Connection Management**: Auto-reconnect for WebSocket
- **Data Validation**: Input sanitization and type checking

### 🚀 Performance Optimizations

- **Caching Strategy**: Redis for frequently accessed data
- **Database Indexing**: Optimized queries for financial data
- **Client-Side State**: MobX for reactive UI updates
- **Code Splitting**: Lazy loading for optimal bundle size

---

_For detailed technical specifications, see [ARCHITECTURE-DOCUMENTATION.md](./ARCHITECTURE-DOCUMENTATION.md)_
