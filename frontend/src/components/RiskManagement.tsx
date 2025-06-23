import React from "react";
import { RiskManagementRecommendation } from "../types";

interface RiskManagementProps {
  riskManagement: RiskManagementRecommendation;
  currentPrice: number;
  symbol: string;
}

const RiskManagement: React.FC<RiskManagementProps> = ({
  riskManagement,
  currentPrice,
  symbol,
}) => {
  const getRiskColor = (recommendation: string) => {
    switch (recommendation) {
      case "PROCEED":
        return "text-green-600";
      case "REDUCE_SIZE":
        return "text-yellow-600";
      case "WAIT":
        return "text-orange-600";
      case "AVOID":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getPortfolioRiskColor = (risk: string) => {
    switch (risk) {
      case "low_risk":
        return "text-green-600";
      case "moderate_risk":
        return "text-yellow-600";
      case "high_risk":
        return "text-orange-600";
      case "excessive_risk":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    if (score >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">
        Risk Management Analysis - {symbol}
      </h3>

      {/* Overall Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Risk Score</span>
          <span
            className={`text-xl font-bold ${getRiskScoreColor(
              riskManagement.riskScore
            )}`}
          >
            {riskManagement.riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              riskManagement.riskScore >= 70
                ? "bg-green-500"
                : riskManagement.riskScore >= 50
                ? "bg-yellow-500"
                : riskManagement.riskScore >= 30
                ? "bg-orange-500"
                : "bg-red-500"
            }`}
            style={{ width: `${riskManagement.riskScore}%` }}
          ></div>
        </div>
      </div>

      {/* Overall Recommendation */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Recommendation</span>
          <span
            className={`text-lg font-bold ${getRiskColor(
              riskManagement.recommendation
            )}`}
          >
            {riskManagement.recommendation}
          </span>
        </div>
        <ul className="text-sm text-gray-600 space-y-1">
          {riskManagement.reasoning.map((reason, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Position Sizing */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Position Sizing</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Recommended Shares</div>
            <div className="text-lg font-semibold text-blue-600">
              {riskManagement.positionSizing.recommendedShares.toLocaleString()}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Position Size</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(riskManagement.positionSizing.positionSize)}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Portfolio Allocation</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatPercentage(
                riskManagement.positionSizing.portfolioAllocation
              )}
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-gray-600">Max Risk Amount</div>
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(riskManagement.positionSizing.maxRiskAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk/Reward Analysis */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Risk/Reward Analysis</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600">Risk/Reward Ratio</div>
            <div className="text-xl font-bold text-green-600">
              {riskManagement.riskReward.riskRewardRatio.toFixed(2)}:1
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600">Break-Even Win Rate</div>
            <div className="text-lg font-semibold text-green-600">
              {formatPercentage(
                riskManagement.riskReward.breakEvenProbability * 100
              )}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600">Potential Risk</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(riskManagement.riskReward.riskAmount)}
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-gray-600">Potential Reward</div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(riskManagement.riskReward.rewardAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Stop Loss */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Stop Loss Recommendations</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-gray-600">Recommended Stop</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(riskManagement.stopLoss.recommendedStop)}
            </div>
            <div className="text-xs text-gray-500">
              {formatPercentage(riskManagement.stopLoss.percentage)} from entry
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-gray-600">Stop Type</div>
            <div className="text-lg font-semibold text-red-600 capitalize">
              {riskManagement.stopLoss.stopType}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-gray-600">Technical Stop</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(riskManagement.stopLoss.technicalStop)}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-gray-600">ATR-Based Stop</div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(riskManagement.stopLoss.atrBasedStop)}
            </div>
          </div>
        </div>
      </div>

      {/* Take Profit Targets */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Take Profit Targets</h4>
        <div className="space-y-3">
          {riskManagement.takeProfit.targets.map((target, index) => (
            <div key={index} className="bg-green-50 p-3 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-green-700">
                    Target {index + 1}: {formatCurrency(target.price)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {target.reasoning} • {formatPercentage(target.percentage)}{" "}
                    upside
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    {formatPercentage(target.probability * 100)}
                  </div>
                  <div className="text-xs text-gray-500">probability</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio Risk */}
      <div className="mb-4">
        <h4 className="font-medium mb-3">Portfolio Risk Assessment</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Current Exposure</div>
            <div className="text-lg font-semibold text-gray-700">
              {formatPercentage(riskManagement.portfolioRisk.currentExposure)}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">After Trade Exposure</div>
            <div className="text-lg font-semibold text-gray-700">
              {formatPercentage(
                riskManagement.portfolioRisk.afterTradeExposure
              )}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Portfolio Risk Level</div>
            <div
              className={`text-lg font-semibold capitalize ${getPortfolioRiskColor(
                riskManagement.portfolioRisk.recommendation
              )}`}
            >
              {riskManagement.portfolioRisk.recommendation.replace("_", " ")}
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Sector Concentration</div>
            <div className="text-lg font-semibold text-gray-700">
              {formatPercentage(
                riskManagement.portfolioRisk.sectorConcentration
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskManagement;
