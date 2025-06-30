import React from "react";

interface Stock {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  tradingSignal?: {
    signal: "buy" | "sell" | "hold";
    confidence: number;
  };
}

interface StockGridProps {
  stocks: Stock[];
  isLoading: boolean;
  onStockClick?: (stock: Stock) => void;
}

/**
 * StockGrid - Displays a grid of stock cards
 */
const StockGrid: React.FC<StockGridProps> = ({
  stocks,
  isLoading,
  onStockClick,
}) => {
  if (isLoading) {
    return (
      <div className="stock-grid-loading">
        <div className="loading-spinner"></div>
        <span>Loading market data...</span>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="stock-grid-empty">
        <div className="empty-state">
          <h3>No Market Data Available</h3>
          <p>
            Unable to load stock data. Please check your connection and try
            again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-grid">
      <div className="stock-grid-header">
        <h3>Market Overview</h3>
        <span className="stock-count">{stocks.length} stocks</span>
      </div>
      <div className="stock-cards-container">
        {stocks.map((stock) => (
          <div
            key={stock.id}
            className="stock-card"
            onClick={() => onStockClick?.(stock)}
          >
            <div className="stock-header">
              <div className="stock-identity">
                <span className="stock-symbol">{stock.symbol}</span>
                <span className="stock-name">{stock.name}</span>
              </div>
              {stock.tradingSignal && (
                <div className={`signal-badge ${stock.tradingSignal.signal}`}>
                  {stock.tradingSignal.signal.toUpperCase()}
                </div>
              )}
            </div>

            <div className="stock-price">
              <span className="current-price">
                ${stock.currentPrice.toFixed(2)}
              </span>
              <span
                className={`price-change ${stock.changePercent >= 0 ? "positive" : "negative"}`}
              >
                {stock.changePercent >= 0 ? "+" : ""}
                {stock.changePercent.toFixed(2)}%
              </span>
            </div>

            {stock.volume && (
              <div className="stock-metrics">
                <div className="metric">
                  <span className="metric-label">Volume</span>
                  <span className="metric-value">
                    {stock.volume >= 1e6
                      ? `${(stock.volume / 1e6).toFixed(1)}M`
                      : `${(stock.volume / 1e3).toFixed(0)}K`}
                  </span>
                </div>
                {stock.marketCap && (
                  <div className="metric">
                    <span className="metric-label">Market Cap</span>
                    <span className="metric-value">
                      {stock.marketCap >= 1e9
                        ? `$${(stock.marketCap / 1e9).toFixed(1)}B`
                        : `$${(stock.marketCap / 1e6).toFixed(0)}M`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockGrid;
