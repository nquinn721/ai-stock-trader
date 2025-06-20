import React from "react";
import { Stock, TradingSignal } from "../types";
import BreakoutDisplay from "./BreakoutDisplay";
import DayTradingPatterns from "./DayTradingPatterns";
import PriceChart from "./PriceChart";
import SentimentDisplay from "./SentimentDisplay";
import "./StockCard.css";

interface StockCardProps {
  stock: Stock;
  signal?: TradingSignal;
}

const StockCard: React.FC<StockCardProps> = ({ stock, signal }) => {
  const getChangeColor = (changePercent: number) => {
    if (changePercent > 0) return "#00C851";
    if (changePercent < 0) return "#ff4444";
    return "#666";
  };
  const formatNumber = (num: number | string | null | undefined) => {
    const numValue = Number(num) || 0;
    if (numValue >= 1000000000) {
      return `$${(numValue / 1000000000).toFixed(2)}B`;
    }
    if (numValue >= 1000000) {
      return `$${(numValue / 1000000).toFixed(2)}M`;
    }
    if (numValue >= 1000) {
      return `$${(numValue / 1000).toFixed(2)}K`;
    }
    return `$${numValue.toFixed(2)}`;
  };

  const formatPrice = (price: number | string | null | undefined) => {
    const numValue = Number(price) || 0;
    return numValue.toFixed(2);
  };

  const formatPercent = (percent: number | string | null | undefined) => {
    const numValue = Number(percent) || 0;
    return numValue.toFixed(2);
  };

  return (
    <div className="stock-card">
      <div className="stock-header">
        <div className="stock-symbol">{stock.symbol}</div>
        <div className="stock-name">{stock.name}</div>
      </div>
      <div className="stock-price-section">
        <div className="current-price">${formatPrice(stock.currentPrice)}</div>
        <div
          className="price-change"
          style={{ color: getChangeColor(Number(stock.changePercent) || 0) }}
        >
          {(Number(stock.changePercent) || 0) >= 0 ? "+" : ""}
          {formatPercent(stock.changePercent)}%
        </div>
      </div>
      <div className="stock-details">
        <div className="detail-row">
          <span>Previous Close:</span>
          <span>${formatPrice(stock.previousClose)}</span>
        </div>
        <div className="detail-row">
          <span>Volume:</span>
          <span>{(Number(stock.volume) || 0).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Market Cap:</span>
          <span>{formatNumber(stock.marketCap)}</span>
        </div>
        <div className="detail-row">
          <span>Sector:</span>
          <span>{stock.sector}</span>
        </div>{" "}
      </div>{" "}
      {/* Live Price Chart */}
      <PriceChart
        symbol={stock.symbol}
        currentPrice={Number(stock.currentPrice) || 0}
        changePercent={Number(stock.changePercent) || 0}
      />
      {/* Sentiment Section */}
      {stock.sentiment && (
        <SentimentDisplay
          sentiment={stock.sentiment}
          recentNews={stock.recentNews}
          symbol={stock.symbol}
        />
      )}
      {/* Breakout Strategy Section */}
      {stock.breakoutStrategy && (
        <BreakoutDisplay
          breakoutStrategy={stock.breakoutStrategy}
          symbol={stock.symbol}
        />
      )}
      {/* Day Trading Patterns Section */}
      {stock.breakoutStrategy && stock.breakoutStrategy.dayTradingPatterns && (
        <DayTradingPatterns
          patterns={stock.breakoutStrategy.dayTradingPatterns}
          symbol={stock.symbol}
        />
      )}      {/* AI Trading Recommendation Section - Always show, with default if no signal */}
      <div className="trading-signal">
        <div className="signal-header">🤖 AI Recommendation</div>
        {signal ? (
          <>            <div className="signal-content">              <div className={`signal-type ${signal.signal}`}>
                {signal.signal === 'buy' ? '🚀 BUY' : 
                 signal.signal === 'sell' ? '📉 SELL' : 
                 signal.signal === 'hold' ? '⚖️ HOLD' : 
                 (signal.signal as string).toUpperCase()}
              </div>
              <div className="signal-confidence">
                AI Confidence:{" "}
                {((Number(signal.confidence) || 0) * 100).toFixed(1)}%
              </div>
              <div className="signal-target">
                Price Target: ${formatPrice(signal.targetPrice)}
              </div>
            </div>
            <div className="signal-reason">
              🎯 AI analysis complete. Our machine learning models recommend this action based on technical indicators, market sentiment, and pattern recognition.
            </div>
          </>
        ) : (
          <>
            <div className="signal-content">              <div className="signal-type neutral">🤖 ANALYZING</div>
              <div className="signal-confidence">AI Confidence: Loading...</div>
              <div className="signal-target">Price Target: Computing...</div>
            </div>            <div className="signal-reason">
              🔄 AI models are processing market data, technical indicators, and sentiment analysis. Fresh recommendations incoming!
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockCard;
