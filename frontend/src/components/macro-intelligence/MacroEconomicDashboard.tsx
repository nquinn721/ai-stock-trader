import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  Box,
  Button,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Public,
  AccountBalance,
  Warning,
  Refresh,
  Info,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './MacroEconomicDashboard.css';

interface EconomicAnalysis {
  country: string;
  overallHealth: number;
  indicators: Array<{
    indicator: string;
    value: number;
    previousValue: number;
    forecast: number;
    impact: 'low' | 'medium' | 'high';
  }>;
  trends: {
    gdpGrowth: number;
    inflation: number;
    unemployment: number;
    productivity: number;
  };
  risks: string[];
  opportunities: string[];
  outlook: 'positive' | 'neutral' | 'negative';
  confidence: number;
  timestamp: Date;
}

interface RecessionProbability {
  country: string;
  probability: {
    sixMonth: number;
    oneYear: number;
    twoYear: number;
  };
  indicators: Array<{
    indicator: string;
    signal: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
  confidence: number;
}

interface PoliticalStability {
  country: string;
  overall: number;
  components: {
    political: number;
    economic: number;
    social: number;
    security: number;
  };
  trends: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
  risks: Array<{
    type: string;
    probability: number;
    impact: number;
  }>;
}

interface MacroDashboardData {
  country: string;
  economic: EconomicAnalysis;
  recession: RecessionProbability;
  political: PoliticalStability;
  businessCycle: {
    phase: string;
    duration: number;
    strength: number;
  };
  timestamp: Date;
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
      role=\"tabpanel\"
      hidden={value !== index}
      id={`macro-tabpanel-${index}`}
      aria-labelledby={`macro-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * S51: Macro Economic Dashboard Component
 * Comprehensive macroeconomic intelligence and analysis dashboard
 */
export const MacroEconomicDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [dashboardData, setDashboardData] = useState<MacroDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countries = ['US', 'China', 'Germany', 'Japan', 'UK'];

  useEffect(() => {
    fetchMacroDashboardData(selectedCountry);
  }, [selectedCountry]);

  const fetchMacroDashboardData = async (country: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/macro-intelligence/dashboard/${country}`);
      if (!response.ok) {
        throw new Error('Failed to fetch macro dashboard data');
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching macro dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    fetchMacroDashboardData(selectedCountry);
  };

  const getHealthColor = (health: number): string => {
    if (health >= 70) return '#4caf50';
    if (health >= 50) return '#ff9800';
    return '#f44336';
  };

  const getOutlookIcon = (outlook: string) => {
    switch (outlook) {
      case 'positive':
        return <TrendingUp style={{ color: '#4caf50' }} />;
      case 'negative':
        return <TrendingDown style={{ color: '#f44336' }} />;
      default:
        return <Assessment style={{ color: '#ff9800' }} />;
    }
  };

