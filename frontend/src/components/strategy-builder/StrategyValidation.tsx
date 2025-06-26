import { CheckCircle, Error, Warning } from "@mui/icons-material";
import { Alert, Box, Button, Typography } from "@mui/material";
import React from "react";
import { ValidationResult } from "./StrategyBuilder";

interface StrategyValidationProps {
  validation: ValidationResult | null;
  onValidate: () => void;
}

export const StrategyValidation: React.FC<StrategyValidationProps> = ({
  validation,
  onValidate,
}) => {
  const getValidationIcon = () => {
    if (!validation) return null;

    if (validation.isValid) {
      return <CheckCircle color="success" />;
    } else if (validation.errors.length > 0) {
      return <Error color="error" />;
    } else if (validation.warnings && validation.warnings.length > 0) {
      return <Warning color="warning" />;
    }
    return null;
  };

  const getValidationColor = () => {
    if (!validation) return "info";
    if (validation.isValid) return "success";
    if (validation.errors.length > 0) return "error";
    return "warning";
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{ display: "flex", alignItems: "center", gap: 1 }}
        >
          {getValidationIcon()}
          Strategy Validation
        </Typography>
        <Button variant="outlined" size="small" onClick={onValidate}>
          Validate
        </Button>
      </Box>

      {validation && (
        <Box sx={{ mb: 2 }}>
          <Alert severity={getValidationColor()}>
            {validation.isValid
              ? "Strategy is valid and ready for testing!"
              : `Found ${validation.errors.length} error(s) ${
                  validation.warnings
                    ? `and ${validation.warnings.length} warning(s)`
                    : ""
                }`}
          </Alert>

          {validation.errors.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="error" gutterBottom>
                Errors:
              </Typography>
              {validation.errors.map((error, index) => (
                <Alert key={index} severity="error" sx={{ mt: 1 }}>
                  {error}
                </Alert>
              ))}
            </Box>
          )}

          {validation.warnings && validation.warnings.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="warning.main" gutterBottom>
                Warnings:
              </Typography>
              {validation.warnings.map((warning, index) => (
                <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                  {warning}
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      )}

      {!validation && (
        <Typography color="text.secondary">
          Click "Validate" to check your strategy for errors and warnings.
        </Typography>
      )}
    </Box>
  );
};
