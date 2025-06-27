import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Pause,
  PlayArrow,
  Stop,
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

interface TradingSessionMonitorProps {
  sessions: TradingSession[];
  isGlobalActive: boolean;
}

export const TradingSessionMonitor: React.FC<TradingSessionMonitorProps> = ({
  sessions,
  isGlobalActive,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayArrow color="success" />;
      case 'paused':
        return <Pause color="warning" />;
      case 'stopped':
        return <Stop color="error" />;
      default:
        return <Stop />;
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

  const totalProfitLoss = sessions.reduce((total, session) => total + session.profitLoss, 0);
  const totalTrades = sessions.reduce((total, session) => total + session.tradesExecuted, 0);
  const activeSessions = sessions.filter(session => session.status === 'active').length;

  return (
    <Box>
      {!isGlobalActive && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Global trading is disabled. All trading sessions are currently suspended.
        </Alert>
      )}

      {/* Summary Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Sessions
            </Typography>
            <Typography variant="h4">
              {activeSessions}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {sessions.length} total sessions
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total P&L
            </Typography>
            <Typography 
              variant="h4"
              color={totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
            >
              {formatCurrency(totalProfitLoss)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {totalTrades} trades executed
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              System Status
            </Typography>
            <Typography variant="h6">
              {isGlobalActive ? 'Trading Active' : 'Trading Suspended'}
            </Typography>
            <Chip
              label={isGlobalActive ? 'ONLINE' : 'OFFLINE'}
              color={isGlobalActive ? 'success' : 'error'}
              size="small"
            />
          </CardContent>
        </Card>
      </Box>

      {/* Session Details */}
      <Card>
        <CardHeader title="Trading Session Monitor" />
        <CardContent>
          <List>
            {sessions.map((session) => (
              <ListItem key={session.id} divider>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          P&L: {' '}
                          <Typography
                            component="span"
                            color={session.profitLoss >= 0 ? 'success.main' : 'error.main'}
                            fontWeight="bold"
                          >
                            {formatCurrency(session.profitLoss)}
                            {session.profitLoss >= 0 ? (
                              <TrendingUp fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                            ) : (
                              <TrendingDown fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                            )}
                          </Typography>
                        </Typography>
                        <Typography variant="body2">
                          {session.tradesExecuted} trades | {session.activeRules} rules
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          Started: {session.startTime.toLocaleTimeString()}
                        </Typography>
                        {session.status === 'active' && (
                          <Box sx={{ width: 100 }}>
                            <LinearProgress variant="indeterminate" color="success" />
                          </Box>
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {sessions.length === 0 && (
            <Alert severity="info">
              No trading sessions found. Set up portfolios and trading rules to begin monitoring automated trading.
            </Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradingSessionMonitor;