  const formatProbability = (prob: number): string => {
    return `${(prob * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className=\"macro-dashboard\">
        <div className=\"page-header\">
          <div className=\"header-left\">
            <h1>Macro Economic Intelligence</h1>
            <div className=\"market-time\">
              <Assessment size={16} />
              <span>Loading Analysis...</span>
            </div>
          </div>
        </div>
        <Box sx={{ mt: 4 }}>
          <LinearProgress />
          <Typography sx={{ mt: 2, textAlign: 'center' }}>
            Loading macroeconomic data and analysis...
          </Typography>
        </Box>
      </div>
    );
  }

  if (error) {
    return (
      <div className=\"macro-dashboard\">
        <div className=\"page-header\">
          <div className=\"header-left\">
            <h1>Macro Economic Intelligence</h1>
            <div className=\"market-time\">
              <Warning size={16} />
              <span>Error Loading</span>
            </div>
          </div>
          <div className=\"header-info\">
            <Button onClick={handleRefresh} startIcon={<Refresh />}>
              Retry
            </Button>
          </div>
        </div>
        <Alert severity=\"error\" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className=\"macro-dashboard\">
        <Typography>No data available</Typography>
      </div>
    );
  }

  const economicHealthData = [
    { name: 'Economic Health', value: dashboardData.economic.overallHealth },
    { name: 'Political Stability', value: dashboardData.political.overall },
    { name: 'Business Cycle', value: dashboardData.businessCycle.strength },
  ];

  const riskDistribution = dashboardData.political.risks.map((risk, index) => ({
    name: risk.type,
    value: risk.probability * 100,
    impact: risk.impact * 100,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className=\"macro-dashboard\">
      <div className=\"page-header\">
        <div className=\"header-left\">
          <h1>Macro Economic Intelligence</h1>
          <div className=\"market-time\">
            <Public size={16} />
            <span>{selectedCountry} Economic Analysis</span>
          </div>
        </div>
        <div className=\"header-info\">
          <div className=\"country-selector\">
            {countries.map((country) => (
              <Button
                key={country}
                variant={selectedCountry === country ? 'contained' : 'outlined'}
                size=\"small\"
                onClick={() => setSelectedCountry(country)}
                sx={{ mr: 1 }}
              >
                {country}
              </Button>
            ))}
          </div>
          <Tooltip title=\"Refresh Data\">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className=\"metrics-overview\">
        <div className=\"metric-card\">
          <div className=\"metric-header\">
            <AccountBalance />
            <span>Economic Health</span>
          </div>
          <div className=\"metric-value\" style={{ color: getHealthColor(dashboardData.economic.overallHealth) }}>
            {dashboardData.economic.overallHealth}
          </div>
          <div className=\"metric-subtitle\">
            {getOutlookIcon(dashboardData.economic.outlook)}
            {dashboardData.economic.outlook} outlook
          </div>
        </div>

        <div className=\"metric-card\">
          <div className=\"metric-header\">
            <TrendingUp />
            <span>GDP Growth</span>
          </div>
          <div className=\"metric-value\">
            {dashboardData.economic.trends.gdpGrowth.toFixed(1)}%
          </div>
          <div className=\"metric-subtitle\">Annual growth rate</div>
        </div>

        <div className=\"metric-card\">
          <div className=\"metric-header\">
            <Assessment />
            <span>Inflation</span>
          </div>
          <div className=\"metric-value\">
            {dashboardData.economic.trends.inflation.toFixed(1)}%
          </div>
          <div className=\"metric-subtitle\">Current rate</div>
        </div>

        <div className=\"metric-card\">
          <div className=\"metric-header\">
            <Warning />
            <span>Recession Risk</span>
          </div>
          <div className=\"metric-value\">
            {formatProbability(dashboardData.recession.probability.oneYear)}
          </div>
          <div className=\"metric-subtitle\">12-month probability</div>
        </div>
      </div>

      {/* Detailed Analysis Tabs */}
      <Box sx={{ mt: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label=\"macro analysis tabs\">
          <Tab label=\"Economic Indicators\" />
          <Tab label=\"Risk Assessment\" />
          <Tab label=\"Political Stability\" />
          <Tab label=\"Business Cycle\" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <div className=\"economic-indicators\">
            <div className=\"indicators-grid\">
              {dashboardData.economic.indicators.map((indicator, index) => (
                <Card key={index} className=\"indicator-card\">
                  <CardContent>
                    <Typography variant=\"h6\" gutterBottom>
                      {indicator.indicator}
                    </Typography>
                    <Typography variant=\"h4\" color=\"primary\">
                      {indicator.value.toFixed(2)}
                      {indicator.indicator.includes('Rate') ? '%' : ''}
                    </Typography>
                    <Typography variant=\"body2\" color=\"textSecondary\">
                      Previous: {indicator.previousValue.toFixed(2)}
                      {indicator.indicator.includes('Rate') ? '%' : ''}
                    </Typography>
                    <Typography variant=\"body2\" color=\"textSecondary\">
                      Forecast: {indicator.forecast.toFixed(2)}
                      {indicator.indicator.includes('Rate') ? '%' : ''}
                    </Typography>
                    <Chip
                      size=\"small\"
                      label={indicator.impact}
                      color={indicator.impact === 'high' ? 'error' : indicator.impact === 'medium' ? 'warning' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant=\"h6\" gutterBottom>
                  Economic Health Distribution
                </Typography>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <BarChart data={economicHealthData}>
                    <CartesianGrid strokeDasharray=\"3 3\" />
                    <XAxis dataKey=\"name\" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip />
                    <Bar dataKey=\"value\" fill=\"#8884d8\" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <div className=\"risk-assessment\">
            <div className=\"risk-grid\">
              <Card>
                <CardContent>
                  <Typography variant=\"h6\" gutterBottom>
                    Recession Probability
                  </Typography>
                  <div className=\"recession-timeline\">
                    <div className=\"recession-item\">
                      <span>6 Months</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.recession.probability.sixMonth * 100}
                        sx={{ mt: 1 }}
                      />
                      <span>{formatProbability(dashboardData.recession.probability.sixMonth)}</span>
                    </div>
                    <div className=\"recession-item\">
                      <span>1 Year</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.recession.probability.oneYear * 100}
                        sx={{ mt: 1 }}
                      />
                      <span>{formatProbability(dashboardData.recession.probability.oneYear)}</span>
                    </div>
                    <div className=\"recession-item\">
                      <span>2 Years</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.recession.probability.twoYear * 100}
                        sx={{ mt: 1 }}
                      />
                      <span>{formatProbability(dashboardData.recession.probability.twoYear)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant=\"h6\" gutterBottom>
                    Economic Risks
                  </Typography>
                  <div className=\"risks-list\">
                    {dashboardData.economic.risks.map((risk, index) => (
                      <Alert key={index} severity=\"warning\" sx={{ mb: 1 }}>
                        {risk}
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant=\"h6\" gutterBottom>
                    Opportunities
                  </Typography>
                  <div className=\"opportunities-list\">
                    {dashboardData.economic.opportunities.map((opportunity, index) => (
                      <Alert key={index} severity=\"success\" sx={{ mb: 1 }}>
                        {opportunity}
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <div className=\"political-stability\">
            <div className=\"stability-grid\">
              <Card>
                <CardContent>
                  <Typography variant=\"h6\" gutterBottom>
                    Stability Components
                  </Typography>
                  <div className=\"stability-components\">
                    <div className=\"component-item\">
                      <span>Political</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.political.components.political}
                        sx={{ mt: 1 }}
                      />
                      <span>{dashboardData.political.components.political.toFixed(1)}</span>
                    </div>
                    <div className=\"component-item\">
                      <span>Economic</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.political.components.economic}
                        sx={{ mt: 1 }}
                      />
                      <span>{dashboardData.political.components.economic.toFixed(1)}</span>
                    </div>
                    <div className=\"component-item\">
                      <span>Social</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.political.components.social}
                        sx={{ mt: 1 }}
                      />
                      <span>{dashboardData.political.components.social.toFixed(1)}</span>
                    </div>
                    <div className=\"component-item\">
                      <span>Security</span>
                      <LinearProgress
                        variant=\"determinate\"
                        value={dashboardData.political.components.security}
                        sx={{ mt: 1 }}
                      />
                      <span>{dashboardData.political.components.security.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant=\"h6\" gutterBottom>
                    Risk Distribution
                  </Typography>
                  <ResponsiveContainer width=\"100%\" height={300}>
                    <PieChart>
                      <Pie
                        data={riskDistribution}
                        cx=\"50%\"
                        cy=\"50%\"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={80}
                        fill=\"#8884d8\"
                        dataKey=\"value\"
                      >
                        {riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <div className=\"business-cycle\">
            <Card>
              <CardContent>
                <Typography variant=\"h6\" gutterBottom>
                  Current Business Cycle Phase
                </Typography>
                <div className=\"cycle-info\">
                  <div className=\"cycle-phase\">
                    <Typography variant=\"h3\" color=\"primary\">
                      {dashboardData.businessCycle.phase.charAt(0).toUpperCase() + 
                       dashboardData.businessCycle.phase.slice(1)}
                    </Typography>
                  </div>
                  <div className=\"cycle-details\">
                    <div className=\"detail-item\">
                      <span>Duration</span>
                      <span>{dashboardData.businessCycle.duration} months</span>
                    </div>
                    <div className=\"detail-item\">
                      <span>Strength</span>
                      <span>{dashboardData.businessCycle.strength}/100</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabPanel>
      </Box>
    </div>
  );
};
