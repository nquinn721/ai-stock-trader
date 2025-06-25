import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useAutoTradingStore } from "../../stores/StoreContext";
import { TradingRule, RuleCondition, RuleAction } from "../../types/autoTrading.types";
import "./RuleBuilder.css";

interface RuleBuilderProps {
  rule?: TradingRule | null;
  portfolioId: string;
  onSave: (rule: TradingRule) => void;
  onCancel: () => void;
}

// Field options for rule conditions
const FIELD_OPTIONS = [
  { value: "price", label: "Current Price" },
  { value: "priceChange", label: "Price Change %" },
  { value: "volume", label: "Volume" },
  { value: "marketCap", label: "Market Cap" },
  { value: "pe", label: "P/E Ratio" },
  { value: "rsi", label: "RSI" },
  { value: "macd", label: "MACD" },
  { value: "sma20", label: "20-day SMA" },
  { value: "sma50", label: "50-day SMA" },
  { value: "sma200", label: "200-day SMA" },
  { value: "portfolio.totalValue", label: "Portfolio Value" },
  { value: "portfolio.dailyPnL", label: "Daily P&L" },
  { value: "portfolio.cash", label: "Available Cash" },
  { value: "time", label: "Time of Day" },
  { value: "dayOfWeek", label: "Day of Week" }
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "contains", label: "Contains" }
];

const ACTION_TYPE_OPTIONS = [
  { value: "buy", label: "Buy" },
  { value: "sell", label: "Sell" },
  { value: "stop_loss", label: "Set Stop Loss" },
  { value: "take_profit", label: "Set Take Profit" },
  { value: "notify", label: "Send Notification" }
];

const SIZING_METHOD_OPTIONS = [
  { value: "fixed", label: "Fixed Amount" },
  { value: "percentage", label: "Percentage of Portfolio" },
  { value: "kelly_criterion", label: "Kelly Criterion" }
];

