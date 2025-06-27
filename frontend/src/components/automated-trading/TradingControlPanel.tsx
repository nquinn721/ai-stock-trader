import { Pause, PlayArrow, Stop } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import React from "react";

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
  onSessionUpdate: React.Dispatch<React.SetStateAction<TradingSession[]>>;
  isGlobalActive: boolean;
  onGlobalToggle: () => void;
}

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
    onSessionUpdate((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: action === "start" ? "active" : (action as any),
            }
          : session
      )
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Trading Session Control
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Control individual trading sessions or manage global trading settings.
        Always ensure proper risk management before starting automated trading.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Global Controls
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={isGlobalActive}
                onChange={onGlobalToggle}
                color="primary"
              />
            }
            label="Global Trading Active"
          />
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Individual Sessions
      </Typography>

      {sessions.map((session) => (
        <Card key={session.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography variant="h6">{session.portfolioName}</Typography>
                <Typography color="textSecondary">
                  Status:{" "}
                  {session.status.charAt(0).toUpperCase() +
                    session.status.slice(1)}
                </Typography>
                <Typography variant="body2">
                  P&L: ${session.profitLoss.toFixed(2)} | Trades:{" "}
                  {session.tradesExecuted}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant={
                    session.status === "active" ? "contained" : "outlined"
                  }
                  color="success"
                  startIcon={<PlayArrow />}
                  onClick={() => handleSessionAction(session.id, "start")}
                  disabled={!isGlobalActive}
                >
                  Start
                </Button>
                <Button
                  variant={
                    session.status === "paused" ? "contained" : "outlined"
                  }
                  color="warning"
                  startIcon={<Pause />}
                  onClick={() => handleSessionAction(session.id, "pause")}
                >
                  Pause
                </Button>
                <Button
                  variant={
                    session.status === "stopped" ? "contained" : "outlined"
                  }
                  color="error"
                  startIcon={<Stop />}
                  onClick={() => handleSessionAction(session.id, "stop")}
                >
                  Stop
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default TradingControlPanel;
