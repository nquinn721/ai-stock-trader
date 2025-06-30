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
import { Analytics, AutoMode, Chat } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PortfolioCreator from "../components/PortfolioCreator";
import PortfolioDetailsModal from "../components/PortfolioDetailsModal";
import PortfolioSelector from "../components/PortfolioSelector";
import QuickTradeContent from "../components/QuickTradeContent";
import StockCard from "../components/StockCard";
import PageHeader from "../components/ui/PageHeader";
import {
  usePortfolioStore,
  useStockStore,
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
  const navigate = useNavigate();
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();

  const [showPortfolioCreator, setShowPortfolioCreator] = useState(false);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [portfolioForDetails, setPortfolioForDetails] =
    useState<Portfolio | null>(null);

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
      {/* Page Header */}
      <PageHeader
        title="Trading Dashboard"
        statsValue={`${marketAnalytics.totalStocks} Stocks • ${marketAnalytics.buySignals + marketAnalytics.sellSignals} Signals`}
        actionButtons={[
          {
            icon: <Analytics />,
            onClick: () => navigate("/dashboard"),
            tooltip: "Dashboard Analytics",
            label: "Analytics",
          },
          {
            icon: <AutoMode />,
            onClick: () => navigate("/autonomous-trading"),
            tooltip: "Autonomous Trading",
            label: "Auto Trade",
          },
          {
            icon: <Chat />,
            onClick: () => navigate("/ai-assistant"),
            tooltip: "AI Trading Assistant",
            label: "AI Chat",
          },
        ]}
      />

      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        {/* Enhanced Metrics Grid */}
        <div className="dashboard-grid grid-small">
          <div className="dashboard-card trading-card slide-up">
            <div className="card-header">
              <div className="card-title">
                <FontAwesomeIcon
                  icon={faArrowTrendUp}
                  className="card-title-icon trading-bull"
                />
                Market Gainers
              </div>
              <div className="card-actions">
                <span className="signal-badge buy">
                  {marketAnalytics.gainers}
                </span>
              </div>
            </div>
            <div className="stat-value positive">{marketAnalytics.gainers}</div>
            <div className="card-subtitle">
              {(
                (marketAnalytics.gainers / marketAnalytics.totalStocks) *
                100
              ).toFixed(1)}
              % of market moving up
            </div>
          </div>

          <div className="dashboard-card trading-card slide-up">
            <div className="card-header">
              <div className="card-title">
                <FontAwesomeIcon
                  icon={faArrowTrendDown}
                  className="card-title-icon trading-bear"
                />
                Market Losers
              </div>
              <div className="card-actions">
                <span className="signal-badge sell">
                  {marketAnalytics.losers}
                </span>
              </div>
            </div>
            <div className="stat-value negative">{marketAnalytics.losers}</div>
            <div className="card-subtitle">
              {(
                (marketAnalytics.losers / marketAnalytics.totalStocks) *
                100
              ).toFixed(1)}
              % of market declining
            </div>
          </div>

          <div className="dashboard-card performance-card slide-up">
            <div className="card-header">
              <div className="card-title">
                <FontAwesomeIcon icon={faSignal} className="card-title-icon" />
                Buy Signals
              </div>
              <div className="card-actions">
                <span className="signal-badge buy">
                  {marketAnalytics.buySignals}
                </span>
              </div>
            </div>
            <div className="stat-value">{marketAnalytics.buySignals}</div>
            <div className="card-subtitle">AI trading recommendations</div>
          </div>

          <div className="dashboard-card slide-up">
            <div className="card-header">
              <div className="card-title">
                <FontAwesomeIcon
                  icon={faVolumeHigh}
                  className="card-title-icon"
                />
                Trading Volume
              </div>
            </div>
            <div className="stat-value">
              ${(marketAnalytics.totalVolume / 1e9).toFixed(1)}B
            </div>
            <div className="card-subtitle">Total market activity</div>
          </div>
        </div>

        {/* Portfolio & Quick Trade Section */}
        <div className="dashboard-grid">
          {/* Portfolio Section */}
          <div
            className="dashboard-card slide-up"
            style={{ gridColumn: "1 / -1" }}
          >
            <div className="card-header">
              <div className="card-title">
                <FontAwesomeIcon
                  icon={faExchangeAlt}
                  className="card-title-icon"
                />
                Portfolio Management
              </div>
              <div className="card-actions">
                <button
                  className="dashboard-btn ghost"
                  onClick={handleCreatePortfolio}
                >
                  <FontAwesomeIcon icon={faExchangeAlt} />
                  Create New
                </button>
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "var(--theme-space-6)",
              }}
            >
              <div>
                <PortfolioSelector
                  selectedPortfolioId={portfolioStore.currentPortfolio?.id}
                  onPortfolioSelect={(portfolio) =>
                    portfolioStore.setSelectedPortfolio(portfolio.id)
                  }
                  onViewDetails={handleViewPortfolioDetails}
                  onCreatePortfolio={handleCreatePortfolio}
                />
              </div>
              <div className="dashboard-card">
                <div className="card-header">
                  <div className="card-title">
                    <FontAwesomeIcon
                      icon={faBolt}
                      className="card-title-icon"
                    />
                    Quick Trade
                  </div>
                  <div className="status-indicator connected"></div>
                </div>
                <QuickTradeContent />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Market Data Section */}
        <div className="dashboard-card slide-up dashboard-section-full">
          <div className="card-header">
            <div className="card-title">
              <FontAwesomeIcon icon={faChartLine} className="card-title-icon" />
              Live Market Data
            </div>
            <div className="card-actions">
              <button
                className="dashboard-btn primary"
                onClick={() => stockStore.fetchStocksWithSignals()}
                disabled={stockStore.isLoading}
              >
                {stockStore.isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                )}
                Refresh
              </button>
            </div>
          </div>
          {stockStore.isLoading ? (
            <EmptyState
              type="loading"
              icon={<FontAwesomeIcon icon={faChartLine} />}
              title="Loading Market Data"
              description="Fetching latest stock prices and signals..."
            />
          ) : stocksWithSignals.length === 0 ? (
            <EmptyState
              type="no-data"
              icon={<FontAwesomeIcon icon={faChartLine} />}
              title="No Stock Data Ready"
              description="Waiting for stocks with valid price data. Live updates will appear here automatically."
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

        {/* Enhanced Top Performers Section */}
        {marketAnalytics.topGainer && marketAnalytics.topLoser && (
          <div className="dashboard-grid">
            <div className="dashboard-card performance-card slide-up">
              <div className="card-header">
                <div className="card-title">
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    className="card-title-icon trading-bull"
                  />
                  Top Gainer
                </div>
                <div className="card-actions">
                  <span className="signal-badge buy">
                    +{marketAnalytics.topGainer.changePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="stat-value">
                {marketAnalytics.topGainer.symbol}
              </div>
              <div className="card-subtitle">
                ${marketAnalytics.topGainer.currentPrice?.toFixed(2)}
              </div>
            </div>

            <div className="dashboard-card alert-card slide-up">
              <div className="card-header">
                <div className="card-title">
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    className="card-title-icon trading-bear"
                  />
                  Top Loser
                </div>
                <div className="card-actions">
                  <span className="signal-badge sell">
                    {marketAnalytics.topLoser.changePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="stat-value">
                {marketAnalytics.topLoser.symbol}
              </div>
              <div className="card-subtitle">
                ${marketAnalytics.topLoser.currentPrice?.toFixed(2)}
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
