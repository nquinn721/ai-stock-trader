import {
  Analytics,
  Delete,
  PlayArrow,
  Refresh,
  School,
  Stop,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { Grid } from '../common/GridWrapper';
import {
  CategoryScale,
  Chart as ChartJS,
  Tooltip as ChartTooltip,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
} from "chart.js";
import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import rlTradingService, {
  DeploymentConfig,
  RLAgent,
  TrainingConfig,
} from "../../services/rlTradingService";
import "./RLAgentDashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

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
      id={`rl-tabpanel-${index}`}
      aria-labelledby={`rl-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RLAgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [agents, setAgents] = useState<RLAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<RLAgent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isCreateAgentOpen, setIsCreateAgentOpen] = useState(false);
  const [isTrainingConfigOpen, setIsTrainingConfigOpen] = useState(false);
  const [isDeploymentOpen, setIsDeploymentOpen] = useState(false);

  // Training/Deployment configs
  const [newAgentName, setNewAgentName] = useState("");
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    episodes: 1000,
    learningRate: 0.001,
    batchSize: 32,
    memorySize: 10000,
    epsilon: 1.0,
    epsilonDecay: 0.995,
    symbols: ["AAPL", "GOOGL", "MSFT"],
    riskTolerance: 0.1,
  });

  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    agentId: "",
    portfolioId: "default",
    riskLimits: {
      maxPositionSize: 10,
      dailyLossLimit: 1000,
      maxDrawdown: 15,
    },
    executionMode: "paper",
    symbols: ["AAPL", "GOOGL", "MSFT"],
    notificationsEnabled: true,
  });

  // Mock data for when backend is not available
  const mockAgents: RLAgent[] = [
    {
      id: "dqn-agent-1",
      name: "DQN Momentum Trader",
      status: "ready",
      trainingProgress: 100,
      episodeCount: 1000,
      totalReward: 15670.23,
      averageReward: 15.67,
      performance: {
        winRate: 68.5,
        sharpeRatio: 1.42,
        maxDrawdown: 8.3,
        totalReturn: 12.4,
      },
      lastUpdated: new Date(),
    },
    {
      id: "dqn-agent-2",
      name: "DQN Contrarian Agent",
      status: "training",
      trainingProgress: 45,
      episodeCount: 450,
      totalReward: 8234.12,
      averageReward: 18.3,
      performance: {
        winRate: 72.1,
        sharpeRatio: 1.28,
        maxDrawdown: 6.7,
        totalReturn: 8.9,
      },
      lastUpdated: new Date(),
    },
  ];

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    setError(null);

    const result = await rlTradingService.getAgents();
    if (result.success && result.data) {
      setAgents(result.data);
    } else {
      // Use mock data if backend is not available
      console.warn("Backend not available, using mock data");
      setAgents(mockAgents);
    }

    setIsLoading(false);
  };

  const handleCreateAgent = async () => {
    if (!newAgentName.trim()) return;

    setIsLoading(true);
    const result = await rlTradingService.createAgent({
      name: newAgentName,
      ...trainingConfig,
    });

    if (result.success) {
      await loadAgents();
      setIsCreateAgentOpen(false);
      setNewAgentName("");
    } else {
      setError(result.error || "Failed to create agent");
    }
    setIsLoading(false);
  };

  const handleStartTraining = async (agentId: string) => {
    setIsLoading(true);
    const result = await rlTradingService.startTraining(
      agentId,
      trainingConfig
    );

    if (result.success) {
      await loadAgents();
    } else {
      setError(result.error || "Failed to start training");
    }
    setIsLoading(false);
  };

  const handleStopTraining = async (agentId: string) => {
    setIsLoading(true);
    const result = await rlTradingService.stopTraining(agentId);

    if (result.success) {
      await loadAgents();
    } else {
      setError(result.error || "Failed to stop training");
    }
    setIsLoading(false);
  };

  const handleDeployAgent = async () => {
    if (!selectedAgent) return;

    setIsLoading(true);
    const config = { ...deploymentConfig, agentId: selectedAgent.id };
    const result = await rlTradingService.deployAgent(config);

    if (result.success) {
      await loadAgents();
      setIsDeploymentOpen(false);
    } else {
      setError(result.error || "Failed to deploy agent");
    }
    setIsLoading(false);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!window.confirm("Are you sure you want to delete this agent?")) return;

    setIsLoading(true);
    const result = await rlTradingService.deleteAgent(agentId);

    if (result.success) {
      await loadAgents();
      if (selectedAgent?.id === agentId) {
        setSelectedAgent(null);
      }
    } else {
      setError(result.error || "Failed to delete agent");
    }
    setIsLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "training":
        return "warning";
      case "ready":
        return "success";
      case "deployed":
        return "primary";
      case "stopped":
        return "default";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "training":
        return <School />;
      case "ready":
        return <TrendingUp />;
      case "deployed":
        return <PlayArrow />;
      case "stopped":
        return <Stop />;
      case "error":
        return <Warning />;
      default:
        return <Analytics />;
    }
  };

  // Mock chart data
  const chartData = {
    labels: Array.from({ length: 50 }, (_, i) => `Episode ${i * 20}`),
    datasets: [
      {
        label: "Average Reward",
        data: Array.from({ length: 50 }, () => Math.random() * 100 - 50),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1,
      },
      {
        label: "Cumulative Return",
        data: Array.from({ length: 50 }, (_, i) => i * 2 + Math.random() * 10),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend:
        {
          position: "top" as const,
        },
      title: {
        display: true,
        text: "Training Progress",
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="rl-agent-dashboard">
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          Deep RL Trading Agents
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={() => setIsCreateAgentOpen(true)}
            sx={{ mr: 2 }}
          >
            Create Agent
          </Button>
          <IconButton onClick={loadAgents} disabled={isLoading}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab label="Agents Overview" />
          <Tab label="Training Center" />
          <Tab label="Performance Analytics" />
          <Tab label="Live Trading" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="agent-card"
              sx={{
                height: "100%",
                cursor: "pointer",
                "&:hover": { transform: "translateY(-2px)" },
                transition: "transform 0.2s",
              }}
                onClick={() => setSelectedAgent(agent)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {agent.name}
                    </Typography>
                    <Chip
                      icon={getStatusIcon(agent.status)}
                      label={agent.status.toUpperCase()}
                      color={getStatusColor(agent.status) as any}
                      size="small"
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Training Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={agent.trainingProgress}
                      sx={{ mt: 1, mb: 1 }}
                    />
                    <Typography variant="caption">
                      {agent.trainingProgress}% ({agent.episodeCount} episodes)
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {agent.performance.winRate}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sharpe Ratio
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {agent.performance.sharpeRatio}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Total Return
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {agent.performance.totalReturn}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Max Drawdown
                      </Typography>
                      <Typography variant="h6" color="error.main">
                        {agent.performance.maxDrawdown}%
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                    {agent.status === "ready" && (
                      <>
                        <Button
                          size="small"
                          startIcon={<School />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agent);
                            setIsTrainingConfigOpen(true);
                          }}
                        >
                          Train
                        </Button>
                        <Button
                          size="small"
                          startIcon={<PlayArrow />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agent);
                            setIsDeploymentOpen(true);
                          }}
                        >
                          Deploy
                        </Button>
                      </>
                    )}
                    {agent.status === "training" && (
                      <Button
                        size="small"
                        startIcon={<Stop />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStopTraining(agent.id);
                        }}
                      >
                        Stop
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAgent(agent.id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Training Progress
                </Typography>
                <Line data={chartData} options={chartOptions} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Training Metrics
                </Typography>
                {selectedAgent && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Current Episode: {selectedAgent.episodeCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Reward: {selectedAgent.averageReward}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Reward: {selectedAgent.totalReward}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Performance Analytics
        </Typography>
        <Alert severity="info">
          Advanced performance analytics and backtesting results will be
          displayed here.
        </Alert>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Live Trading
        </Typography>
        <Alert severity="info">
          Live trading controls and real-time decision monitoring will be
          displayed here.
        </Alert>
      </TabPanel>

      {/* Create Agent Dialog */}
      <Dialog
        open={isCreateAgentOpen}
        onClose={() => setIsCreateAgentOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New RL Agent</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Agent Name"
            fullWidth
            variant="outlined"
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Training Configuration
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Episodes"
                type="number"
                fullWidth
                value={trainingConfig.episodes}
                onChange={(e) =>
                  setTrainingConfig((prev) => ({
                    ...prev,
                    episodes: parseInt(e.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Learning Rate"
                type="number"
                fullWidth
                value={trainingConfig.learningRate}
                onChange={(e) =>
                  setTrainingConfig((prev) => ({
                    ...prev,
                    learningRate: parseFloat(e.target.value),
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateAgentOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateAgent}
            variant="contained"
            disabled={!newAgentName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Training Config Dialog */}
      <Dialog
        open={isTrainingConfigOpen}
        onClose={() => setIsTrainingConfigOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Configure Training</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={6}>
              <TextField
                label="Episodes"
                type="number"
                fullWidth
                value={trainingConfig.episodes}
                onChange={(e) =>
                  setTrainingConfig((prev) => ({
                    ...prev,
                    episodes: parseInt(e.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Learning Rate"
                type="number"
                fullWidth
                value={trainingConfig.learningRate}
                onChange={(e) =>
                  setTrainingConfig((prev) => ({
                    ...prev,
                    learningRate: parseFloat(e.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Batch Size"
                type="number"
                fullWidth
                value={trainingConfig.batchSize}
                onChange={(e) =>
                  setTrainingConfig((prev) => ({
                    ...prev,
                    batchSize: parseInt(e.target.value),
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Memory Size"
                type="number"
                fullWidth
                value={trainingConfig.memorySize}
                onChange={(e) =>
                  setTrainingConfig((prev) => ({
                    ...prev,
                    memorySize: parseInt(e.target.value),
                  }))
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTrainingConfigOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedAgent) {
                handleStartTraining(selectedAgent.id);
                setIsTrainingConfigOpen(false);
              }
            }}
            variant="contained"
          >
            Start Training
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deployment Dialog */}
      <Dialog
        open={isDeploymentOpen}
        onClose={() => setIsDeploymentOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deploy Agent</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Execution Mode</InputLabel>
            <Select
              value={deploymentConfig.executionMode}
              onChange={(e) =>
                setDeploymentConfig((prev) => ({
                  ...prev,
                  executionMode: e.target.value as any,
                }))
              }
            >
              <MenuItem value="simulation">Simulation</MenuItem>
              <MenuItem value="paper">Paper Trading</MenuItem>
              <MenuItem value="live">Live Trading</MenuItem>
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Max Position Size (%)"
                type="number"
                fullWidth
                value={deploymentConfig.riskLimits.maxPositionSize}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    riskLimits: {
                      ...prev.riskLimits,
                      maxPositionSize: parseInt(e.target.value),
                    },
                  }))
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Daily Loss Limit ($)"
                type="number"
                fullWidth
                value={deploymentConfig.riskLimits.dailyLossLimit}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    riskLimits: {
                      ...prev.riskLimits,
                      dailyLossLimit: parseInt(e.target.value),
                    },
                  }))
                }
              />
            </Grid>
          </Grid>

          <FormControlLabel
            control={
              <Switch
                checked={deploymentConfig.notificationsEnabled}
                onChange={(e) =>
                  setDeploymentConfig((prev) => ({
                    ...prev,
                    notificationsEnabled: e.target.checked,
                  }))
                }
              />
            }
            label="Enable Notifications"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeploymentOpen(false)}>Cancel</Button>
          <Button onClick={handleDeployAgent} variant="contained">
            Deploy
          </Button>
        </DialogActions>
      </Dialog>

      {isLoading && (
        <Box
          sx={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }}
        >
          <LinearProgress />
        </Box>
      )}
    </div>
  );
};

export default RLAgentDashboard;
