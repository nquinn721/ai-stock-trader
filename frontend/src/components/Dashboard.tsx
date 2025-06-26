import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowDown,
  faArrowTrendDown,
  faArrowTrendUp,
  faArrowUp,
  faChartLine,
  faCircle,
  faClock,
  faComments,
  faDollarSign,
  faExchangeAlt,
  faEye,
  faRobot,
  faSignal,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import {
  usePortfolioStore,
  useStockStore,
  useWebSocketStore,
} from "../stores/StoreContext";
import { Portfolio } from "../types";
import TradingAssistantChat from "./ai/TradingAssistantChat";
import AutoTradingDashboard from "./automated-trading/AutoTradingDashboard";
import AutonomousAgentDashboard from "./autonomous-trading/AutonomousAgentDashboard";
import "./Dashboard.css";
import EmptyState from "./EmptyState";
import EnhancedPortfolioAnalyticsDashboard from "./EnhancedPortfolioAnalyticsDashboard";
import { MarketScannerDashboard } from "./MarketScanner/MarketScannerDashboard";
import NotificationCenter from "./NotificationCenter";
import PortfolioCreator from "./PortfolioCreator";
import PortfolioDetailsModal from "./PortfolioDetailsModal";
import PortfolioSelector from "./PortfolioSelector";
import QuickTrade from "./QuickTrade";
import StockCard from "./StockCard";

// Add icons to library
library.add(
  faArrowTrendUp,
  faArrowTrendDown,
  faChartLine,
  faDollarSign,
  faExchangeAlt,
  faVolumeHigh,
  faEye,
  faSignal,
  faClock,
  faArrowUp,
  faArrowDown,
  faCircle,
  faRobot,
  faComments
);

