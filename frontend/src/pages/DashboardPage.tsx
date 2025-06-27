import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowDown,
  faArrowTrendDown,
  faArrowTrendUp,
  faArrowUp,
  faChartLine,
  faCircle,
  faClock,
  faDollarSign,
  faExchangeAlt,
  faEye,
  faSignal,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import PortfolioCreator from "../components/PortfolioCreator";
import PortfolioDetailsModal from "../components/PortfolioDetailsModal";
import PortfolioSelector from "../components/PortfolioSelector";
import QuickTrade from "../components/QuickTrade";
import StockCard from "../components/StockCard";
import {
  usePortfolioStore,
  useStockStore,
  useWebSocketStore,
} from "../stores/StoreContext";
import { Portfolio } from "../types";
import "./DashboardPage.css";

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
  faCircle
);

const DashboardPage: React.FC = observer(() => {
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();
  const webSocketStore = useWebSocketStore();

  const [showPortfolioCreator, setShowPortfolioCreator] = useState(false);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [portfolioForDetails, setPortfolioForDetails] =
    useState<Portfolio | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize data only if stores are empty or need fresh data
  useEffect(() => {
    // Only fetch stocks if we don't have any recent data and WebSocket isn't providing updates
    if (
      (!stockStore.isInitialized || stockStore.needsFreshData) &&
      !stockStore.isLoading
    ) {
      console.log(
        "Dashboard: Fetching initial stock data (not initialized or needs fresh data)"
      );
      stockStore.fetchStocksWithSignals();
    } else if (stockStore.isInitialized) {
      console.log(
        "Dashboard: Using existing stock data, WebSocket will provide updates"
      );
    }

    // Only initialize portfolio if we don't have any portfolios
    if (!portfolioStore.isInitialized && !portfolioStore.isLoading) {
      console.log("Dashboard: Initializing default portfolio");
      portfolioStore.initializeDefaultPortfolio();
    } else if (portfolioStore.isInitialized) {
      console.log("Dashboard: Using existing portfolio data");
    }
  }, []); // Remove dependencies to prevent re-runs

  // Connect WebSocket if not already connected - only connect once
  useEffect(() => {
    if (!webSocketStore.isConnected && !webSocketStore.isConnecting) {
      console.log("Dashboard: Connecting WebSocket for real-time updates");
      webSocketStore.connect();
    } else if (webSocketStore.isConnected) {
      console.log(
        "Dashboard: WebSocket already connected, real-time updates active"
      );
    }

    // Cleanup function to prevent multiple connections
    return () => {
      // Don't disconnect WebSocket when dashboard unmounts - keep it alive for the app
      console.log(
        "Dashboard: Component unmounting, keeping WebSocket alive for other components"
      );
    };
  }, []); // No dependencies - connect once and keep alive

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
    const gainers = stocksWithSignals.filter(
      (stock) => stock.changePercent && stock.changePercent > 0
    );
    const losers = stocksWithSignals.filter(
      (stock) => stock.changePercent && stock.changePercent < 0
    );

    const avgChange =
      stocksWithSignals.reduce(
        (acc, stock) => acc + (stock.changePercent || 0),
        0
      ) / stocksWithSignals.length || 0;

    const totalVolume = stocksWithSignals.reduce(
      (acc, stock) => acc + (stock.volume || 0),
      0
    );

    const totalMarketCap = stocksWithSignals.reduce(
      (acc, stock) => acc + (stock.marketCap || 0),
      0
    );

    const signals = stocksWithSignals.reduce(
      (acc, stock) => {
        if (stock.tradingSignal?.signal === "buy") acc.buy++;
        else if (stock.tradingSignal?.signal === "sell") acc.sell++;
        else acc.hold++;
        return acc;
      },
      { buy: 0, sell: 0, hold: 0 }
    );

    const topGainer = gainers.sort(
      (a, b) => (b.changePercent || 0) - (a.changePercent || 0)
    )[0];
    const topLoser = losers.sort(
      (a, b) => (a.changePercent || 0) - (b.changePercent || 0)
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

  const handlePortfolioCreated = (portfolio: any) => {
    console.log("Portfolio created:", portfolio);
    setShowPortfolioCreator(false);
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

  const isConnected = webSocketStore.isConnected;
  const stocksWithSignals = stockStore.stocksWithSignals;
  const loading = stockStore.isLoading;

  if (loading) {
    return (
      <div className="dashboard-page">
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

  if (showPortfolioCreator) {
    return (
      <PortfolioCreator
        onPortfolioCreated={handlePortfolioCreated}
        onCancel={handleCancelPortfolioCreation}
      />
    );
  }

  return (
    <div className="dashboard-page">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            <div className={`status-indicator ${isConnected ? "online" : "offline"}`}>
              <div className="status-dot"></div>
              <span>{isConnected ? "LIVE MARKET DATA" : "OFFLINE"}</span>
            </div>
          </div>
          <h1 className="hero-title">
            Smart Trading
            <span className="gradient-text"> Dashboard</span>
          </h1>
          <p className="hero-description">
            Real-time market insights, AI-powered signals, and intelligent portfolio management
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">{marketAnalytics.totalStocks}</span>
              <span className="stat-label">Stocks Tracked</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="stat-label">Market Time</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">{marketAnalytics.buySignals + marketAnalytics.sellSignals}</span>
              <span className="stat-label">Active Signals</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="floating-cards">
            <div className="float-card card-1">
              <FontAwesomeIcon icon={faChartLine} />
              <span>Market Analysis</span>
            </div>
            <div className="float-card card-2">
              <FontAwesomeIcon icon={faArrowTrendUp} />
              <span>+{marketAnalytics.avgChange.toFixed(1)}%</span>
            </div>
            <div className="float-card card-3">
              <FontAwesomeIcon icon={faSignal} />
              <span>AI Signals</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Overview Dashboard */}
      <div className="market-dashboard">
        <div className="dashboard-grid">
          {/* Market Metrics */}
          <div className="dashboard-section market-metrics">
            <div className="section-header">
              <h3>Market Overview</h3>
              <div className="market-status">
                <span className="market-open">Market Open</span>
              </div>
            </div>
            <div className="metrics-grid">
              <div className="metric-card gainers">
                <div className="metric-icon">
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{marketAnalytics.gainers}</span>
                  <span className="metric-label">Gainers</span>
                  <span className="metric-change positive">+{((marketAnalytics.gainers / marketAnalytics.totalStocks) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="metric-card losers">
                <div className="metric-icon">
                  <FontAwesomeIcon icon={faArrowTrendDown} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{marketAnalytics.losers}</span>
                  <span className="metric-label">Losers</span>
                  <span className="metric-change negative">-{((marketAnalytics.losers / marketAnalytics.totalStocks) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="metric-card volume">
                <div className="metric-icon">
                  <FontAwesomeIcon icon={faVolumeHigh} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{(marketAnalytics.totalVolume / 1000000).toFixed(1)}M</span>
                  <span className="metric-label">Volume</span>
                  <span className="metric-change neutral">Total</span>
                </div>
              </div>

              <div className="metric-card signals">
                <div className="metric-icon">
                  <FontAwesomeIcon icon={faSignal} />
                </div>
                <div className="metric-data">
                  <span className="metric-value">{marketAnalytics.buySignals}</span>
                  <span className="metric-label">Buy Signals</span>
                  <span className="metric-change positive">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Movers */}
          <div className="dashboard-section top-movers">
            <div className="section-header">
              <h3>Top Movers</h3>
              <button className="refresh-btn">
                <FontAwesomeIcon icon={faArrowTrendUp} />
              </button>
            </div>
            <div className="movers-list">
              {marketAnalytics.topGainer && (
                <div className="mover-item gainer">
                  <div className="mover-info">
                    <span className="mover-symbol">{marketAnalytics.topGainer.symbol}</span>
                    <span className="mover-name">{marketAnalytics.topGainer.name}</span>
                  </div>
                  <div className="mover-change positive">
                    <FontAwesomeIcon icon={faArrowUp} />
                    +{marketAnalytics.topGainer.changePercent?.toFixed(2)}%
                  </div>
                </div>
              )}
              {marketAnalytics.topLoser && (
                <div className="mover-item loser">
                  <div className="mover-info">
                    <span className="mover-symbol">{marketAnalytics.topLoser.symbol}</span>
                    <span className="mover-name">{marketAnalytics.topLoser.name}</span>
                  </div>
                  <div className="mover-change negative">
                    <FontAwesomeIcon icon={faArrowDown} />
                    {marketAnalytics.topLoser.changePercent?.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio and Trading Section */}
      <div className="trading-dashboard">
        <div className="dashboard-grid">
          <div className="dashboard-section portfolio-section">
            <div className="section-header">
              <h3>Portfolio Management</h3>
              <button className="create-btn" onClick={handleCreatePortfolio}>
                <FontAwesomeIcon icon={faExchangeAlt} />
                Create Portfolio
              </button>
            </div>
            <div className="portfolio-widget">
              <PortfolioSelector
                selectedPortfolioId={portfolioStore.currentPortfolio?.id}
                onPortfolioSelect={(portfolio) =>
                  portfolioStore.setSelectedPortfolio(portfolio.id)
                }
                onViewDetails={handleViewPortfolioDetails}
                onCreatePortfolio={handleCreatePortfolio}
              />
            </div>
          </div>

          <div className="dashboard-section trading-section">
            <div className="section-header">
              <h3>Quick Trade</h3>
              <div className="trading-status">
                <span className="status-dot active"></span>
                <span>Ready</span>
              </div>
            </div>
            <div className="trading-widget">
              <QuickTrade />
            </div>
          </div>
        </div>
      </div>

      {/* Stock Grid */}
      <div className="stocks-section">
        <div className="section-header">
          <h3>Live Market Data</h3>
          <div className="stocks-controls">
            <div className="stocks-stats">
              <span>{stocksWithSignals.length} stocks • {marketAnalytics.buySignals} buy signals</span>
            </div>
            <button className="refresh-btn" onClick={() => stockStore.fetchStocksWithSignals()}>
              <FontAwesomeIcon icon={faArrowTrendUp} />
              Refresh
            </button>
          </div>
        </div>

        {stocksWithSignals.length === 0 ? (
          <div className="empty-state-wrapper">
            <EmptyState
              type="no-data"
              icon={<FontAwesomeIcon icon={faChartLine} />}
              title="No Stock Data Available"
              description="Unable to load stock data. Check your connection and try again."
              action={{
                label: "Refresh Data",
                onClick: () => stockStore.fetchStocksWithSignals(),
              }}
            />
          </div>
        ) : (
          <div className="stocks-grid">
            {stocksWithSignals.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                signal={stock.tradingSignal || undefined}
              />
            ))}
          </div>
        )}
      </div>

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

export default DashboardPage;
