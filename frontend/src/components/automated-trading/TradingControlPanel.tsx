import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import { Grid } from '../common/GridWrapper';
import {
  PlayArrow,
  Stop,
  Pause,
  Emergency,
  CheckCircle,
  Error,
  Warning,
} from '@mui/icons-material';

interface TradingSession {
  id: string;
  portfolioId: string;
  portfolioName: string;
  status: 'active' | 'paused' | 'stopped';
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

export const TradingControlPanel: React.FC<TradingControlPanelProps> = ({
  sessions,
  onSessionUpdate,
  isGlobalActive,
  onGlobalToggle,
}) => {
  const handleSessionAction = (sessionId: string, action: 'start' | 'pause' | 'stop') => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId
        ? { ...session, status: (action === 'start' ? 'active' : action) as "active" | "paused" | "stopped" }
        : session
    );
    onSessionUpdate(updatedSessions);
  };

  const handleEmergencyStop = () => {
    const stoppedSessions = sessions.map(session => ({
      ...session,
      status: 'stopped' as const,
    }));
    onSessionUpdate(stoppedSessions);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle color="success" />;
      case 'paused':
        return <Warning color="warning" />;
      case 'stopped':
        return <Error color="error" />;
      default:
        return <Error />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'stopped':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Global Controls */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Global Trading Controls" />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
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
                  <Typography variant="h6">
                    Global Automated Trading
                  </Typography>
                }
              />
              <Typography variant="body2" color="textSecondary">
                Enable or disable all automated trading across all portfolios
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
              Global trading is currently disabled. Individual portfolio sessions will not execute trades.
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
                  <ListItemIcon>
                    {getStatusIcon(session.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            P&L: {' '}
                            <Typography
                              component="span"
                              color={session.profitLoss >= 0 ? 'success.main' : 'error.main'}
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
                  <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                    {session.status !== 'active' && (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PlayArrow />}
                        onClick={() => handleSessionAction(session.id, 'start')}
                        disabled={!isGlobalActive}
                        size="small"
                      >
                        Start
                      </Button>
                    )}
                    {session.status === 'active' && (
                      <Button
                        variant="contained"
                        color="warning"
                        startIcon={<Pause />}
                        onClick={() => handleSessionAction(session.id, 'pause')}
                        size="small"
                      >
                        Pause
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Stop />}
                      onClick={() => handleSessionAction(session.id, 'stop')}
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
              No trading sessions found. Create a portfolio and set up trading rules to begin automated trading.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradingControlPanel;
