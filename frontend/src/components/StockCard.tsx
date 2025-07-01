import { faChartLine, faHeart } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStockStore } from "../stores/StoreContext";
import { DayTradingPattern, Stock, TradingSignal } from "../types";
import "./StockCard.css";
import StockModal from "./StockModal";

interface StockCardProps {
  stock: Stock;
  signal?: TradingSignal;
  variant?: 'default' | 'compact';
}

interface ChartDataPoint {
  time: string;
  timestamp: number;
  price: number;
  volume?: number;
}

const StockCard: React.FC<StockCardProps> = observer(({ stock, signal, variant = 'default' }) => {
  const stockStore = useStockStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patterns, setPatterns] = useState<DayTradingPattern[]>([]);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const getChangeColor = (changePercent: number) => {
    if (changePercent > 0) return "#00C851";
    if (changePercent < 0) return "#ff4444";
    return "#666";
  };

  const formatPrice = (price: number | string | null | undefined) => {
    const numValue = Number(price) || 0;
    return numValue.toFixed(2);
  };

  const formatPercent = (percent: number | string | null | undefined) => {
    const numValue = Number(percent) || 0;
    return numValue.toFixed(2);
  };
  const getRSILevel = (rsi: number | undefined) => {
    if (!rsi) return "neutral";
    if (rsi > 70) return "overbought";
    if (rsi < 30) return "oversold";
    return "neutral";
  };

  // Handle favorite toggle
  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening modal
    setIsFavoriteLoading(true);

    try {
      const response = await fetch(
        `http://localhost:8000/api/stocks/${stock.symbol}/favorite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedStock = await response.json();
        // Update the stock in the store
        stockStore.updateStockFavorite(stock.symbol, updatedStock.favorite);
        console.log(
          `✅ Toggled favorite for ${stock.symbol}: ${updatedStock.favorite}`
        );
      } else {
        console.error("Failed to toggle favorite:", response.statusText);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  // Fetch today's historical data
  const fetchTodaysHistoricalData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`📊 Fetching today's historical data for ${stock.symbol}`);

      const data = await stockStore.fetchStockHistory(stock.symbol, "1D");
      console.log(`📊 Received historical data for ${stock.symbol}:`, data);

      if (data && Array.isArray(data) && data.length > 0) {
        const chartPoints: ChartDataPoint[] = data.map(
          (point: any, index: number) => ({
            time: new Date(
              point.date || Date.now() - (data.length - index) * 60000 * 60
            ).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
            timestamp: point.date
              ? new Date(point.date).getTime()
              : Date.now() - (data.length - index) * 60000 * 60,
            price:
              point.close || point.price || Number(stock.currentPrice) || 100,
            volume: point.volume,
          })
        );

        setChartData(chartPoints);
        lastUpdateRef.current = Date.now();
      } else {
        // Fallback to mock data if no historical data
        generateMockIntradayData();
      }
    } catch (error) {
      console.error(
        `📊 Error fetching historical data for ${stock.symbol}:`,
        error
      );
      // Fallback to mock data on error
      generateMockIntradayData();
    } finally {
      setIsLoading(false);
    }
  }, [stock.symbol, stock.currentPrice, stockStore]);

  // Generate mock intraday data as fallback
  const generateMockIntradayData = useCallback(() => {
    const data: ChartDataPoint[] = [];
    const basePrice = Number(stock.currentPrice) || 100;
    const volatility = stock.breakoutStrategy?.volatility || 0.02;
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const hour = Math.max(9, (now.getHours() - 11 + i) % 24);
      const minute = Math.floor(Math.random() * 60);
      const variation = (Math.random() - 0.5) * volatility * basePrice;
      const price = Math.max(basePrice + variation, basePrice * 0.9);

      data.push({
        time: `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`,
        timestamp: now.getTime() - (12 - i) * 60000 * 60,
        price: Number(price.toFixed(2)),
        volume: Math.floor(Math.random() * 1000000),
      });
    }
    setChartData(data);
    lastUpdateRef.current = Date.now();
  }, [stock.currentPrice, stock.breakoutStrategy?.volatility]);

  // Append new price data (for real-time updates)
  const appendNewPriceData = useCallback((newPrice: number) => {
    const now = new Date();
    const newDataPoint: ChartDataPoint = {
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      timestamp: now.getTime(),
      price: newPrice,
      volume: Math.floor(Math.random() * 1000000), // Would come from real data
    };

    setChartData((prevData) => {
      // Keep only last 50 points for performance
      const updatedData = [...prevData, newDataPoint].slice(-50);
      return updatedData;
    });
    lastUpdateRef.current = Date.now();
  }, []);

  // Fetch patterns for today
  const fetchTodaysPatterns = useCallback(async () => {
    try {
      // In a real implementation, this would be a dedicated endpoint
      // For now, we'll get patterns from the stock's breakout strategy
      if (stock.breakoutStrategy?.dayTradingPatterns) {
        setPatterns(stock.breakoutStrategy.dayTradingPatterns);
      } else {
        setPatterns([]);
      }
    } catch (error) {
      console.error(`Error fetching patterns for ${stock.symbol}:`, error);
      setPatterns([]);
    }
  }, [stock.symbol, stock.breakoutStrategy?.dayTradingPatterns]);

  // Initialize data on component mount
  useEffect(() => {
    fetchTodaysHistoricalData();
    fetchTodaysPatterns();
  }, [fetchTodaysHistoricalData, fetchTodaysPatterns]);

  // Set up real-time price updates
  useEffect(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }

    // Update with current price every 30 seconds (simulate real-time)
    updateIntervalRef.current = setInterval(() => {
      const currentPrice = Number(stock.currentPrice);
      if (currentPrice && currentPrice > 0) {
        // Get the latest data point to compare prices
        const lastDataPoint = chartData[chartData.length - 1];
        const priceChanged = !lastDataPoint || Math.abs(lastDataPoint.price - currentPrice) > 0.01;
        const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
        
        // Update if price changed significantly or it's been more than 2 minutes
        if (priceChanged || timeSinceLastUpdate > 2 * 60 * 1000) {
          appendNewPriceData(currentPrice);
        }
      }
    }, 30000); // 30 seconds

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [stock.currentPrice, appendNewPriceData]);

  // Pattern markers for the chart
  const getPatternMarkers = () => {
    return patterns
      .filter((pattern) => pattern.type !== "none" && pattern.confidence > 0.3)
      .map((pattern, index) => {
        // Find approximate position in chart for pattern
        const middleIndex = Math.floor(chartData.length / 2);
        const dataPoint =
          chartData[middleIndex + index] || chartData[middleIndex];

        if (!dataPoint) return null;

        return (
          <ReferenceDot
            key={`pattern-${stock.symbol}-${pattern.type}-${pattern.direction}-${index}`}
            x={dataPoint.time}
            y={dataPoint.price}
            r={4}
            fill={
              pattern.direction === "bullish"
                ? "#10b981"
                : pattern.direction === "bearish"
                  ? "#ef4444"
                  : "#f59e0b"
            }
            stroke="#fff"
            strokeWidth={1}
          />
        );
      })
      .filter(Boolean);
  };
  return (
    <div className={`stock-card vertical ${variant === 'compact' ? 'compact' : ''}`}>
      {/* Header Section - Stock Info and Favorite */}
      <div className="stock-header">
        <div className="stock-info">
          <div className="stock-symbol">{stock.symbol}</div>
          <div className="stock-name">{stock.name}</div>
        </div>
        <button
          className={`favorite-btn ${stock.favorite ? "favorited" : ""}`}
          onClick={handleFavoriteToggle}
          disabled={isFavoriteLoading}
          title={stock.favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <FontAwesomeIcon
            icon={faHeart}
            className={isFavoriteLoading ? "loading" : ""}
          />
        </button>
      </div>

      {/* Price Section */}
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

      {/* Chart Section */}
      <div className="chart-section">
        {isLoading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <span>Loading...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={100}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <XAxis dataKey="time" hide />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "4px",
                  color: "#f0f6fc",
                  fontSize: "10px",
                }}
                formatter={(value: any) => [
                  `$${Number(value).toFixed(2)}`,
                  "Price",
                ]}
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={getChangeColor(Number(stock.changePercent) || 0)}
                strokeWidth={1.5}
                dot={false}
                activeDot={{
                  r: 2,
                  fill: getChangeColor(Number(stock.changePercent) || 0),
                  stroke: "#fff",
                  strokeWidth: 1,
                }}
              />
              {/* Pattern markers */}
              {getPatternMarkers()}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Technical Indicators Section */}
      <div className="indicators-section">
        <div className="technical-indicators horizontal">
          <div className="indicator-badge">
            <span className="badge-label">Trend</span>
            <span
              className={`badge-value trend-${
                stock.breakoutStrategy?.currentTrend || "neutral"
              }`}
              title={`Price Direction: ${
                stock.breakoutStrategy?.currentTrend === "upward"
                  ? "📈 Rising (Bullish)"
                  : stock.breakoutStrategy?.currentTrend === "downward"
                    ? "📉 Falling (Bearish)"
                    : "➡️ Sideways (Neutral)"
              }`}
            >
              {stock.breakoutStrategy?.currentTrend === "upward"
                ? "📈"
                : stock.breakoutStrategy?.currentTrend === "downward"
                  ? "📉"
                  : "➡️"}
            </span>
          </div>

          <div className="indicator-badge">
            <span className="badge-label">RSI</span>
            <span
              className={`badge-value rsi-${getRSILevel(
                stock.breakoutStrategy?.rsi
              )}`}
              title={`Momentum Indicator: ${
                stock.breakoutStrategy?.rsi?.toFixed(1) || "N/A"
              }`}
            >
              {stock.breakoutStrategy?.rsi?.toFixed(0) || "--"}
            </span>
          </div>

          <div className="indicator-badge">
            <span className="badge-label">Signal</span>
            <span
              className={`badge-value signal-${
                stock.tradingSignal?.signal || "hold"
              }`}
              title={`AI Recommendation: ${
                stock.tradingSignal?.signal === "buy"
                  ? "🟢 AI suggests buying"
                  : stock.tradingSignal?.signal === "sell"
                    ? "🔴 AI suggests selling"
                    : "🟡 AI suggests holding"
              }`}
            >
              {stock.tradingSignal?.signal === "buy"
                ? "🟢"
                : stock.tradingSignal?.signal === "sell"
                  ? "🔴"
                  : "🟡"}
            </span>
          </div>
        </div>

        <button
          className="details-btn"
          onClick={() => setIsModalOpen(true)}
          title="Open detailed dashboard"
        >
          <FontAwesomeIcon icon={faChartLine} />
          Details
        </button>
      </div>

      {/* Stock Modal */}
      <StockModal
        stock={stock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
});

export default StockCard;
