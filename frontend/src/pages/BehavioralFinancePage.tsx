import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Psychology,
  Dashboard,
  Insights,
  TrendingUp,
  Settings,
  MoreVert,
} from '@mui/icons-material';
import {
  BehavioralAnalyticsDashboard,
  PsychologyInsightsPanel,
  BehavioralTradingInterface,
} from '../components/behavioral-analytics';

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
      id={`behavioral-tabpanel-${index}`}
      aria-labelledby={`behavioral-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `behavioral-tab-${index}`,
    'aria-controls': `behavioral-tabpanel-${index}`,
  };
}

export const BehavioralFinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    handleMenuClose();
  };

  const popularSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META', 'SPY', 'QQQ'];

  return (
    <Box className="min-h-screen bg-primary">
      {/* Header */}
      <AppBar position="static" className="bg-gradient-card shadow-lg">
        <Toolbar>
          <Psychology sx={{ fontSize: 32, mr: 2 }} />
          <Box className="flex-1">
            <Typography variant="h5" className="font-bold text-gradient-primary">
              Behavioral Finance & Cognitive AI
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Advanced market psychology and behavioral analysis platform
            </Typography>
          </Box>
          
          <Box className="flex items-center gap-2">
            <Chip
              label={`Symbol: ${selectedSymbol}`}
              variant="outlined"
              color="primary"
              onClick={handleMenuClick}
              icon={<TrendingUp />}
            />
            <IconButton onClick={handleMenuClick}>
              <MoreVert />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="subtitle2" className="font-semibold">
                Select Symbol
              </Typography>
            </MenuItem>
            {popularSymbols.map((symbol) => (
              <MenuItem
                key={symbol}
                onClick={() => handleSymbolChange(symbol)}
                selected={symbol === selectedSymbol}
              >
                {symbol}
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Box className="bg-secondary border-b border-gray-700">
        <Container maxWidth={false}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            className="text-white"
          >
            <Tab
              icon={<Dashboard />}
              label="Behavioral Dashboard"
              {...a11yProps(0)}
              className="font-medium"
            />
            <Tab
              icon={<Insights />}
              label="Psychology Insights"
              {...a11yProps(1)}
              className="font-medium"
            />
            <Tab
              icon={<Psychology />}
              label="Trading Interface"
              {...a11yProps(2)}
              className="font-medium"
            />
          </Tabs>
        </Container>
      </Box>

      {/* Tab Content */}
      <Container maxWidth={false} className="py-0">
        <TabPanel value={activeTab} index={0}>
          <BehavioralAnalyticsDashboard symbol={selectedSymbol} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <PsychologyInsightsPanel symbols={[selectedSymbol, 'SPY', 'QQQ']} />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <BehavioralTradingInterface />
        </TabPanel>
      </Container>

      {/* Footer */}
      <Box className="bg-tertiary mt-8 py-6">
        <Container maxWidth={false}>
          <Box className="text-center">
            <Typography variant="body2" color="textSecondary" className="mb-2">
              Behavioral Finance & Cognitive AI Trading Platform
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Powered by advanced psychology models, sentiment analysis, and behavioral economics
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default BehavioralFinancePage;