const Dashboard: React.FC = observer(() => {
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();
  const webSocketStore = useWebSocketStore();

  const [showPortfolioCreator, setShowPortfolioCreator] = useState(false);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [portfolioForDetails, setPortfolioForDetails] =
    useState<Portfolio | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAutoTrading, setShowAutoTrading] = useState(false);
  const [showAutonomousAgents, setShowAutonomousAgents] = useState(false);
  const [showPortfolioAnalytics, setShowPortfolioAnalytics] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMarketScanner, setShowMarketScanner] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    stockStore.fetchStocksWithSignals();
    // Initialize with the first available portfolio or create default
    portfolioStore.initializeDefaultPortfolio();
  }, [stockStore, portfolioStore]);

  // Update stocks when socket data changes
  useEffect(() => {
    if ((stockStore?.stocks?.length || 0) === 0 && !stockStore?.isLoading) {
      stockStore?.fetchStocksWithSignals();
    }
  }, [stockStore?.stocks?.length, stockStore?.isLoading, stockStore]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Calculate market analytics
  const marketAnalytics = React.useMemo(() => {
    const stocksWithSignals = stockStore.stocksWithSignals;

    if (stocksWithSignals.length === 0) {
      return {
        totalStocks: 0,
        gainers: 0,
        losers: 0,
        avgChange: 0,
        totalVolume: 0,
        totalMarketCap: 0,
        buySignals: 0,
        sellSignals: 0,
        holdSignals: 0,
        topGainer: null,
        topLoser: null,
      };
    }

    const gainers = stocksWithSignals.filter((s) => s.changePercent > 0);
    const losers = stocksWithSignals.filter((s) => s.changePercent < 0);
    const avgChange =
      stocksWithSignals.reduce((sum, s) => sum + s.changePercent, 0) /
      stocksWithSignals.length;
    const totalVolume = stocksWithSignals.reduce(
      (sum, s) => sum + (s.volume || 0),
      0
    );
    const totalMarketCap = stocksWithSignals.reduce(
      (sum, s) => sum + (s.marketCap || 0),
      0
    );

    const signals = stocksWithSignals.reduce(
      (acc, s) => {
        if (s.tradingSignal) {
          acc[s.tradingSignal.signal]++;
        }
        return acc;
      },
      { buy: 0, sell: 0, hold: 0 }
    );

    const topGainer = [...stocksWithSignals].sort(
      (a, b) => b.changePercent - a.changePercent
    )[0];
    const topLoser = [...stocksWithSignals].sort(
      (a, b) => a.changePercent - b.changePercent
    )[0];

    return {
      totalStocks: stocksWithSignals.length,
      gainers: gainers.length,
      losers: losers.length,
      avgChange,
      totalVolume,
      totalMarketCap,
      buySignals: signals.buy,
      sellSignals: signals.sell,
      holdSignals: signals.hold,
      topGainer,
      topLoser,
    };
  }, [stockStore.stocksWithSignals]);

  // Get top performing stock for main chart display
  const topStock =
    stockStore.stocksWithSignals.find(
      (s) => s.changePercent && s.changePercent > 0
    ) || stockStore.stocksWithSignals[0];

  const handlePortfolioCreated = (portfolio: any) => {
    console.log("Portfolio created:", portfolio);
    setShowPortfolioCreator(false);
    // Refresh portfolio data
    portfolioStore.initializeDefaultPortfolio();
  };

  const handleCancelPortfolioCreation = () => {
    setShowPortfolioCreator(false);
  };

  const handleCreatePortfolio = () => {
    setShowPortfolioCreator(true);
  };

  const handleViewPortfolioDetails = (portfolio: Portfolio) => {
    setPortfolioForDetails(portfolio);
    setShowPortfolioDetails(true);
  };

  const handleClosePortfolioDetails = () => {
    setShowPortfolioDetails(false);
    setPortfolioForDetails(null);
  };

  // AI Assistant handlers
  const handleStockSelect = (symbol: string) => {
    // TODO: Navigate to stock details or highlight in grid
    console.log("Stock selected:", symbol);
  };

  const handleOrderAction = (action: "BUY" | "SELL", symbol?: string) => {
    // TODO: Open quick trade modal with pre-filled action
    console.log("Order action:", action, symbol);
  };

  const handleViewAnalysis = (type: string) => {
    switch (type) {
      case "portfolio":
        setShowPortfolioAnalytics(true);
        break;
      case "dashboard":
        setShowAIAssistant(false);
        break;
      default:
        console.log("View analysis:", type);
    }
  };

  const isConnected = webSocketStore.isConnected;
  const stocksWithSignals = stockStore.stocksWithSignals;
  const loading = stockStore.isLoading;

  if (loading) {
    return (
      <div className="dashboard">
        {" "}
        <EmptyState
          type="loading"
          icon={<FontAwesomeIcon icon="clock" />}
          title="Loading Stock Data"
          description="Fetching real-time market data and trading signals..."
          size="large"
        />
      </div>
    );
  }

  if (showMarketScanner) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Market Scanner</h1>
            <button
              className="back-button"
              onClick={() => setShowMarketScanner(false)}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>
        <MarketScannerDashboard onStockSelect={handleStockSelect} />
      </div>
    );
  }

  if (showAutoTrading) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Automated Trading</h1>
            <button
              className="back-button"
              onClick={() => setShowAutoTrading(false)}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>
        <AutoTradingDashboard portfolios={portfolioStore.portfolios} />
      </div>
    );
  }

  if (showAutonomousAgents) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Autonomous Trading Agents</h1>
            <button
              className="back-button"
              onClick={() => setShowAutonomousAgents(false)}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>
        <AutonomousAgentDashboard />
      </div>
    );
  }

  if (showPortfolioAnalytics) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Portfolio Analytics</h1>
            <button
              className="back-button"
              onClick={() => setShowPortfolioAnalytics(false)}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>
        {portfolioStore.currentPortfolio ? (
          <EnhancedPortfolioAnalyticsDashboard
            portfolioId={portfolioStore.currentPortfolio.id}
          />
        ) : (
          <div style={{ padding: "20px", textAlign: "center" }}>
            <p>Please select a portfolio to view analytics.</p>
            <button onClick={() => setShowPortfolioAnalytics(false)}>
              Go Back to Select Portfolio
            </button>
          </div>
        )}
      </div>
    );
  }

  if (showAIAssistant) {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <div className="header-left">
            <h1>AI Trading Assistant</h1>
            <button
              className="back-button"
              onClick={() => setShowAIAssistant(false)}
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>
        <div style={{ padding: "20px", height: "calc(100vh - 120px)" }}>
          <TradingAssistantChat />
        </div>
      </div>
    );
  }

  if (showPortfolioCreator) {
    return (
      <PortfolioCreator
        onPortfolioCreated={handlePortfolioCreated}
        onCancel={handleCancelPortfolioCreation}
      />
    );
  }
  return (
    <div className="dashboard">
      {" "}
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Trading Dashboard</h1>
          <div className="market-time">
            <FontAwesomeIcon icon={faClock} />
            <span>{currentTime.toLocaleTimeString()}</span>
            <span className="date">{currentTime.toLocaleDateString()}</span>
          </div>
        </div>
        <div className="header-info">
          <button
            className="auto-trading-btn"
            onClick={() => setShowAutoTrading(true)}
            title="Open Automated Trading"
          >
            <FontAwesomeIcon icon={faRobot} />
            Auto Trading
          </button>
          <button
            className="autonomous-agents-btn"
            onClick={() => setShowAutonomousAgents(true)}
            title="Autonomous Trading Agents"
          >
            <FontAwesomeIcon icon={faRobot} />
            Agents
          </button>
          <button
            className="analytics-btn"
            onClick={() => setShowPortfolioAnalytics(true)}
            title="View Portfolio Analytics"
          >
            <FontAwesomeIcon icon={faChartLine} />
            Analytics
          </button>
          <button
            className="scanner-btn"
            onClick={() => setShowMarketScanner(true)}
            title="Open Market Scanner"
          >
            <FontAwesomeIcon icon={faSignal} />
            Scanner
          </button>
          <button
            className="ai-assistant-btn"
            onClick={() => setShowAIAssistant(true)}
            title="Open AI Trading Assistant"
          >
            <FontAwesomeIcon icon={faComments} />
            AI Assistant
          </button>
          <div className="stats">
            <span>{stocksWithSignals.length} stocks</span>
          </div>
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <FontAwesomeIcon icon="circle" />
            {isConnected ? "Live" : "Offline"}
          </div>
          <NotificationCenter />
        </div>
      </header>
      {/* Market Overview Cards */}
      <div className="market-overview">
        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{marketAnalytics.totalStocks}</div>
            <div className="metric-label">Total Stocks</div>
          </div>
        </div>

        <div className="metric-card positive">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faArrowTrendUp} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{marketAnalytics.gainers}</div>
            <div className="metric-label">Gainers</div>
          </div>
        </div>

        <div className="metric-card negative">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faArrowTrendDown} />
          </div>
          <div className="metric-content">
            <div className="metric-value">{marketAnalytics.losers}</div>
            <div className="metric-label">Losers</div>
          </div>
        </div>

        <div
          className={`metric-card ${
            marketAnalytics.avgChange >= 0 ? "positive" : "negative"
          }`}
        >
          <div className="metric-icon">
            <FontAwesomeIcon
              icon={marketAnalytics.avgChange >= 0 ? faArrowUp : faArrowDown}
            />
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {marketAnalytics.avgChange.toFixed(2)}%
            </div>
            <div className="metric-label">Avg Change</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faVolumeHigh} />
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {(marketAnalytics.totalVolume / 1000000).toFixed(1)}M
            </div>
            <div className="metric-label">Total Volume</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faDollarSign} />
          </div>
          <div className="metric-content">
            <div className="metric-value">
              ${(marketAnalytics.totalMarketCap / 1000000000).toFixed(1)}B
            </div>
            <div className="metric-label">Market Cap</div>
          </div>
        </div>
      </div>
      {/* Trading Signals Summary */}
      <div className="signals-overview">
        <h3>
          <FontAwesomeIcon icon={faSignal} /> Trading Signals
        </h3>
        <div className="signals-grid">
          <div className="signal-card buy">
            <div className="signal-count">{marketAnalytics.buySignals}</div>
            <div className="signal-label">Buy Signals</div>
          </div>
          <div className="signal-card sell">
            <div className="signal-count">{marketAnalytics.sellSignals}</div>
            <div className="signal-label">Sell Signals</div>
          </div>
          <div className="signal-card hold">
            <div className="signal-count">{marketAnalytics.holdSignals}</div>
            <div className="signal-label">Hold Signals</div>
          </div>
        </div>
      </div>
      {/* Top Movers */}
      {(marketAnalytics.topGainer || marketAnalytics.topLoser) && (
        <div className="top-movers">
          <h3>
            <FontAwesomeIcon icon={faEye} /> Top Movers
          </h3>
          <div className="movers-grid">
            {marketAnalytics.topGainer && (
              <div className="mover-card positive">
                <div className="mover-header">
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                  <span>Top Gainer</span>
                </div>
                <div className="mover-symbol">
                  {marketAnalytics.topGainer.symbol}
                </div>
                <div className="mover-change">
                  +{marketAnalytics.topGainer.changePercent.toFixed(2)}%
                </div>
                <div className="mover-price">
                  ${marketAnalytics.topGainer.currentPrice.toFixed(2)}
                </div>
              </div>
            )}
            {marketAnalytics.topLoser && (
              <div className="mover-card negative">
                <div className="mover-header">
                  <FontAwesomeIcon icon={faArrowTrendDown} />
                  <span>Top Loser</span>
                </div>
                <div className="mover-symbol">
                  {marketAnalytics.topLoser.symbol}
                </div>
                <div className="mover-change">
                  {marketAnalytics.topLoser.changePercent.toFixed(2)}%
                </div>
                <div className="mover-price">
                  ${marketAnalytics.topLoser.currentPrice.toFixed(2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Paper Trading Section */}
      <div className="paper-trading-section">
        <h3>
          <FontAwesomeIcon icon={faExchangeAlt} /> Paper Trading
        </h3>
        <div className="trading-row">
          {/* Portfolio Selector */}
          <div className="portfolios-container">
            <PortfolioSelector
              onCreatePortfolio={handleCreatePortfolio}
              onViewDetails={handleViewPortfolioDetails}
            />
          </div>

          {/* Quick Trade */}
          <div className="quick-trade-container">
            <QuickTrade />
          </div>
        </div>
      </div>
      {/* Stocks Grid */}
      <div className="stocks-section">
        <h3>
          <FontAwesomeIcon icon={faChartLine} /> Live Stocks
        </h3>
        <div className="stocks-grid">
          {stocksWithSignals.map((stockWithSignal) => (
            <div key={stockWithSignal.id} className="stock-container">
              <StockCard
                stock={stockWithSignal}
                signal={stockWithSignal.tradingSignal || undefined}
              />
            </div>
          ))}
        </div>
      </div>
      {stocksWithSignals.length === 0 && !loading && (
        <EmptyState
          type="no-data"
          icon={<FontAwesomeIcon icon="chart-line" />}
          title={isConnected ? "Waiting for Stock Data" : "No Connection"}
          description={
            isConnected
              ? "Connected to server. Waiting for live stock data to be broadcasted..."
              : "Please check your connection to the trading server."
          }
          size="large"
        />
      )}
      {/* Portfolio Details Modal */}
      {showPortfolioDetails && portfolioForDetails && (
        <PortfolioDetailsModal
          portfolio={portfolioForDetails}
          isOpen={showPortfolioDetails}
          onClose={handleClosePortfolioDetails}
        />
      )}
    </div>
  );
});

export default Dashboard;
