import React, { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { DayTradingPattern } from "../types";
import { useStockStore } from "../stores/StoreContext";
import "./PriceChart.css";

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  height?: number;
  showRealTime?: boolean;
  interval?: number; // Update interval in milliseconds
  period?: "1H" | "1D" | "1W" | "1M";
  patterns?: DayTradingPattern[]; // Today's trading patterns
  onPatternClick?: (pattern: DayTradingPattern) => void; // Pattern click handler
}

interface PricePoint {
  time: string;
  timestamp: number;
  price: number;
  volume?: number;
}

interface MarketSession {
  isOpen: boolean;
  nextOpen?: Date;
  nextClose?: Date;
}

const PriceChart: React.FC<PriceChartProps> = observer(({
  symbol,
  currentPrice,
  changePercent,
  height = 120,
  showRealTime = true,
  interval = 10000, // 10 seconds default - reduced from 5
  period = "1H",
  patterns = [],
  onPatternClick,
}) => {
  const stockStore = useStockStore();
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketSession, setMarketSession] = useState<MarketSession>({
    isOpen: true,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const lastPriceRef = useRef<number>(currentPrice);

  // Check if market is open (simplified - assumes 9:30 AM - 4:00 PM EST)
  const checkMarketHours = useCallback((): MarketSession => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isOpen = isWeekday && hour >= 9 && hour < 16;

    return { isOpen };
  }, []); // Fetch historical data from backend - enhanced for today's data
  const fetchHistoricalData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`📊 Fetching historical data for ${symbol}`);

      // For today's data, use period=1D, otherwise use the specified period
      const requestPeriod = period === "1H" ? "1D" : period;
      
      const data = await stockStore.fetchStockHistory(symbol, requestPeriod);
      console.log(`📊 Received historical data for ${symbol}:`, data);

      if (data && Array.isArray(data)) {
        const pricePoints: PricePoint[] = data.map(
          (point: any, index: number) => ({
            time: point.date
              ? new Date(point.date).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : `${Date.now() - (data.length - index) * 60000}`,
            timestamp: point.date
              ? new Date(point.date).getTime()
              : Date.now() - (data.length - index) * 60000,
            price: point.close || point.price || currentPrice,
            volume: point.volume,
          })
        );

        setPriceHistory(pricePoints);
        setInitialLoadComplete(true);
        console.log(`📊 Set ${pricePoints.length} price points for ${symbol}`);
      } else {
        console.warn(`📊 Invalid data format for ${symbol}:`, data);
        setPriceHistory([]);
      }
    } catch (error) {
      console.error(`📊 Error fetching historical data for ${symbol}:`, error);
      setPriceHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, period, currentPrice, stockStore]);

  // Append new price data point (for incremental updates)
  const appendNewPriceData = useCallback((newPrice: number) => {
    const now = new Date();
    const newPricePoint: PricePoint = {
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      timestamp: now.getTime(),
      price: newPrice,
      volume: Math.floor(Math.random() * 1000000), // Would come from real WebSocket data
    };

    setPriceHistory((prevHistory) => {
      // Keep only last 100 points for performance
      const updatedHistory = [...prevHistory, newPricePoint].slice(-100);
      return updatedHistory;
    });

    setLastUpdate(now);
    lastPriceRef.current = newPrice;
  }, []);

  // Check for price changes and append new data
  useEffect(() => {
    if (
      initialLoadComplete &&
      currentPrice !== lastPriceRef.current &&
      currentPrice > 0
    ) {
      appendNewPriceData(currentPrice);
    }
  }, [currentPrice, initialLoadComplete, appendNewPriceData]);
  useEffect(() => {
    setMarketSession(checkMarketHours());

    // Only fetch historical data on initial load
    if (!initialLoadComplete) {
      fetchHistoricalData();
    }

    // Set up periodic refresh for live data - but only append new prices, don't reload all
    if (showRealTime && initialLoadComplete) {
      const refreshInterval = setInterval(() => {
        // In a real implementation, this would come from WebSocket
        // For now, we'll just check if currentPrice changed
        if (currentPrice !== lastPriceRef.current && currentPrice > 0) {
          appendNewPriceData(currentPrice);
        }
      }, interval);
      intervalRef.current = refreshInterval;
    }

    return () => {
      const currentInterval = intervalRef.current;
      const currentWs = wsRef.current;
      if (currentInterval) {
        clearInterval(currentInterval);
      }
      if (currentWs) {
        currentWs.close();
      }
    };
  }, [
    symbol,
    period,
    fetchHistoricalData,
    checkMarketHours,
    showRealTime,
    interval,
    initialLoadComplete,
    currentPrice,
    appendNewPriceData,
  ]);

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      );
    }

    if (priceHistory.length === 0) {
      return (
        <div className="chart-no-data">
          <div className="no-data-icon">📊</div>
          <span>No price data available</span>
          <small>Real-time data feed required</small>
        </div>
      );
    }
    const prices = priceHistory.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = Math.max(maxPrice - minPrice, maxPrice * 0.01); // Ensure minimum 1% range

    // Debug logging
    console.log(`${symbol} Chart Debug:`, {
      priceCount: prices.length,
      minPrice: minPrice.toFixed(2),
      maxPrice: maxPrice.toFixed(2),
      priceRange: priceRange.toFixed(2),
      svgHeight:
        height <= 160 ? Math.max(height - 25, 115) : Math.max(height - 70, 100),
      samplePrices: prices.slice(0, 3).map((p) => p.toFixed(2)),
    });
    const lastPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2] || lastPrice;
    const priceChange = lastPrice - previousPrice;
    const isRising = priceChange >= 0; // Create SVG path
    const width = 400; // Adjust SVG height calculation based on container height
    let svgHeight: number;
    if (height <= 160) {
      // For small charts (stock cards), use more of the available space
      // Account for header (~24px) and footer (~24px) and minimal padding
      svgHeight = Math.max(height - 25, 115);
    } else {
      // For larger charts, leave more space for UI elements
      svgHeight = Math.max(height - 70, 100);
    }
    // Use smaller padding for small charts to maximize chart area
    const padding = height <= 160 ? 15 : 20;

    const points = priceHistory
      .map((point, index) => {
        const x =
          padding + (index / (priceHistory.length - 1)) * (width - 2 * padding);
        const y =
          svgHeight -
          padding -
          ((point.price - minPrice) / priceRange) * (svgHeight - 2 * padding);
        return `${x},${y}`;
      })
      .join(" ");
    const chartColor = isRising ? "#10b981" : "#ef4444";
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const fillColor = isRising
      ? "rgba(16, 185, 129, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

    return (
      <div className="chart-container">
        <svg width={width} height={svgHeight} className="price-chart-svg">
          {/* Grid lines */}
          <defs>
            <pattern
              id="priceGrid"
              width="40"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </pattern>
            <linearGradient
              id="priceGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: chartColor, stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: chartColor, stopOpacity: 0.05 }}
              />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#priceGrid)" />
          {/* Price area fill */}
          <polygon
            fill="url(#priceGradient)"
            points={`${padding},${svgHeight - padding} ${points} ${
              width - padding
            },${svgHeight - padding}`}
          />{" "}
          {/* Price line */}
          <polyline
            fill="none"
            stroke={chartColor}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
            className="price-line"
            filter="drop-shadow(0 0 4px rgba(0,0,0,0.3))"
          />
          {/* Price points */}
          {priceHistory.map((point, index) => {
            const x =
              padding +
              (index / (priceHistory.length - 1)) * (width - 2 * padding);
            const y =
              svgHeight -
              padding -
              ((point.price - minPrice) / priceRange) *
                (svgHeight - 2 * padding);

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r="2"
                  fill={chartColor}
                  className="price-point"
                  opacity={index === priceHistory.length - 1 ? 1 : 0.6}
                />
                {index === priceHistory.length - 1 && (
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="none"
                    stroke={chartColor}
                    strokeWidth="2"
                    className="current-price-indicator"
                  />
                )}
              </g>
            );
          })}{" "}
          {/* Current price line */}
          {priceHistory.length > 0 && (
            <line
              x1={padding}
              y1={
                svgHeight -
                padding -
                ((lastPrice - minPrice) / priceRange) *
                  (svgHeight - 2 * padding)
              }
              x2={width - padding}
              y2={
                svgHeight -
                padding -
                ((lastPrice - minPrice) / priceRange) *
                  (svgHeight - 2 * padding)
              }
              stroke={chartColor}
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )}
          {/* Pattern markers */}
          {patterns
            .filter(
              (pattern) => pattern.type !== "none" && pattern.confidence > 0.3
            )
            .map((pattern, index) => {
              // Calculate position for pattern marker
              const markerIndex = Math.floor(
                (priceHistory.length * (0.3 + index * 0.2)) %
                  priceHistory.length
              );
              const dataPoint = priceHistory[markerIndex];

              if (!dataPoint) return null;

              const x =
                padding +
                (markerIndex / (priceHistory.length - 1)) *
                  (width - 2 * padding);
              const y =
                svgHeight -
                padding -
                ((dataPoint.price - minPrice) / priceRange) *
                  (svgHeight - 2 * padding);

              const patternColor =
                pattern.direction === "bullish"
                  ? "#10b981"
                  : pattern.direction === "bearish"
                  ? "#ef4444"
                  : "#f59e0b";

              return (
                <g key={`pattern-${index}`}>
                  {/* Pattern marker circle */}
                  <circle
                    cx={x}
                    cy={y - 15}
                    r="6"
                    fill={patternColor}
                    stroke="#fff"
                    strokeWidth="2"
                    className="pattern-marker"
                    style={{
                      cursor: onPatternClick ? "pointer" : "default",
                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                    }}
                    onClick={() => onPatternClick && onPatternClick(pattern)}
                  />

                  {/* Pattern type icon */}
                  <text
                    x={x}
                    y={y - 12}
                    textAnchor="middle"
                    fontSize="8"
                    fill="#fff"
                    fontWeight="bold"
                    style={{ pointerEvents: "none" }}
                  >
                    {pattern.type.charAt(0).toUpperCase()}
                  </text>

                  {/* Pattern confidence tooltip */}
                  <title>
                    {`${pattern.type.replace("_", " ").toUpperCase()} - ${
                      pattern.direction
                    } - ${(pattern.confidence * 100).toFixed(0)}% confidence`}
                  </title>
                </g>
              );
            })}
        </svg>

        <div className="chart-info">
          <div className="price-range">
            <span className="range-label">H:</span>
            <span className="range-high">${maxPrice.toFixed(2)}</span>
            <span className="range-label">L:</span>
            <span className="range-low">${minPrice.toFixed(2)}</span>
          </div>
          <div className="time-range">
            <span>{priceHistory[0]?.time}</span>
            <span className="current-time">
              {priceHistory[priceHistory.length - 1]?.time}
            </span>
          </div>
        </div>

        {/* Real-time indicator */}
        {showRealTime && marketSession.isOpen && (
          <div className="realtime-indicator">
            <div className="pulse-dot"></div>
            <span>LIVE</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`price-chart ${height <= 160 ? "price-chart-small" : ""}`}
      style={{ height }}
    >
      <div className="chart-header">
        <div className="chart-title">
          <span className="chart-symbol">{symbol}</span>
          <span className="chart-period">{period}</span>
        </div>
        <div className="chart-status">
          {!marketSession.isOpen && (
            <span className="market-closed">Market Closed</span>
          )}
          {showRealTime && marketSession.isOpen && (
            <span className="last-update">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      {renderChart()}
      <div className="chart-footer">
        <div className="price-change">
          <span
            className={`change-value ${
              changePercent >= 0 ? "positive" : "negative"
            }`}
          >
            {changePercent >= 0 ? "+" : ""}
            {changePercent.toFixed(2)}%
          </span>
          <span className="volume-info">
            Vol:{" "}
            {priceHistory.length > 0
              ? priceHistory[
                  priceHistory.length - 1
                ].volume?.toLocaleString() || "N/A"
              : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default PriceChart;
