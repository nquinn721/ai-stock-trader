import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Tab,
  Tabs,
  Typography,
  Grid,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Emergency,
  Assessment,
  Settings,
  History,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import { TradingRulesManager } from './TradingRulesManager';
import { TradingControlPanel } from './TradingControlPanel';
import { TradingSessionMonitor } from './TradingSessionMonitor';
import { RuleBuilder } from './RuleBuilder';
import { TradingPerformanceChart } from './TradingPerformanceChart';
import { AutoTradeHistory } from './AutoTradeHistory';
import './AutoTradingDashboard.css';

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

interface TradingRule {
  id: string;
  name: string;
  strategy: string;
  isActive: boolean;
  conditions: any[];
  actions: any[];
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auto-trading-tabpanel-${index}`}
      aria-labelledby={`auto-trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AutoTradingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isGlobalTradingActive, setIsGlobalTradingActive] = useState(false);
  const [tradingSessions, setTradingSessions] = useState<TradingSession[]>([]);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading trading data
    const timer = setTimeout(() => {
      setTradingSessions([
        {
          id: '1',
          portfolioId: 'portfolio-1',
          portfolioName: 'Growth Portfolio',
          status: 'active',
          startTime: new Date(),
          profitLoss: 1245.50,
          tradesExecuted: 12,
          activeRules: 3,
        },
        {
          id: '2',
          portfolioId: 'portfolio-2',
          portfolioName: 'Conservative Portfolio',
          status: 'paused',
          startTime: new Date(),
          profitLoss: -89.25,
          tradesExecuted: 5,
          activeRules: 2,
        },
      ]);

      setTradingRules([
        {
          id: '1',
          name: 'RSI Oversold Strategy',
          strategy: 'Mean Reversion',
          isActive: true,
          conditions: [],
          actions: [],
          performance: {
            totalTrades: 45,
            winRate: 67.8,
            profitLoss: 2840.15,
          },
        },
        {
          id: '2',
          name: 'Momentum Breakout',
          strategy: 'Trend Following',
          isActive: true,
          conditions: [],
          actions: [],
          performance: {
            totalTrades: 23,
            winRate: 52.2,
            profitLoss: 1205.30,
          },
        },
      ]);

      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEmergencyStop = () => {
    setIsGlobalTradingActive(false);
    setTradingSessions(prev => 
      prev.map(session => ({ ...session, status: 'stopped' as const }))
    );
  };

  const toggleGlobalTrading = () => {
    setIsGlobalTradingActive(!isGlobalTradingActive);
  };

  if (loading) {
    return (
      <Box className="auto-trading-dashboard">
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading Automated Trading Dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="auto-trading-dashboard">
      {/* Header Section */}
      <Card className="dashboard-header">
        <CardHeader
          title="Automated Trading Dashboard"
          subheader="Manage your automated trading strategies and monitor performance"
          action={
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<Emergency />}
                onClick={handleEmergencyStop}
                className="emergency-stop-btn"
              >
                Emergency Stop
              </Button>
              <FormControlLabel
                control={
                  <Switch
                    checked={isGlobalTradingActive}
                    onChange={toggleGlobalTrading}
                    color="primary"
                  />
                }
                label="Global Trading"
              />
            </Box>
          }
        />
      </Card>

      {/* Status Overview */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 3 }} className="status-overview">
        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Sessions
            </Typography>
            <Typography variant="h4">
              {tradingSessions.filter(s => s.status === 'active').length}
            </Typography>
            <Chip 
              size="small" 
              label={isGlobalTradingActive ? 'Trading Active' : 'Trading Paused'}
              color={isGlobalTradingActive ? 'success' : 'warning'}
            />
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total P&L Today
            </Typography>
            <Typography variant="h4" color="success.main">
              +$1,156.25
            </Typography>
            <Typography variant="body2" color="textSecondary">
              17 trades executed
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Rules
            </Typography>
            <Typography variant="h4">
              {tradingRules.filter(r => r.isActive).length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {tradingRules.length} total rules
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Win Rate
            </Typography>
            <Typography variant="h4">
              62.5%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last 30 days
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Tab Navigation */}
      <Card className="tabs-container">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          className="dashboard-tabs"
        >
          <Tab label="Overview" icon={<Assessment />} />
          <Tab label="Trading Rules" icon={<Settings />} />
          <Tab label="Session Control" icon={<PlayArrow />} />
          <Tab label="Performance" icon={<TrendingUp />} />
          <Tab label="Trade History" icon={<History />} />
          <Tab label="Rule Builder" icon={<Settings />} />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={activeTab} index={0}>
          <TradingSessionMonitor 
            sessions={tradingSessions}
            isGlobalActive={isGlobalTradingActive}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <TradingRulesManager 
            rules={tradingRules}
            onRuleUpdate={setTradingRules}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <TradingControlPanel 
            sessions={tradingSessions}
            onSessionUpdate={setTradingSessions}
            isGlobalActive={isGlobalTradingActive}
            onGlobalToggle={toggleGlobalTrading}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <TradingPerformanceChart />
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <AutoTradeHistory />
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <RuleBuilder onRuleCreate={(rule: TradingRule) => {
            setTradingRules(prev => [...prev, rule]);
          }} />
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AutoTradingDashboard;
