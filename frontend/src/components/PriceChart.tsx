import React, { useEffect, useState } from "react";
import "./PriceChart.css";

interface PriceChartProps {
  symbol: string;
  currentPrice: number;
  changePercent: number;
}

interface PricePoint {
  time: string;
  price: number;
}

const PriceChart: React.FC<PriceChartProps> = ({
  symbol,
  currentPrice,
  changePercent,
}) => {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate real-time price updates
    const generateInitialData = () => {
      const points: PricePoint[] = [];
      const now = new Date();
      const basePrice = currentPrice;

      // Generate 20 data points over the last hour
      for (let i = 19; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 3 * 60 * 1000); // Every 3 minutes
        const randomVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const price = basePrice * (1 + randomVariation);

        points.push({
          time: time.toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: price,
        });
      }

      return points;
    };

    setPriceHistory(generateInitialData());
    setIsLoading(false);

    // Update with current price periodically
    const interval = setInterval(() => {
      setPriceHistory((prev) => {
        const newPoint: PricePoint = {
          time: new Date().toLocaleTimeString("en-US", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
          }),
          price: currentPrice,
        };

        // Keep only last 20 points
        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [currentPrice, symbol]);

  const renderChart = () => {
    if (isLoading || priceHistory.length === 0) {
      return <div className="chart-loading">Loading chart...</div>;
    }

    const prices = priceHistory.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create SVG path
    const width = 280;
    const height = 60;
    const padding = 10;

    const points = priceHistory
      .map((point, index) => {
        const x =
          padding + (index / (priceHistory.length - 1)) * (width - 2 * padding);
        const y =
          height -
          padding -
          ((point.price - minPrice) / priceRange) * (height - 2 * padding);
        return `${x},${y}`;
      })
      .join(" ");

    const chartColor = changePercent >= 0 ? "#00C851" : "#ff4444";

    return (
      <div className="chart-container">
        <svg width={width} height={height} className="price-chart-svg">
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="20"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 20 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Price line */}
          <polyline
            fill="none"
            stroke={chartColor}
            strokeWidth="2"
            points={points}
          />

          {/* Fill area under line */}
          <polygon
            fill={`${chartColor}20`}
            points={`${padding},${height - padding} ${points} ${
              width - padding
            },${height - padding}`}
          />

          {/* Current price dot */}
          {priceHistory.length > 0 && (
            <circle
              cx={
                padding +
                ((priceHistory.length - 1) / (priceHistory.length - 1)) *
                  (width - 2 * padding)
              }
              cy={
                height -
                padding -
                ((priceHistory[priceHistory.length - 1].price - minPrice) /
                  priceRange) *
                  (height - 2 * padding)
              }
              r="3"
              fill={chartColor}
            />
          )}
        </svg>

        <div className="chart-info">
          <div className="price-range">
            <span className="range-high">${maxPrice.toFixed(2)}</span>
            <span className="range-low">${minPrice.toFixed(2)}</span>
          </div>
          <div className="time-range">
            <span>{priceHistory[0]?.time}</span>
            <span>{priceHistory[priceHistory.length - 1]?.time}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="price-chart">
      <div className="chart-header">
        <span>Live Chart</span>
        <span className="chart-period">1H</span>
      </div>
      {renderChart()}
    </div>
  );
};

export default PriceChart;
