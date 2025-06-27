import { Close, PlayArrow, Settings, Stop } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import autonomousTradingApi, {
  DeploymentConfig,
  Portfolio,
  StrategyInstance,
} from "../services/autonomousTradingApi";
import { usePortfolioStore } from "../stores/StoreContext";
import "./AutonomousTradingPage.css";

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
      id={`autonomous-trading-tabpanel-${index}`}
      aria-labelledby={`autonomous-trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `autonomous-trading-tab-${index}`,
    "aria-controls": `autonomous-trading-tabpanel-${index}`,
  };
}

interface PortfolioTradingStatus {
  portfolioId: string;
  isActive: boolean;
  activeStrategies: StrategyInstance[];
  performance?: {
    totalReturn: number;
    dailyReturn: number;
    totalTrades: number;
  };
}

const AutonomousTradingPage: React.FC = observer(() => {
  const portfolioStore = usePortfolioStore();
  const [activeTab, setActiveTab] = useState(0);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [portfolioStatuses, setPortfolioStatuses] = useState<
    Record<string, PortfolioTradingStatus>
  >({});
  const [globalTradingActive, setGlobalTradingActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strategy deployment modal
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
  const [deploymentConfig, setDeploymentConfig] = useState<
    Partial<DeploymentConfig>
  >({
    mode: "paper",
    initialCapital: 10000,
    maxPositions: 5,
    executionFrequency: "hour",
    riskLimits: {
      maxDrawdown: 10,
      maxPositionSize: 20,
      dailyLossLimit: 5,
      correlationLimit: 0.7,
    },
    notifications: {
      enabled: true,
      onTrade: true,
      onError: true,
      onRiskBreach: true,
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Load portfolios and their trading status
  useEffect(() => {
    loadPortfolios();
    loadActiveStrategies();
  }, []);

  const loadPortfolios = async () => {
    setLoading(true);
    try {
      const response = await autonomousTradingApi.getAvailablePortfolios();
      if (response.success && response.data) {
        setPortfolios(response.data);

        // Initialize portfolio statuses
        const statuses: Record<string, PortfolioTradingStatus> = {};
        response.data.forEach((portfolio) => {
          statuses[portfolio.id] = {
            portfolioId: portfolio.id,
            isActive: false,
            activeStrategies: [],
          };
        });
        setPortfolioStatuses(statuses);
      } else {
        setError(response.error || "Failed to load portfolios");
      }
    } catch (err) {
      setError("Failed to load portfolios");
    } finally {
      setLoading(false);
    }
  };

  const loadActiveStrategies = async () => {
    try {
      const response = await autonomousTradingApi.getActiveStrategies();
      if (response.success) {
        // Group strategies by portfolio
        const updatedStatuses = { ...portfolioStatuses };
        response.data.forEach((strategy) => {
          // Assuming strategy has portfolioId - may need to adjust based on actual API
          const portfolioId = strategy.id.split("-")[0]; // Placeholder logic
          if (updatedStatuses[portfolioId]) {
            updatedStatuses[portfolioId].activeStrategies.push(strategy);
            updatedStatuses[portfolioId].isActive =
              strategy.status === "running";
          }
        });
        setPortfolioStatuses(updatedStatuses);
      }
    } catch (err) {
      console.error("Failed to load active strategies:", err);
    }
  };

  const handleStartTrading = async (portfolioId: string) => {
    try {
      setLoading(true);
      // Deploy a default strategy to the portfolio
      const config: DeploymentConfig = {
        ...deploymentConfig,
        portfolioId,
      } as DeploymentConfig;

      const response = await autonomousTradingApi.deployStrategy(
        "default-strategy",
        config
      );
      if (response.success) {
        setPortfolioStatuses((prev) => ({
          ...prev,
          [portfolioId]: {
            ...prev[portfolioId],
            isActive: true,
            activeStrategies: [
              ...prev[portfolioId].activeStrategies,
              response.data,
            ],
          },
        }));
      } else {
        setError(response.error || "Failed to start trading");
      }
    } catch (err) {
      setError("Failed to start trading");
    } finally {
      setLoading(false);
    }
  };

  const handleStopTrading = async (portfolioId: string) => {
    try {
      setLoading(true);
      const status = portfolioStatuses[portfolioId];

      // Stop all active strategies for this portfolio
      for (const strategy of status.activeStrategies) {
        await autonomousTradingApi.stopStrategy(strategy.strategyId);
      }

      setPortfolioStatuses((prev) => ({
        ...prev,
        [portfolioId]: {
          ...prev[portfolioId],
          isActive: false,
          activeStrategies: [],
        },
      }));
    } catch (err) {
      setError("Failed to stop trading");
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalTradingToggle = async () => {
    const newState = !globalTradingActive;
    setGlobalTradingActive(newState);

    if (newState) {
      // Start trading on all portfolios
      for (const portfolio of portfolios) {
        if (!portfolioStatuses[portfolio.id]?.isActive) {
          await handleStartTrading(portfolio.id);
        }
      }
    } else {
      // Stop trading on all portfolios
      for (const portfolio of portfolios) {
        if (portfolioStatuses[portfolio.id]?.isActive) {
          await handleStopTrading(portfolio.id);
        }
      }
    }
  };

  const handleDeployStrategy = async () => {
    try {
      setLoading(true);
      for (const portfolioId of selectedPortfolios) {
        const config: DeploymentConfig = {
          ...deploymentConfig,
          portfolioId,
        } as DeploymentConfig;

        await autonomousTradingApi.deployStrategy("custom-strategy", config);
      }
      setDeployModalOpen(false);
      setSelectedPortfolios([]);
      await loadActiveStrategies();
    } catch (err) {
      setError("Failed to deploy strategy");
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <Box>
      {/* Global Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Global Trading Control</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2">
              {globalTradingActive ? "Trading Active" : "Trading Stopped"}
            </Typography>
            <Switch
              checked={globalTradingActive}
              onChange={handleGlobalTradingToggle}
              color="primary"
            />
            <Button
              variant="contained"
              onClick={() => setDeployModalOpen(true)}
              startIcon={<Settings />}
            >
              Deploy Strategy
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Portfolio Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {portfolios.map((portfolio) => {
          const status = portfolioStatuses[portfolio.id];
          return (
            <Card key={portfolio.id} sx={{ height: "100%" }}>
              <CardHeader
                title={portfolio.name}
                subheader={`Total Value: $${portfolio.totalValue.toLocaleString()}`}
                action={
                  <Chip
                    label={status?.isActive ? "Active" : "Inactive"}
                    color={status?.isActive ? "success" : "default"}
                    size="small"
                  />
                }
              />
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Cash Available
                    </Typography>
                    <Typography variant="body2">
                      ${portfolio.currentCash.toLocaleString()}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Active Strategies
                    </Typography>
                    <Typography variant="body2">
                      {status?.activeStrategies.length || 0}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box display="flex" gap={1}>
                    {status?.isActive ? (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => handleStopTrading(portfolio.id)}
                        fullWidth
                        disabled={loading}
                      >
                        Stop Trading
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<PlayArrow />}
                        onClick={() => handleStartTrading(portfolio.id)}
                        fullWidth
                        disabled={loading}
                      >
                        Start Trading
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );

  const renderPerformanceTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance Overview
      </Typography>
      <Alert severity="info">
        Performance metrics will be displayed here once trading sessions are
        active.
      </Alert>
    </Box>
  );

  const renderHistoryTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Trading History
      </Typography>
      <Alert severity="info">
        Trading history and logs will be displayed here.
      </Alert>
    </Box>
  );

  const renderSettingsTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Trading Settings
      </Typography>
      <Alert severity="info">
        Global trading settings and risk management parameters will be
        configured here.
      </Alert>
    </Box>
  );

  return (
    <div className="autonomous-trading-page">
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 600 }}>
          Autonomous Trading
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="autonomous trading tabs"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "1rem",
                minWidth: 120,
              },
            }}
          >
            <Tab label="Overview" {...a11yProps(0)} />
            <Tab label="Performance" {...a11yProps(1)} />
            <Tab label="History" {...a11yProps(2)} />
            <Tab label="Settings" {...a11yProps(3)} />
          </Tabs>
        </Box>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress />
        </Box>
      )}

      <TabPanel value={activeTab} index={0}>
        {renderOverviewTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {renderPerformanceTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {renderHistoryTab()}
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {renderSettingsTab()}
      </TabPanel>

      {/* Strategy Deployment Modal */}
      <Dialog
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            Deploy Trading Strategy
            <IconButton onClick={() => setDeployModalOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Select Portfolios</InputLabel>
              <Select
                multiple
                value={selectedPortfolios}
                onChange={(e) =>
                  setSelectedPortfolios(e.target.value as string[])
                }
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => {
                      const portfolio = portfolios.find((p) => p.id === value);
                      return (
                        <Chip
                          key={value}
                          label={portfolio?.name || value}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {portfolios.map((portfolio) => (
                  <MenuItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Trading Mode</InputLabel>
                <Select
                  value={deploymentConfig.mode}
                  onChange={(e) =>
                    setDeploymentConfig((prev) => ({
                      ...prev,
                      mode: e.target.value as "paper" | "live",
                    }))
                  }
                >
                  <MenuItem value="paper">Paper Trading</MenuItem>
                  <MenuItem value="live">Live Trading</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Initial Capital"
                type="number"
                value={deploymentConfig.initialCapital}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    initialCapital: Number(e.target.value),
                  }))
                }
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Max Positions"
                type="number"
                value={deploymentConfig.maxPositions}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    maxPositions: Number(e.target.value),
                  }))
                }
              />

              <FormControl fullWidth>
                <InputLabel>Execution Frequency</InputLabel>
                <Select
                  value={deploymentConfig.executionFrequency}
                  onChange={(e) =>
                    setDeploymentConfig((prev) => ({
                      ...prev,
                      executionFrequency: e.target.value as
                        | "minute"
                        | "hour"
                        | "daily",
                    }))
                  }
                >
                  <MenuItem value="minute">Every Minute</MenuItem>
                  <MenuItem value="hour">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeployStrategy}
            variant="contained"
            disabled={selectedPortfolios.length === 0 || loading}
          >
            Deploy Strategy
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
});

export default AutonomousTradingPage;
