import { Add, Delete, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import { RiskRule, StrategyConfig } from "./StrategyBuilder";

interface StrategyPropertiesProps {
  strategy: StrategyConfig;
  onStrategyUpdate: (strategy: StrategyConfig) => void;
  onRiskRuleAdd: (riskRule: RiskRule) => void;
  onRiskRuleUpdate: (ruleId: string, updates: Partial<RiskRule>) => void;
  onRiskRuleDelete: (ruleId: string) => void;
}

export const StrategyProperties: React.FC<StrategyPropertiesProps> = ({
  strategy,
  onStrategyUpdate,
  onRiskRuleAdd,
  onRiskRuleUpdate,
  onRiskRuleDelete,
}) => {
  const handleStrategyChange = (field: string, value: any) => {
    onStrategyUpdate({
      ...strategy,
      [field]: value,
    });
  };

  const handleSymbolAdd = (symbol: string) => {
    if (symbol && !strategy.symbols?.includes(symbol)) {
      handleStrategyChange("symbols", [...(strategy.symbols || []), symbol]);
    }
  };

  const handleSymbolRemove = (symbol: string) => {
    handleStrategyChange(
      "symbols",
      strategy.symbols?.filter((s) => s !== symbol) || []
    );
  };

  const handleAddRiskRule = (type: string) => {
    const newRule: RiskRule = {
      id: `rule_${Date.now()}`,
      type: type as any,
      parameters: getDefaultRiskRuleParameters(type),
    };
    onRiskRuleAdd(newRule);
  };

  const getDefaultRiskRuleParameters = (type: string) => {
    switch (type) {
      case "position_size":
        return { maxPercent: 10, minShares: 1, maxShares: 1000 };
      case "stop_loss":
        return { percentage: 5, trailing: false };
      case "take_profit":
        return { percentage: 10, partial: false };
      case "max_drawdown":
        return { percentage: 15, pauseTrading: true };
      default:
        return {};
    }
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      {/* Strategy Settings */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Strategy Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              fullWidth
              label="Strategy Name"
              value={strategy.name}
              onChange={(e) => handleStrategyChange("name", e.target.value)}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={strategy.description}
              onChange={(e) =>
                handleStrategyChange("description", e.target.value)
              }
            />

            <FormControl fullWidth>
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={strategy.timeframe || "1h"}
                onChange={(e) =>
                  handleStrategyChange("timeframe", e.target.value)
                }
                label="Timeframe"
              >
                <MenuItem value="1m">1 Minute</MenuItem>
                <MenuItem value="5m">5 Minutes</MenuItem>
                <MenuItem value="15m">15 Minutes</MenuItem>
                <MenuItem value="1h">1 Hour</MenuItem>
                <MenuItem value="4h">4 Hours</MenuItem>
                <MenuItem value="1d">1 Day</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={strategy.isActive || false}
                  onChange={(e) =>
                    handleStrategyChange("isActive", e.target.checked)
                  }
                />
              }
              label="Active"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Symbols */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Trading Symbols</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {strategy.symbols?.map((symbol) => (
                <Chip
                  key={symbol}
                  label={symbol}
                  onDelete={() => handleSymbolRemove(symbol)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>

            <TextField
              label="Add Symbol"
              placeholder="e.g., AAPL, MSFT"
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const input = e.target as HTMLInputElement;
                  handleSymbolAdd(input.value.toUpperCase());
                  input.value = "";
                }
              }}
              size="small"
            />
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Risk Management */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Risk Management</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Add Risk Rule Buttons */}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddRiskRule("position_size")}
                variant="outlined"
              >
                Position Size
              </Button>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddRiskRule("stop_loss")}
                variant="outlined"
              >
                Stop Loss
              </Button>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddRiskRule("take_profit")}
                variant="outlined"
              >
                Take Profit
              </Button>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => handleAddRiskRule("max_drawdown")}
                variant="outlined"
              >
                Max Drawdown
              </Button>
            </Box>

            <Divider />

            {/* Risk Rules List */}
            {strategy.riskRules.map((rule, index) => (
              <Box
                key={rule.id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ textTransform: "capitalize" }}
                  >
                    {rule.type.replace("_", " ")}
                  </Typography>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => onRiskRuleDelete(rule.id)}
                  >
                    Remove
                  </Button>
                </Box>

                {/* Rule Parameters */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {Object.entries(rule.parameters).map(([key, value]) => (
                    <TextField
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      type={typeof value === "number" ? "number" : "text"}
                      value={value}
                      onChange={(e) => {
                        const newValue =
                          typeof value === "number"
                            ? parseFloat(e.target.value) || 0
                            : e.target.value;
                        onRiskRuleUpdate(rule.id, {
                          parameters: { ...rule.parameters, [key]: newValue },
                        });
                      }}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>
            ))}

            {strategy.riskRules.length === 0 && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                No risk management rules configured. Add rules to protect your
                capital.
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Strategy Components Summary */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            Components ({strategy.components.length})
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {strategy.components.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No components added yet. Drag components from the palette to the
                canvas.
              </Typography>
            ) : (
              strategy.components.map((component) => (
                <Box
                  key={component.id}
                  sx={{
                    p: 1,
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {component.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {component.category}
                    </Typography>
                  </Box>
                  <Chip
                    label={component.type}
                    size="small"
                    color={
                      component.type === "indicator"
                        ? "primary"
                        : component.type === "condition"
                        ? "success"
                        : component.type === "action"
                        ? "error"
                        : "default"
                    }
                  />
                </Box>
              ))
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default StrategyProperties;
