import React, { useEffect, useMemo, useState } from "react";
import "./CleanPortfolioAnalyticsDashboard.css";

interface PortfolioAnalyticsData {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  var95: number;
  performanceData: Array<{
    date: string;
    portfolioValue: number;
    benchmarkValue: number;
    returns: number;
  }>;
  sectorAllocation: Array<{
    sector: string;
    value: number;
    allocation: number;
  }>;
  riskReturnData: Array<{
    asset: string;
    risk: number;
    return: number;
    size: number;
  }>;
  benchmarkComparison: Array<{
    benchmark: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    alpha: number;
    beta: number;
  }>;
}

interface CleanPortfolioAnalyticsDashboardProps {
  portfolioId: number;
}

const CleanPortfolioAnalyticsDashboard: React.FC<
  CleanPortfolioAnalyticsDashboardProps
> = ({ portfolioId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [performanceWindow, setPerformanceWindow] = useState<
    "1M" | "3M" | "6M" | "1Y" | "3Y"
  >("1Y");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] =
    useState<PortfolioAnalyticsData | null>(null);

  // Mock data generation
  const mockAnalyticsData = useMemo((): PortfolioAnalyticsData => {
    const generatePerformanceData = () => {
      const data = [];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      for (let i = 0; i < 252; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const portfolioValue = 100000 + Math.random() * 20000 - 10000 + i * 100;
        const benchmarkValue = 100000 + Math.random() * 15000 - 7500 + i * 80;
        data.push({
          date: date.toISOString().split("T")[0],
          portfolioValue,
          benchmarkValue,
          returns: ((portfolioValue - 100000) / 100000) * 100,
        });
      }
      return data;
    };

    const generateSectorData = () => [
      { sector: "Technology", value: 45000, allocation: 45 },
      { sector: "Healthcare", value: 25000, allocation: 25 },
      { sector: "Finance", value: 15000, allocation: 15 },
      { sector: "Consumer", value: 10000, allocation: 10 },
      { sector: "Energy", value: 5000, allocation: 5 },
    ];

    const generateRiskReturnData = () => [
      { asset: "AAPL", risk: 15.2, return: 12.5, size: 25000 },
      { asset: "GOOGL", risk: 18.7, return: 15.2, size: 20000 },
      { asset: "MSFT", risk: 14.8, return: 11.8, size: 22000 },
      { asset: "TSLA", risk: 35.2, return: 25.8, size: 15000 },
      { asset: "NVDA", risk: 28.5, return: 22.1, size: 18000 },
    ];

    const generateBenchmarkComparison = () => [
      {
        benchmark: "S&P 500",
        portfolioReturn: 12.5,
        benchmarkReturn: 10.2,
        alpha: 2.3,
        beta: 1.05,
      },
      {
        benchmark: "NASDAQ",
        portfolioReturn: 12.5,
        benchmarkReturn: 14.8,
        alpha: -2.3,
        beta: 0.85,
      },
      {
        benchmark: "Russell 2000",
        portfolioReturn: 12.5,
        benchmarkReturn: 8.9,
        alpha: 3.6,
        beta: 0.92,
      },
    ];

    return {
      totalValue: 125450.75,
      totalReturn: 25450.75,
      totalReturnPercent: 25.45,
      dayChange: 1250.3,
      dayChangePercent: 1.01,
      alpha: 2.3,
      beta: 1.05,
      sharpeRatio: 1.45,
      maxDrawdown: -8.5,
      volatility: 15.2,
      var95: -2850.5,
      performanceData: generatePerformanceData(),
      sectorAllocation: generateSectorData(),
      riskReturnData: generateRiskReturnData(),
      benchmarkComparison: generateBenchmarkComparison(),
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [portfolioId, mockAnalyticsData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const handleExportReport = () => {
    console.log("Exporting portfolio analytics report...");
    // TODO: Implement PDF export functionality
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Loading portfolio analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-dashboard">
        <div className="error-state">
          <span className="error-icon">⚠️</span>
          <h3>Unable to Load Analytics</h3>
          <p>Please try again later or check your portfolio data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Header with Live Indicator */}
      <header className="analytics-header">
        <div className="header-left">
          <div className="header-title">
            <h1>Portfolio Analytics</h1>
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">LIVE</span>
            </div>
          </div>
          <p className="header-subtitle">
            Comprehensive portfolio performance analysis and risk metrics
          </p>
        </div>
        <div className="header-actions">
          <select
            value={performanceWindow}
            onChange={(e) => setPerformanceWindow(e.target.value as any)}
            className="time-selector"
          >
            <option value="1M">1 Month</option>
            <option value="3M">3 Months</option>
            <option value="6M">6 Months</option>
            <option value="1Y">1 Year</option>
            <option value="3Y">3 Years</option>
          </select>
          <button className="export-btn" onClick={handleExportReport}>
            📊 Export Report
          </button>
        </div>
      </header>

      {/* Key Metrics Summary */}
      <div className="metrics-summary">
        <div className="metric-card primary">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <div className="metric-label">Total Value</div>
            <div className="metric-value">
              {formatCurrency(analyticsData.totalValue)}
            </div>
            <div
              className={`metric-change ${
                analyticsData.dayChange >= 0 ? "positive" : "negative"
              }`}
            >
              {formatCurrency(analyticsData.dayChange)} (
              {formatPercentage(analyticsData.dayChangePercent)}) today
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-label">Total Return</div>
            <div
              className={`metric-value ${
                analyticsData.totalReturn >= 0 ? "positive" : "negative"
              }`}
            >
              {formatPercentage(analyticsData.totalReturnPercent)}
            </div>
            <div className="metric-subtitle">
              {formatCurrency(analyticsData.totalReturn)}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">⚡</div>
          <div className="metric-content">
            <div className="metric-label">Sharpe Ratio</div>
            <div className="metric-value">
              {analyticsData.sharpeRatio.toFixed(2)}
            </div>
            <div className="metric-subtitle">Risk-adjusted return</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📉</div>
          <div className="metric-content">
            <div className="metric-label">Max Drawdown</div>
            <div className="metric-value negative">
              {formatPercentage(analyticsData.maxDrawdown)}
            </div>
            <div className="metric-subtitle">Peak-to-trough decline</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-label">Alpha</div>
            <div
              className={`metric-value ${
                analyticsData.alpha >= 0 ? "positive" : "negative"
              }`}
            >
              {formatPercentage(analyticsData.alpha)}
            </div>
            <div className="metric-subtitle">vs S&P 500</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <div className="metric-label">Beta</div>
            <div className="metric-value">{analyticsData.beta.toFixed(2)}</div>
            <div className="metric-subtitle">Market correlation</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-list">
          <button
            className={`tab-button ${activeTab === 0 ? "active" : ""}`}
            onClick={() => setActiveTab(0)}
          >
            📈 Performance
          </button>
          <button
            className={`tab-button ${activeTab === 1 ? "active" : ""}`}
            onClick={() => setActiveTab(1)}
          >
            🥧 Allocation
          </button>
          <button
            className={`tab-button ${activeTab === 2 ? "active" : ""}`}
            onClick={() => setActiveTab(2)}
          >
            ⚠️ Risk Analysis
          </button>
          <button
            className={`tab-button ${activeTab === 3 ? "active" : ""}`}
            onClick={() => setActiveTab(3)}
          >
            📊 Benchmarks
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Performance Tab */}
        {activeTab === 0 && (
          <div className="performance-tab">
            <div className="charts-grid">
              <div className="chart-card large">
                <div className="chart-header">
                  <h3>Portfolio Performance</h3>
                  <p>vs Benchmark over {performanceWindow}</p>
                </div>
                <div className="chart-container">
                  <div className="mock-chart performance-chart">
                    <div className="chart-line portfolio"></div>
                    <div className="chart-line benchmark"></div>
                    <div className="chart-legend">
                      <span className="legend-item portfolio">Portfolio</span>
                      <span className="legend-item benchmark">S&P 500</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Returns Distribution</h3>
                  <p>Monthly returns histogram</p>
                </div>
                <div className="chart-container">
                  <div className="mock-chart histogram-chart">
                    <div className="histogram-bars">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="histogram-bar"
                          style={{ height: `${Math.random() * 80 + 20}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="performance-metrics">
              <div className="metrics-row">
                <div className="metric-item">
                  <span className="metric-label">Volatility</span>
                  <span className="metric-value">
                    {formatPercentage(analyticsData.volatility)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">VaR (95%)</span>
                  <span className="metric-value negative">
                    {formatCurrency(analyticsData.var95)}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Best Month</span>
                  <span className="metric-value positive">+8.2%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Worst Month</span>
                  <span className="metric-value negative">-4.1%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Allocation Tab */}
        {activeTab === 1 && (
          <div className="allocation-tab">
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Sector Allocation</h3>
                  <p>Current portfolio breakdown</p>
                </div>
                <div className="chart-container">
                  <div className="pie-chart-container">
                    <div className="pie-chart">
                      {analyticsData.sectorAllocation.map((sector, index) => (
                        <div
                          key={sector.sector}
                          className="pie-slice"
                          style={
                            {
                              "--percentage": sector.allocation,
                              "--color": `hsl(${index * 72}, 70%, 60%)`,
                            } as any
                          }
                        ></div>
                      ))}
                    </div>
                    <div className="pie-legend">
                      {analyticsData.sectorAllocation.map((sector, index) => (
                        <div key={sector.sector} className="legend-item">
                          <span
                            className="legend-color"
                            style={{
                              backgroundColor: `hsl(${index * 72}, 70%, 60%)`,
                            }}
                          ></span>
                          <span className="legend-text">
                            {sector.sector} ({sector.allocation}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Asset Allocation</h3>
                  <p>By market value</p>
                </div>
                <div className="allocation-list">
                  {analyticsData.sectorAllocation.map((sector) => (
                    <div key={sector.sector} className="allocation-item">
                      <div className="allocation-info">
                        <span className="allocation-name">{sector.sector}</span>
                        <span className="allocation-percentage">
                          {sector.allocation}%
                        </span>
                      </div>
                      <div className="allocation-bar">
                        <div
                          className="allocation-fill"
                          style={{ width: `${sector.allocation}%` }}
                        ></div>
                      </div>
                      <span className="allocation-value">
                        {formatCurrency(sector.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Analysis Tab */}
        {activeTab === 2 && (
          <div className="risk-tab">
            <div className="charts-grid">
              <div className="chart-card large">
                <div className="chart-header">
                  <h3>Risk-Return Scatter</h3>
                  <p>Asset positioning by risk and return</p>
                </div>
                <div className="chart-container">
                  <div className="scatter-chart">
                    {analyticsData.riskReturnData.map((asset) => (
                      <div
                        key={asset.asset}
                        className="scatter-point"
                        style={
                          {
                            left: `${(asset.risk / 40) * 100}%`,
                            bottom: `${(asset.return / 30) * 100}%`,
                            "--size": `${Math.sqrt(asset.size / 1000)}px`,
                          } as any
                        }
                      >
                        <span className="point-label">{asset.asset}</span>
                      </div>
                    ))}
                    <div className="scatter-axes">
                      <div className="x-axis-label">Risk (Volatility %)</div>
                      <div className="y-axis-label">Return %</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Risk Metrics</h3>
                  <p>Portfolio risk assessment</p>
                </div>
                <div className="risk-metrics">
                  <div className="risk-gauge">
                    <div className="gauge-container">
                      <div className="gauge-arc"></div>
                      <div
                        className="gauge-needle"
                        style={{ "--angle": "45deg" } as any}
                      ></div>
                      <div className="gauge-center">
                        <span className="gauge-value">Medium</span>
                        <span className="gauge-label">Risk Level</span>
                      </div>
                    </div>
                  </div>
                  <div className="risk-breakdown">
                    <div className="risk-item">
                      <span className="risk-label">Market Risk</span>
                      <div className="risk-bar">
                        <div
                          className="risk-fill medium"
                          style={{ width: "65%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="risk-item">
                      <span className="risk-label">Credit Risk</span>
                      <div className="risk-bar">
                        <div
                          className="risk-fill low"
                          style={{ width: "25%" }}
                        ></div>
                      </div>
                    </div>
                    <div className="risk-item">
                      <span className="risk-label">Liquidity Risk</span>
                      <div className="risk-bar">
                        <div
                          className="risk-fill low"
                          style={{ width: "15%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benchmarks Tab */}
        {activeTab === 3 && (
          <div className="benchmarks-tab">
            <div className="benchmark-comparison">
              {analyticsData.benchmarkComparison.map((benchmark) => (
                <div key={benchmark.benchmark} className="benchmark-card">
                  <div className="benchmark-header">
                    <h4>{benchmark.benchmark}</h4>
                  </div>
                  <div className="benchmark-metrics">
                    <div className="benchmark-metric">
                      <span className="metric-label">Portfolio Return</span>
                      <span
                        className={`metric-value ${
                          benchmark.portfolioReturn >= 0
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {formatPercentage(benchmark.portfolioReturn)}
                      </span>
                    </div>
                    <div className="benchmark-metric">
                      <span className="metric-label">Benchmark Return</span>
                      <span
                        className={`metric-value ${
                          benchmark.benchmarkReturn >= 0
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {formatPercentage(benchmark.benchmarkReturn)}
                      </span>
                    </div>
                    <div className="benchmark-metric">
                      <span className="metric-label">Alpha</span>
                      <span
                        className={`metric-value ${
                          benchmark.alpha >= 0 ? "positive" : "negative"
                        }`}
                      >
                        {formatPercentage(benchmark.alpha)}
                      </span>
                    </div>
                    <div className="benchmark-metric">
                      <span className="metric-label">Beta</span>
                      <span className="metric-value">
                        {benchmark.beta.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="performance-comparison">
                    <div className="comparison-bar">
                      <div
                        className="portfolio-bar"
                        style={{
                          width: `${Math.abs(benchmark.portfolioReturn) * 3}%`,
                        }}
                      ></div>
                      <div
                        className="benchmark-bar"
                        style={{
                          width: `${Math.abs(benchmark.benchmarkReturn) * 3}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanPortfolioAnalyticsDashboard;
