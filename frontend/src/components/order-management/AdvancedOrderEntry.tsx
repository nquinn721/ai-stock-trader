import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useStores } from "../../hooks/useStores";

export interface ConditionalTrigger {
  id: string;
  type: "price" | "time" | "indicator" | "volume";
  condition: "greater_than" | "less_than" | "equals" | "between";
  value: number | string;
  value2?: number;
  field: string;
  logicalOperator?: "AND" | "OR";
}

interface AdvancedOrderEntryProps {
  symbol: string;
  portfolioId: number;
  onOrderSubmitted?: (order: any) => void;
  onClose?: () => void;
}

export const AdvancedOrderEntry: React.FC<AdvancedOrderEntryProps> = observer(
  ({ symbol, portfolioId, onOrderSubmitted, onClose }) => {
    const { tradeStore, portfolioStore } = useStores();

    // Basic order fields
    const [orderType, setOrderType] = useState<string>("market");
    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [quantity, setQuantity] = useState<number>(0);
    const [limitPrice, setLimitPrice] = useState<number>(0);
    const [stopPrice, setStopPrice] = useState<number>(0);
    const [timeInForce, setTimeInForce] = useState<string>("day");

    // Advanced order features
    const [isBracketOrder, setIsBracketOrder] = useState<boolean>(false);
    const [profitTargetPrice, setProfitTargetPrice] = useState<number>(0);
    const [stopLossPrice, setStopLossPrice] = useState<number>(0);

    const [isTrailingStop, setIsTrailingStop] = useState<boolean>(false);
    const [trailAmount, setTrailAmount] = useState<number>(0);
    const [trailPercent, setTrailPercent] = useState<number>(0);

    const [isOCOOrder, setIsOCOOrder] = useState<boolean>(false);
    const [ocoLimitPrice, setOcoLimitPrice] = useState<number>(0);
    const [ocoStopPrice, setOcoStopPrice] = useState<number>(0);

    const [isConditionalOrder, setIsConditionalOrder] =
      useState<boolean>(false);
    const [conditionalTriggers, setConditionalTriggers] = useState<
      ConditionalTrigger[]
    >([]);

    // UI state
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [estimatedCost, setEstimatedCost] = useState<number>(0);
    const [riskWarnings, setRiskWarnings] = useState<string[]>([]);

    useEffect(() => {
      // Get current price for the symbol
      // This would be replaced with actual market data
      setCurrentPrice(100); // Placeholder
    }, [symbol]);

    useEffect(() => {
      // Calculate estimated cost
      let price = currentPrice;
      if (orderType === "limit" && limitPrice > 0) {
        price = limitPrice;
      }
      setEstimatedCost(quantity * price);
    }, [quantity, limitPrice, currentPrice, orderType]);

    const addConditionalTrigger = () => {
      const newTrigger: ConditionalTrigger = {
        id: `trigger_${Date.now()}`,
        type: "price",
        condition: "greater_than",
        value: currentPrice,
        field: "price",
        logicalOperator: conditionalTriggers.length > 0 ? "AND" : undefined,
      };
      setConditionalTriggers([...conditionalTriggers, newTrigger]);
    };

    const updateConditionalTrigger = (
      index: number,
      updates: Partial<ConditionalTrigger>
    ) => {
      const updated = [...conditionalTriggers];
      updated[index] = { ...updated[index], ...updates };
      setConditionalTriggers(updated);
    };

    const removeConditionalTrigger = (index: number) => {
      const updated = conditionalTriggers.filter((_, i) => i !== index);
      setConditionalTriggers(updated);
    };

    const validateOrder = (): string[] => {
      const errors: string[] = [];

      if (quantity <= 0) {
        errors.push("Quantity must be greater than 0");
      }

      if (orderType === "limit" && limitPrice <= 0) {
        errors.push("Limit price must be greater than 0");
      }

      if (orderType === "stop_loss" && stopPrice <= 0) {
        errors.push("Stop price must be greater than 0");
      }

      if (isBracketOrder) {
        if (profitTargetPrice <= 0) {
          errors.push("Profit target price must be greater than 0");
        }
        if (stopLossPrice <= 0) {
          errors.push("Stop loss price must be greater than 0");
        }
        if (side === "buy") {
          if (profitTargetPrice <= currentPrice) {
            errors.push(
              "Profit target must be above current price for buy orders"
            );
          }
          if (stopLossPrice >= currentPrice) {
            errors.push("Stop loss must be below current price for buy orders");
          }
        } else {
          if (profitTargetPrice >= currentPrice) {
            errors.push(
              "Profit target must be below current price for sell orders"
            );
          }
          if (stopLossPrice <= currentPrice) {
            errors.push(
              "Stop loss must be above current price for sell orders"
            );
          }
        }
      }

      if (isTrailingStop && trailAmount <= 0 && trailPercent <= 0) {
        errors.push("Trail amount or trail percent must be specified");
      }

      if (isOCOOrder) {
        if (ocoLimitPrice <= 0) {
          errors.push("OCO limit price must be greater than 0");
        }
        if (ocoStopPrice <= 0) {
          errors.push("OCO stop price must be greater than 0");
        }
      }

      return errors;
    };

    const submitOrder = async () => {
      const validationErrors = validateOrder();
      if (validationErrors.length > 0) {
        setError(validationErrors.join("; "));
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        let orderData: any = {
          portfolioId,
          symbol,
          orderType,
          side,
          quantity,
          timeInForce,
        };

        // Add price fields based on order type
        if (orderType === "limit") {
          orderData.limitPrice = limitPrice;
        }
        if (orderType === "stop_loss") {
          orderData.stopPrice = stopPrice;
        }
        if (orderType === "stop_limit") {
          orderData.limitPrice = limitPrice;
          orderData.stopPrice = stopPrice;
        }

        // Handle advanced order types
        if (isBracketOrder) {
          orderData = {
            ...orderData,
            orderType: "bracket",
            profitTargetPrice,
            stopLossPrice,
          };
        }

        if (isTrailingStop) {
          orderData = {
            ...orderData,
            orderType: "trailing_stop",
            trailAmount: trailAmount || undefined,
            trailPercent: trailPercent || undefined,
          };
        }

        if (isConditionalOrder && conditionalTriggers.length > 0) {
          orderData.conditionalTriggers = conditionalTriggers;
        }

        // Submit order through appropriate endpoint
        let response;
        if (isBracketOrder) {
          response = await fetch("/api/order-management/orders/bracket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portfolioId,
              symbol,
              side,
              quantity,
              entryPrice: limitPrice || currentPrice,
              stopLossPrice,
              takeProfitPrice: profitTargetPrice,
            }),
          });
        } else if (isOCOOrder) {
          response = await fetch("/api/order-management/orders/oco", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              portfolioId,
              symbol,
              quantity,
              limitPrice: ocoLimitPrice,
              stopPrice: ocoStopPrice,
            }),
          });
        } else if (isConditionalOrder) {
          response = await fetch("/api/order-management/orders/conditional", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
          });
        } else {
          response = await fetch("/api/order-management/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to submit order");
        }

        const order = await response.json();
        setSuccess(`Order submitted successfully: ${order.id}`);

        if (onOrderSubmitted) {
          onOrderSubmitted(order);
        }

        // Reset form
        resetForm();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    };

    const resetForm = () => {
      setOrderType("market");
      setSide("buy");
      setQuantity(0);
      setLimitPrice(0);
      setStopPrice(0);
      setTimeInForce("day");
      setIsBracketOrder(false);
      setProfitTargetPrice(0);
      setStopLossPrice(0);
      setIsTrailingStop(false);
      setTrailAmount(0);
      setTrailPercent(0);
      setIsOCOOrder(false);
      setOcoLimitPrice(0);
      setOcoStopPrice(0);
      setIsConditionalOrder(false);
      setConditionalTriggers([]);
    };

    return (
      <Card sx={{ maxWidth: 800, margin: "auto" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Advanced Order Entry - {symbol}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Price: ${currentPrice.toFixed(2)}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Basic Order Fields */}
            <FormControl fullWidth>
              <InputLabel>Order Type</InputLabel>
              <Select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                label="Order Type"
              >
                <MenuItem value="market">Market</MenuItem>
                <MenuItem value="limit">Limit</MenuItem>
                <MenuItem value="stop_loss">Stop Loss</MenuItem>
                <MenuItem value="stop_limit">Stop Limit</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Side</InputLabel>
              <Select
                value={side}
                onChange={(e) => setSide(e.target.value as "buy" | "sell")}
                label="Side"
              >
                <MenuItem value="buy">Buy</MenuItem>
                <MenuItem value="sell">Sell</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              inputProps={{ min: 0, step: 1 }}
            />

            <FormControl fullWidth>
              <InputLabel>Time in Force</InputLabel>
              <Select
                value={timeInForce}
                onChange={(e) => setTimeInForce(e.target.value)}
                label="Time in Force"
              >
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="gtc">Good Till Cancelled</MenuItem>
                <MenuItem value="ioc">Immediate or Cancel</MenuItem>
                <MenuItem value="fok">Fill or Kill</MenuItem>
              </Select>
            </FormControl>

            {/* Price Fields */}
            {(orderType === "limit" || orderType === "stop_limit") && (
              <TextField
                fullWidth
                label="Limit Price"
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(Number(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            )}

            {(orderType === "stop_loss" || orderType === "stop_limit") && (
              <TextField
                fullWidth
                label="Stop Price"
                type="number"
                value={stopPrice}
                onChange={(e) => setStopPrice(Number(e.target.value))}
                inputProps={{ min: 0, step: 0.01 }}
              />
            )}
          </Box>

          {/* Order Summary */}
          <Box sx={{ mt: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">Order Summary</Typography>
                <Typography>
                  Estimated Cost: ${estimatedCost.toFixed(2)}
                </Typography>
                {riskWarnings.map((warning, index) => (
                  <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                    {warning}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Box>

          {/* Advanced Order Types */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Advanced Order Features
            </Typography>

            {/* Bracket Order */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isBracketOrder}
                      onChange={(e) => setIsBracketOrder(e.target.checked)}
                    />
                  }
                  label="Bracket Order"
                  onClick={(e) => e.stopPropagation()}
                />
                <Tooltip title="Entry order with automatic profit target and stop loss">
                  <InfoIcon sx={{ ml: 1, fontSize: 16 }} />
                </Tooltip>
              </AccordionSummary>
              <AccordionDetails>
                {isBracketOrder && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Profit Target Price"
                      type="number"
                      value={profitTargetPrice}
                      onChange={(e) =>
                        setProfitTargetPrice(Number(e.target.value))
                      }
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Stop Loss Price"
                      type="number"
                      value={stopLossPrice}
                      onChange={(e) => setStopLossPrice(Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Trailing Stop */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTrailingStop}
                      onChange={(e) => setIsTrailingStop(e.target.checked)}
                    />
                  }
                  label="Trailing Stop"
                  onClick={(e) => e.stopPropagation()}
                />
                <Tooltip title="Stop order that trails the market price">
                  <InfoIcon sx={{ ml: 1, fontSize: 16 }} />
                </Tooltip>
              </AccordionSummary>
              <AccordionDetails>
                {isTrailingStop && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Trail Amount ($)"
                      type="number"
                      value={trailAmount}
                      onChange={(e) => setTrailAmount(Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Trail Percent (%)"
                      type="number"
                      value={trailPercent}
                      onChange={(e) => setTrailPercent(Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.1, max: 100 }}
                    />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* OCO Order */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isOCOOrder}
                      onChange={(e) => setIsOCOOrder(e.target.checked)}
                    />
                  }
                  label="One-Cancels-Other (OCO)"
                  onClick={(e) => e.stopPropagation()}
                />
                <Tooltip title="Two orders where execution of one cancels the other">
                  <InfoIcon sx={{ ml: 1, fontSize: 16 }} />
                </Tooltip>
              </AccordionSummary>
              <AccordionDetails>
                {isOCOOrder && (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      gap: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      label="Limit Price"
                      type="number"
                      value={ocoLimitPrice}
                      onChange={(e) => setOcoLimitPrice(Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                    <TextField
                      fullWidth
                      label="Stop Price"
                      type="number"
                      value={ocoStopPrice}
                      onChange={(e) => setOcoStopPrice(Number(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Conditional Order */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isConditionalOrder}
                      onChange={(e) => setIsConditionalOrder(e.target.checked)}
                    />
                  }
                  label="Conditional Order"
                  onClick={(e) => e.stopPropagation()}
                />
                <Tooltip title="Order triggered by custom conditions">
                  <InfoIcon sx={{ ml: 1, fontSize: 16 }} />
                </Tooltip>
              </AccordionSummary>
              <AccordionDetails>
                {isConditionalOrder && (
                  <Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 2,
                      }}
                    >
                      <Typography variant="subtitle1">
                        Conditional Triggers
                      </Typography>
                      <Button
                        startIcon={<AddIcon />}
                        onClick={addConditionalTrigger}
                        size="small"
                      >
                        Add Trigger
                      </Button>
                    </Box>

                    {conditionalTriggers.map((trigger, index) => (
                      <Card key={trigger.id} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(5, 1fr) auto",
                              gap: 2,
                              alignItems: "center",
                              "@media (max-width: 900px)": {
                                gridTemplateColumns: "1fr",
                                gap: 1,
                              },
                            }}
                          >
                            <FormControl fullWidth size="small">
                              <InputLabel>Type</InputLabel>
                              <Select
                                value={trigger.type}
                                onChange={(e) =>
                                  updateConditionalTrigger(index, {
                                    type: e.target.value as any,
                                  })
                                }
                                label="Type"
                              >
                                <MenuItem value="price">Price</MenuItem>
                                <MenuItem value="volume">Volume</MenuItem>
                                <MenuItem value="time">Time</MenuItem>
                                <MenuItem value="indicator">Indicator</MenuItem>
                              </Select>
                            </FormControl>

                            <TextField
                              fullWidth
                              size="small"
                              label="Field"
                              value={trigger.field}
                              onChange={(e) =>
                                updateConditionalTrigger(index, {
                                  field: e.target.value,
                                })
                              }
                            />

                            <FormControl fullWidth size="small">
                              <InputLabel>Condition</InputLabel>
                              <Select
                                value={trigger.condition}
                                onChange={(e) =>
                                  updateConditionalTrigger(index, {
                                    condition: e.target.value as any,
                                  })
                                }
                                label="Condition"
                              >
                                <MenuItem value="greater_than">
                                  Greater Than
                                </MenuItem>
                                <MenuItem value="less_than">Less Than</MenuItem>
                                <MenuItem value="equals">Equals</MenuItem>
                                <MenuItem value="between">Between</MenuItem>
                              </Select>
                            </FormControl>

                            <TextField
                              fullWidth
                              size="small"
                              label="Value"
                              type={
                                trigger.type === "time"
                                  ? "datetime-local"
                                  : "number"
                              }
                              value={trigger.value}
                              onChange={(e) =>
                                updateConditionalTrigger(index, {
                                  value:
                                    trigger.type === "time"
                                      ? e.target.value
                                      : Number(e.target.value),
                                })
                              }
                            />

                            {trigger.condition === "between" && (
                              <TextField
                                fullWidth
                                size="small"
                                label="Value 2"
                                type="number"
                                value={trigger.value2 || ""}
                                onChange={(e) =>
                                  updateConditionalTrigger(index, {
                                    value2: Number(e.target.value),
                                  })
                                }
                              />
                            )}

                            <IconButton
                              color="error"
                              onClick={() => removeConditionalTrigger(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>

                          {index > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <FormControl size="small">
                                <InputLabel>Logic</InputLabel>
                                <Select
                                  value={trigger.logicalOperator || "AND"}
                                  onChange={(e) =>
                                    updateConditionalTrigger(index, {
                                      logicalOperator: e.target.value as any,
                                    })
                                  }
                                  label="Logic"
                                >
                                  <MenuItem value="AND">AND</MenuItem>
                                  <MenuItem value="OR">OR</MenuItem>
                                </Select>
                              </FormControl>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}
          >
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="outlined" onClick={resetForm}>
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={submitOrder}
              disabled={isSubmitting}
              color={side === "buy" ? "primary" : "error"}
            >
              {isSubmitting
                ? "Submitting..."
                : `Submit ${side.toUpperCase()} Order`}
            </Button>
          </Box>

          {/* Error/Success Messages */}
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
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess(null)}
          >
            <Alert severity="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Snackbar>
        </CardContent>
      </Card>
    );
  }
);
