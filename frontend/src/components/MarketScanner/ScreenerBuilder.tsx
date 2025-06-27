import { Add as AddIcon, Delete as DeleteIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import {
  FilterCriteria,
  FilterOperator,
  FilterType,
  ScanCriteria,
  ScreenerTemplate,
} from "../../types/marketScanner";

interface ScreenerBuilderProps {
  onCriteriaChange: (criteria: ScanCriteria) => void;
  onTemplateSelect: (template: ScreenerTemplate | null) => void;
  selectedTemplate: ScreenerTemplate | null;
}

export const ScreenerBuilder: React.FC<ScreenerBuilderProps> = ({
  onCriteriaChange,
  onTemplateSelect,
  selectedTemplate,
}) => {
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [limit, setLimit] = useState<number>(50);

  const filterTypeOptions = [
    { value: FilterType.PRICE, label: "Price" },
    { value: FilterType.VOLUME, label: "Volume" },
    { value: FilterType.MARKET_CAP, label: "Market Cap" },
    { value: FilterType.TECHNICAL, label: "Technical" },
    { value: FilterType.FUNDAMENTAL, label: "Fundamental" },
    { value: FilterType.PATTERN, label: "Pattern" },
  ];

  const operatorOptions = [
    { value: FilterOperator.GREATER_THAN, label: "Greater Than" },
    { value: FilterOperator.LESS_THAN, label: "Less Than" },
    { value: FilterOperator.EQUALS, label: "Equals" },
    { value: FilterOperator.BETWEEN, label: "Between" },
    { value: FilterOperator.ABOVE, label: "Above" },
    { value: FilterOperator.BELOW, label: "Below" },
    { value: FilterOperator.CROSSES_ABOVE, label: "Crosses Above" },
    { value: FilterOperator.CROSSES_BELOW, label: "Crosses Below" },
  ];

  const getFieldOptions = (type: FilterType) => {
    switch (type) {
      case FilterType.PRICE:
        return [
          { value: "price", label: "Current Price" },
          { value: "change_percent", label: "Change %" },
          { value: "high_52w", label: "52W High" },
          { value: "low_52w", label: "52W Low" },
        ];
      case FilterType.VOLUME:
        return [
          { value: "volume", label: "Current Volume" },
          { value: "avg_volume", label: "Average Volume" },
          { value: "volume_ratio", label: "Volume Ratio" },
        ];
      case FilterType.TECHNICAL:
        return [
          { value: "rsi", label: "RSI" },
          { value: "macd", label: "MACD" },
          { value: "sma_20", label: "SMA 20" },
          { value: "ema_50", label: "EMA 50" },
          { value: "bollinger_upper", label: "Bollinger Upper" },
          { value: "bollinger_lower", label: "Bollinger Lower" },
        ];
      case FilterType.FUNDAMENTAL:
        return [
          { value: "pe_ratio", label: "P/E Ratio" },
          { value: "market_cap", label: "Market Cap" },
          { value: "revenue", label: "Revenue" },
        ];
      default:
        return [];
    }
  };

  const addFilter = () => {
    const newFilter: FilterCriteria = {
      id: `filter_${Date.now()}`,
      type: FilterType.PRICE,
      field: "price",
      operator: FilterOperator.GREATER_THAN,
      value: 0,
      logicalOperator: filters.length > 0 ? "AND" : undefined,
    };

    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    updateCriteria(updatedFilters);
  };

  const updateFilter = (
    index: number,
    updatedFilter: Partial<FilterCriteria>
  ) => {
    const updatedFilters = filters.map((filter, i) =>
      i === index ? { ...filter, ...updatedFilter } : filter
    );
    setFilters(updatedFilters);
    updateCriteria(updatedFilters);
  };

  const removeFilter = (index: number) => {
    const updatedFilters = filters.filter((_, i) => i !== index);
    setFilters(updatedFilters);
    updateCriteria(updatedFilters);
  };

  const updateCriteria = (currentFilters: FilterCriteria[]) => {
    const criteria: ScanCriteria = {
      filters: currentFilters,
      sortBy: sortBy || undefined,
      sortOrder: sortOrder,
      limit: limit,
    };
    onCriteriaChange(criteria);
  };

  const clearFilters = () => {
    setFilters([]);
    setSortBy("");
    setSortOrder("DESC");
    setLimit(50);
    onTemplateSelect(null);
    onCriteriaChange({ filters: [] });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: "#f1f5f9" }}>
          Custom Screener Builder
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={addFilter}
            sx={{
              color: "#3b82f6",
              borderColor: "#3b82f6",
              "&:hover": {
                borderColor: "#2563eb",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
              },
            }}
          >
            Add Filter
          </Button>
          <Button
            variant="outlined"
            onClick={clearFilters}
            sx={{
              color: "#ef4444",
              borderColor: "#ef4444",
              "&:hover": {
                borderColor: "#dc2626",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
              },
            }}
          >
            Clear All
          </Button>
        </Box>
      </Box>

      {selectedTemplate && (
        <Card
          sx={{ mb: 3, bgcolor: "primary.main", color: "primary.contrastText" }}
        >
          <CardContent>
            <Typography variant="h6">{selectedTemplate.name}</Typography>
            <Typography variant="body2">
              {selectedTemplate.description}
            </Typography>
            <Chip
              label={selectedTemplate.category}
              size="small"
              sx={{ mt: 1, bgcolor: "rgba(255,255,255,0.2)" }}
            />
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {filters.map((filter, index) => (
        <Card
          key={filter.id}
          sx={{
            mb: 2,
            backgroundColor: "rgba(30, 41, 59, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              {index > 0 && (
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={filter.logicalOperator || "AND"}
                    onChange={(e) =>
                      updateFilter(index, {
                        logicalOperator: e.target.value as "AND" | "OR",
                      })
                    }
                    sx={{
                      color: "#f1f5f9",
                      ".MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(148, 163, 184, 0.3)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(148, 163, 184, 0.5)",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#3b82f6",
                      },
                      ".MuiSvgIcon-root": {
                        color: "#94a3b8",
                      },
                    }}
                  >
                    <MenuItem value="AND">AND</MenuItem>
                    <MenuItem value="OR">OR</MenuItem>
                  </Select>
                </FormControl>
              )}
              <Typography variant="h6" sx={{ minWidth: 60, color: "#f1f5f9" }}>
                Filter {index + 1}
              </Typography>
              <IconButton
                color="error"
                onClick={() => removeFilter(index)}
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                  md: "repeat(5, 1fr)",
                },
                gap: 2,
                alignItems: "center",
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#94a3b8" }}>Type</InputLabel>
                <Select
                  value={filter.type}
                  label="Type"
                  onChange={(e) =>
                    updateFilter(index, {
                      type: e.target.value as FilterType,
                      field:
                        getFieldOptions(e.target.value as FilterType)[0]
                          ?.value || "",
                    })
                  }
                  sx={{
                    color: "#f1f5f9",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3b82f6",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#94a3b8",
                    },
                  }}
                >
                  {filterTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#94a3b8" }}>Field</InputLabel>
                <Select
                  value={filter.field}
                  label="Field"
                  onChange={(e) =>
                    updateFilter(index, { field: e.target.value })
                  }
                  sx={{
                    color: "#f1f5f9",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3b82f6",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#94a3b8",
                    },
                  }}
                >
                  {getFieldOptions(filter.type).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#94a3b8" }}>Operator</InputLabel>
                <Select
                  value={filter.operator}
                  label="Operator"
                  onChange={(e) =>
                    updateFilter(index, {
                      operator: e.target.value as FilterOperator,
                    })
                  }
                  sx={{
                    color: "#f1f5f9",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3b82f6",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#94a3b8",
                    },
                  }}
                >
                  {operatorOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Value"
                type="number"
                value={filter.value}
                onChange={(e) =>
                  updateFilter(index, {
                    value: parseFloat(e.target.value) || 0,
                  })
                }
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "#94a3b8",
                  },
                  "& .MuiOutlinedInput-root": {
                    color: "#f1f5f9",
                    "& fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                    },
                  },
                }}
              />

              {filter.operator === FilterOperator.BETWEEN && (
                <TextField
                  fullWidth
                  size="small"
                  label="Value 2"
                  type="number"
                  value={filter.value2 || ""}
                  onChange={(e) =>
                    updateFilter(index, {
                      value2: parseFloat(e.target.value) || undefined,
                    })
                  }
                  sx={{
                    "& .MuiInputLabel-root": {
                      color: "#94a3b8",
                    },
                    "& .MuiOutlinedInput-root": {
                      color: "#f1f5f9",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#3b82f6",
                      },
                    },
                  }}
                />
              )}
            </Box>
          </CardContent>
        </Card>
      ))}

      {filters.length === 0 && (
        <Card
          sx={{
            backgroundColor: "rgba(30, 41, 59, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
          }}
        >
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ color: "#94a3b8" }}>
              No filters added yet
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: "#64748b" }}>
              Add filters to build your custom screener criteria
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addFilter}
              sx={{
                backgroundColor: "#3b82f6",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#2563eb",
                },
              }}
            >
              Add Your First Filter
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sorting and Limits */}
      {filters.length > 0 && (
        <Card
          sx={{
            mt: 3,
            backgroundColor: "rgba(30, 41, 59, 0.9)",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            borderRadius: "12px",
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: "#f1f5f9" }}>
              Output Settings
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
                gap: 2,
              }}
            >
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#94a3b8" }}>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateCriteria(filters);
                  }}
                  sx={{
                    color: "#f1f5f9",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3b82f6",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#94a3b8",
                    },
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="price">Price</MenuItem>
                  <MenuItem value="volume">Volume</MenuItem>
                  <MenuItem value="change_percent">Change %</MenuItem>
                  <MenuItem value="market_cap">Market Cap</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: "#94a3b8" }}>Sort Order</InputLabel>
                <Select
                  value={sortOrder}
                  label="Sort Order"
                  onChange={(e) => {
                    setSortOrder(e.target.value as "ASC" | "DESC");
                    updateCriteria(filters);
                  }}
                  sx={{
                    color: "#f1f5f9",
                    ".MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3b82f6",
                    },
                    ".MuiSvgIcon-root": {
                      color: "#94a3b8",
                    },
                  }}
                >
                  <MenuItem value="DESC">Descending</MenuItem>
                  <MenuItem value="ASC">Ascending</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Result Limit"
                type="number"
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value) || 50);
                  updateCriteria(filters);
                }}
                inputProps={{ min: 1, max: 1000 }}
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "#94a3b8",
                  },
                  "& .MuiOutlinedInput-root": {
                    color: "#f1f5f9",
                    "& fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.3)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(148, 163, 184, 0.5)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#3b82f6",
                    },
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
