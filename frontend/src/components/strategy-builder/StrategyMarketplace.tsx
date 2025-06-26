import { Download, Favorite, Star, Visibility } from "@mui/icons-material";
import {
  Avatar,
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
  Rating,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";

interface MarketplaceStrategy {
  id: string;
  name: string;
  description: string;
  author: {
    name: string;
    avatar: string;
    rating: number;
    strategiesCount: number;
  };
  category: string;
  price: number; // 0 for free
  rating: number;
  downloads: number;
  favorites: number;
  views: number;
  tags: string[];
  performance: {
    backtestedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
  };
  timeframe: string;
  supportedAssets: string[];
  lastUpdated: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  verified: boolean;
}

interface StrategyMarketplaceProps {
  onUseStrategy: (strategy: MarketplaceStrategy) => void;
}

export const StrategyMarketplace: React.FC<StrategyMarketplaceProps> = ({
  onUseStrategy,
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [sortBy, setSortBy] = React.useState<string>("rating");
  const [priceFilter, setPriceFilter] = React.useState<string>("all");

  // Mock marketplace data
  const strategies: MarketplaceStrategy[] = [
    {
      id: "1",
      name: "AI-Powered Momentum Scanner",
      description:
        "Advanced momentum strategy using machine learning to identify high-probability breakouts",
      author: {
        name: "QuantAI Labs",
        avatar: "https://via.placeholder.com/40",
        rating: 4.8,
        strategiesCount: 15,
      },
      category: "AI/ML",
      price: 29.99,
      rating: 4.9,
      downloads: 2340,
      favorites: 567,
      views: 12450,
      tags: ["AI", "Momentum", "Breakout", "High-Frequency"],
      performance: {
        backtestedReturn: 0.42,
        maxDrawdown: 0.08,
        sharpeRatio: 2.8,
        winRate: 0.68,
        totalTrades: 1250,
      },
      timeframe: "5m",
      supportedAssets: ["Stocks", "Crypto", "Forex"],
      lastUpdated: "2024-01-15",
      difficulty: "Advanced",
      verified: true,
    },
    {
      id: "2",
      name: "Crypto Arbitrage Master",
      description:
        "Cross-exchange arbitrage opportunities detector for major cryptocurrencies",
      author: {
        name: "CryptoBot Elite",
        avatar: "https://via.placeholder.com/40",
        rating: 4.6,
        strategiesCount: 8,
      },
      category: "Arbitrage",
      price: 0,
      rating: 4.7,
      downloads: 5670,
      favorites: 1230,
      views: 28900,
      tags: ["Crypto", "Arbitrage", "Low-Risk", "Automated"],
      performance: {
        backtestedReturn: 0.18,
        maxDrawdown: 0.03,
        sharpeRatio: 3.2,
        winRate: 0.85,
        totalTrades: 890,
      },
      timeframe: "1m",
      supportedAssets: ["Crypto"],
      lastUpdated: "2024-01-20",
      difficulty: "Intermediate",
      verified: true,
    },
    {
      id: "3",
      name: "DCA Dollar-Cost Averaging Pro",
      description:
        "Smart DCA strategy with market timing and volatility-based position sizing",
      author: {
        name: "InvestWise",
        avatar: "https://via.placeholder.com/40",
        rating: 4.4,
        strategiesCount: 22,
      },
      category: "DCA/Long-term",
      price: 0,
      rating: 4.3,
      downloads: 8900,
      favorites: 2100,
      views: 45600,
      tags: ["DCA", "Long-term", "Low-Risk", "Beginner-Friendly"],
      performance: {
        backtestedReturn: 0.16,
        maxDrawdown: 0.12,
        sharpeRatio: 1.4,
        winRate: 0.72,
        totalTrades: 156,
      },
      timeframe: "1d",
      supportedAssets: ["Stocks", "ETFs", "Crypto"],
      lastUpdated: "2024-01-18",
      difficulty: "Beginner",
      verified: true,
    },
    {
      id: "4",
      name: "Options Wheel Strategy Bot",
      description:
        "Automated options wheel strategy with cash-secured puts and covered calls",
      author: {
        name: "OptionsAlpha",
        avatar: "https://via.placeholder.com/40",
        rating: 4.7,
        strategiesCount: 12,
      },
      category: "Options",
      price: 49.99,
      rating: 4.8,
      downloads: 1890,
      favorites: 456,
      views: 9870,
      tags: ["Options", "Wheel", "Income", "Premium"],
      performance: {
        backtestedReturn: 0.22,
        maxDrawdown: 0.15,
        sharpeRatio: 1.8,
        winRate: 0.74,
        totalTrades: 324,
      },
      timeframe: "1d",
      supportedAssets: ["Options"],
      lastUpdated: "2024-01-12",
      difficulty: "Advanced",
      verified: true,
    },
  ];

  const categories = [
    "All",
    ...Array.from(new Set(strategies.map((s) => s.category))),
  ];

  const filteredStrategies = strategies
    .filter((strategy) => {
      const matchesCategory =
        selectedCategory === "All" || strategy.category === selectedCategory;
      const matchesSearch =
        strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        strategy.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );
      const matchesPrice =
        priceFilter === "all" ||
        (priceFilter === "free" && strategy.price === 0) ||
        (priceFilter === "paid" && strategy.price > 0);
      return matchesCategory && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "downloads":
          return b.downloads - a.downloads;
        case "price":
          return a.price - b.price;
        case "newest":
          return (
            new Date(b.lastUpdated).getTime() -
            new Date(a.lastUpdated).getTime()
          );
        default:
          return 0;
      }
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

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Strategy Marketplace
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Discover and download strategies created by the community
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
            label="Search strategies"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
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

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Price</InputLabel>
            <Select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              label="Price"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort by</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort by"
            >
              <MenuItem value="rating">Rating</MenuItem>
              <MenuItem value="downloads">Downloads</MenuItem>
              <MenuItem value="price">Price</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Strategies Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 3,
        }}
      >
        {filteredStrategies.map((strategy) => (
          <Card
            key={strategy.id}
            sx={{ display: "flex", flexDirection: "column" }}
          >
            <CardContent sx={{ flex: 1 }}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6">{strategy.name}</Typography>
                    {strategy.verified && (
                      <Chip label="Verified" size="small" color="primary" />
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Rating value={strategy.rating} readOnly size="small" />
                    <Typography variant="body2">({strategy.rating})</Typography>
                    <Chip
                      label={strategy.difficulty}
                      color={getDifficultyColor(strategy.difficulty) as any}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  {strategy.price === 0 ? (
                    <Chip label="FREE" color="success" />
                  ) : (
                    <Typography variant="h6" color="primary">
                      ${strategy.price}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Author */}
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <Avatar
                  src={strategy.author.avatar}
                  sx={{ width: 24, height: 24 }}
                />
                <Typography variant="body2" color="text.secondary">
                  by {strategy.author.name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Star sx={{ fontSize: 14, color: "warning.main" }} />
                  <Typography variant="caption">
                    {strategy.author.rating} ({strategy.author.strategiesCount})
                  </Typography>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {strategy.description}
              </Typography>

              {/* Tags */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
                {strategy.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" />
                ))}
                {strategy.tags.length > 3 && (
                  <Chip
                    label={`+${strategy.tags.length - 3}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>

              {/* Performance Metrics */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Return
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    {formatPercent(strategy.performance.backtestedReturn)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Drawdown
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {formatPercent(strategy.performance.maxDrawdown)}
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
                    {strategy.performance.sharpeRatio.toFixed(1)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Win Rate
                  </Typography>
                  <Typography variant="body2">
                    {formatPercent(strategy.performance.winRate)}
                  </Typography>
                </Box>
              </Box>

              {/* Stats */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Download sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      {formatNumber(strategy.downloads)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Favorite sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      {formatNumber(strategy.favorites)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      {formatNumber(strategy.views)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Updated {new Date(strategy.lastUpdated).toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>

            <CardActions>
              <Button
                fullWidth
                variant="contained"
                onClick={() => onUseStrategy(strategy)}
                startIcon={<Download />}
              >
                {strategy.price === 0
                  ? "Download Free"
                  : `Purchase for $${strategy.price}`}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {filteredStrategies.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No strategies found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filters
          </Typography>
        </Box>
      )}
    </Box>
  );
};
