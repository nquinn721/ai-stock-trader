import { useEffect, useMemo, useState } from "react";
import {
  usePortfolioStore,
  useStockStore,
  useWebSocketStore,
} from "../../stores/StoreContext";
import { Portfolio } from "../../types";

export const useDashboard = () => {
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();
  const webSocketStore = useWebSocketStore();

  // UI state
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
    stockStore.fetchStocksFast();
    portfolioStore.initializeDefaultPortfolio();
  }, [stockStore, portfolioStore]);

  // Update stocks when socket data changes
  useEffect(() => {
    if ((stockStore?.stocks?.length || 0) === 0 && !stockStore?.isLoading) {
      stockStore?.fetchStocksFast();
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
  const marketAnalytics = useMemo(() => {
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

  // Portfolio handlers
  const handleCreatePortfolio = () => setShowPortfolioCreator(true);
  const handleClosePortfolioCreator = () => setShowPortfolioCreator(false);

  const handleViewPortfolioDetails = (portfolio: Portfolio) => {
    setPortfolioForDetails(portfolio);
    setShowPortfolioDetails(true);
  };
  const handleClosePortfolioDetails = () => {
    setShowPortfolioDetails(false);
    setPortfolioForDetails(null);
  };

  // Feature panel handlers
  const handleShowAutonomousAgents = () => setShowAutonomousAgents(true);
  const handleShowPortfolioAnalytics = () => setShowPortfolioAnalytics(true);
  const handleShowAIAssistant = () => setShowAIAssistant(true);
  const handleShowMarketScanner = () => setShowMarketScanner(true);
  const handleShowMultiAsset = () => setShowMultiAsset(true);
  const handleShowAIPortfolios = () => setShowAIPortfolios(true);

  return {
    // Stores
    stockStore,
    portfolioStore,
    webSocketStore,

    // Computed data
    marketAnalytics,
    currentTime,

    // UI state
    showPortfolioCreator,
    showPortfolioDetails,
    portfolioForDetails,
    showAutonomousAgents,
    showPortfolioAnalytics,
    showAIAssistant,
    showMarketScanner,
    showMultiAsset,
    showAIPortfolios,

    // Handlers
    handleCreatePortfolio,
    handleClosePortfolioCreator,
    handleViewPortfolioDetails,
    handleClosePortfolioDetails,
    handleShowAutonomousAgents,
    handleShowPortfolioAnalytics,
    handleShowAIAssistant,
    handleShowMarketScanner,
    handleShowMultiAsset,
    handleShowAIPortfolios,

    // State setters for closing modals
    setShowAutonomousAgents,
    setShowPortfolioAnalytics,
    setShowAIAssistant,
    setShowMarketScanner,
    setShowMultiAsset,
    setShowAIPortfolios,
  };
};
