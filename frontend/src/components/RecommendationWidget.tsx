import React, { useEffect, useState } from "react";
import recommendationService from "../services/recommendationService";
import { TradingRecommendation } from "../types/recommendation.types";
import "./RecommendationWidget.css";

interface RecommendationWidgetProps {
  symbol: string;
  currentPrice: number;
  compact?: boolean;
  className?: string;
  onRecommendationClick?: (recommendation: TradingRecommendation) => void;
}

const RecommendationWidget: React.FC<RecommendationWidgetProps> = ({
  symbol,
  currentPrice,
  compact = true,
  className = "",
  onRecommendationClick,
}) => {
  const [recommendation, setRecommendation] =
    useState<TradingRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (symbol && currentPrice) {
      loadQuickRecommendation();
    }
  }, [symbol, currentPrice]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuickRecommendation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await recommendationService.getQuickRecommendation(
        symbol,
        currentPrice,
        "MEDIUM"
      );
      setRecommendation(result);
    } catch (err) {
      setError("Failed to load");
      console.error("Error loading quick recommendation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (recommendation && onRecommendationClick) {
      onRecommendationClick(recommendation);
    }
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

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BUY":
        return "📈";
      case "SELL":
        return "📉";
      case "HOLD":
        return "⏸️";
      default:
        return "🤖";
    }
  };

  const isActionable = recommendation
    ? recommendationService.isRecommendationActionable(recommendation, 0.6)
    : false;

  if (loading) {
    return (
      <div
        className={`recommendation-widget loading ${
          compact ? "compact" : ""
        } ${className}`}
      >
        <div className="widget-spinner"></div>
        {!compact && <span className="loading-text">AI</span>}
      </div>
    );
  }

  if (error || !recommendation) {
    return (
      <div
        className={`recommendation-widget error ${
          compact ? "compact" : ""
        } ${className}`}
      >
        <span className="error-icon">❌</span>
        {!compact && <span className="error-text">N/A</span>}
      </div>
    );
  }

  const confidence = Math.round(recommendation.confidence * 100);

  if (compact) {
    return (
      <div
        className={`recommendation-widget compact ${
          isActionable ? "actionable" : ""
        } ${className}`}
        onClick={handleClick}
        title={`AI Recommendation: ${recommendation.action} (${confidence}% confidence)`}
      >
        <div
          className="action-indicator"
          style={{ backgroundColor: getActionColor(recommendation.action) }}
        >
          <span className="action-icon">
            {getActionIcon(recommendation.action)}
          </span>
          <span className="action-text">{recommendation.action}</span>
        </div>
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{
              width: `${confidence}%`,
              backgroundColor: getActionColor(recommendation.action),
            }}
          />
        </div>
        {isActionable && <div className="actionable-dot" />}
      </div>
    );
  }

  // Full widget layout
  return (
    <div
      className={`recommendation-widget full ${
        isActionable ? "actionable" : ""
      } ${className}`}
      onClick={handleClick}
    >
      <div className="widget-header">
        <span className="ai-icon">🤖</span>
        <span className="widget-title">AI Rec</span>
      </div>

      <div className="recommendation-content">
        <div
          className="action-badge"
          style={{ backgroundColor: getActionColor(recommendation.action) }}
        >
          <span className="action-icon">
            {getActionIcon(recommendation.action)}
          </span>
          <span className="action-text">{recommendation.action}</span>
        </div>

        <div className="confidence-section">
          <span className="confidence-value">{confidence}%</span>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{
                width: `${confidence}%`,
                backgroundColor: getActionColor(recommendation.action),
              }}
            />
          </div>
        </div>

        <div className="risk-indicator">
          <span
            className={`risk-level ${recommendation.riskLevel.toLowerCase()}`}
          >
            {recommendation.riskLevel}
          </span>
        </div>
      </div>

      {isActionable && (
        <div className="actionable-indicator">
          <span className="pulse-dot" />
          <span className="actionable-text">High Confidence</span>
        </div>
      )}

      {recommendation.reasoning.length > 0 && (
        <div className="widget-summary">
          {recommendation.reasoning[0].substring(0, 50)}...
        </div>
      )}
    </div>
  );
};

export default RecommendationWidget;
