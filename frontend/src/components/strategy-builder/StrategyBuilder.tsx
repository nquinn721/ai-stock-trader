import { Add, PlayArrow, Public, Save } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useCallback, useRef, useState } from "react";
import { strategyBuilderService } from "../../services/strategy-builder.service";
import { BacktestResults } from "./BacktestResults";
import { ComponentPalette } from "./ComponentPalette";
import "./StrategyBuilder.css";
import { StrategyCanvas } from "./StrategyCanvas";
import { StrategyMarketplace } from "./StrategyMarketplace";
import StrategyProperties from "./StrategyProperties";
import { StrategyTemplates } from "./StrategyTemplates";
import { StrategyValidation } from "./StrategyValidation";

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

export interface ComponentLibrary {
  indicators: ComponentDefinition[];
  conditions: ComponentDefinition[];
  actions: ComponentDefinition[];
  riskRules: ComponentDefinition[];
}

export interface ComponentDefinition {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  parameters: Record<string, any>;
}

export const StrategyBuilder: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [strategy, setStrategy] = useState<StrategyConfig>({
    name: "New Strategy",
    description: "",
    components: [],
    riskRules: [],
    symbols: ["AAPL"],
    timeframe: "1h",
  });

  const [componentLibrary, setComponentLibrary] =
    useState<ComponentLibrary | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dialog states
  const [showBacktestDialog, setShowBacktestDialog] = useState(false);
  const [showDeployDialog, setShowDeployDialog] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Load component library on mount
  React.useEffect(() => {
    loadComponentLibrary();
  }, []);

  const loadComponentLibrary = async () => {
    try {
      const response = await strategyBuilderService.getComponentLibrary();
      if (response.success) {
        // Transform the flat component list into categorized library
        const library: ComponentLibrary = {
          indicators: response.data.filter((c) => c.type === "indicator"),
          conditions: response.data.filter((c) => c.type === "condition"),
          actions: response.data.filter((c) => c.type === "action"),
          riskRules: response.data.filter(
            (c) => c.category === "risk_management"
          ),
        };
        setComponentLibrary(library);
      } else {
        throw new Error(response.error || "Failed to load components");
      }
    } catch (error: any) {
      console.error("Failed to load component library:", error);
      setError("Failed to load component library");
      // Fallback to mock data
      setComponentLibrary(getMockComponentLibrary());
    }
  };

  const handleDrop = useCallback(
    (component: ComponentDefinition, position: { x: number; y: number }) => {
      const newComponent: StrategyComponent = {
        id: `${component.id}_${Date.now()}`,
        type: component.type as "indicator" | "condition" | "action",
        name: component.name,
        category: component.category,
        parameters: { ...component.parameters },
        position,
        connections: [],
      };

      setStrategy((prev) => ({
        ...prev,
        components: [...prev.components, newComponent],
      }));

      // Validate strategy after adding component
      validateStrategy({
        ...strategy,
        components: [...strategy.components, newComponent],
      });
    },
    [strategy]
  );

  const handleConnect = useCallback((fromId: string, toId: string) => {
    // Prevent self-connections
    if (fromId === toId) return;

    setStrategy((prev) => {
      const fromComponent = prev.components.find((c) => c.id === fromId);
      if (!fromComponent) return prev;

      // Check if connection already exists
      if (fromComponent.connections?.includes(toId)) return prev;

      // Add connection to the from component
      const updatedComponents = prev.components.map((comp) =>
        comp.id === fromId
          ? { ...comp, connections: [...(comp.connections || []), toId] }
          : comp
      );

      return {
        ...prev,
        components: updatedComponents,
        // Also maintain the strategy-level connections for backward compatibility
        connections: [...(prev.connections || []), { from: fromId, to: toId }],
      };
    });
  }, []);

  const handleComponentUpdate = useCallback(
    (componentId: string, updates: Partial<StrategyComponent>) => {
      setStrategy((prev) => ({
        ...prev,
        components: prev.components.map((comp) =>
          comp.id === componentId ? { ...comp, ...updates } : comp
        ),
      }));
    },
    []
  );

  const handleComponentDelete = useCallback((componentId: string) => {
    setStrategy((prev) => ({
      ...prev,
      components: prev.components.filter((comp) => comp.id !== componentId),
    }));
  }, []);

  const handleRiskRuleAdd = useCallback((riskRule: RiskRule) => {
    setStrategy((prev) => ({
      ...prev,
      riskRules: [...prev.riskRules, riskRule],
    }));
  }, []);

  const handleRiskRuleUpdate = useCallback(
    (ruleId: string, updates: Partial<RiskRule>) => {
      setStrategy((prev) => ({
        ...prev,
        riskRules: prev.riskRules.map((rule) =>
          rule.id === ruleId ? { ...rule, ...updates } : rule
        ),
      }));
    },
    []
  );

  const handleRiskRuleDelete = useCallback((ruleId: string) => {
    setStrategy((prev) => ({
      ...prev,
      riskRules: prev.riskRules.filter((rule) => rule.id !== ruleId),
    }));
  }, []);

  const validateStrategy = async (
    strategyToValidate: StrategyConfig = strategy
  ) => {
    try {
      // Client-side validation first for quick feedback
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!strategyToValidate.name.trim()) {
        errors.push("Strategy must have a name");
      }

      if (strategyToValidate.components.length === 0) {
        errors.push("Strategy must have at least one component");
      }

      const hasEntry = strategyToValidate.components.some(
        (c) => c.type === "condition" && c.category.includes("entry")
      );
      if (!hasEntry) {
        errors.push("Strategy must have at least one entry condition");
      }

      const hasExit = strategyToValidate.components.some(
        (c) => c.type === "condition" && c.category.includes("exit")
      );
      if (!hasExit) {
        warnings.push("Strategy should have exit conditions");
      }

      if (strategyToValidate.riskRules.length === 0) {
        errors.push("Strategy must have risk management rules");
      }

      // If client-side validation passes and strategy is saved, run server-side validation
      if (errors.length === 0 && strategyToValidate.id) {
        try {
          const serverValidation =
            await strategyBuilderService.validateStrategy(
              strategyToValidate.id
            );
          if (serverValidation.success) {
            const serverResult = serverValidation.data;
            errors.push(...serverResult.errors);
            if (serverResult.warnings) {
              warnings.push(...serverResult.warnings);
            }
          }
        } catch (serverError) {
          console.warn(
            "Server validation failed, using client-side validation only"
          );
        }
      }

      setValidation({
        isValid: errors.length === 0,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (error) {
      console.error("Validation error:", error);
      setError("Failed to validate strategy");
    }
  };

  const handleSaveStrategy = async () => {
    if (!validation?.isValid) {
      setError("Cannot save invalid strategy. Please fix errors first.");
      return;
    }

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

  const handleRunBacktest = async (backtestParams: any) => {
    if (!validation?.isValid) {
      setError("Cannot backtest invalid strategy. Please fix errors first.");
      return;
    }

    if (!strategy.id) {
      setError("Please save the strategy before running backtest.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await strategyBuilderService.runBacktest(
        strategy.id,
        backtestParams
      );

      if (!response.success) {
        throw new Error(response.error || "Backtest failed");
      }

      setBacktestResults(response.data);
      setActiveTab(3); // Switch to backtest results tab
      setSuccessMessage("Backtest completed successfully!");
    } catch (error: any) {
      console.error("Backtest error:", error);
      setError(error.message || "Backtest failed");
    } finally {
      setIsLoading(false);
      setShowBacktestDialog(false);
    }
  };

  const handleDeployStrategy = async (deploymentConfig: any) => {
    if (!validation?.isValid) {
      setError("Cannot deploy invalid strategy. Please fix errors first.");
      return;
    }

    if (!strategy.id) {
      setError("Please save the strategy before deploying.");
      return;
    }

    setIsLoading(true);
    try {
      // Import autoTradingService for deployment
      const autoTradingService = (
        await import("../../services/autoTradingService")
      ).default;
      const response = await autoTradingService.deployStrategy(
        strategy.id,
        deploymentConfig
      );

      if (!response.success) {
        throw new Error(response.error || "Deployment failed");
      }

      setSuccessMessage(
        `Strategy deployed successfully! Instance ID: ${response.data.id}`
      );
    } catch (error: any) {
      console.error("Deploy error:", error);
      setError(error.message || "Deployment failed");
    } finally {
      setIsLoading(false);
      setShowDeployDialog(false);
    }
  };

  const handlePublishStrategy = async () => {
    if (!validation?.isValid) {
      setError("Cannot publish invalid strategy. Please fix errors first.");
      return;
    }

    if (!strategy.id) {
      setError("Please save the strategy before publishing.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await strategyBuilderService.publishStrategy(
        strategy.id,
        {
          isPublic: true,
          category: "general",
          tags: [],
        }
      );

      if (!response.success) {
        throw new Error(response.error || "Publishing failed");
      }

      setSuccessMessage("Strategy published to marketplace!");
    } catch (error: any) {
      console.error("Publish error:", error);
      setError(error.message || "Publishing failed");
    } finally {
      setIsLoading(false);
      setShowPublishDialog(false);
    }
  };

  const handleUseTemplate = async (template: any) => {
    try {
      setIsLoading(true);

      // If template has an ID, create strategy from template via API
      if (template.id) {
        const response =
          await strategyBuilderService.createStrategyFromTemplate(
            template.id,
            `${template.name} - Copy`
          );

        if (response.success) {
          setStrategy({
            id: response.data.id,
            name: response.data.name,
            description: response.data.description,
            components: response.data.components,
            riskRules: response.data.riskRules,
            symbols: response.data.symbols || ["AAPL"],
            timeframe: response.data.timeframe || "1h",
          });
          setSuccessMessage("Template loaded successfully!");
        } else {
          throw new Error(response.error || "Failed to load template");
        }
      } else {
        // Fallback to local template loading
        setStrategy({
          name: template.name,
          description: template.description,
          components: template.components || [],
          riskRules: template.defaultRiskRules || template.riskRules || [],
          symbols: template.defaultSymbols || ["AAPL"],
          timeframe: template.defaultTimeframe || "1h",
        });
      }

      setActiveTab(0); // Switch to builder tab
    } catch (error: any) {
      console.error("Error loading template:", error);
      setError(error.message || "Failed to load template");
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing strategy for editing
  const handleLoadStrategy = async (strategyId: string) => {
    try {
      setIsLoading(true);
      const response = await strategyBuilderService.getStrategy(strategyId);

      if (response.success) {
        setStrategy({
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          components: response.data.components,
          riskRules: response.data.riskRules,
          symbols: response.data.symbols,
          timeframe: response.data.timeframe,
        });
        setSuccessMessage("Strategy loaded successfully!");

        // Trigger validation for loaded strategy
        await validateStrategy(response.data);
      } else {
        throw new Error(response.error || "Failed to load strategy");
      }
    } catch (error: any) {
      console.error("Error loading strategy:", error);
      setError(error.message || "Failed to load strategy");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save functionality (save every 30 seconds if there are changes)
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  React.useEffect(() => {
    setHasUnsavedChanges(true);
  }, [
    strategy.name,
    strategy.description,
    strategy.components,
    strategy.riskRules,
  ]);

  React.useEffect(() => {
    if (!hasUnsavedChanges || !validation?.isValid) return;

    const autoSaveInterval = setInterval(async () => {
      try {
        if (strategy.id) {
          const response = await strategyBuilderService.updateStrategy(
            strategy.id,
            strategy
          );
          if (response.success) {
            setLastSaved(new Date());
            setHasUnsavedChanges(false);
          }
        }
      } catch (error) {
        console.warn("Auto-save failed:", error);
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [strategy, validation?.isValid, hasUnsavedChanges]);

  const tabs = [
    { label: "Builder", icon: <Add /> },
    { label: "Templates", icon: <Add /> },
    { label: "Marketplace", icon: <Public /> },
    { label: "Backtest Results", icon: <PlayArrow /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box sx={{ display: "flex", height: "100%" }}>
            {componentLibrary && (
              <Box sx={{ width: 300, borderRight: 1, borderColor: "divider" }}>
                <ComponentPalette
                  components={componentLibrary}
                  onDragStart={(component: any) =>
                    console.log("Dragging:", component)
                  }
                />
              </Box>
            )}

            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box ref={canvasRef} sx={{ flex: 1, position: "relative" }}>
                <StrategyCanvas
                  strategy={strategy}
                  onDrop={handleDrop}
                  onConnect={handleConnect}
                  onComponentUpdate={handleComponentUpdate}
                  onComponentDelete={handleComponentDelete}
                />
              </Box>

              <Box sx={{ borderTop: 1, borderColor: "divider" }}>
                <StrategyValidation
                  validation={validation}
                  onValidate={() => validateStrategy()}
                />
              </Box>
            </Box>

            <Box sx={{ width: 350, borderLeft: 1, borderColor: "divider" }}>
              <StrategyProperties
                strategy={strategy}
                onStrategyUpdate={setStrategy}
                onRiskRuleAdd={handleRiskRuleAdd}
                onRiskRuleUpdate={handleRiskRuleUpdate}
                onRiskRuleDelete={handleRiskRuleDelete}
              />
            </Box>
          </Box>
        );

      case 1:
        return componentLibrary ? (
          <StrategyTemplates onUseTemplate={handleUseTemplate} />
        ) : null;

      case 2:
        return <StrategyMarketplace onUseStrategy={handleUseTemplate} />;

      case 3:
        return backtestResults ? (
          <BacktestResults results={backtestResults} />
        ) : (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No backtest results available. Run a backtest first.
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" component="h1">
            Strategy Builder
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={handleSaveStrategy}
              disabled={isLoading || !validation?.isValid}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              onClick={() => setShowBacktestDialog(true)}
              disabled={isLoading || !validation?.isValid}
            >
              Backtest
            </Button>
            <Button
              variant="contained"
              onClick={() => setShowDeployDialog(true)}
              disabled={isLoading || !validation?.isValid}
            >
              Deploy
            </Button>
            <Button
              variant="outlined"
              startIcon={<Public />}
              onClick={() => setShowPublishDialog(true)}
              disabled={isLoading || !validation?.isValid}
            >
              Publish
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.label}
              icon={tab.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>{renderTabContent()}</Box>

      {/* Dialogs */}
      <Dialog
        open={showBacktestDialog}
        onClose={() => setShowBacktestDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>Run Backtest</DialogTitle>
        <DialogContent>
          {/* Backtest configuration form would go here */}
          <Typography>Backtest configuration form coming soon...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBacktestDialog(false)}>Cancel</Button>
          <Button
            onClick={() =>
              handleRunBacktest({
                startDate: "2023-01-01",
                endDate: "2023-12-31",
                initialCapital: 10000,
                symbols: strategy.symbols || ["AAPL"],
              })
            }
            variant="contained"
          >
            Run Backtest
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showDeployDialog}
        onClose={() => setShowDeployDialog(false)}
        maxWidth="md"
      >
        <DialogTitle>Deploy Strategy</DialogTitle>
        <DialogContent>
          {/* Deployment configuration form would go here */}
          <Typography>Deployment configuration form coming soon...</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeployDialog(false)}>Cancel</Button>
          <Button
            onClick={() =>
              handleDeployStrategy({
                portfolioId: "default-portfolio",
                maxCapitalAllocation: 10000,
                riskLimits: {
                  maxDrawdown: 10,
                  maxDailyLoss: 5,
                  maxPositionSize: 1000,
                },
                enablePaperTrading: true,
              })
            }
            variant="contained"
          >
            Deploy
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showPublishDialog}
        onClose={() => setShowPublishDialog(false)}
      >
        <DialogTitle>Publish to Marketplace</DialogTitle>
        <DialogContent>
          <Typography>
            Publishing this strategy will make it available to other users in
            the marketplace. Are you sure you want to continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPublishDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePublishStrategy}
            variant="contained"
            color="primary"
          >
            Publish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Mock component library for fallback
const getMockComponentLibrary = (): ComponentLibrary => {
  return {
    indicators: [
      {
        id: "sma",
        name: "Simple Moving Average",
        type: "indicator",
        category: "trend",
        description:
          "Calculates the simple moving average of price over a specified period",
        parameters: { period: 20 },
      },
      {
        id: "ema",
        name: "Exponential Moving Average",
        type: "indicator",
        category: "trend",
        description:
          "Calculates the exponential moving average with more weight on recent values",
        parameters: { period: 12 },
      },
      {
        id: "rsi",
        name: "Relative Strength Index",
        type: "indicator",
        category: "momentum",
        description:
          "Momentum oscillator that measures speed and magnitude of price changes",
        parameters: { period: 14, overbought: 70, oversold: 30 },
      },
    ],
    conditions: [
      {
        id: "price_above",
        name: "Price Above",
        type: "condition",
        category: "price",
        description:
          "Triggers when price is above a specified value or indicator",
        parameters: { threshold: 100 },
      },
      {
        id: "crossover",
        name: "Crossover",
        type: "condition",
        category: "signal",
        description: "Triggers when one line crosses above another",
        parameters: {},
      },
    ],
    actions: [
      {
        id: "buy_market",
        name: "Buy Market Order",
        type: "action",
        category: "trade",
        description: "Places a market buy order",
        parameters: { quantity: 100 },
      },
      {
        id: "sell_market",
        name: "Sell Market Order",
        type: "action",
        category: "trade",
        description: "Places a market sell order",
        parameters: { quantity: 100 },
      },
    ],
    riskRules: [
      {
        id: "stop_loss",
        name: "Stop Loss",
        type: "risk_rule",
        category: "risk_management",
        description: "Sets a stop loss to limit downside risk",
        parameters: { percentage: 5 },
      },
      {
        id: "position_size",
        name: "Position Sizing",
        type: "risk_rule",
        category: "risk_management",
        description: "Controls the size of each position",
        parameters: { percentage: 10 },
      },
    ],
  };
};
