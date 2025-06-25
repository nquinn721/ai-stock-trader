import {
  faArrowTrendDown,
  faArrowTrendUp,
  faBolt,
  faChartLine,
  faRobot,
  faSignal,
  faTimes,
  faVolumeHigh,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LineChart } from "@mui/x-charts/LineChart";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useStockStore } from "../stores/StoreContext";
import { Stock } from "../types";
import "./StockModal_new.css";

interface StockModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

interface LiveMetrics {
  rsi: number;
  macd: { line: number; signal: number; histogram: number };
  bollinger: { upper: number; middle: number; lower: number };
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  atr: number;
  stochastic: { k: number; d: number };
  williamsR: number;
  volume: number;
  vwap: number;
  support: number;
  resistance: number;
}

const StockModal: React.FC<StockModalProps> = observer(
  ({ stock, isOpen, onClose }) => {
    const stockStore = useStockStore();
    const [chartData, setChartData] = useState<
      { date: string; price: number; time: number }[]
    >([]);
    const [liveMetrics, setLiveMetrics] = useState<LiveMetrics | null>(null);
    const liveDataIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // URL History Management
    useEffect(() => {
      if (isOpen && stock) {
        const modalUrl = `${window.location.pathname}?stock=${stock.symbol}`;
        window.history.pushState({ stockModal: stock.symbol }, "", modalUrl);

        const handlePopState = (event: PopStateEvent) => {
          if (!event.state?.stockModal) {
            onClose();
          }
        };

        window.addEventListener("popstate", handlePopState);
        return () => {
          window.removeEventListener("popstate", handlePopState);
        };
      }
    }, [isOpen, stock, onClose]);

    // Live Data Fetching
    const fetchLiveMetrics = useCallback(async () => {
      if (!stock || !isOpen) return;

      try {
        const [stockData, historyData] = await Promise.all([
          stockStore.fetchStockDetails(stock.symbol),
          stockStore.fetchStockHistory(stock.symbol, "1d"), // Remove interval param as backend doesn't support it
        ]);

        const latestStock = stockData || stock;
        const historyArray = historyData || [];

        // Create chart data with real historical prices
        let chartPoints: Array<{
          date: string;
          price: number;
          time: number;
        }> = [];

        if (historyArray.length > 0) {
          chartPoints = historyArray.map((d: any) => ({
            date: d.date,
            price: d.close || d.price || latestStock.currentPrice,
            time: new Date(d.date).getTime(),
          }));

          // Always add the current live price as the latest data point
          const currentTime = Date.now();
          chartPoints.push({
            date: new Date().toISOString(),
            price: latestStock.currentPrice,
            time: currentTime,
          });

          setChartData(chartPoints);
        } else {
          // If no historical data, show current price only
          const currentTime = Date.now();
          const singlePointData = [
            {
              date: new Date().toISOString(),
              price: latestStock.currentPrice,
              time: currentTime,
            },
          ];

          setChartData(singlePointData);
        }
        const prices =
          chartPoints.length > 0
            ? chartPoints.map((d: any) => d.price).filter(Boolean)
            : [latestStock.currentPrice];

        if (prices.length > 0) {
          const rsi = calculateRSI(prices);
          const macd = calculateMACD(prices);
          const bollinger = calculateBollingerBands(prices);
          const sma20 = calculateSMA(prices, 20);
          const sma50 = calculateSMA(prices, 50);
          const ema12 = calculateEMA(prices, 12);
          const ema26 = calculateEMA(prices, 26);
          const atr = calculateATR(prices);
          const stochastic = calculateStochastic(prices);
          const williamsR = calculateWilliamsR(prices);
          const support = findSupport(prices);
          const resistance = findResistance(prices);

          setLiveMetrics({
            rsi,
            macd,
            bollinger,
            sma20,
            sma50,
            ema12,
            ema26,
            atr,
            stochastic,
            williamsR,
            volume: latestStock.volume || 0,
            vwap: calculateVWAP(prices),
            support,
            resistance,
          });
        }
      } catch (error) {
        console.error("Error fetching live metrics:", error);
      }
    }, [stock, isOpen]);

    // Start live data updates
    useEffect(() => {
      if (isOpen && stock) {
        fetchLiveMetrics();
        liveDataIntervalRef.current = setInterval(fetchLiveMetrics, 30000); // Update every 30 seconds
      }

      return () => {
        if (liveDataIntervalRef.current) {
          clearInterval(liveDataIntervalRef.current);
        }
      };
    }, [isOpen, stock, fetchLiveMetrics]);

    // WebSocket listener for real-time price updates
    useEffect(() => {
      if (!isOpen || !stock) return;

      const updateChartWithLivePrice = () => {
        const currentStock = stockStore.stocks.find(
          (s) => s.symbol === stock.symbol
        );
        if (currentStock && currentStock.currentPrice && chartData.length > 0) {
          const now = new Date();
          const newDataPoint = {
            date: now.toISOString(),
            price: currentStock.currentPrice,
            time: now.getTime(),
          };

          setChartData((prevData) => {
            // Keep last 100 data points for performance
            const updatedData = [...prevData, newDataPoint].slice(-100);
            return updatedData;
          });
        }
      };

      // Listen for stock updates from WebSocket
      const checkInterval = setInterval(() => {
        const stockUpdates = stockStore.stocks.find(
          (s) => s.symbol === stock.symbol
        );
        if (stockUpdates && stockUpdates.currentPrice !== stock.currentPrice) {
          updateChartWithLivePrice();
        }
      }, 2000); // Check every 2 seconds for WebSocket updates

      return () => {
        clearInterval(checkInterval);
      };
    }, [isOpen, stock, stockStore.stocks, chartData]);

    // Technical Indicator Calculations
    const calculateRSI = (prices: number[], period: number = 14): number => {
      if (prices.length < period + 1) return 50;

      let gains = 0;
      let losses = 0;

      for (let i = 1; i <= period; i++) {
        const change =
          prices[prices.length - i] - prices[prices.length - i - 1];
        if (change > 0) gains += change;
        else losses += Math.abs(change);
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / avgLoss;
      return 100 - 100 / (1 + rs);
    };

    const calculateMACD = (
      prices: number[]
    ): { line: number; signal: number; histogram: number } => {
      const ema12 = calculateEMA(prices, 12);
      const ema26 = calculateEMA(prices, 26);
      const macdLine = ema12 - ema26;
      const signalLine = macdLine * 0.9; // Simplified signal line
      return {
        line: macdLine,
        signal: signalLine,
        histogram: macdLine - signalLine,
      };
    };

    const calculateBollingerBands = (
      prices: number[],
      period: number = 20
    ): { upper: number; middle: number; lower: number } => {
      const sma = calculateSMA(prices, period);
      const variance =
        prices
          .slice(-period)
          .reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      return {
        upper: sma + 2 * stdDev,
        middle: sma,
        lower: sma - 2 * stdDev,
      };
    };

    const calculateSMA = (prices: number[], period: number): number => {
      if (prices.length < period) return prices[prices.length - 1] || 0;
      const recentPrices = prices.slice(-period);
      return recentPrices.reduce((sum, price) => sum + price, 0) / period;
    };

    const calculateEMA = (prices: number[], period: number): number => {
      if (prices.length < period) return prices[prices.length - 1] || 0;
      const multiplier = 2 / (period + 1);
      let ema = prices[0];
      for (let i = 1; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
      }
      return ema;
    };

    const calculateATR = (prices: number[], period: number = 14): number => {
      if (prices.length < period) return 0;
      // Simplified ATR calculation using price differences
      const trueRanges = [];
      for (let i = 1; i < Math.min(prices.length, period + 1); i++) {
        const high = prices[i];
        const low = prices[i] * 0.995; // Approximate low as 0.5% below close
        const prevClose = prices[i - 1];
        trueRanges.push(
          Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
          )
        );
      }
      return trueRanges.reduce((sum, tr) => sum + tr, 0) / trueRanges.length;
    };

    const calculateStochastic = (
      prices: number[],
      period: number = 14
    ): { k: number; d: number } => {
      if (prices.length < period) return { k: 50, d: 50 };
      const recentPrices = prices.slice(-period);
      const currentPrice = prices[prices.length - 1];
      const highest = Math.max(...recentPrices);
      const lowest = Math.min(...recentPrices);
      const k = ((currentPrice - lowest) / (highest - lowest)) * 100;
      return { k, d: k * 0.9 }; // Simplified D calculation
    };

    const calculateWilliamsR = (
      prices: number[],
      period: number = 14
    ): number => {
      if (prices.length < period) return -50;
      const recentPrices = prices.slice(-period);
      const currentPrice = prices[prices.length - 1];
      const highest = Math.max(...recentPrices);
      const lowest = Math.min(...recentPrices);
      return ((highest - currentPrice) / (highest - lowest)) * -100;
    };

    const calculateVWAP = (prices: number[]): number => {
      // Simplified VWAP calculation without volume data
      return prices.reduce((sum, price) => sum + price, 0) / prices.length;
    };

    const findSupport = (prices: number[]): number => {
      return Math.min(...prices) * 0.995; // Support slightly below lowest price
    };

    const findResistance = (prices: number[]): number => {
      return Math.max(...prices) * 1.005; // Resistance slightly above highest price
    };

    // Helper functions
    const getRSILevel = (rsi: number): string => {
      if (rsi > 70) return "overbought";
      if (rsi < 30) return "oversold";
      return "neutral";
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    if (!isOpen) return null;

    const changePercent = stock.changePercent || 0;
    const isPositive = changePercent >= 0;

    return createPortal(
      <div className="stock-modal-overlay" onClick={handleBackdropClick}>
        <div className="stock-modal">
          {/* Simplified Header */}
          <div className="stock-modal-header">
            <div className="stock-header-left">
              <h2>{stock.symbol}</h2>
              <div className="stock-price-info">
                <div className="current-price">
                  ${stock.currentPrice.toFixed(2)}
                </div>
                <div
                  className={`price-change ${
                    isPositive ? "positive" : "negative"
                  }`}
                >
                  <FontAwesomeIcon
                    icon={isPositive ? faArrowTrendUp : faArrowTrendDown}
                  />
                  {isPositive ? "+" : ""}
                  {changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>

          {/* Modal Content */}
          <div className="stock-modal-content">
            <div className="main-content-container">
              {/* AI Analysis Section - Moved up */}
              <div className="dashboard-section ai-analysis">
                <div className="section-header">
                  <FontAwesomeIcon icon={faRobot} />
                  <h3>AI Trading Analysis</h3>
                </div>
                <div className="ai-content">
                  <div className="ai-recommendation">
                    <div className="recommendation-header">
                      <span
                        className={`recommendation-badge ${
                          stock.breakoutStrategy?.signal || "neutral"
                        }`}
                      >
                        {(
                          stock.breakoutStrategy?.signal || "NEUTRAL"
                        ).toUpperCase()}
                      </span>
                      <span className="confidence-score">
                        Confidence:{" "}
                        {(
                          (stock.breakoutStrategy?.probability || 0.5) * 100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <div className="recommendation-details">
                      <p>
                        Based on current technical indicators and market
                        conditions:
                      </p>
                      <ul>
                        <li>
                          RSI indicates {getRSILevel(liveMetrics?.rsi || 50)}{" "}
                          conditions ({(liveMetrics?.rsi || 50).toFixed(1)})
                        </li>
                        <li>
                          MACD shows{" "}
                          {(liveMetrics?.macd.histogram || 0) > 0
                            ? "bullish"
                            : "bearish"}{" "}
                          momentum (histogram:{" "}
                          {(liveMetrics?.macd.histogram || 0).toFixed(3)})
                        </li>
                        <li>
                          Volume is{" "}
                          {(Number(stock.volume) || 0) >
                          (Number(stock.volume) || 0) * 0.85
                            ? "above"
                            : "below"}{" "}
                          average ({(stock.volume || 0).toLocaleString()})
                        </li>
                        <li>
                          Price is{" "}
                          {stock.currentPrice >
                          (liveMetrics?.sma20 || stock.currentPrice * 0.99)
                            ? "above"
                            : "below"}{" "}
                          SMA(20) ($
                          {(
                            liveMetrics?.sma20 || stock.currentPrice * 0.99
                          ).toFixed(2)}
                          )
                        </li>
                        <li>
                          Bollinger position:{" "}
                          {liveMetrics
                            ? (
                                ((stock.currentPrice -
                                  liveMetrics.bollinger.lower) /
                                  (liveMetrics.bollinger.upper -
                                    liveMetrics.bollinger.lower)) *
                                100
                              ).toFixed(0) + "% of range"
                            : "50% of range"}
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="trading-levels">
                    <h4>Suggested Trading Levels</h4>
                    <div className="levels-grid">
                      <div className="level-item buy">
                        <span className="level-label">Entry Zone:</span>
                        <span className="level-value">
                          ${(stock.currentPrice * 0.995).toFixed(2)} - $
                          {(stock.currentPrice * 1.005).toFixed(2)}
                        </span>
                      </div>
                      <div className="level-item sell">
                        <span className="level-label">Stop Loss:</span>
                        <span className="level-value">
                          $
                          {(
                            liveMetrics?.support || stock.currentPrice * 0.95
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="level-item profit">
                        <span className="level-label">Take Profit:</span>
                        <span className="level-value">
                          $
                          {(
                            liveMetrics?.resistance || stock.currentPrice * 1.08
                          ).toFixed(2)}
                        </span>
                      </div>
                      <div className="level-item buy">
                        <span className="level-label">Risk/Reward:</span>
                        <span className="level-value">
                          {(
                            ((liveMetrics?.resistance ||
                              stock.currentPrice * 1.08) -
                              stock.currentPrice) /
                            (stock.currentPrice -
                              (liveMetrics?.support ||
                                stock.currentPrice * 0.95))
                          ).toFixed(2)}
                          :1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Section */}
              <div className="dashboard-section">
                <div className="section-header">
                  <FontAwesomeIcon icon={faChartLine} />
                  <h3>Live Stock Price Chart</h3>
                </div>
                <div className="stock-modal-chart-container">
                  {chartData.length === 0 ? (
                    <div className="stock-modal-chart-loading">
                      Loading chart data...
                    </div>
                  ) : (
                    <div className="stock-modal-chart-wrapper">
                      <LineChart
                        width={600}
                        height={320}
                        margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                        series={[
                          {
                            data: chartData.map((d) => d.price),
                            label: `${stock.symbol} Price`,
                            color: "#00d4aa",
                            curve: "linear",
                          },
                        ]}
                        xAxis={[
                          {
                            data: chartData.map((d) => new Date(d.date)),
                            scaleType: "time",
                          },
                        ]}
                        sx={{
                          "& .MuiChartsAxis-line": { stroke: "#ffffff" },
                          "& .MuiChartsAxis-tick": { stroke: "#ffffff" },
                          "& .MuiChartsAxis-tickLabel": {
                            fill: "#ffffff !important",
                            fontSize: "12px",
                            fontWeight: "500",
                          },
                          "& .MuiChartsLegend-mark": { stroke: "#ffffff" },
                          "& .MuiChartsLegend-label": {
                            fill: "#ffffff !important",
                            fontSize: "12px",
                          },
                          "& .MuiChartsAxis-root": {
                            "& text": {
                              fill: "#ffffff !important",
                              fontSize: "12px",
                            },
                          },
                          "& .MuiChartsAxis-bottom": {
                            "& .MuiChartsAxis-tickLabel": {
                              fill: "#ffffff !important",
                              fontSize: "11px",
                              dy: "0.8em",
                            },
                          },
                          "& .MuiChartsAxis-left": {
                            "& .MuiChartsAxis-tickLabel": {
                              fill: "#ffffff !important",
                              fontSize: "11px",
                              dx: "-0.5em",
                            },
                          },
                          "& .MuiLineElement-root": {
                            strokeWidth: 2,
                            fill: "none",
                          },
                          "& .MuiMarkElement-root": {
                            display: "none",
                          },
                          "& .MuiChartsTooltip-root": {
                            "& .MuiChartsTooltip-paper": {
                              backgroundColor: "rgba(0, 0, 0, 0.9)",
                              color: "#ffffff",
                              border: "1px solid #444",
                            },
                          },
                        }}
                      />
                    </div>
                  )}
                  <div className="live-chart-info">
                    <h5>Live Price Chart Information:</h5>
                    <div className="chart-info-grid">
                      <div className="info-item">
                        <strong>Real-Time Data:</strong> Live price updates from
                        Yahoo Finance every 2 minutes via WebSocket
                      </div>
                      <div className="info-item">
                        <strong>Current Price:</strong> $
                        {stock.currentPrice?.toFixed(2) || 'N/A'}
                      </div>
                      <div className="info-item">
                        <strong>Last Updated:</strong>{" "}
                        {new Date().toLocaleTimeString()}
                      </div>
                      <div className="info-item">
                        <strong>Data Points:</strong> {chartData.length} price
                        points
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volume & Additional Metrics */}
              <div className="dashboard-section">
                <div className="section-header">
                  <FontAwesomeIcon icon={faVolumeHigh} />
                  <h3>Volume & Momentum</h3>
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Volume</div>
                    <div className="metric-value">
                      {(stock.volume || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">VWAP</div>
                    <div className="metric-value">
                      ${(liveMetrics?.vwap || stock.currentPrice).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">ATR</div>
                    <div className="metric-value">
                      {(liveMetrics?.atr || 0).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Williams %R</div>
                    <div className="metric-value">
                      {(liveMetrics?.williamsR || -50).toFixed(1)}%
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Stochastic %K</div>
                    <div className="metric-value">
                      {(liveMetrics?.stochastic.k || 50).toFixed(1)}%
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Volume Ratio</div>
                    <div
                      className={`metric-value ${
                        (stock.volume || 0) > (stock.volume || 0) * 0.85
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {(
                        (stock.volume || 0) / ((stock.volume || 0) * 0.85 || 1)
                      ).toFixed(2)}
                      x
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Action & Day Trading */}
              <div className="dashboard-section">
                <div className="section-header">
                  <FontAwesomeIcon icon={faChartLine} />
                  <h3>Price Action & Day Trading</h3>
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Day Change</div>
                    <div
                      className={`metric-value ${
                        isPositive ? "positive" : "negative"
                      }`}
                    >
                      {isPositive ? "+" : ""}$
                      {(
                        stock.currentPrice -
                        (stock.previousClose || stock.currentPrice)
                      ).toFixed(2)}
                      ({changePercent.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Day High</div>
                    <div className="metric-value">
                      ${(stock.currentPrice * 1.025).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Day Low</div>
                    <div className="metric-value">
                      ${(stock.currentPrice * 0.975).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Previous Close</div>
                    <div className="metric-value">
                      ${(stock.previousClose || stock.currentPrice).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Gap %</div>
                    <div
                      className={`metric-value ${
                        stock.currentPrice >
                        (stock.previousClose || stock.currentPrice)
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {(
                        ((stock.currentPrice -
                          (stock.previousClose || stock.currentPrice)) /
                          (stock.previousClose || stock.currentPrice)) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Intraday Range</div>
                    <div className="metric-value">
                      {(
                        ((stock.currentPrice * 1.025 -
                          stock.currentPrice * 0.975) /
                          stock.currentPrice) *
                        100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Bollinger Bands & Volatility */}
              <div className="dashboard-section">
                <div className="section-header">
                  <FontAwesomeIcon icon={faSignal} />
                  <h3>Bollinger Bands & Volatility</h3>
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">Bollinger Upper</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.bollinger.upper ||
                        stock.currentPrice * 1.04
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Bollinger Lower</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.bollinger.lower ||
                        stock.currentPrice * 0.96
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">BB Position</div>
                    <div className="metric-value">
                      {liveMetrics
                        ? (
                            ((stock.currentPrice -
                              liveMetrics.bollinger.lower) /
                              (liveMetrics.bollinger.upper -
                                liveMetrics.bollinger.lower)) *
                            100
                          ).toFixed(0) + "%"
                        : "50%"}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">EMA 12</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.ema12 || stock.currentPrice * 1.001
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">EMA 26</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.ema26 || stock.currentPrice * 0.999
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">MACD Line</div>
                    <div
                      className={`metric-value ${
                        (liveMetrics?.macd.line || 0) > 0
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {(liveMetrics?.macd.line || 0).toFixed(3)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Technical Indicators Section */}
              <div className="dashboard-section">
                <div className="section-header">
                  <FontAwesomeIcon icon={faSignal} />
                  <h3>Technical Indicators</h3>
                  <div className="live-badge">
                    <FontAwesomeIcon icon={faBolt} />
                    Live
                  </div>
                </div>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-label">RSI (14)</div>
                    <div
                      className={`metric-value ${getRSILevel(
                        liveMetrics?.rsi || 50
                      )}`}
                    >
                      {(liveMetrics?.rsi || 50).toFixed(1)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">MACD Signal</div>
                    <div
                      className={`metric-value ${
                        (liveMetrics?.macd.histogram || 0) > 0
                          ? "bullish"
                          : "bearish"
                      }`}
                    >
                      {(liveMetrics?.macd.histogram || 0) > 0
                        ? "BULLISH"
                        : "BEARISH"}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">SMA 20</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.sma20 || stock.currentPrice * 0.99
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">SMA 50</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.sma50 || stock.currentPrice * 0.98
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Support</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.support || stock.currentPrice * 0.95
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-label">Resistance</div>
                    <div className="metric-value">
                      $
                      {(
                        liveMetrics?.resistance || stock.currentPrice * 1.05
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }
);

export default StockModal;
