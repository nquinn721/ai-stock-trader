import React, { useEffect, useState } from "react";
import recommendationService from "../services/recommendationService";
import {
  EnhancedRecommendation,
  RecommendationExplanation,
  TradingRecommendation,
} from "../types/recommendation.types";
import "./RecommendationPanel.css";

interface RecommendationPanelProps {
  symbol: string;
  currentPrice: number;
  portfolioContext?: {
    currentHoldings: number;
    availableCash: number;
    riskTolerance: "LOW" | "MEDIUM" | "HIGH";
  };
  showEnhanced?: boolean;
  className?: string;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  symbol,
  currentPrice,
  portfolioContext,
  showEnhanced = false,
  className = "",
}) => {
  const [recommendation, setRecommendation] = useState<
    TradingRecommendation | EnhancedRecommendation | null
  >(null);
  const [explanation, setExplanation] =
    useState<RecommendationExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [timeHorizon, setTimeHorizon] = useState<"1D" | "1W" | "1M">("1D");
  useEffect(() => {
    if (symbol && currentPrice) {
      loadRecommendation();
    }
  }, [symbol, currentPrice, timeHorizon, showEnhanced]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      const request = {
        currentPrice,
        portfolioContext,
        timeHorizon,
      };

      let result;
      if (showEnhanced) {
        result = await recommendationService.generateEnhancedRecommendation(
          symbol,
          {
            ...request,
            ensembleOptions: {
              ensembleMethod: "meta_learning",
              includeConflictResolution: true,
              timeframes: ["1D", "1H", "4H"],
              confidenceThreshold: 0.7,
            },
          }
        );
      } else {
        result = await recommendationService.generateRecommendation(
          symbol,
          request
        );
      }

      setRecommendation(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load recommendation"
      );
      console.error("Error loading recommendation:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadExplanation = async () => {
    if (!explanation && recommendation) {
      try {
        const result = await recommendationService.getRecommendationExplanation(
          symbol
        );
        setExplanation(result);
      } catch (err) {
        console.error("Error loading explanation:", err);
      }
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BUY":
        return "#4caf50";
      case "SELL":
        return "#f44336";
      case "HOLD":
        return "#ff9800";
      default:
        return "#9e9e9e";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "#4caf50";
      case "MEDIUM":
        return "#ff9800";
      case "HIGH":
        return "#f44336";
      default:
        return "#9e9e9e";
    }
  };

  const getSuggestedPositionSize = () => {
    if (!recommendation || !portfolioContext) return null;

    return recommendationService.getRiskAdjustedPositionSize(
      recommendation,
      portfolioContext.availableCash,
      portfolioContext.riskTolerance
    );
  };

  const isEnhanced = (
    rec: TradingRecommendation | EnhancedRecommendation
  ): rec is EnhancedRecommendation => {
    return "ensembleSignals" in rec;
  };

  if (loading) {
    return (
      <div className={`recommendation-panel loading ${className}`}>
        <div className="recommendation-header">
          <h3>🤖 AI Recommendation</h3>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`recommendation-panel error ${className}`}>
        <div className="recommendation-header">
          <h3>🤖 AI Recommendation</h3>
          <button onClick={loadRecommendation} className="retry-btn">
            🔄 Retry
          </button>
        </div>
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className={`recommendation-panel empty ${className}`}>
        <div className="recommendation-header">
          <h3>🤖 AI Recommendation</h3>
        </div>
        <p>No recommendation available</p>
      </div>
    );
  }

  const formatted =
    recommendationService.formatRecommendationForDisplay(recommendation);
  const suggestedSize = getSuggestedPositionSize();
  const isActionable =
    recommendationService.isRecommendationActionable(recommendation);

  return (
    <div className={`recommendation-panel ${className}`}>
      <div className="recommendation-header">
        <h3>🤖 AI Recommendation</h3>
        <div className="time-horizon-selector">
          <select
            value={timeHorizon}
            onChange={(e) =>
              setTimeHorizon(e.target.value as "1D" | "1W" | "1M")
            }
            className="horizon-select"
          >
            <option value="1D">1 Day</option>
            <option value="1W">1 Week</option>
            <option value="1M">1 Month</option>
          </select>
        </div>
      </div>

      <div className="recommendation-content">
        {/* Main Recommendation */}
        <div className="main-recommendation">
          <div
            className="action-badge"
            style={{ backgroundColor: formatted.actionColor }}
          >
            {formatted.actionText}
          </div>
          <div className="confidence-info">
            <span className="confidence">{formatted.confidenceText}</span>
            <span className="confidence-label">Confidence</span>
          </div>
          <div
            className="risk-badge"
            style={{ color: getRiskColor(recommendation.riskLevel) }}
          >
            {recommendation.riskLevel} Risk
          </div>
        </div>

        {/* Summary */}
        <div className="recommendation-summary">
          <p>{formatted.summaryText}</p>
          {isActionable && (
            <div className="actionable-indicator">
              ✅ High confidence recommendation
            </div>
          )}
        </div>

        {/* Enhanced Features */}
        {isEnhanced(recommendation) && (
          <div className="enhanced-features">
            <div className="ensemble-info">
              <h4>🔀 Ensemble Analysis</h4>
              <div className="ensemble-metrics">
                <div className="metric">
                  <span className="label">Signal Strength:</span>
                  <span className="value">
                    {Math.round(
                      recommendation.ensembleSignals.signalStrength * 100
                    )}
                    %
                  </span>
                </div>
                <div className="metric">
                  <span className="label">Method:</span>
                  <span className="value">
                    {recommendation.ensembleSignals.ensembleMethod}
                  </span>
                </div>
                <div className="metric">
                  <span className="label">Composite Score:</span>
                  <span className="value">
                    {recommendation.compositeScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Position Sizing */}
        {suggestedSize && (
          <div className="position-sizing">
            <h4>💰 Suggested Position</h4>
            <div className="position-info">
              <span className="amount">${suggestedSize.toLocaleString()}</span>
              <span className="percentage">
                (
                {Math.round(
                  (suggestedSize / portfolioContext!.availableCash) * 100
                )}
                % of cash)
              </span>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="key-metrics">
          <div className="metric-grid">
            <div className="metric-item">
              <span className="metric-label">Market Prediction</span>
              <span className="metric-value">
                {recommendation.metrics.marketPrediction.direction}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Sentiment Score</span>
              <span className="metric-value">
                {recommendation.metrics.sentimentAnalysis.score.toFixed(2)}
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Technical Strength</span>
              <span className="metric-value">
                {Math.round(
                  recommendation.metrics.technicalSignals.strength * 100
                )}
                %
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Pattern Count</span>
              <span className="metric-value">
                {recommendation.metrics.patternRecognition.patterns.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action Levels */}
        {(recommendation.stopLoss || recommendation.takeProfit) && (
          <div className="action-levels">
            <h4>🎯 Price Targets</h4>
            <div className="levels-grid">
              {recommendation.stopLoss && (
                <div className="level stop-loss">
                  <span className="level-label">Stop Loss</span>
                  <span className="level-value">
                    ${recommendation.stopLoss.toFixed(2)}
                  </span>
                </div>
              )}
              {recommendation.takeProfit && (
                <div className="level take-profit">
                  <span className="level-label">Take Profit</span>
                  <span className="level-value">
                    ${recommendation.takeProfit.toFixed(2)}
                  </span>
                </div>
              )}
              {recommendation.metrics.marketPrediction.priceTarget && (
                <div className="level price-target">
                  <span className="level-label">Price Target</span>
                  <span className="level-value">
                    $
                    {recommendation.metrics.marketPrediction.priceTarget.toFixed(
                      2
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {recommendation.reasoning.length > 1 && (
          <div className="reasoning-section">
            <button
              className="details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "▼" : "▶"} View Details
            </button>

            {showDetails && (
              <div className="reasoning-details">
                <h4>💭 Analysis</h4>
                <ul className="reasoning-list">
                  {recommendation.reasoning.map((reason, index) => (
                    <li key={index} className="reasoning-item">
                      {reason}
                    </li>
                  ))}
                </ul>

                {/* Risk Factors */}
                <div className="risk-factors">
                  <h5>⚠️ Risk Factors</h5>
                  <ul>
                    {recommendation.metrics.riskAssessment.factors.map(
                      (factor, index) => (
                        <li key={index}>{factor}</li>
                      )
                    )}
                  </ul>
                </div>

                {/* Explanation Button */}
                {!explanation && (
                  <button className="explanation-btn" onClick={loadExplanation}>
                    📖 Get Detailed Explanation
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Detailed Explanation */}
        {explanation && showDetails && (
          <div className="detailed-explanation">
            <h4>📊 Detailed Analysis</h4>
            <div className="explanation-content">
              <p className="explanation-summary">
                {explanation.explanation.summary}
              </p>

              <div className="key-factors">
                <h5>Key Factors</h5>
                {explanation.explanation.keyFactors.map((factor, index) => (
                  <div
                    key={index}
                    className={`factor-item ${factor.impact.toLowerCase()}`}
                  >
                    <span className="factor-name">{factor.factor}</span>
                    <span className="factor-impact">{factor.impact}</span>
                    <span className="factor-weight">
                      {Math.round(factor.weight * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="recommendation-footer">
        <div className="timestamp">
          Updated: {new Date(recommendation.timestamp).toLocaleTimeString()}
        </div>
        <button
          className="refresh-btn"
          onClick={loadRecommendation}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default RecommendationPanel;