const RuleBuilder: React.FC<RuleBuilderProps> = observer(
  ({ rule, portfolioId, onSave, onCancel }) => {
    const autoTradingStore = useAutoTradingStore();

    // Form state
    const [formData, setFormData] = useState({
      name: "",
      description: "",
      ruleType: "entry" as "entry" | "exit" | "risk",
      priority: 1,
      isActive: true
    });

    const [conditions, setConditions] = useState<RuleCondition[]>([]);
    const [actions, setActions] = useState<RuleAction[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Initialize form data when rule changes
    useEffect(() => {
      if (rule) {
        setFormData({
          name: rule.name,
          description: rule.description || "",
          ruleType: rule.ruleType,
          priority: rule.priority,
          isActive: rule.isActive
        });
        setConditions(rule.conditions || []);
        setActions(rule.actions || []);
      } else {
        // Reset for new rule
        setFormData({
          name: "",
          description: "",
          ruleType: "entry",
          priority: 1,
          isActive: true
        });
        setConditions([]);
        setActions([]);
      }
      setErrors({});
    }, [rule]);

    // Generate unique ID
    const generateId = () => {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    };

    // Add new condition
    const addCondition = () => {
      const newCondition: RuleCondition = {
        id: generateId(),
        field: "price",
        operator: "greater_than",
        value: "",
        logicalOperator: conditions.length > 0 ? "AND" : undefined
      };
      setConditions([...conditions, newCondition]);
    };

    // Update condition
    const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
      const updatedConditions = [...conditions];
      updatedConditions[index] = { ...updatedConditions[index], [field]: value };
      setConditions(updatedConditions);
    };

    // Remove condition
    const removeCondition = (index: number) => {
      const updatedConditions = conditions.filter((_, i) => i !== index);
      setConditions(updatedConditions);
    };

    // Add new action
    const addAction = () => {
      const newAction: RuleAction = {
        id: generateId(),
        type: "buy",
        parameters: {
          sizingMethod: "percentage",
          sizeValue: 10,
          maxPositionSize: 100000
        }
      };
      setActions([...actions, newAction]);
    };

    // Update action
    const updateAction = (index: number, field: keyof RuleAction, value: any) => {
      const updatedActions = [...actions];
      updatedActions[index] = { ...updatedActions[index], [field]: value };
      setActions(updatedActions);
    };

    // Update action parameters
    const updateActionParameter = (index: number, param: string, value: any) => {
      const updatedActions = [...actions];
      updatedActions[index] = {
        ...updatedActions[index],
        parameters: {
          ...updatedActions[index].parameters,
          [param]: value
        }
      };
      setActions(updatedActions);
    };

    // Remove action
    const removeAction = (index: number) => {
      const updatedActions = actions.filter((_, i) => i !== index);
      setActions(updatedActions);
    };

    // Validate form
    const validateForm = (): boolean => {
      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = "Rule name is required";
      }

      if (conditions.length === 0) {
        newErrors.conditions = "At least one condition is required";
      }

      if (actions.length === 0) {
        newErrors.actions = "At least one action is required";
      }

      // Validate conditions
      conditions.forEach((condition, index) => {
        if (!condition.value && condition.value !== 0) {
          newErrors[`condition_${index}_value`] = "Value is required";
        }
      });

      // Validate actions
      actions.forEach((action, index) => {
        if (["buy", "sell"].includes(action.type)) {
          if (!action.parameters.sizeValue || action.parameters.sizeValue <= 0) {
            newErrors[`action_${index}_size`] = "Size value must be greater than 0";
          }
        }
      });

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    // Handle save
    const handleSave = async () => {
      if (!validateForm()) {
        return;
      }

      const ruleData: TradingRule = {
        id: rule?.id || generateId(),
        portfolioId: portfolioId,
        name: formData.name,
        description: formData.description,
        ruleType: formData.ruleType,
        priority: formData.priority,
        isActive: formData.isActive,
        conditions: conditions,
        actions: actions,
        createdAt: rule?.createdAt || new Date(),
        updatedAt: new Date()
      };

      try {
        if (rule) {
          await autoTradingStore.updateTradingRule(rule.id, ruleData);
        } else {
          await autoTradingStore.createTradingRule(ruleData);
        }
        onSave(ruleData);
      } catch (error) {
        console.error("Error saving rule:", error);
        setErrors({ general: "Failed to save rule. Please try again." });
      }
    };

    return (
      <div className="rule-builder">
        {errors.general && <div className="error-message">{errors.general}</div>}

        {/* Basic Information */}
        <div className="form-section">
          <h4>Basic Information</h4>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ruleName">Rule Name *</label>
              <input
                id="ruleName"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter rule name"
                className={errors.name ? "error" : ""}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="ruleType">Rule Type</label>
              <select
                id="ruleType"
                value={formData.ruleType}
                onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as any })}
              >
                <option value="entry">Entry Rule</option>
                <option value="exit">Exit Rule</option>
                <option value="risk">Risk Management</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority (1-10)</label>
              <input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active Rule
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this rule does"
              rows={3}
            />
          </div>
        </div>

        {/* Conditions */}
        <div className="form-section">
          <div className="section-header">
            <h4>Conditions {conditions.length > 0 && `(${conditions.length})`}</h4>
            <button type="button" className="btn-secondary" onClick={addCondition}>
              Add Condition
            </button>
          </div>
          {errors.conditions && <span className="error-text">{errors.conditions}</span>}

          {conditions.map((condition, index) => (
            <div key={condition.id} className="condition-row">
              {index > 0 && (
                <div className="logical-operator">
                  <select
                    value={condition.logicalOperator || "AND"}
                    onChange={(e) => updateCondition(index, "logicalOperator", e.target.value)}
                  >
                    <option value="AND">AND</option>
                    <option value="OR">OR</option>
                  </select>
                </div>
              )}

              <div className="condition-fields">
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(index, "field", e.target.value)}
                >
                  {FIELD_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(index, "operator", e.target.value)}
                >
                  {OPERATOR_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, "value", e.target.value)}
                  placeholder="Value"
                  className={errors[`condition_${index}_value`] ? "error" : ""}
                />

                <button
                  type="button"
                  className="btn-danger-small"
                  onClick={() => removeCondition(index)}
                  title="Remove condition"
                >
                  ×
                </button>
              </div>
              {errors[`condition_${index}_value`] && (
                <span className="error-text">{errors[`condition_${index}_value`]}</span>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="form-section">
          <div className="section-header">
            <h4>Actions {actions.length > 0 && `(${actions.length})`}</h4>
            <button type="button" className="btn-secondary" onClick={addAction}>
              Add Action
            </button>
          </div>
          {errors.actions && <span className="error-text">{errors.actions}</span>}

          {actions.map((action, index) => (
            <div key={action.id} className="action-row">
              <div className="action-header">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, "type", e.target.value)}
                >
                  {ACTION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-danger-small"
                  onClick={() => removeAction(index)}
                  title="Remove action"
                >
                  ×
                </button>
              </div>

              {/* Action Parameters */}
              {["buy", "sell"].includes(action.type) && (
                <div className="action-parameters">
                  <div className="param-row">
                    <label>Sizing Method:</label>
                    <select
                      value={action.parameters.sizingMethod || "percentage"}
                      onChange={(e) => updateActionParameter(index, "sizingMethod", e.target.value)}
                    >
                      {SIZING_METHOD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="param-row">
                    <label>Size Value:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={action.parameters.sizeValue || ""}
                      onChange={(e) => updateActionParameter(index, "sizeValue", parseFloat(e.target.value))}
                      placeholder={action.parameters.sizingMethod === "percentage" ? "%" : "$"}
                      className={errors[`action_${index}_size`] ? "error" : ""}
                    />
                    {errors[`action_${index}_size`] && (
                      <span className="error-text">{errors[`action_${index}_size`]}</span>
                    )}
                  </div>

                  <div className="param-row">
                    <label>Max Position Size:</label>
                    <input
                      type="number"
                      value={action.parameters.maxPositionSize || ""}
                      onChange={(e) => updateActionParameter(index, "maxPositionSize", parseFloat(e.target.value))}
                      placeholder="Maximum $ amount"
                    />
                  </div>

                  {action.type === "buy" && (
                    <div className="param-row">
                      <label>Limit Price (optional):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={action.parameters.limitPrice || ""}
                        onChange={(e) => updateActionParameter(index, "limitPrice", parseFloat(e.target.value))}
                        placeholder="Limit price"
                      />
                    </div>
                  )}
                </div>
              )}

              {["stop_loss", "take_profit"].includes(action.type) && (
                <div className="action-parameters">
                  <div className="param-row">
                    <label>Stop Price:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={action.parameters.stopPrice || ""}
                      onChange={(e) => updateActionParameter(index, "stopPrice", parseFloat(e.target.value))}
                      placeholder="Stop price"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            disabled={autoTradingStore.isLoading}
          >
            {autoTradingStore.isLoading ? "Saving..." : rule ? "Update Rule" : "Create Rule"}
          </button>
        </div>
      </div>
    );
  }
);

export default RuleBuilder;
