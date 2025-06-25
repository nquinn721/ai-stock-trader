import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useAutoTradingStore } from "../../stores/StoreContext";
import { TradingRule } from "../../types/autoTrading.types";
import "./TradingRulesManager.css";

interface TradingRulesManagerProps {
  portfolioId?: string;
}

const TradingRulesManager: React.FC<TradingRulesManagerProps> = observer(
  ({ portfolioId }) => {
    const autoTradingStore = useAutoTradingStore();
    const [selectedRule, setSelectedRule] = useState<TradingRule | null>(null);
    const [showRuleBuilder, setShowRuleBuilder] = useState(false);
    const [filterStatus, setFilterStatus] = useState<
      "all" | "active" | "inactive"
    >("all");

    useEffect(() => {
      autoTradingStore.loadTradingRules(portfolioId);
    }, [portfolioId]);

    const filteredRules = autoTradingStore.tradingRules.filter((rule) => {
      if (portfolioId && rule.portfolioId !== portfolioId) return false;
      if (filterStatus === "active") return rule.isActive;
      if (filterStatus === "inactive") return !rule.isActive;
      return true;
    });

    const handleToggleRule = async (rule: TradingRule) => {
      await autoTradingStore.updateTradingRule(rule.id, {
        isActive: !rule.isActive,
      });
    };

    const handleDeleteRule = async (ruleId: string) => {
      if (
        window.confirm("Are you sure you want to delete this trading rule?")
      ) {
        await autoTradingStore.deleteTradingRule(ruleId);
      }
    };

    const handleDuplicateRule = async (rule: TradingRule) => {
      const duplicatedRule = {
        ...rule,
        name: `${rule.name} (Copy)`,
        isActive: false,
      };
      delete (duplicatedRule as any).id;
      await autoTradingStore.createTradingRule(duplicatedRule);
    };

    const handleImportRules = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const rules = JSON.parse(e.target?.result as string);
            await autoTradingStore.importTradingRules(rules);
          } catch (error) {
            console.error("Failed to import rules:", error);
          }
        };
        reader.readAsText(file);
      }
    };

    const handleExportRules = () => {
      const rulesToExport = portfolioId
        ? filteredRules
        : autoTradingStore.tradingRules;

      const dataStr = JSON.stringify(rulesToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `trading-rules-${portfolioId || "all"}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();

      URL.revokeObjectURL(url);
    };

    const getRuleStatusColor = (rule: TradingRule) => {
      if (!rule.isActive) return "inactive";
      if (
        rule.lastTriggered &&
        new Date(rule.lastTriggered).getTime() >
          Date.now() - 24 * 60 * 60 * 1000
      ) {
        return "recently-triggered";
      }
      return "active";
    };

    if (autoTradingStore.isLoading) {
      return (
        <div className="trading-rules-manager loading">
          <div className="loading-spinner">Loading trading rules...</div>
        </div>
      );
    }

    return (
      <div className="trading-rules-manager">
        <div className="rules-header">
          <div className="header-actions">
            <h3>
              Trading Rules {portfolioId && `for Portfolio ${portfolioId}`}
            </h3>
            <div className="action-buttons">
              <button
                className="btn-primary"
                onClick={() => setShowRuleBuilder(true)}
              >
                Create Rule
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowRuleBuilder(true)}
              >
                From Template
              </button>
              <input
                type="file"
                accept=".json"
                onChange={handleImportRules}
                style={{ display: "none" }}
                id="import-rules"
              />
              <label htmlFor="import-rules" className="btn-secondary">
                Import
              </label>
              <button
                className="btn-secondary"
                onClick={handleExportRules}
                disabled={filteredRules.length === 0}
              >
                Export ({filteredRules.length})
              </button>
            </div>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">All Rules</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {autoTradingStore.error && (
          <div className="error-message">Error: {autoTradingStore.error}</div>
        )}

        <div className="rules-list">
          {filteredRules.length === 0 ? (
            <div className="no-rules">
              <div className="no-rules-content">
                <h4>No trading rules found</h4>
                <p>
                  Get started by creating your first automated trading rule.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setShowRuleBuilder(true)}
                >
                  Create Your First Rule
                </button>
              </div>
            </div>
          ) : (
            filteredRules.map((rule) => (
              <div
                key={rule.id}
                className={`rule-card ${getRuleStatusColor(rule)}`}
                onClick={() => setSelectedRule(rule)}
              >
                <div className="rule-header">
                  <div className="rule-title">
                    <h4>{rule.name}</h4>
                    <span
                      className={`status-badge ${
                        rule.isActive ? "active" : "inactive"
                      }`}
                    >
                      {rule.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div
                    className="rule-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`toggle-btn ${
                        rule.isActive ? "active" : "inactive"
                      }`}
                      onClick={() => handleToggleRule(rule)}
                      title={
                        rule.isActive ? "Deactivate rule" : "Activate rule"
                      }
                    >
                      {rule.isActive ? "⏸" : "▶"}
                    </button>
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setSelectedRule(rule);
                        setShowRuleBuilder(true);
                      }}
                      title="Edit rule"
                    >
                      ✏️
                    </button>
                    <button
                      className="duplicate-btn"
                      onClick={() => handleDuplicateRule(rule)}
                      title="Duplicate rule"
                    >
                      📋
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteRule(rule.id)}
                      title="Delete rule"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="rule-details">
                  <p className="rule-description">{rule.description}</p>

                  <div className="rule-stats">
                    <div className="stat">
                      <label>Priority:</label>
                      <span>{rule.priority}</span>
                    </div>
                    <div className="stat">
                      <label>Conditions:</label>
                      <span>{rule.conditions.length}</span>
                    </div>
                    <div className="stat">
                      <label>Actions:</label>
                      <span>{rule.actions.length}</span>
                    </div>
                    {rule.lastTriggered && (
                      <div className="stat">
                        <label>Last Triggered:</label>
                        <span>
                          {new Date(rule.lastTriggered).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {rule.performance && (
                    <div className="rule-performance">
                      <div className="perf-stat">
                        <label>Success Rate:</label>
                        <span
                          className={
                            rule.performance.successRate >= 60
                              ? "positive"
                              : "negative"
                          }
                        >
                          {rule.performance.successRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="perf-stat">
                        <label>Total P&L:</label>
                        <span
                          className={
                            rule.performance.totalPnL >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          ${rule.performance.totalPnL.toFixed(2)}
                        </span>
                      </div>
                      <div className="perf-stat">
                        <label>Trades:</label>
                        <span>{rule.performance.totalTrades}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rule Builder Modal would be rendered here */}
        {showRuleBuilder && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{selectedRule ? "Edit Rule" : "Create New Rule"}</h3>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowRuleBuilder(false);
                    setSelectedRule(null);
                  }}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                {/* RuleBuilder component will be implemented next */}
                <div className="rule-builder-placeholder">
                  <p>Rule Builder Component will be implemented here</p>
                  <p>Rule: {selectedRule?.name || "New Rule"}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export { TradingRulesManager };
export default TradingRulesManager;
