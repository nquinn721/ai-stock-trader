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
import autonomousTradingApi, { Portfolio, DeploymentConfig } from '../../services/autonomousTradingApi';
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
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load available portfolios
      const portfoliosResult = await autonomousTradingApi.getAvailablePortfolios();
      if (portfoliosResult.success && portfoliosResult.data) {
        setPortfolios(portfoliosResult.data);
        
        // Create trading sessions based on actual portfolios
        const sessions = await Promise.all(
          portfoliosResult.data.map(async (portfolio) => {
            try {
              // Try to get performance data for each portfolio
              const performanceResult = await autonomousTradingApi.getPortfolioPerformance(portfolio.id);
              const performance = performanceResult.success ? performanceResult.data : null;
              
              return {
                id: portfolio.id,
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                status: 'stopped' as const, // Start with all sessions stopped
                startTime: new Date(),
                profitLoss: performance?.totalReturn || (portfolio.totalValue - parseFloat(portfolio.currentCash.toString())),
                tradesExecuted: performance?.dayTradeCount || 0,
                activeRules: 0, // Will be updated when rules are loaded
              };
            } catch (error) {
              console.warn(`Failed to load performance for portfolio ${portfolio.id}:`, error);
              return {
                id: portfolio.id,
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                status: 'stopped' as const,
                startTime: new Date(),
                profitLoss: portfolio.totalValue - parseFloat(portfolio.currentCash.toString()),
                tradesExecuted: 0,
                activeRules: 0,
              };
            }
          })
        );
        setTradingSessions(sessions);
      }

      // Load active trading strategies from backend
      try {
        const strategiesResult = await autonomousTradingApi.getActiveStrategies();
        if (strategiesResult.success && strategiesResult.data) {
          const rules = strategiesResult.data.map(instance => ({
            id: instance.id,
            name: instance.strategy?.name || `Strategy ${instance.strategyId}`,
            strategy: instance.strategy?.description || 'Auto Trading Strategy',
            isActive: instance.status === 'running',
            conditions: [], // These would come from strategy definition
            actions: [], // These would come from strategy definition
            performance: {
              totalTrades: instance.performance?.totalTrades || 0,
              winRate: instance.performance?.winRate || 0,
              profitLoss: instance.performance?.totalReturn || 0,
            },
          }));
          setTradingRules(rules);
          
          // Update session active rules count
          setTradingSessions(prev => prev.map(session => ({
            ...session,
            activeRules: rules.filter(rule => rule.isActive).length
          })));
        }
      } catch (error) {
        console.warn('Failed to load trading strategies:', error);
        // Fallback to basic rules for demo purposes
        setTradingRules([
          {
            id: '1',
            name: 'RSI Oversold Strategy',
            strategy: 'Mean Reversion',
            isActive: false,
            conditions: [],
            actions: [],
            performance: {
              totalTrades: 0,
              winRate: 0,
              profitLoss: 0,
            },
          },
          {
            id: '2', 
            name: 'Moving Average Crossover',
            strategy: 'Trend Following',
            isActive: false,
            conditions: [],
            actions: [],
            performance: {
              totalTrades: 0,
              winRate: 0,
              profitLoss: 0,
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error loading auto trading data:', error);
    }
    setLoading(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEmergencyStop = async () => {
    try {
      // Stop all active strategies
      const activeStrategies = tradingRules.filter(rule => rule.isActive);
      await Promise.all(
        activeStrategies.map(strategy =>
          autonomousTradingApi.stopStrategy(strategy.id)
        )
      );
      
      setIsGlobalTradingActive(false);
      setTradingSessions(prev => 
        prev.map(session => ({ ...session, status: 'stopped' as const }))
      );
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }
  };

  const toggleGlobalTrading = async () => {
    if (isGlobalTradingActive) {
      await handleEmergencyStop();
    } else {
      setIsGlobalTradingActive(true);
      // Note: Individual strategies would need to be started manually
      // This just enables the global trading flag
    }
  };

  const deployStrategy = async (strategyId: string, deploymentConfig: DeploymentConfig, portfolioId: string) => {
    try {
      const configWithPortfolio = {
        ...deploymentConfig,
        portfolioId
      };
      
      const result = await autonomousTradingApi.deployStrategy(strategyId, configWithPortfolio);
      
      if (result.success) {
        // Reload data to reflect the new strategy
        await loadData();
        return result;
      } else {
        throw new Error(result.error || 'Failed to deploy strategy');
      }
    } catch (error) {
      console.error('Error deploying strategy:', error);
      throw error;
    }
  };

  const stopStrategy = async (strategyId: string) => {
    try {
      const result = await autonomousTradingApi.stopStrategy(strategyId);
      if (result.success) {
        await loadData();
        return result;
      } else {
        throw new Error(result.error || 'Failed to stop strategy');
      }
    } catch (error) {
      console.error('Error stopping strategy:', error);
      throw error;
    }
  };

  const pauseStrategy = async (strategyId: string) => {
    try {
      const result = await autonomousTradingApi.pauseStrategy(strategyId);
      if (result.success) {
        await loadData();
        return result;
      } else {
        throw new Error(result.error || 'Failed to pause strategy');
      }
    } catch (error) {
      console.error('Error pausing strategy:', error);
      throw error;
    }
  };

  const resumeStrategy = async (strategyId: string) => {
    try {
      const result = await autonomousTradingApi.resumeStrategy(strategyId);
      if (result.success) {
        await loadData();
        return result;
      } else {
        throw new Error(result.error || 'Failed to resume strategy');
      }
    } catch (error) {
      console.error('Error resuming strategy:', error);
      throw error;
    }
  };

  // Calculate aggregated metrics from real data
  const calculateTotalPnL = () => {
    return tradingSessions.reduce((total, session) => total + session.profitLoss, 0);
  };

  const calculateTotalTrades = () => {
    return tradingSessions.reduce((total, session) => total + session.tradesExecuted, 0);
  };

  const calculateWinRate = () => {
    const totalTrades = tradingRules.reduce((total, rule) => total + rule.performance.totalTrades, 0);
    if (totalTrades === 0) return 0;
    
    const totalWins = tradingRules.reduce((total, rule) => 
      total + (rule.performance.totalTrades * rule.performance.winRate / 100), 0
    );
    
    return (totalWins / totalTrades) * 100;
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
            <Typography 
              variant="h4" 
              color={calculateTotalPnL() >= 0 ? 'success.main' : 'error.main'}
            >
              {calculateTotalPnL() >= 0 ? '+' : ''}${calculateTotalPnL().toFixed(2)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {calculateTotalTrades()} trades executed
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
              {calculateWinRate().toFixed(1)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              From active strategies
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
