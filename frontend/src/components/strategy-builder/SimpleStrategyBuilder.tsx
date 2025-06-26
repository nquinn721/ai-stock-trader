import { Add, PlayArrow, Public, Save, Assessment } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from "@mui/material";
import React, { useState } from "react";
import { strategyBuilderService } from "../../services/strategy-builder.service";

export interface StrategyComponent {
  id: string;
  type: "indicator" | "condition" | "action";
  name: string;
  category: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
  connections?: string[];
}

export interface RiskRule {
  id: string;
  type: "position_size" | "stop_loss" | "take_profit" | "max_drawdown";
  parameters: Record<string, any>;
}

export interface StrategyConfig {
  id?: string;
  name: string;
  description: string;
  components: StrategyComponent[];
  connections?: Array<{ from: string; to: string }>;
  riskRules: RiskRule[];
  symbols?: string[];
  timeframe?: string;
  isActive?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export const SimpleStrategyBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [strategy, setStrategy] = useState<StrategyConfig>({
    name: "New Strategy",
    description: "",
    components: [],
    riskRules: [],
    symbols: ["AAPL"],
    timeframe: "1h",
  });

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showBacktestDialog, setShowBacktestDialog] = useState(false);

  // Mock component library for demonstration
  const componentLibrary = {
    indicators: [
      { id: "sma", name: "Simple Moving Average", type: "indicator", category: "trend", description: "Moving average indicator", parameters: { period: 20 } },
      { id: "rsi", name: "RSI", type: "indicator", category: "momentum", description: "Relative Strength Index", parameters: { period: 14 } },
    ],
    conditions: [
      { id: "price_above", name: "Price Above", type: "condition", category: "price", description: "Price above threshold", parameters: { threshold: 100 } },
      { id: "crossover", name: "Crossover", type: "condition", category: "signal", description: "Line crossover", parameters: {} },
    ],
    actions: [
      { id: "buy_market", name: "Buy Market", type: "action", category: "trade", description: "Market buy order", parameters: { quantity: 100 } },
      { id: "sell_market", name: "Sell Market", type: "action", category: "trade", description: "Market sell order", parameters: { quantity: 100 } },
    ],
    riskRules: [
      { id: "stop_loss", name: "Stop Loss", type: "risk_rule", category: "risk", description: "Stop loss rule", parameters: { percentage: 5 } },
      { id: "position_size", name: "Position Size", type: "risk_rule", category: "risk", description: "Position sizing", parameters: { percentage: 10 } },
    ],
  };

  const handleSaveStrategy = async () => {
    setIsLoading(true);
    try {
      const response = await strategyBuilderService.createStrategy(strategy);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to save strategy");
      }

      setStrategy(response.data);
      setSuccessMessage("Strategy saved successfully!");
    } catch (error: any) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save strategy");
    } finally {
      setIsLoading(false);
    }
  };

  const validateStrategy = () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!strategy.name.trim()) {
      errors.push("Strategy must have a name");
    }

    if (strategy.components.length === 0) {
      errors.push("Strategy must have at least one component");
    }

    if (strategy.riskRules.length === 0) {
      errors.push("Strategy must have risk management rules");
    }

    setValidation({
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  };

  const addComponent = (componentDef: any) => {
    const newComponent: StrategyComponent = {
      id: `${componentDef.id}_${Date.now()}`,
      type: componentDef.type as "indicator" | "condition" | "action",
      name: componentDef.name,
      category: componentDef.category,
      parameters: { ...componentDef.parameters },
      connections: [],
    };

    setStrategy(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));
  };

  const removeComponent = (componentId: string) => {
    setStrategy(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== componentId)
    }));
  };

  const addRiskRule = (ruleDef: any) => {
    const newRule: RiskRule = {
      id: `${ruleDef.id}_${Date.now()}`,
      type: ruleDef.type,
      parameters: { ...ruleDef.parameters }
    };

    setStrategy(prev => ({
      ...prev,
      riskRules: [...prev.riskRules, newRule]
    }));
  };

  React.useEffect(() => {
    validateStrategy();
  }, [strategy]);

  const tabs = [
    { label: "Builder", icon: <Add /> },
    { label: "Components", icon: <Add /> },
    { label: "Validation", icon: <Assessment /> },
    { label: "Backtest", icon: <PlayArrow /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Strategy Configuration
            </Typography>
            
            <Box sx={{ display: "grid", gap: 3, mb: 4 }}>
              <TextField
                label="Strategy Name"
                value={strategy.name}
                onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
              />
              
              <TextField
                label="Description"
                value={strategy.description}
                onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={3}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={strategy.timeframe}
                  label="Timeframe"
                  onChange={(e) => setStrategy(prev => ({ ...prev, timeframe: e.target.value }))}
                >
                  <MenuItem value="1m">1 Minute</MenuItem>
                  <MenuItem value="5m">5 Minutes</MenuItem>
                  <MenuItem value="15m">15 Minutes</MenuItem>
                  <MenuItem value="1h">1 Hour</MenuItem>
                  <MenuItem value="1d">1 Day</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Typography variant="h6" gutterBottom>
              Strategy Components ({strategy.components.length})
            </Typography>
            
            <Box sx={{ display: "grid", gap: 2, mb: 4 }}>
              {strategy.components.map((component) => (
                <Card key={component.id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {component.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {component.type} • {component.category}
                        </Typography>
                      </Box>
                      <Button
                        color="error"
                        size="small"
                        onClick={() => removeComponent(component.id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
              
              {strategy.components.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                  No components added yet. Use the Components tab to add indicators, conditions, and actions.
                </Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Risk Management Rules ({strategy.riskRules.length})
            </Typography>
            
            <Box sx={{ display: "grid", gap: 2 }}>
              {strategy.riskRules.map((rule) => (
                <Card key={rule.id} variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {rule.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Parameters: {JSON.stringify(rule.parameters)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
              
              {strategy.riskRules.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                  No risk rules configured. Add risk management rules to protect your capital.
                </Typography>
              )}
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Component Library
            </Typography>
            
            {Object.entries(componentLibrary).map(([category, components]) => (
              <Box key={category} sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ textTransform: "capitalize" }}>
                  {category}
                </Typography>
                <Box sx={{ display: "grid", gap: 2 }}>
                  {components.map((comp: any) => (
                    <Card key={comp.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {comp.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {comp.description}
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => category === 'riskRules' ? addRiskRule(comp) : addComponent(comp)}
                          >
                            Add
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        );

      case 2:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Strategy Validation
            </Typography>
            
            {validation && (
              <Box sx={{ mb: 3 }}>
                {validation.isValid ? (
                  <Alert severity="success">
                    Strategy is valid and ready for testing!
                  </Alert>
                ) : (
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      Validation Errors:
                    </Typography>
                    <ul>
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
                
                {validation.warnings && validation.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Warnings:
                    </Typography>
                    <ul>
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </Alert>
                )}
              </Box>
            )}
            
            <Typography variant="h6" gutterBottom>
              Strategy Summary
            </Typography>
            <Box sx={{ display: "grid", gap: 2 }}>
              <Paper sx={{ p: 2 }}>
                <Typography><strong>Name:</strong> {strategy.name}</Typography>
                <Typography><strong>Components:</strong> {strategy.components.length}</Typography>
                <Typography><strong>Risk Rules:</strong> {strategy.riskRules.length}</Typography>
                <Typography><strong>Timeframe:</strong> {strategy.timeframe}</Typography>
                <Typography><strong>Symbols:</strong> {strategy.symbols?.join(", ")}</Typography>
              </Paper>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Backtesting
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Backtesting functionality will simulate your strategy against historical data.
              Ensure your strategy is validated before running backtests.
            </Alert>
            
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => setShowBacktestDialog(true)}
              disabled={!validation?.isValid}
            >
              Run Backtest
            </Button>
            
            {!validation?.isValid && (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Fix validation errors before running backtests.
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Strategy Builder
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Build and test autonomous trading strategies
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Assessment />}
              onClick={validateStrategy}
            >
              Validate
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveStrategy}
              disabled={isLoading || !validation?.isValid}
            >
              {isLoading ? "Saving..." : "Save Strategy"}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {renderTabContent()}
      </Box>

      {/* Notifications */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Backtest Dialog */}
      <Dialog open={showBacktestDialog} onClose={() => setShowBacktestDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Run Backtest</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will test your strategy against historical data to evaluate performance.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Backtesting integration with real historical data coming soon!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBacktestDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowBacktestDialog(false)}>
            Start Backtest
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SimpleStrategyBuilder;
