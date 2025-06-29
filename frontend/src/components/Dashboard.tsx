import {
  Analytics,
  ArrowDownward,
  ArrowUpward,
  AttachMoney,
  AutoMode,
  Chat,
  ShowChart,
  SignalCellularAlt,
  SwapHorizontalCircle,
  TrendingDown,
  TrendingUp,
  Visibility,
  VolumeUp,
} from "@mui/icons-material";
// import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import AutonomousTradingPage from "../pages/AutonomousTradingPage";
import {
  usePortfolioStore,
  useStockStore,
  useWebSocketStore,
} from "../stores/StoreContext";
import { Portfolio } from "../types";
import "./Dashboard.css";
import EmptyState from "./EmptyState";
import EnhancedPortfolioAnalyticsDashboard from "./EnhancedPortfolioAnalyticsDashboard";
import { MarketScannerDashboard } from "./MarketScanner/MarketScannerDashboard";
import { MultiAssetDashboard } from "./multi-asset/MultiAssetDashboard";
import NotificationCenter from "./NotificationCenter";
import PortfolioAICard from "./PortfolioAICard";
import PortfolioCreator from "./PortfolioCreator";
import PortfolioDetailsModal from "./PortfolioDetailsModal";
import PortfolioSelector from "./PortfolioSelector";
import QuickTrade from "./QuickTrade";
import StockCard from "./StockCard";
import TradingAssistantChat from "./TradingAssistantChat";
import PageHeader from "./ui/PageHeader";

// Add icons to library - commented out for now
// library.add(
//   faArrowTrendUp,
//   faArrowTrendDown,
//   faChartLine,
//   faDollarSign,
//   faExchangeAlt,
//   faVolumeHigh,
//   faEye,
//   faSignal,
//   faClock,
//   faArrowUp,
//   faArrowDown,
//   faCircle,
//   faRobot,
//   faComments
// );

