import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowDown,
  faArrowTrendDown,
  faArrowTrendUp,
  faArrowUp,
  faBolt,
  faChartLine,
  faCircle,
  faClock,
  faDollarSign,
  faExchangeAlt,
  faEye,
  faRocket,
  faSignal,
  faStar,
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
  faCircle,
  faBolt,
  faRocket,
  faStar
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
  // Removed loading screen since data comes through WebSockets
  // const loading = stockStore.isLoading;

  // if (loading) {
  //   return (
  //     <div className="dashboard-page">
  //       <EmptyState
  //         type="loading"
  //         icon={<FontAwesomeIcon icon="clock" />}
  //         title="Loading Stock Data"
  //         description="Fetching real-time market data and trading signals..."
  //         size="large"
  //       />
  //     </div>
  //   );
  // }

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
      {/* Simple Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="dashboard-title">Trading Dashboard</h1>
            <div className="connection-status">
              <span
                className={`status-dot ${isConnected ? "connected" : "disconnected"}`}
              ></span>
              <span className="status-text">
                {isConnected ? "Live Data" : "Offline"}
              </span>
              <span className="current-time">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
          </div>
          <div className="header-right">
            <div className="market-summary">
              <div className="summary-item">
                <span className="summary-label">Stocks</span>
                <span className="summary-value">
                  {marketAnalytics.totalStocks}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Signals</span>
                <span className="summary-value">
                  {marketAnalytics.buySignals + marketAnalytics.sellSignals}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Top Metrics Row */}
        <div className="metrics-row">
          <div className="metric-card">
            <div className="metric-header">
              <FontAwesomeIcon
                icon={faArrowTrendUp}
                className="metric-icon positive"
              />
              <span className="metric-title">Gainers</span>
            </div>
            <div className="metric-value">{marketAnalytics.gainers}</div>
            <div className="metric-subtitle">
              {(
                (marketAnalytics.gainers / marketAnalytics.totalStocks) *
                100
              ).toFixed(1)}
              % of market
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <FontAwesomeIcon
                icon={faArrowTrendDown}
                className="metric-icon negative"
              />
              <span className="metric-title">Losers</span>
            </div>
            <div className="metric-value">{marketAnalytics.losers}</div>
            <div className="metric-subtitle">
              {(
                (marketAnalytics.losers / marketAnalytics.totalStocks) *
                100
              ).toFixed(1)}
              % of market
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <FontAwesomeIcon icon={faSignal} className="metric-icon" />
              <span className="metric-title">Buy Signals</span>
            </div>
            <div className="metric-value">{marketAnalytics.buySignals}</div>
            <div className="metric-subtitle">AI recommendations</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <FontAwesomeIcon icon={faVolumeHigh} className="metric-icon" />
              <span className="metric-title">Volume</span>
            </div>
            <div className="metric-value">
              ${(marketAnalytics.totalVolume / 1e9).toFixed(1)}B
            </div>
            <div className="metric-subtitle">Total trading volume</div>
          </div>
        </div>

        {/* Two Column Layout - Portfolio (75%) + Quick Trade (25%) */}
        <div className="dashboard-main-row">
          {/* Portfolio Section - 75% width */}
          <div className="portfolio-section">
            <div className="section-card">
              <div className="section-header">
                <h3>Portfolio</h3>
                <button className="action-btn" onClick={handleCreatePortfolio}>
                  <FontAwesomeIcon icon={faExchangeAlt} />
                  Create New
                </button>
              </div>
              <div className="section-content">
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
          </div>

          {/* Quick Trade Section - 25% width */}
          <div className="quick-trade-section">
            <div className="section-card">
              <div className="section-header">
                <h3>Quick Trade</h3>
                <div className="status-indicator">
                  <span className="status-dot active"></span>
                  <span>Ready</span>
                </div>
              </div>
              <div className="section-content">
                <QuickTrade />
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Market Data Section */}
        <div className="market-data-section">
          <div className="section-card">
            <div className="section-header">
              <h3>Live Market Data</h3>
              <button
                className="action-btn"
                onClick={() => stockStore.fetchStocksWithSignals()}
              >
                <FontAwesomeIcon icon={faArrowTrendUp} />
                Refresh
              </button>
            </div>
            <div className="section-content">
              {stocksWithSignals.length === 0 ? (
                <EmptyState
                  type="no-data"
                  icon={<FontAwesomeIcon icon={faChartLine} />}
                  title="No Stock Data"
                  description="Unable to load market data. Check connection and try again."
                  action={{
                    label: "Refresh Data",
                    onClick: () => stockStore.fetchStocksWithSignals(),
                  }}
                />
              ) : (
                <div className="stocks-grid">
                  {stocksWithSignals.slice(0, 12).map((stock) => (
                    <StockCard
                      key={stock.symbol}
                      stock={stock}
                      signal={stock.tradingSignal || undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section - Top Performers */}
        {marketAnalytics.topGainer && marketAnalytics.topLoser && (
          <div className="performers-section">
            <div className="section-header">
              <h3>Today's Top Performers</h3>
            </div>
            <div className="performers-grid">
              <div className="performer-card gainer">
                <div className="performer-header">
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    className="performer-icon"
                  />
                  <span className="performer-title">Top Gainer</span>
                </div>
                <div className="performer-symbol">
                  {marketAnalytics.topGainer.symbol}
                </div>
                <div className="performer-price">
                  ${marketAnalytics.topGainer.currentPrice?.toFixed(2)}
                </div>
                <div className="performer-change positive">
                  +{marketAnalytics.topGainer.changePercent?.toFixed(2)}%
                </div>
              </div>

              <div className="performer-card loser">
                <div className="performer-header">
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    className="performer-icon"
                  />
                  <span className="performer-title">Top Loser</span>
                </div>
                <div className="performer-symbol">
                  {marketAnalytics.topLoser.symbol}
                </div>
                <div className="performer-price">
                  ${marketAnalytics.topLoser.currentPrice?.toFixed(2)}
                </div>
                <div className="performer-change negative">
                  {marketAnalytics.topLoser.changePercent?.toFixed(2)}%
                </div>
              </div>
            </div>
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
