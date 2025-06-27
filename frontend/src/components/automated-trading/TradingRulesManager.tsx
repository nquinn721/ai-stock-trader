import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStores } from "../../hooks/useStores";
import { TradingRuleDisplay, CreateTradingRuleDtoDisplay } from "../../types/autoTrading.types";
import RuleBuilder from "./RuleBuilder";
import "./TradingRulesManager.css";

interface TradingRulesManagerProps {
  portfolioId?: string;
}

const TradingRulesManager: React.FC<TradingRulesManagerProps> = observer(
  ({ portfolioId }) => {
    const { autoTradingStore } = useStores();
    const [showRuleBuilder, setShowRuleBuilder] = useState(false);
    const [editingRule, setEditingRule] = useState<TradingRuleDisplay | null>(null);

    useEffect(() => {
      if (portfolioId) {
        autoTradingStore.loadTradingRules(portfolioId);
      }
    }, [portfolioId, autoTradingStore]);

    const handleCreateRule = async (ruleData: CreateTradingRuleDtoDisplay) => {
      await autoTradingStore.createTradingRule(ruleData);
      setShowRuleBuilder(false);
    };

    const handleUpdateRule = async (ruleId: string, ruleData: Partial<TradingRuleDisplay>) => {
      await autoTradingStore.updateTradingRule(ruleId, ruleData);
      setEditingRule(null);
      setShowRuleBuilder(false);
    };

    const handleDeleteRule = async (ruleId: string) => {
      if (window.confirm("Are you sure you want to delete this rule?")) {
        await autoTradingStore.deleteTradingRule(ruleId);
      }
    };

    const handleToggleRule = async (ruleId: string, isActive: boolean) => {
      await autoTradingStore.toggleRuleStatus(ruleId, isActive);
    };

    const handleEditRule = (rule: TradingRuleDisplay) => {
      setEditingRule(rule);
      setShowRuleBuilder(true);
    };

    const handleCloseRuleBuilder = () => {
      setShowRuleBuilder(false);
      setEditingRule(null);
    };

    const formatPerformance = (performance: any) => {
      if (!performance) return { trades: 0, winRate: 0, pnl: 0 };
      return {
        trades: performance.totalTrades || 0,
        winRate: performance.winRate || 0,
        pnl: performance.totalPnL || 0,
      };
    };

    return (
      <div className="trading-rules-manager">
        <div className="rules-header">
          <h3>Trading Rules</h3>
          <button
            className="btn btn-primary"
            onClick={() => setShowRuleBuilder(true)}
            disabled={!portfolioId}
          >
            + Create Rule
          </button>
        </div>

        {!portfolioId ? (
          <div className="no-portfolio">
            <p>Please select a portfolio to manage trading rules.</p>
          </div>
        ) : autoTradingStore.tradingRules.length === 0 ? (
          <div className="no-rules">
            <p>No trading rules found. Create your first rule to get started.</p>
          </div>
        ) : (
          <div className="rules-list">
            {autoTradingStore.tradingRules.map((rule) => {
              const perf = formatPerformance(rule.performance);
              return (
                <div key={rule.id} className="rule-card">
                  <div className="rule-header">
                    <div className="rule-info">
                      <h4>{rule.name}</h4>
                      <span className="rule-strategy">{rule.ruleType}</span>
                    </div>
                    <div className="rule-controls">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                          disabled={autoTradingStore.isLoading}
                        />
                        <span className="slider"></span>
                      </label>
                      <button
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEditRule(rule)}
                        disabled={autoTradingStore.isLoading}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={autoTradingStore.isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="rule-details">
                    <div className="rule-conditions">
                      <h5>Conditions ({rule.conditions.length})</h5>
                      <div className="conditions-list">
                        {rule.conditions.map((condition, index) => (
                          <div key={index} className="condition-item">
                            <span className="condition-type">{condition.field}</span>
                            <span className="condition-operator">{condition.operator}</span>
                            <span className="condition-value">{condition.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rule-actions">
                      <h5>Actions ({rule.actions.length})</h5>
                      <div className="actions-list">
                        {rule.actions.map((action, index) => (
                          <div key={index} className="action-item">
                            <span className="action-type">{action.type}</span>
                            {action.size_value && (
                              <span className="action-quantity">Qty: {action.size_value}</span>
                            )}
                            {action.price_offset && (
                              <span className="action-price">Price: ${action.price_offset}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rule-performance">
                    <h5>Performance</h5>
                    <div className="performance-stats">
                      <div className="stat">
                        <label>Total Trades:</label>
                        <span>{perf.trades}</span>
                      </div>
                      <div className="stat">
                        <label>Win Rate:</label>
                        <span>{(perf.winRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="stat">
                        <label>P&L:</label>
                        <span className={perf.pnl >= 0 ? "profit" : "loss"}>
                          ${perf.pnl.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`rule-status ${rule.isActive ? "active" : "inactive"}`}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rule Builder Dialog */}
        {showRuleBuilder && (
          <div className="rule-builder-modal">
            <div className="modal-backdrop" onClick={handleCloseRuleBuilder}></div>
            <div className="modal-content">
              <div className="modal-header">
                <h3>{editingRule ? "Edit Rule" : "Create New Rule"}</h3>
                <button className="close-btn" onClick={handleCloseRuleBuilder}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <RuleBuilder
                  onRuleCreate={(ruleData: any) => {
                    if (editingRule) {
                      handleUpdateRule(editingRule.id, ruleData);
                    } else {
                      handleCreateRule(ruleData);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {autoTradingStore.error && (
          <div className="error-panel">
            <h4>Error</h4>
            <p>{autoTradingStore.error}</p>
            <button
              className="btn btn-secondary"
              onClick={() => autoTradingStore.clearError()}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    );
  }
);

export default TradingRulesManager;
