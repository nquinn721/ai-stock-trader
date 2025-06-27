import {
  Analytics,
  CheckCircle,
  Psychology,
  Settings,
  Timeline,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import {
  HybridSignalConfig,
  hybridSignalService,
} from "../services/hybridSignalService";
import { HybridSignal } from "../types";
import "./HybridSignalDashboard.css";

interface HybridSignalDashboardProps {
  onSignalSelect?: (signal: HybridSignal) => void;
  onConfigUpdate?: (config: HybridSignalConfig) => void;
}

const HybridSignalDashboard: React.FC<HybridSignalDashboardProps> = ({
  onSignalSelect,
  onConfigUpdate,
}) => {
  const [signals, setSignals] = useState<HybridSignal[]>([]);
  const [config, setConfig] = useState<HybridSignalConfig>(
    hybridSignalService.getConfig()
  );
  const [showConfig, setShowConfig] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSignals();
  }, [config]);

  const loadSignals = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration - replace with real API calls
      const mockTraditionalSignals = [
        {
          symbol: "AAPL",
          action: "buy" as const,
          confidence: 0.78,
          indicators: {
            rsi: 65,
            macd: 0.5,
            bollingerBands: 0.3,
            movingAverage: 0.6,
          },
          reasoning: [
            "RSI indicates oversold condition",
            "MACD bullish crossover",
          ],
          timestamp: new Date().toISOString(),
          price: 185.5,
        },
        {
          symbol: "GOOGL",
          action: "sell" as const,
          confidence: 0.72,
          indicators: {
            rsi: 82,
            macd: -0.3,
            bollingerBands: 0.8,
            movingAverage: -0.2,
          },
          reasoning: ["RSI overbought", "Bearish divergence"],
          timestamp: new Date().toISOString(),
          price: 2750.25,
        },
      ];

      const mockAISignals = [
        {
          symbol: "AAPL",
          action: "buy" as const,
          confidence: 0.85,
          modelType: "dqn" as const,
          features: {
            technicalScore: 0.8,
            sentimentScore: 0.7,
            volumeScore: 0.9,
            momentumScore: 0.8,
          },
          reasoning: [
            "Strong momentum pattern detected",
            "Positive sentiment trend",
          ],
          timestamp: new Date().toISOString(),
          price: 185.5,
        },
        {
          symbol: "GOOGL",
          action: "hold" as const,
          confidence: 0.68,
          modelType: "ppo" as const,
          features: {
            technicalScore: 0.6,
            sentimentScore: 0.5,
            volumeScore: 0.7,
            momentumScore: 0.4,
          },
          reasoning: [
            "Mixed signals from multiple timeframes",
            "Uncertain market regime",
          ],
          timestamp: new Date().toISOString(),
          price: 2750.25,
        },
      ];

      const hybridSignals = hybridSignalService.generatePortfolioSignals(
        mockTraditionalSignals,
        mockAISignals
      );

      setSignals(hybridSignals);
    } catch (error) {
      console.error("Failed to load signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (
    field: keyof HybridSignalConfig,
    value: number | boolean
  ) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    hybridSignalService.updateConfig(newConfig);
    onConfigUpdate?.(newConfig);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "buy":
        return <TrendingUp className="action-icon buy" />;
      case "sell":
        return <TrendingDown className="action-icon sell" />;
      default:
        return <Timeline className="action-icon hold" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "human":
        return <Analytics className="source-icon human" />;
      case "ai":
        return <Psychology className="source-icon ai" />;
      default:
        return <CheckCircle className="source-icon combined" />;
    }
  };

  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.8) return "high";
    if (confidence >= 0.6) return "medium";
    return "low";
  };

  return (
    <div className="hybrid-signal-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>Hybrid Signal Intelligence</h2>
          <p>AI + Traditional Analysis Combined</p>
        </div>
        <div className="header-actions">
          <button
            className="config-btn"
            onClick={() => setShowConfig(!showConfig)}
          >
            <Settings />
            Configure
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="config-panel">
          <h3>Signal Configuration</h3>
          <div className="config-grid">
            <div className="config-item">
              <label>Traditional Weight</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.traditionalWeight}
                onChange={(e) =>
                  handleConfigChange(
                    "traditionalWeight",
                    parseFloat(e.target.value)
                  )
                }
              />
              <span>{(config.traditionalWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="config-item">
              <label>AI Weight</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.aiWeight}
                onChange={(e) =>
                  handleConfigChange("aiWeight", parseFloat(e.target.value))
                }
              />
              <span>{(config.aiWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="config-item">
              <label>Confidence Threshold</label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.05"
                value={config.confidenceThreshold}
                onChange={(e) =>
                  handleConfigChange(
                    "confidenceThreshold",
                    parseFloat(e.target.value)
                  )
                }
              />
              <span>{(config.confidenceThreshold * 100).toFixed(0)}%</span>
            </div>
            <div className="config-item">
              <label>Divergence Alert</label>
              <input
                type="checkbox"
                checked={config.enableDisagreementAlert}
                onChange={(e) =>
                  handleConfigChange(
                    "enableDisagreementAlert",
                    e.target.checked
                  )
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* Signals Grid */}
      <div className="signals-container">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Generating hybrid signals...</p>
          </div>
        ) : signals.length > 0 ? (
          <div className="signals-grid">
            {signals.map((signal, index) => (
              <div
                key={`${signal.symbol}-${index}`}
                className={`signal-card ${signal.action} ${getConfidenceLevel(signal.confidence)}`}
                onClick={() => onSignalSelect?.(signal)}
              >
                <div className="signal-header">
                  <div className="symbol-section">
                    <span className="symbol">{signal.symbol}</span>
                    <span className="price">${signal.price.toFixed(2)}</span>
                  </div>
                  <div className="source-indicator">
                    {getSourceIcon(signal.source)}
                    <span className="source-label">{signal.source}</span>
                  </div>
                </div>

                <div className="signal-action">
                  {getActionIcon(signal.action)}
                  <span className="action-text">
                    {signal.action.toUpperCase()}
                  </span>
                </div>

                <div className="confidence-section">
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{ width: `${signal.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="confidence-text">
                    {(signal.confidence * 100).toFixed(1)}% confidence
                  </span>
                </div>

                <div className="signal-reasoning">
                  {signal.reasoning.slice(0, 2).map((reason, idx) => (
                    <div key={idx} className="reason-item">
                      {reason.includes("Traditional") && (
                        <Analytics className="mini-icon" />
                      )}
                      {reason.includes("AI") && (
                        <Psychology className="mini-icon" />
                      )}
                      {reason.includes("⚠️") && (
                        <Warning className="mini-icon warning" />
                      )}
                      <span>{reason.replace(/^(Traditional:|AI:)/, "")}</span>
                    </div>
                  ))}
                  {signal.reasoning.length > 2 && (
                    <div className="more-reasons">
                      +{signal.reasoning.length - 2} more reasons
                    </div>
                  )}
                </div>

                <div className="signal-metadata">
                  <span className="weight">
                    Weight: {(signal.weight * 100).toFixed(0)}%
                  </span>
                  <span className="timestamp">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Psychology className="empty-icon" />
            <h3>No Hybrid Signals Available</h3>
            <p>Adjust configuration or wait for new market data</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HybridSignalDashboard;
