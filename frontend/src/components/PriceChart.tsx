import React, { useCallback, useEffect, useRef, useState } from "react";
import "./PriceChart.css";

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  changePercent: number;
  height?: number;
  showRealTime?: boolean;
  interval?: number; // Update interval in milliseconds
  period?: "1H" | "1D" | "1W" | "1M";
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

const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  currentPrice,
  changePercent,
  height = 120,
  showRealTime = true,
  interval = 10000, // 10 seconds default - reduced from 5
  period = "1H",
}) => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketSession, setMarketSession] = useState<MarketSession>({
    isOpen: true,
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Check if market is open (simplified - assumes 9:30 AM - 4:00 PM EST)
  const checkMarketHours = useCallback((): MarketSession => {
    const now = new Date();
    const hour = now.getHours();
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    const isOpen = isWeekday && hour >= 9 && hour < 16;

    return { isOpen };
  }, []);

  useEffect(() => {
    setMarketSession(checkMarketHours());

    // Simulate real-time price updates
    const generateInitialData = () => {
      const points: PricePoint[] = [];
      const now = new Date();
      const basePrice = currentPrice;
      const dataPoints =
        period === "1H" ? 20 : period === "1D" ? 48 : period === "1W" ? 35 : 30;
      const timeInterval =
        period === "1H"
          ? 3 * 60 * 1000 // 3 minutes
          : period === "1D"
          ? 30 * 60 * 1000 // 30 minutes
          : period === "1W"
          ? 24 * 60 * 60 * 1000 // 1 day
          : 24 * 60 * 60 * 1000; // 1 day for 1M

      // Generate historical data points
      for (let i = dataPoints - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - i * timeInterval);
        const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const trendFactor = Math.sin(i / 5) * 0.001; // Add slight trend
        const price = basePrice * (1 + randomVariation + trendFactor);

        points.push({
          time: time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: time.getTime(),
          price: price,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }

      return points;
    };

    setPriceHistory(generateInitialData());
    setIsLoading(false);

    // Set up real-time updates if enabled and market is open
    if (showRealTime && marketSession.isOpen) {
      // Simulate WebSocket connection
      const connectWebSocket = () => {
        // In a real app, this would be: new WebSocket(`wss://api.example.com/ws/${symbol}`)
        console.log(`Simulating WebSocket connection for ${symbol}`);
        intervalRef.current = setInterval(() => {
          const now = new Date();

          setPriceHistory((prev) => {
            const lastPrice =
              prev.length > 0 ? prev[prev.length - 1].price : currentPrice;
            const marketVolatility = 0.005; // 0.5% max change per update
            const randomChange = (Math.random() - 0.5) * marketVolatility;
            const newPrice = Math.max(0.01, lastPrice * (1 + randomChange));

            const newPoint: PricePoint = {
              time: now.toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
              }),
              timestamp: now.getTime(),
              price: newPrice,
              volume: Math.floor(Math.random() * 50000) + 10000,
            };

            const maxPoints = period === "1H" ? 60 : period === "1D" ? 96 : 50;
            return [
              ...prev.slice(Math.max(0, prev.length - maxPoints)),
              newPoint,
            ];
          });

          setLastUpdate(now);
        }, interval);
      };

      connectWebSocket();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentPrice, symbol, showRealTime, interval, period, checkMarketHours]); // Removed priceHistory and marketSession.isOpen from dependencies
  const renderChart = () => {
    if (isLoading || priceHistory.length === 0) {
      return (
        <div className="chart-loading">
          <div className="loading-spinner"></div>
          <span>Loading real-time data...</span>
        </div>
      );
    }

    const prices = priceHistory.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const currentPrice = prices[prices.length - 1];
    const previousPrice = prices[prices.length - 2] || currentPrice;
    const priceChange = currentPrice - previousPrice;
    const isRising = priceChange >= 0; // Create SVG path
    const width = 400;    // Adjust SVG height calculation based on container height
    let svgHeight: number;
    if (height <= 160) {
      // For small charts (stock cards), use more of the available space
      // Account for header (~32px) and footer (~32px) and padding (~16px)
      svgHeight = Math.max(height - 30, 110);
    } else {
      // For larger charts, leave more space for UI elements
      svgHeight = Math.max(height - 70, 100);
    }
    const padding = 20;

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
          })}
          {/* Current price line */}
          {priceHistory.length > 0 && (
            <line
              x1={padding}
              y1={
                svgHeight -
                padding -
                ((currentPrice - minPrice) / priceRange) *
                  (svgHeight - 2 * padding)
              }
              x2={width - padding}
              y2={
                svgHeight -
                padding -
                ((currentPrice - minPrice) / priceRange) *
                  (svgHeight - 2 * padding)
              }
              stroke={chartColor}
              strokeWidth="1"
              strokeDasharray="5,5"
              opacity="0.6"
            />
          )}
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
  };  return (
    <div className={`price-chart ${height <= 160 ? 'price-chart-small' : ''}`} style={{ height }}>
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
};

export default PriceChart;
