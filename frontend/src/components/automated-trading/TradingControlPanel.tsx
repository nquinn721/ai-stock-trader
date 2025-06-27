<<<<<<< HEAD
import {
  CheckCircle,
  Emergency,
  Error,
  Pause,
  PlayArrow,
  Stop,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
} from "@mui/material";
import React from "react";
=======
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useAutoTradingStore } from "../../stores/StoreContext";
import { Portfolio } from "../../types";
import { TradingConfig, TradingSessionDtoDisplay } from "../../types/autoTrading.types";
import "./TradingControlPanel.css";
>>>>>>> 6ddc0fc (udpate)

interface TradingSession {
  id: string;
  portfolioId: string;
  portfolioName: string;
  status: "active" | "paused" | "stopped";
  startTime: Date;
  profitLoss: number;
  tradesExecuted: number;
  activeRules: number;
}

interface TradingControlPanelProps {
  sessions: TradingSession[];
  onSessionUpdate: (sessions: TradingSession[]) => void;
  isGlobalActive: boolean;
  onGlobalToggle: () => void;
}

<<<<<<< HEAD
export const TradingControlPanel: React.FC<TradingControlPanelProps> = ({
  sessions,
  onSessionUpdate,
  isGlobalActive,
  onGlobalToggle,
}) => {
  const handleSessionAction = (
    sessionId: string,
    action: "start" | "pause" | "stop"
  ) => {
    const updatedSessions = sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            status: (action === "start" ? "active" : action) as
              | "active"
              | "paused"
              | "stopped",
          }
        : session
=======
    useEffect(() => {
      // Sessions will be loaded when portfolios are selected
      // No global session loading needed
    }, []);

    const getPortfolioSession = (portfolioId: number) => {
      return autoTradingStore.tradingSessions.find(
        (session) => session.portfolioId === portfolioId.toString()
      );
    };

    const getSessionStatusColor = (status: string) => {
      switch (status) {
        case "active":
          return "success";
        case "paused":
          return "warning";
        case "stopped":
          return "inactive";
        case "error":
          return "error";
        default:
          return "inactive";
      }
    };

    const handleStartPortfolioTrading = async (portfolioId: number) => {
      const sessionData: TradingSessionDtoDisplay = {
        sessionName: `Auto Trading Session - ${new Date().toLocaleString()}`,
        config: {
          maxRisk: 0.02, // 2% risk per trade
          maxDailyLoss: 0.05, // 5% max daily loss
          maxPositions: 10,
          emergencyStop: true,
          notificationSettings: {
            onTrade: true,
            onError: true,
            onThreshold: true,
          },
        },
      };

      await autoTradingStore.startPortfolioTrading(
        portfolioId.toString(),
        sessionData
      );
    };

    const handleStopPortfolioTrading = async (portfolioId: number) => {
      if (
        window.confirm(
          "Are you sure you want to stop automated trading for this portfolio?"
        )
      ) {
        await autoTradingStore.stopPortfolioTrading(portfolioId.toString());
      }
    };

    const handlePausePortfolioTrading = async (portfolioId: number) => {
      await autoTradingStore.pausePortfolioTrading(portfolioId.toString());
    };

    const handleResumePortfolioTrading = async (portfolioId: number) => {
      const sessionData: TradingSessionDtoDisplay = {
        sessionName: `Resumed Session - ${new Date().toLocaleString()}`,
        config: {
          maxRisk: 0.02,
          maxDailyLoss: 0.05,
          maxPositions: 10,
          emergencyStop: true,
          notificationSettings: {
            onTrade: true,
            onError: true,
            onThreshold: true,
          },
        },
      };
      await autoTradingStore.resumePortfolioTrading(portfolioId.toString(), sessionData.config);
    };

    const handleGlobalStart = async () => {
      if (window.confirm("Start automated trading for ALL portfolios?")) {
        await autoTradingStore.startGlobalTrading();
      }
    };

    const handleGlobalStop = async () => {
      if (window.confirm("Stop automated trading for ALL portfolios?")) {
        await autoTradingStore.stopGlobalTrading();
      }
    };

    const handleEmergencyStop = async () => {
      const reason =
        window.prompt("Emergency stop reason (optional):") ||
        "Manual emergency stop";
      if (
        window.confirm(
          "EMERGENCY STOP: This will immediately stop all trading activity. Continue?"
        )
      ) {
        await autoTradingStore.emergencyStop();
      }
    };

    const getActiveSessionsCount = () => {
      return autoTradingStore.tradingSessions.filter(
        (session) => session.status === "active"
      ).length;
    };

    const getTotalPnL = () => {
      return autoTradingStore.tradingSessions.reduce((total, session) => {
        return total + (Number(session.performance?.totalPnL) || 0);
      }, 0);
    };

    return (
      <div className="trading-control-panel">
        {/* Global Controls */}
        <div className="global-controls">
          <div className="global-header">
            <h3>Global Trading Controls</h3>
            <div className="global-stats">
              <div className="stat">
                <label>Active Sessions:</label>
                <span className="value">{getActiveSessionsCount()}</span>
              </div>
              <div className="stat">
                <label>Total P&L Today:</label>
                <span
                  className={`value ${
                    getTotalPnL() >= 0 ? "positive" : "negative"
                  }`}
                >
                  ${Number(getTotalPnL()).toFixed(2)}
                </span>
              </div>
              <div className="stat">
                <label>Status:</label>
                <span
                  className={`status-indicator ${
                    autoTradingStore.isGlobalTradingActive
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {autoTradingStore.isGlobalTradingActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
          </div>

          <div className="global-actions">
            <button
              className={`global-btn start ${
                autoTradingStore.isGlobalTradingActive ? "active" : ""
              }`}
              onClick={handleGlobalStart}
              disabled={
                autoTradingStore.isGlobalTradingActive ||
                autoTradingStore.isLoading
              }
            >
              <span className="icon">▶</span>
              Start All
            </button>

            <button
              className="global-btn pause"
              onClick={() => autoTradingStore.pauseGlobalTrading()}
              disabled={
                !autoTradingStore.isGlobalTradingActive ||
                autoTradingStore.isLoading
              }
            >
              <span className="icon">⏸</span>
              Pause All
            </button>

            <button
              className="global-btn stop"
              onClick={handleGlobalStop}
              disabled={
                !autoTradingStore.isGlobalTradingActive ||
                autoTradingStore.isLoading
              }
            >
              <span className="icon">⏹</span>
              Stop All
            </button>

            <button
              className="emergency-btn"
              onClick={handleEmergencyStop}
              disabled={autoTradingStore.isLoading}
            >
              <span className="icon">🚨</span>
              Emergency Stop
            </button>
          </div>
        </div>

        {/* Portfolio Controls */}
        <div className="portfolio-controls">
          <div className="portfolio-header">
            <h3>Portfolio Trading Sessions</h3>
            <div className="portfolio-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowScheduleModal(true)}
              >
                Schedule Trading
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowConfigModal(true)}
              >
                Global Config
              </button>
            </div>
          </div>

          <div className="portfolio-grid">
            {portfolios.map((portfolio) => {
              const session = getPortfolioSession(portfolio.id);
              const isActive = session?.status === "active";
              const isPaused = session?.status === "paused";

              return (
                <div
                  key={portfolio.id}
                  className={`portfolio-card ${session?.status || "inactive"}`}
                >
                  <div className="portfolio-info">
                    <h4>{portfolio.name}</h4>
                    <div className="portfolio-details">
                      <div className="detail">
                        <label>Value:</label>
                        <span>
                          ${Number(portfolio.totalValue || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="detail">
                        <label>Cash:</label>
                        <span>
                          ${Number(portfolio.currentCash || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="detail">
                        <label>Rules:</label>
                        <span>
                          {
                            autoTradingStore.tradingRules.filter(
                              (rule) =>
                                rule.portfolioId === portfolio.id.toString() &&
                                rule.isActive
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="session-status">
                    <div
                      className={`status-indicator ${getSessionStatusColor(
                        session?.status || "stopped"
                      )}`}
                    >
                      <span className="status-dot"></span>
                      <span className="status-text">
                        {session?.status
                          ? session.status.charAt(0).toUpperCase() +
                            session.status.slice(1)
                          : "Stopped"}
                      </span>
                    </div>

                    {session && (
                      <div className="session-stats">
                        <div className="stat">
                          <label>Trades Today:</label>
                          <span>{session.tradesExecuted || 0}</span>
                        </div>
                        <div className="stat">
                          <label>P&L:</label>
                          <span
                            className={
                              session.performance?.totalPnL >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            $
                            {Number(session.performance?.totalPnL || 0).toFixed(
                              2
                            )}
                          </span>
                        </div>
                        {session.lastTradeTime && (
                          <div className="stat">
                            <label>Last Trade:</label>
                            <span>
                              {new Date(
                                session.lastTradeTime
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="portfolio-actions">
                    {!isActive && !isPaused && (
                      <button
                        className="action-btn start"
                        onClick={() =>
                          handleStartPortfolioTrading(portfolio.id)
                        }
                        disabled={autoTradingStore.isLoading}
                      >
                        <span className="icon">▶</span>
                        Start
                      </button>
                    )}

                    {isActive && (
                      <>
                        <button
                          className="action-btn pause"
                          onClick={() =>
                            handlePausePortfolioTrading(portfolio.id)
                          }
                          disabled={autoTradingStore.isLoading}
                        >
                          <span className="icon">⏸</span>
                          Pause
                        </button>
                        <button
                          className="action-btn stop"
                          onClick={() =>
                            handleStopPortfolioTrading(portfolio.id)
                          }
                          disabled={autoTradingStore.isLoading}
                        >
                          <span className="icon">⏹</span>
                          Stop
                        </button>
                      </>
                    )}

                    {isPaused && (
                      <>
                        <button
                          className="action-btn resume"
                          onClick={() =>
                            handleResumePortfolioTrading(portfolio.id)
                          }
                          disabled={autoTradingStore.isLoading}
                        >
                          <span className="icon">▶</span>
                          Resume
                        </button>
                        <button
                          className="action-btn stop"
                          onClick={() =>
                            handleStopPortfolioTrading(portfolio.id)
                          }
                          disabled={autoTradingStore.isLoading}
                        >
                          <span className="icon">⏹</span>
                          Stop
                        </button>
                      </>
                    )}

                    <button
                      className="action-btn config"
                      onClick={() => {
                        setSelectedPortfolioId(portfolio.id.toString());
                        setShowConfigModal(true);
                      }}
                      disabled={autoTradingStore.isLoading}
                    >
                      <span className="icon">⚙️</span>
                      Config
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Display */}
        {autoTradingStore.error && (
          <div className="error-message">
            <strong>Error:</strong> {autoTradingStore.error}
            <button
              className="dismiss-btn"
              onClick={() => autoTradingStore.clearError()}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading Overlay */}
        {autoTradingStore.isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Processing...</span>
            </div>
          </div>
        )}

        {/* Modals will be implemented later */}
        {showScheduleModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Schedule Trading Sessions</h3>
                <button onClick={() => setShowScheduleModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Trading schedule configuration will be implemented here.</p>
              </div>
            </div>
          </div>
        )}

        {showConfigModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Trading Configuration</h3>
                <button onClick={() => setShowConfigModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p>Trading configuration settings will be implemented here.</p>
                {selectedPortfolioId && <p>Portfolio: {selectedPortfolioId}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
>>>>>>> 6ddc0fc (udpate)
    );
    onSessionUpdate(updatedSessions);
  };

  const handleEmergencyStop = () => {
    const stoppedSessions = sessions.map((session) => ({
      ...session,
      status: "stopped" as const,
    }));
    onSessionUpdate(stoppedSessions);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle color="success" />;
      case "paused":
        return <Warning color="warning" />;
      case "stopped":
        return <Error color="error" />;
      default:
        return <Error />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "paused":
        return "warning";
      case "stopped":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      {/* Global Controls */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Global Trading Controls" />
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: 3,
              alignItems: "center",
            }}
          >
            <Box sx={{ flex: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isGlobalActive}
                    onChange={onGlobalToggle}
                    color="primary"
                    size="medium"
                  />
                }
                label={
                  <Typography variant="h6">Global Automated Trading</Typography>
                }
              />
              <Typography variant="body2" color="textSecondary">
                Enable or disable all automated trading across all portfolios
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<Emergency />}
                onClick={handleEmergencyStop}
                size="large"
              >
                Emergency Stop All
              </Button>
            </Box>
          </Box>

          {!isGlobalActive && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Global trading is currently disabled. Individual portfolio
              sessions will not execute trades.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Portfolio Session Controls */}
      <Card>
        <CardHeader title="Portfolio Trading Sessions" />
        <CardContent>
          <List>
            {sessions.map((session, index) => (
              <React.Fragment key={session.id}>
                <ListItem>
                  <ListItemIcon>{getStatusIcon(session.status)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography variant="h6">
                          {session.portfolioName}
                        </Typography>
                        <Chip
                          label={session.status.toUpperCase()}
                          color={getStatusColor(session.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr 1fr",
                              md: "repeat(4, 1fr)",
                            },
                            gap: 2,
                          }}
                        >
                          <Typography variant="body2" color="textSecondary">
                            P&L:{" "}
                            <Typography
                              component="span"
                              color={
                                session.profitLoss >= 0
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              {formatCurrency(session.profitLoss)}
                            </Typography>
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Trades: {session.tradesExecuted}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Active Rules: {session.activeRules}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Started: {session.startTime.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                    {session.status !== "active" && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrow />}
                        onClick={() => handleSessionAction(session.id, "start")}
                        disabled={!isGlobalActive}
                        size="small"
                      >
                        Start
                      </Button>
                    )}
                    {session.status === "active" && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<Pause />}
                        onClick={() => handleSessionAction(session.id, "pause")}
                        size="small"
                      >
                        Pause
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Stop />}
                      onClick={() => handleSessionAction(session.id, "stop")}
                      size="small"
                    >
                      Stop
                    </Button>
                  </Box>
                </ListItem>
                {index < sessions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>

          {sessions.length === 0 && (
            <Alert severity="info">
              No trading sessions found. Create a portfolio and set up trading
              rules to begin automated trading.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradingControlPanel;
