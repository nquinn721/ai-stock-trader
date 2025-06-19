import React from 'react';
import { Stock, TradingSignal } from '../types';
import './StockCard.css';

interface StockCardProps {
  stock: Stock;
  signal?: TradingSignal;
}

const StockCard: React.FC<StockCardProps> = ({ stock, signal }) => {
  const getChangeColor = (changePercent: number) => {
    if (changePercent > 0) return '#00C851';
    if (changePercent < 0) return '#ff4444';
    return '#666';
  };

  const getSignalColor = (signalType: string) => {
    switch (signalType) {
      case 'buy': return '#00C851';
      case 'sell': return '#ff4444';
      case 'hold': return '#ffbb33';
      default: return '#666';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    }
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    }
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="stock-card">
      <div className="stock-header">
        <div className="stock-symbol">{stock.symbol}</div>
        <div className="stock-name">{stock.name}</div>
      </div>
      
      <div className="stock-price-section">
        <div className="current-price">${stock.currentPrice?.toFixed(2) || '0.00'}</div>
        <div className="price-change" style={{ color: getChangeColor(stock.changePercent || 0) }}>
          {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2) || '0.00'}%
        </div>
      </div>
      
      <div className="stock-details">
        <div className="detail-row">
          <span>Previous Close:</span>
          <span>${stock.previousClose?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="detail-row">
          <span>Volume:</span>
          <span>{stock.volume?.toLocaleString() || '0'}</span>
        </div>
        <div className="detail-row">
          <span>Market Cap:</span>
          <span>{formatNumber(stock.marketCap || 0)}</span>
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
            </div>
            <div className="signal-confidence">
              Confidence: {(signal.confidence * 100).toFixed(1)}%
            </div>
            <div className="signal-target">
              Target: ${signal.targetPrice.toFixed(2)}
            </div>
          </div>
          <div className="signal-reason">{signal.reason}</div>
        </div>
      )}
    </div>
  );
};

export default StockCard;
