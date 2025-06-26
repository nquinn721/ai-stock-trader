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
    if ((!stockStore.isInitialized || stockStore.needsFreshData) && !stockStore.isLoading) {
      console.log("Dashboard: Fetching initial stock data (not initialized or needs fresh data)");
      stockStore.fetchStocksWithSignals();
    } else if (stockStore.isInitialized) {
      console.log("Dashboard: Using existing stock data, WebSocket will provide updates");
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
      console.log("Dashboard: WebSocket already connected, real-time updates active");
    }

    // Cleanup function to prevent multiple connections
    return () => {
      // Don't disconnect WebSocket when dashboard unmounts - keep it alive for the app
      console.log("Dashboard: Component unmounting, keeping WebSocket alive for other components");
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

        <div className="metric-card">
          <div className="metric-icon">
            <FontAwesomeIcon icon={faDollarSign} />
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
            <FontAwesomeIcon icon={faExchangeAlt} />
          </div>
          <div className="metric-content">
            <div className="metric-value">
              {marketAnalytics.buySignals}/{marketAnalytics.sellSignals}
            </div>
            <div className="metric-label">Buy/Sell Signals</div>
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      <div className="portfolio-section">
        <div className="section-header">
          <h2>Portfolio Management</h2>
          <button
            className="create-portfolio-btn"
            onClick={handleCreatePortfolio}
          >
            Create New Portfolio
          </button>
        </div>
        <div className="portfolio-container">
          <PortfolioSelector
            selectedPortfolioId={portfolioStore.currentPortfolio?.id}
            onPortfolioSelect={(portfolio) =>
              portfolioStore.setSelectedPortfolio(portfolio.id)
            }
            onViewDetails={handleViewPortfolioDetails}
            onCreatePortfolio={handleCreatePortfolio}
          />
          <QuickTrade />
        </div>
      </div>

      {/* Stock Grid */}
      <div className="stock-section">
        <div className="section-header">
          <h2>Market Overview</h2>
          <div className="stock-stats">
            <span>{stocksWithSignals.length} stocks tracked</span>
            <div
              className={`connection-status ${
                isConnected ? "connected" : "disconnected"
              }`}
            >
              <FontAwesomeIcon icon="circle" />
              {isConnected ? "Live" : "Offline"}
            </div>
          </div>
        </div>

        {stocksWithSignals.length === 0 ? (
          <EmptyState
            type="no-data"
            icon={<FontAwesomeIcon icon={faChartLine} />}
            title="No Stock Data Available"
            description="Unable to load stock data. Check your connection and try again."
            action={{
              label: "Refresh",
              onClick: () => stockStore.fetchStocksWithSignals(),
            }}
          />
        ) : (
          <div className="stock-grid">
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
