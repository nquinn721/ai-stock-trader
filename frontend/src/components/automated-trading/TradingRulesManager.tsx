<<<<<<< HEAD
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Switch,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Add,
  ContentCopy,
} from '@mui/icons-material';
=======
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useAutoTradingStore } from "../../stores/StoreContext";
import { TradingRuleDisplay, CreateTradingRuleDtoDisplay } from "../../types/autoTrading.types";
import RuleBuilder from "./RuleBuilder";
import "./TradingRulesManager.css";
>>>>>>> 6ddc0fc (udpate)

interface TradingRule {
  id: string;
  name: string;
  strategy: string;
  isActive: boolean;
  conditions: any[];
  actions: any[];
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
}

<<<<<<< HEAD
interface TradingRulesManagerProps {
  rules: TradingRule[];
  onRuleUpdate: (rules: TradingRule[]) => void;
}

export const TradingRulesManager: React.FC<TradingRulesManagerProps> = ({
  rules,
  onRuleUpdate,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
=======
const TradingRulesManager: React.FC<TradingRulesManagerProps> = observer(
  ({ portfolioId }) => {
    const autoTradingStore = useAutoTradingStore();
    const [selectedRule, setSelectedRule] = useState<TradingRuleDisplay | null>(null);
    const [showRuleBuilder, setShowRuleBuilder] = useState(false);
    const [filterStatus, setFilterStatus] = useState<
      "all" | "active" | "inactive"
    >("all");

    useEffect(() => {
      if (portfolioId) {
        autoTradingStore.fetchTradingRules(portfolioId);
      }
    }, [portfolioId]);

    const filteredRules = autoTradingStore.tradingRules.filter((rule) => {
      if (portfolioId && rule.portfolioId !== portfolioId) return false;
      if (filterStatus === "active") return rule.isActive;
      if (filterStatus === "inactive") return !rule.isActive;
      return true;
    });

    const handleToggleRule = async (rule: TradingRuleDisplay) => {
      await autoTradingStore.toggleRuleStatus(rule.id, !rule.isActive);
    };

    const handleDeleteRule = async (ruleId: string) => {
      if (
        window.confirm("Are you sure you want to delete this trading rule?")
      ) {
        await autoTradingStore.deleteTradingRule(ruleId);
      }
    };

    const handleDuplicateRule = async (rule: TradingRuleDisplay) => {
      if (!portfolioId) {
        console.error('Cannot duplicate rule without portfolioId');
        return;
      }
      
      const duplicatedRule: CreateTradingRuleDtoDisplay = {
        portfolioId,
        name: `${rule.name} (Copy)`,
        description: rule.description,
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        actions: rule.actions,
        priority: rule.priority,
        isActive: false,
      };
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
                          {Number(rule.performance.successRate || 0).toFixed(1)}
                          %
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
                          ${Number(rule.performance.totalPnL || 0).toFixed(2)}
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
                <RuleBuilder
                  rule={selectedRule}
                  portfolioId={portfolioId || "default"}
                  onSave={(rule) => {
                    setShowRuleBuilder(false);
                    setSelectedRule(null);
                  }}
                  onCancel={() => {
                    setShowRuleBuilder(false);
                    setSelectedRule(null);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
>>>>>>> 6ddc0fc (udpate)
    );
    onRuleUpdate(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      const updatedRules = rules.filter(rule => rule.id !== ruleToDelete);
      onRuleUpdate(updatedRules);
    }
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const handleDuplicateRule = (rule: TradingRule) => {
    const duplicatedRule = {
      ...rule,
      id: `${rule.id}-copy-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      isActive: false,
    };
    onRuleUpdate([...rules, duplicatedRule]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="Trading Rules Management"
          subheader="Create, edit, and manage your automated trading rules"
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              color="primary"
            >
              Create New Rule
            </Button>
          }
        />
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule Name</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Trades</TableCell>
                <TableCell>Win Rate</TableCell>
                <TableCell>P&L</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.strategy}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onChange={() => handleToggleRule(rule.id)}
                      color="primary"
                    />
                    <Chip
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      color={rule.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.performance.profitLoss > 0 ? 'Profitable' : 'Loss'}
                      color={rule.performance.profitLoss > 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{rule.performance.totalTrades}</TableCell>
                  <TableCell>{rule.performance.winRate.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Typography
                      color={rule.performance.profitLoss > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(rule.performance.profitLoss)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleDuplicateRule(rule)}
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trading rule? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingRulesManager;
