import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { CreateOrderDto, Portfolio } from "../types";

interface CreateOrderFormProps {
  portfolios: Portfolio[];
  onSubmit: (orderData: CreateOrderDto) => void;
  onCancel: () => void;
  defaultPortfolioId?: number;
}

export default function CreateOrderForm({
  portfolios,
  onSubmit,
  onCancel,
  defaultPortfolioId,
}: CreateOrderFormProps) {
  const [formData, setFormData] = useState<CreateOrderDto>({
    portfolioId:
      defaultPortfolioId || (portfolios.length > 0 ? portfolios[0].id : 0),
    symbol: "",
    orderType: "market",
    side: "buy",
    quantity: 1,
    limitPrice: undefined,
    stopPrice: undefined,
    triggerPrice: undefined,
    timeInForce: "day",
    notes: "",
  });

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateOrderDto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.portfolioId) {
      newErrors.portfolioId = "Portfolio is required";
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = "Symbol is required";
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    }

    if (
      formData.orderType === "limit" &&
      (!formData.limitPrice || formData.limitPrice <= 0)
    ) {
      newErrors.limitPrice = "Limit price is required for limit orders";
    }
    if (
      (formData.orderType === "stop_loss" ||
        formData.orderType === "take_profit") &&
      (!formData.stopPrice || formData.stopPrice <= 0)
    ) {
      newErrors.stopPrice = "Stop price is required for stop orders";
    }

    if (formData.orderType === "stop_limit") {
      if (!formData.limitPrice || formData.limitPrice <= 0) {
        newErrors.limitPrice = "Limit price is required for stop-limit orders";
      }
      if (!formData.stopPrice || formData.stopPrice <= 0) {
        newErrors.stopPrice = "Stop price is required for stop-limit orders";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Clean up the data before submitting
      const orderData = {
        ...formData,
        symbol: formData.symbol.toUpperCase().trim(),
        limitPrice:
          formData.orderType === "limit" || formData.orderType === "stop_limit"
            ? formData.limitPrice
            : undefined,
        stopPrice:
          formData.orderType === "stop_loss" ||
          formData.orderType === "stop_limit"
            ? formData.stopPrice
            : undefined,
      };

      onSubmit(orderData);
    }
  };
  const orderTypes = [
    { value: "market", label: "Market" },
    { value: "limit", label: "Limit" },
    { value: "stop_loss", label: "Stop Loss" },
    { value: "take_profit", label: "Take Profit" },
    { value: "stop_limit", label: "Stop Limit" },
    { value: "entry", label: "Entry" },
  ];

  const timeInForceOptions = [
    { value: "day", label: "Day" },
    { value: "gtc", label: "Good Till Cancelled" },
    { value: "ioc", label: "Immediate or Cancel" },
    { value: "fok", label: "Fill or Kill" },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        {/* Basic Order Information */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            label="Portfolio"
            value={formData.portfolioId}
            onChange={(e) =>
              handleInputChange("portfolioId", Number(e.target.value))
            }
            error={!!errors.portfolioId}
            helperText={errors.portfolioId}
            required
            sx={{ minWidth: 200 }}
          >
            {portfolios.map((portfolio) => (
              <MenuItem key={portfolio.id} value={portfolio.id}>
                {portfolio.name} ($
                {Number(portfolio.totalValue || 0).toFixed(2)})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Symbol"
            value={formData.symbol}
            onChange={(e) => handleInputChange("symbol", e.target.value)}
            error={!!errors.symbol}
            helperText={errors.symbol}
            placeholder="e.g., AAPL"
            required
            sx={{ minWidth: 150 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            label="Order Type"
            value={formData.orderType}
            onChange={(e) => handleInputChange("orderType", e.target.value)}
            sx={{ minWidth: 150 }}
          >
            {orderTypes.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Side"
            value={formData.side}
            onChange={(e) => handleInputChange("side", e.target.value)}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="buy">Buy</MenuItem>
            <MenuItem value="sell">Sell</MenuItem>
          </TextField>

          <TextField
            type="number"
            label="Quantity"
            value={formData.quantity}
            onChange={(e) =>
              handleInputChange("quantity", Number(e.target.value))
            }
            error={!!errors.quantity}
            helperText={errors.quantity}
            inputProps={{ min: 1, step: 1 }}
            required
            sx={{ minWidth: 120 }}
          />
        </Stack>{" "}
        {/* Conditional Price Fields */}
        {(formData.orderType === "limit" ||
          formData.orderType === "stop_limit" ||
          formData.orderType === "stop_loss" ||
          formData.orderType === "take_profit") && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {(formData.orderType === "limit" ||
              formData.orderType === "stop_limit") && (
              <TextField
                type="number"
                label="Limit Price"
                value={formData.limitPrice || ""}
                onChange={(e) =>
                  handleInputChange("limitPrice", Number(e.target.value))
                }
                error={!!errors.limitPrice}
                helperText={errors.limitPrice}
                inputProps={{ min: 0.01, step: 0.01 }}
                required
                sx={{ minWidth: 120 }}
              />
            )}{" "}
            {(formData.orderType === "stop_loss" ||
              formData.orderType === "take_profit" ||
              formData.orderType === "stop_limit") && (
              <TextField
                type="number"
                label="Stop Price"
                value={formData.stopPrice || ""}
                onChange={(e) =>
                  handleInputChange("stopPrice", Number(e.target.value))
                }
                error={!!errors.stopPrice}
                helperText={errors.stopPrice}
                inputProps={{ min: 0.01, step: 0.01 }}
                required
                sx={{ minWidth: 120 }}
              />
            )}
          </Stack>
        )}
        {/* Advanced Options Toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={showAdvancedOptions}
              onChange={(e) => setShowAdvancedOptions(e.target.checked)}
            />
          }
          label="Show Advanced Options"
        />
        {/* Advanced Options */}
        {showAdvancedOptions && (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Time in Force"
                value={formData.timeInForce}
                onChange={(e) =>
                  handleInputChange("timeInForce", e.target.value)
                }
                sx={{ minWidth: 180 }}
              >
                {timeInForceOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="number"
                label="Trigger Price (Optional)"
                value={formData.triggerPrice || ""}
                onChange={(e) =>
                  handleInputChange("triggerPrice", Number(e.target.value))
                }
                inputProps={{ min: 0.01, step: 0.01 }}
                helperText="Price that triggers conditional orders"
                sx={{ minWidth: 160 }}
              />
            </Stack>

            <TextField
              multiline
              rows={2}
              label="Notes (Optional)"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Add any notes about this order..."
            />
          </Stack>
        )}
        {/* Order Summary */}
        <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Order Summary
          </Typography>
          <Typography variant="body2">
            {formData.side.toUpperCase()} {formData.quantity} shares of{" "}
            {formData.symbol || "[Symbol]"}
            {formData.orderType !== "market" &&
              formData.limitPrice &&
              ` at $${formData.limitPrice}`}{" "}
            {(formData.orderType === "stop_loss" ||
              formData.orderType === "take_profit" ||
              formData.orderType === "stop_limit") &&
              formData.stopPrice &&
              ` (stop: $${formData.stopPrice})`}
          </Typography>
        </Box>
        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color={formData.side === "buy" ? "success" : "error"}
          >
            Place {formData.side.toUpperCase()} Order
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
