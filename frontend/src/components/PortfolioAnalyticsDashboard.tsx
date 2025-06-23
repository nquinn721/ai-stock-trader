import {
  Assessment,
  CompareArrows,
  PieChart as PieChartIcon,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { PortfolioAnalytics } from "../types";

interface PortfolioAnalyticsDashboardProps {
  portfolioId: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const PortfolioAnalyticsDashboard: React.FC<
  PortfolioAnalyticsDashboardProps
> = ({ portfolioId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getPortfolioAnalytics } = useSocket();

  useEffect(() => {
    loadAnalytics();
  }, [portfolioId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const analyticsData = await getPortfolioAnalytics(portfolioId);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={loadAnalytics}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return (
      <Alert severity="info">
        No analytics data available for this portfolio.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Paper sx={{ width: "100%", mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analytics tabs"
          >
            <Tab label="Overview" icon={<Assessment />} />
            <Tab label="Sectors" icon={<PieChartIcon />} />
            <Tab label="Risk" icon={<Warning />} />
            <Tab label="Benchmarks" icon={<CompareArrows />} />
            <Tab label="Rebalancing" icon={<TrendingUp />} />
          </Tabs>
        </Box>{" "}
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Value
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(analytics.totalValue)}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Return
                  </Typography>
                  <Typography
                    variant="h4"
                    color={
                      analytics.performanceSummary.totalReturn >= 0
                        ? "success.main"
                        : "error.main"
                    }
                  >
                    {formatPercent(analytics.performanceSummary.totalReturn)}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Sharpe Ratio
                  </Typography>
                  <Typography variant="h4">
                    {analytics.performanceSummary.sharpeRatio.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>

              <Card sx={{ flex: 1 }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Volatility
                  </Typography>
                  <Typography variant="h4">
                    {formatPercent(analytics.performanceSummary.volatility)}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Stack>
        </TabPanel>{" "}
        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardHeader title="Sector Allocation" />
            <CardContent>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {analytics.sectorAllocation.length} sectors in portfolio
              </Typography>
              <Stack spacing={2}>
                {analytics.sectorAllocation.map((sector, index) => (
                  <Card key={sector.sector} variant="outlined" sx={{ p: 2 }}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={2}
                      alignItems={{ sm: "center" }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {sector.sector}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {sector.positions} position
                          {sector.positions !== 1 ? "s" : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                        <Typography variant="h6" color="primary">
                          {formatPercent(sector.percentage)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formatCurrency(sector.value)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>{" "}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardHeader title="Risk Metrics" />
            <CardContent>
              <Stack spacing={3}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Portfolio Beta
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Measures sensitivity to market movements
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="primary">
                      {analytics.riskMetrics.beta.toFixed(2)}
                    </Typography>
                  </Stack>
                </Card>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Maximum Drawdown
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Largest peak-to-trough decline
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="error">
                      {formatPercent(analytics.riskMetrics.maxDrawdown * 100)}
                    </Typography>
                  </Stack>
                </Card>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Value at Risk (VaR)
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Potential loss at 95% confidence level
                      </Typography>
                    </Box>
                    <Typography variant="h5" color="warning.main">
                      {formatCurrency(analytics.riskMetrics.valueAtRisk)}
                    </Typography>
                  </Stack>
                </Card>
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>{" "}
        <TabPanel value={tabValue} index={3}>
          <Card>
            <CardHeader title="Benchmark Comparison" />
            <CardContent>
              <Stack spacing={2}>
                {analytics.benchmarkComparison.map((benchmark) => (
                  <Card
                    key={benchmark.benchmark}
                    variant="outlined"
                    sx={{ p: 2 }}
                  >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      {benchmark.benchmark}
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Alpha
                        </Typography>
                        <Typography
                          variant="h6"
                          color={
                            benchmark.alpha >= 0 ? "success.main" : "error.main"
                          }
                        >
                          {formatPercent(benchmark.alpha)}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Beta
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {benchmark.beta.toFixed(2)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </TabPanel>{" "}
        <TabPanel value={tabValue} index={4}>
          <Card>
            <CardHeader title="Rebalancing Suggestions" />
            <CardContent>
              {analytics.rebalancingSuggestions.length === 0 ? (
                <Alert
                  severity="success"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      Portfolio Well Balanced
                    </Typography>
                    <Typography variant="body2">
                      No rebalancing suggestions at this time. Your portfolio
                      allocation appears optimal.
                    </Typography>
                  </Box>
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {analytics.rebalancingSuggestions.map((suggestion, index) => (
                    <Card key={index} variant="outlined" sx={{ p: 2 }}>
                      <Stack spacing={2}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={2}
                          alignItems={{ sm: "center" }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle1"
                              fontWeight="bold"
                              color="primary"
                            >
                              {suggestion.action.toUpperCase()}:{" "}
                              {suggestion.symbol}
                            </Typography>
                          </Box>
                          <Box>
                            <Alert
                              severity={
                                suggestion.action.toLowerCase() === "buy"
                                  ? "info"
                                  : "warning"
                              }
                              sx={{ py: 0.5 }}
                            >
                              {suggestion.action}
                            </Alert>
                          </Box>
                        </Stack>
                        <Typography variant="body2" color="textSecondary">
                          {suggestion.reasoning}
                        </Typography>
                      </Stack>
                    </Card>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>
    </Box>
  );
};