const Dashboard: React.FC = () => {
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();
  const webSocketStore = useWebSocketStore();

  const [showPortfolioCreator, setShowPortfolioCreator] = useState(false);
  const [showPortfolioDetails, setShowPortfolioDetails] = useState(false);
  const [portfolioForDetails, setPortfolioForDetails] =
    useState<Portfolio | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAutonomousAgents, setShowAutonomousAgents] = useState(false);
  const [showPortfolioAnalytics, setShowPortfolioAnalytics] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showMarketScanner, setShowMarketScanner] = useState(false);
  const [showMultiAsset, setShowMultiAsset] = useState(false);
  const [showAIPortfolios, setShowAIPortfolios] = useState(false);

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

  // AI Portfolio Integration Handlers
  const handleAssignAgent = (portfolioId: number) => {
    console.log("Assign agent to portfolio:", portfolioId);
    setShowAutonomousAgents(true);
  };

  const handleViewAIPerformance = (portfolioId: number) => {
    console.log("View AI performance for portfolio:", portfolioId);
    setShowPortfolioAnalytics(true);
  };

  const handleToggleAgent = (portfolioId: number, agentId: string) => {
    console.log("Toggle agent:", agentId, "for portfolio:", portfolioId);
    // TODO: Implement agent toggle logic
  };

  const getAssignedAgents = (portfolioId: number) => {
    // TODO: Replace with real data from portfolio store
    // For now, return mock data to demonstrate functionality
    const mockAgents = [
      {
        id: "agent-1",
        name: "DQN Momentum Trader",
        type: "dqn" as const,
        status: "running" as const,
        allocation: 30,
        riskProfile: "moderate" as const,
        lastUpdate: new Date().toISOString(),
        performance: {
          totalReturn: 12.5,
          dailyReturn: 0.8,
          sharpeRatio: 1.6,
          maxDrawdown: 8.2,
          currentDrawdown: 2.1,
          winRate: 68.5,
          totalTrades: 45,
          profitableTrades: 31,
          averageWin: 2.4,
          averageLoss: 1.8,
          profitFactor: 1.45,
          currentValue: 11250,
          unrealizedPnL: 450,
          realizedPnL: 800,
          lastUpdated: new Date().toISOString(),
        },
      },
    ];
    return portfolioId === 1 ? mockAgents : []; // Only show agents for first portfolio as demo
  };

  const isConnected = webSocketStore.isConnected;
  const stocksWithSignals = stockStore.stocksWithSignals;
  const loading = stockStore.isLoading;

  // Removed loading screen since data comes through WebSockets
  // if (loading) {
  //   return (
  //     <div className="dashboard">
  //       {" "}
  //       <EmptyState
  //         type="loading"
  //         icon={<AccessTime />}
  //         title="Loading Stock Data"
  //         description="Fetching real-time market data and trading signals..."
  //         size="large"
  //       />
  //     </div>
  //   );
  // }

  if (showMarketScanner) {
    return (
      <div className="dashboard">
        <PageHeader
          title="Market Scanner"
          currentTime={currentTime}
          isConnected={isConnected}
          showLiveIndicator={false}
          actionButtons={[
            {
              icon: <span>←</span>,
              onClick: () => setShowMarketScanner(false),
              tooltip: "Back to Dashboard",
              className: "back-button",
              label: "Back to Dashboard",
            },
          ]}
        />
        <MarketScannerDashboard onStockSelect={handleStockSelect} />
      </div>
    );
  }

  if (showAutonomousAgents) {
    return (
      <AutonomousTradingPage
        onNavigateBack={() => setShowAutonomousAgents(false)}
        currentTime={currentTime}
        isConnected={isConnected}
      />
    );
  }

  if (showPortfolioAnalytics) {
    return (
      <div className="dashboard">
        <PageHeader
          title="Portfolio Analytics"
          currentTime={currentTime}
          isConnected={isConnected}
          showLiveIndicator={false}
          actionButtons={[
            {
              icon: <span>←</span>,
              onClick: () => setShowPortfolioAnalytics(false),
              tooltip: "Back to Dashboard",
              className: "back-button",
              label: "Back to Dashboard",
            },
          ]}
        />
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
        <PageHeader
          title="AI Trading Assistant"
          currentTime={currentTime}
          isConnected={isConnected}
          showLiveIndicator={false}
          actionButtons={[
            {
              icon: <span>←</span>,
              onClick: () => setShowAIAssistant(false),
              tooltip: "Back to Dashboard",
              className: "back-button",
              label: "Back to Dashboard",
            },
          ]}
        />
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

  if (showMultiAsset) {
    return (
      <div className="dashboard">
        <PageHeader
          title="Multi-Asset Intelligence"
          currentTime={currentTime}
          isConnected={isConnected}
          showLiveIndicator={false}
          actionButtons={[
            {
              icon: <span>←</span>,
              onClick: () => setShowMultiAsset(false),
              tooltip: "Back to Dashboard",
              className: "back-button",
              label: "Back to Dashboard",
            },
          ]}
        />
        <MultiAssetDashboard />
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <PageHeader
        title="Auto Trading Dashboard"
        currentTime={currentTime}
        isConnected={isConnected}
        statsValue={`${stocksWithSignals.length} stocks`}
        actionButtons={[
          {
            icon: <AutoMode />,
            onClick: () => setShowAutonomousAgents(true),
            tooltip: "AI Autonomous Trading Agents",
            className: "autonomous-agents-btn",
            label: "AI Agents",
          },
          {
            icon: <Analytics />,
            onClick: () => setShowPortfolioAnalytics(true),
            tooltip: "View Portfolio Analytics",
            className: "analytics-btn",
            label: "Analytics",
          },
          {
            icon: <SignalCellularAlt />,
            onClick: () => setShowMarketScanner(true),
            tooltip: "Open Market Scanner",
            className: "scanner-btn",
            label: "Scanner",
          },
          {
            icon: <SwapHorizontalCircle />,
            onClick: () => setShowMultiAsset(true),
            tooltip: "Multi-Asset Intelligence Platform",
            className: "multi-asset-btn",
            label: "Multi-Asset",
          },
          {
            icon: <Chat />,
            onClick: () => setShowAIAssistant(true),
            tooltip: "Open AI Trading Assistant",
            className: "ai-assistant-btn",
            label: "AI Assistant",
          },
        ]}
      >
        <NotificationCenter />
      </PageHeader>
      {/* Market Overview Cards */}
      <div className="market-overview">
        <div className="metric-card">
          <div className="metric-icon">
            <ShowChart />
          </div>
          <div className="metric-content">
            <div className="metric-value">{marketAnalytics.totalStocks}</div>
            <div className="metric-label">Total Stocks</div>
          </div>
        </div>

        <div className="metric-card positive">
          <div className="metric-icon">
            <TrendingUp />
          </div>
          <div className="metric-content">
            <div className="metric-value">{marketAnalytics.gainers}</div>
            <div className="metric-label">Gainers</div>
          </div>
        </div>

        <div className="metric-card negative">
          <div className="metric-icon">
            <TrendingDown />
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
            {marketAnalytics.avgChange >= 0 ? (
              <ArrowUpward />
            ) : (
              <ArrowDownward />
            )}
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
            <VolumeUp />
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
            <AttachMoney />
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
          <SignalCellularAlt /> Trading Signals
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
            <Visibility /> Top Movers
          </h3>
          <div className="movers-grid">
            {marketAnalytics.topGainer && (
              <div className="mover-card positive">
                <div className="mover-header">
                  <TrendingUp />
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
                  <TrendingDown />
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
      {/* AI-Enhanced Portfolio Trading */}
      <div className="ai-enhanced-trading-section">
        <h3>
          <AutoMode /> AI-Enhanced Portfolio Trading
        </h3>
        <div className="portfolio-ai-grid">
          {portfolioStore.portfolios.map((portfolio) => (
            <PortfolioAICard
              key={portfolio.id}
              portfolio={{
                ...portfolio,
                aiStrategy: portfolio.id === 1 ? "hybrid" : "none", // Demo: first portfolio has AI
                agentAllocation: portfolio.id === 1 ? 30 : 0, // Demo: 30% AI allocation
                performanceComparison:
                  portfolio.id === 1
                    ? {
                        humanTrading: {
                          totalReturn: 8.2,
                          dailyReturn: 0.5,
                          sharpeRatio: 1.2,
                          maxDrawdown: 12.1,
                          currentDrawdown: 3.2,
                          winRate: 62.0,
                          totalTrades: 28,
                          profitableTrades: 17,
                          averageWin: 2.1,
                          averageLoss: 1.9,
                          profitFactor: 1.25,
                          currentValue: 10820,
                          unrealizedPnL: 320,
                          realizedPnL: 500,
                          lastUpdated: new Date().toISOString(),
                        },
                        aiTrading: {
                          totalReturn: 12.5,
                          dailyReturn: 0.8,
                          sharpeRatio: 1.6,
                          maxDrawdown: 8.2,
                          currentDrawdown: 2.1,
                          winRate: 68.5,
                          totalTrades: 45,
                          profitableTrades: 31,
                          averageWin: 2.4,
                          averageLoss: 1.8,
                          profitFactor: 1.45,
                          currentValue: 11250,
                          unrealizedPnL: 450,
                          realizedPnL: 800,
                          lastUpdated: new Date().toISOString(),
                        },
                        combined: {
                          totalReturn: 10.8,
                          dailyReturn: 0.7,
                          sharpeRatio: 1.4,
                          maxDrawdown: 9.8,
                          currentDrawdown: 2.5,
                          winRate: 65.8,
                          totalTrades: 73,
                          profitableTrades: 48,
                          averageWin: 2.3,
                          averageLoss: 1.85,
                          profitFactor: 1.38,
                          currentValue: 22070,
                          unrealizedPnL: 770,
                          realizedPnL: 1300,
                          lastUpdated: new Date().toISOString(),
                        },
                      }
                    : undefined,
                lastAgentUpdate:
                  portfolio.id === 1 ? new Date().toISOString() : undefined,
              }}
              assignedAgents={getAssignedAgents(portfolio.id)}
              onAssignAgent={handleAssignAgent}
              onViewPerformance={handleViewAIPerformance}
              onToggleAgent={handleToggleAgent}
            />
          ))}
        </div>

        {portfolioStore.portfolios.length === 0 && (
          <div className="no-portfolios-message">
            <p>Create your first portfolio to start AI-enhanced trading</p>
            <button
              className="create-portfolio-btn"
              onClick={handleCreatePortfolio}
            >
              Create Portfolio
            </button>
          </div>
        )}
      </div>
      {/* Paper Trading Section */}
      <div className="paper-trading-section">
        <h3>
          <SwapHorizontalCircle /> Paper Trading
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
          <QuickTrade />
        </div>
      </div>
      {/* Stocks Grid */}
      <div className="stocks-section">
        <h3>
          <ShowChart /> Live Stocks
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
          icon={<ShowChart />}
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
};

export default Dashboard;
