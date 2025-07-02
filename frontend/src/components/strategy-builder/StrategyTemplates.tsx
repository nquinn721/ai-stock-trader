import { Star, TrendingUp } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  uses: number;
  author: string;
  tags: string[];
  components: any[];
  defaultRiskRules: any[];
  defaultSymbols: string[];
  defaultTimeframe: string;
  expectedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

interface StrategyTemplatesProps {
  onUseTemplate: (template: StrategyTemplate) => void;
}

export const StrategyTemplates: React.FC<StrategyTemplatesProps> = ({
  onUseTemplate,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  // Mock templates data
  const templates: StrategyTemplate[] = [
    {
      id: "1",
      name: "Simple Moving Average Crossover",
      description:
        "A basic trend-following strategy using 50-day and 200-day moving averages",
      category: "Trend Following",
      difficulty: "Beginner",
      rating: 4.2,
      uses: 1250,
      author: "Trading Bot Pro",
      tags: ["Moving Average", "Trend", "Simple"],
      components: [],
      defaultRiskRules: [],
      defaultSymbols: ["AAPL", "MSFT", "GOOGL"],
      defaultTimeframe: "1d",
      expectedReturn: 0.12,
      maxDrawdown: 0.08,
      sharpeRatio: 1.5,
    },
    {
      id: "2",
      name: "RSI Momentum Strategy",
      description:
        "Mean reversion strategy using RSI overbought/oversold signals",
      category: "Mean Reversion",
      difficulty: "Beginner",
      rating: 4.0,
      uses: 980,
      author: "Quant Master",
      tags: ["RSI", "Momentum", "Oscillator"],
      components: [],
      defaultRiskRules: [],
      defaultSymbols: ["SPY", "QQQ", "IWM"],
      defaultTimeframe: "4h",
      expectedReturn: 0.15,
      maxDrawdown: 0.12,
      sharpeRatio: 1.2,
    },
    {
      id: "3",
      name: "MACD Divergence Hunter",
      description:
        "Exploit MACD divergences with this advanced trend reversal strategy",
      category: "Divergence",
      difficulty: "Advanced",
      rating: 4.8,
      uses: 430,
      author: "Trend Detective",
      tags: ["MACD", "Divergence", "Trend Reversal"],
      components: [],
      defaultRiskRules: [],
      defaultSymbols: ["EURUSD", "GBPUSD", "USDJPY"],
      defaultTimeframe: "30m",
      expectedReturn: 0.18,
      maxDrawdown: 0.15,
      sharpeRatio: 2.1,
    },
    {
      id: "4",
      name: "Crypto Volatility Breakout",
      description:
        "Capture explosive moves with Bollinger Bands and momentum confirmation",
      category: "Breakout",
      difficulty: "Intermediate",
      rating: 4.5,
      uses: 760,
      author: "Volatility Master",
      tags: ["Bollinger Bands", "Breakout", "Volatility"],
      components: [],
      defaultRiskRules: [],
      defaultSymbols: ["TSLA", "NVDA", "AMD"],
      defaultTimeframe: "1h",
      expectedReturn: 0.25,
      maxDrawdown: 0.18,
      sharpeRatio: 1.8,
    },
  ];

  const categories = [
    "All",
    ...Array.from(new Set(templates.map((t) => t.category))),
  ];

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "success";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "error";
      default:
        return "default";
    }
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Strategy Templates
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Choose from pre-built strategies or use them as starting points for your
        own creations
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            gap: 2,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Search templates"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Templates Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
          gap: 3,
        }}
      >
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <CardContent sx={{ flex: 1 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {template.name}
                </Typography>
                <Chip
                  label={template.difficulty}
                  color={getDifficultyColor(template.difficulty) as any}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {template.description}
              </Typography>

              {/* Tags */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                {template.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
              </Box>

              {/* Stats */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Star sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="body2">{template.rating}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {template.uses} uses
                </Typography>
              </Box>

              {/* Performance Metrics */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 1,
                  mt: 2,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 0.5,
                    }}
                  >
                    <TrendingUp
                      sx={{ fontSize: 16, color: "success.main", mr: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Return
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="success.main">
                    {formatPercent(template.expectedReturn)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 0.5,
                    }}
                  >
                    <TrendingUp
                      sx={{ fontSize: 16, color: "error.main", mr: 0.5 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Drawdown
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="error.main">
                    {formatPercent(template.maxDrawdown)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Sharpe
                  </Typography>
                  <Typography variant="body2">
                    {template.sharpeRatio.toFixed(1)}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                by {template.author}
              </Typography>
            </CardContent>

            <CardActions>
              <Button
                fullWidth
                variant="contained"
                onClick={() => onUseTemplate(template)}
              >
                Use This Template
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {filteredTemplates.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No templates found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or category filter
          </Typography>
        </Box>
      )}
    </Box>
  );
};
