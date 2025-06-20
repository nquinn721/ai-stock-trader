import React from "react";
import { Stock, TradingSignal } from "../types";
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

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case "buy":
        return "#00C851";
      case "sell":
        return "#ff4444";
      case "hold":
        return "#ffbb33";
      default:
        return "#666";
    }
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
        </div>
      </div>

      {signal && (
        <div className="trading-signal">
          <div className="signal-header">Trading Signal</div>
          <div className="signal-content">
            <div
              className="signal-type"
              style={{ color: getSignalColor(signal.signal) }}
            >
              {signal.signal.toUpperCase()}
            </div>{" "}
            <div className="signal-confidence">
              Confidence: {((Number(signal.confidence) || 0) * 100).toFixed(1)}%
            </div>
            <div className="signal-target">
              Target: ${formatPrice(signal.targetPrice)}
            </div>
          </div>
          <div className="signal-reason">{signal.reason}</div>
        </div>
      )}
    </div>
  );
};

export default StockCard;
