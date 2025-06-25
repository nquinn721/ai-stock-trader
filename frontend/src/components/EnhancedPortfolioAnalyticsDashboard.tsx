import {
  Assessment,
  CompareArrows,
  PieChart as PieChartIcon,
  TrendingUp,
  Warning,
  GetApp,
  Timeline,
  ScatterPlot,
  ShowChart,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
} from "recharts";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface PortfolioAnalyticsData {
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayChange: number;
  dayChangePercent: number;
  alpha: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
  volatility: number;
  var95: number;
  performanceData: Array<{
    date: string;
    portfolioValue: number;
    benchmarkValue: number;
    returns: number;
  }>;
  sectorAllocation: Array<{
    sector: string;
    value: number;
    allocation: number;
  }>;
  correlationMatrix: Array<{
    asset: string;
    correlations: { [key: string]: number };
  }>;
  monteCarloResults: Array<{
    scenario: number;
    finalValue: number;
    probability: number;
  }>;
  efficientFrontier: Array<{
    risk: number;
    return: number;
    weight: { [key: string]: number };
  }>;
  riskReturnData: Array<{
    asset: string;
    risk: number;
    return: number;
    size: number;
  }>;
  benchmarkComparison: Array<{
    benchmark: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    alpha: number;
    beta: number;
  }>;
}

interface EnhancedPortfolioAnalyticsDashboardProps {
  portfolioId: number;
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
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedPortfolioAnalyticsDashboard: React.FC<EnhancedPortfolioAnalyticsDashboardProps> = ({ portfolioId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [performanceWindow, setPerformanceWindow] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('1Y');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<PortfolioAnalyticsData | null>(null);

  // Mock data generation (in real implementation, this would come from backend)
  const mockAnalyticsData = useMemo((): PortfolioAnalyticsData => {
    const generatePerformanceData = () => {
      const data = [];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      
      for (let i = 0; i < 252; i++) { // ~1 year of trading days
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const portfolioValue = 100000 + Math.random() * 20000 - 10000 + i * 100;
        const benchmarkValue = 100000 + Math.random() * 15000 - 7500 + i * 80;
        data.push({
          date: date.toISOString().split('T')[0],
          portfolioValue,
          benchmarkValue,
          returns: (portfolioValue - 100000) / 100000 * 100,
        });
      }
      return data;
    };

    const generateSectorData = () => [
      { sector: 'Technology', value: 45000, allocation: 45 },
      { sector: 'Healthcare', value: 25000, allocation: 25 },
      { sector: 'Finance', value: 15000, allocation: 15 },
      { sector: 'Consumer', value: 10000, allocation: 10 },
      { sector: 'Energy', value: 5000, allocation: 5 },
    ];

    const generateCorrelationMatrix = () => {
      const assets = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA'];
      return assets.map(asset => ({
        asset,
        correlations: assets.reduce((acc, other) => {
          acc[other] = asset === other ? 1 : Math.random() * 0.8 + 0.1;
          return acc;
        }, {} as { [key: string]: number })
      }));
    };

    const generateMonteCarloResults = () => {
      const results = [];
      for (let i = 0; i < 1000; i++) {
        const finalValue = 100000 * (1 + (Math.random() - 0.5) * 0.6);
        results.push({
          scenario: i,
          finalValue,
          probability: Math.random(),
        });
      }
      return results.sort((a, b) => a.finalValue - b.finalValue);
    };

    const generateEfficientFrontier = () => {
      const data = [];
      for (let risk = 0.05; risk <= 0.25; risk += 0.01) {
        data.push({
          risk: risk * 100,
          return: (risk * 4 + Math.random() * 0.02) * 100,
          weight: {
            'AAPL': Math.random(),
            'GOOGL': Math.random(),
            'MSFT': Math.random(),
            'TSLA': Math.random(),
            'NVDA': Math.random(),
          }
        });
      }
      return data;
    };

    const generateRiskReturnData = () => [
      { asset: 'AAPL', risk: 15.2, return: 12.5, size: 25000 },
      { asset: 'GOOGL', risk: 18.7, return: 15.2, size: 20000 },
      { asset: 'MSFT', risk: 14.8, return: 11.8, size: 22000 },
      { asset: 'TSLA', risk: 35.2, return: 25.8, size: 15000 },
      { asset: 'NVDA', risk: 28.5, return: 22.1, size: 18000 },
    ];

    const generateBenchmarkComparison = () => [
      { benchmark: 'S&P 500', portfolioReturn: 12.5, benchmarkReturn: 10.2, alpha: 2.3, beta: 1.05 },
      { benchmark: 'NASDAQ', portfolioReturn: 12.5, benchmarkReturn: 14.8, alpha: -2.3, beta: 0.85 },
      { benchmark: 'Russell 2000', portfolioReturn: 12.5, benchmarkReturn: 8.9, alpha: 3.6, beta: 0.92 },
    ];

    return {
      totalValue: 125450.75,
      totalReturn: 25450.75,
      totalReturnPercent: 25.45,
      dayChange: 1250.30,
      dayChangePercent: 1.01,
      alpha: 2.3,
      beta: 1.05,
      sharpeRatio: 1.45,
      maxDrawdown: -8.5,
      volatility: 15.2,
      var95: -2850.50,
      performanceData: generatePerformanceData(),
      sectorAllocation: generateSectorData(),
      correlationMatrix: generateCorrelationMatrix(),
      monteCarloResults: generateMonteCarloResults(),
      efficientFrontier: generateEfficientFrontier(),
      riskReturnData: generateRiskReturnData(),
      benchmarkComparison: generateBenchmarkComparison(),
    };
  }, []);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [portfolioId, mockAnalyticsData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('portfolio-analytics-dashboard');
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`portfolio-analytics-${portfolioId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analyticsData) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        No analytics data available
      </Alert>
    );
  }

  return (
    <Box id="portfolio-analytics-dashboard" sx={{ width: '100%' }}>
      <Paper sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h4" component="h1">
            Portfolio Analytics Dashboard
          </Typography>
          <Button
            variant="outlined"
            startIcon={<GetApp />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </Box>
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<Assessment />} />
          <Tab label="Performance" icon={<TrendingUp />} />
          <Tab label="Risk Analysis" icon={<Warning />} />
          <Tab label="Correlations" icon={<CompareArrows />} />
          <Tab label="Monte Carlo" icon={<ShowChart />} />
          <Tab label="Efficient Frontier" icon={<Timeline />} />
          <Tab label="Sectors" icon={<PieChartIcon />} />
          <Tab label="Benchmarks" icon={<ScatterPlot />} />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 3,
            mb: 3
          }}
        >
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(analyticsData.totalValue)}
              </Typography>
              <Typography 
                color={analyticsData.dayChange >= 0 ? "success.main" : "error.main"}
                variant="body2"
              >
                {formatPercent(analyticsData.dayChangePercent)} today
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Return
              </Typography>
              <Typography variant="h4">
                {formatCurrency(analyticsData.totalReturn)}
              </Typography>
              <Typography 
                color={analyticsData.totalReturn >= 0 ? "success.main" : "error.main"}
                variant="body2"
              >
                {formatPercent(analyticsData.totalReturnPercent)}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Sharpe Ratio
              </Typography>
              <Typography variant="h4">
                {analyticsData.sharpeRatio.toFixed(2)}
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Risk-adjusted return
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Max Drawdown
              </Typography>
              <Typography variant="h4" color="error.main">
                {formatPercent(analyticsData.maxDrawdown)}
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Worst decline
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardHeader title="Portfolio Performance vs Benchmark" />
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={analyticsData.performanceData.slice(-30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="portfolioValue" 
                  stroke="#8884d8" 
                  name="Portfolio" 
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmarkValue" 
                  stroke="#82ca9d" 
                  name="Benchmark" 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={performanceWindow}
              label="Time Period"
              onChange={(e) => setPerformanceWindow(e.target.value as any)}
            >
              <MenuItem value="1M">1 Month</MenuItem>
              <MenuItem value="3M">3 Months</MenuItem>
              <MenuItem value="6M">6 Months</MenuItem>
              <MenuItem value="1Y">1 Year</MenuItem>
              <MenuItem value="3Y">3 Years</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3,
            mb: 3
          }}
        >
          <Card>
            <CardHeader title="Rolling Returns" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.performanceData.slice(-60)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="returns" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Cumulative Performance" />
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analyticsData.performanceData.slice(-60)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    stroke="#8884d8" 
                    name="Portfolio" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="benchmarkValue" 
                    stroke="#82ca9d" 
                    name="S&P 500" 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Risk Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 2,
            mb: 3
          }}
        >
          {[
            { label: 'Alpha', value: analyticsData.alpha, suffix: '%' },
            { label: 'Beta', value: analyticsData.beta, suffix: '' },
            { label: 'Volatility', value: analyticsData.volatility, suffix: '%' },
            { label: 'VaR (95%)', value: analyticsData.var95, suffix: '', currency: true },
            { label: 'Sharpe Ratio', value: analyticsData.sharpeRatio, suffix: '' },
            { label: 'Max Drawdown', value: analyticsData.maxDrawdown, suffix: '%' },
          ].map((metric, index) => (
            <Card key={index}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {metric.label}
                </Typography>
                <Typography variant="h5">
                  {metric.currency ? formatCurrency(metric.value) : `${metric.value.toFixed(2)}${metric.suffix}`}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
            gap: 3 
          }}
        >
          <Card>
            <CardHeader title="Risk-Return Scatter Plot" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="risk" 
                    name="Risk (%)" 
                    unit="%" 
                  />
                  <YAxis 
                    type="number" 
                    dataKey="return" 
                    name="Return (%)" 
                    unit="%" 
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Assets" 
                    data={analyticsData.riskReturnData} 
                    fill="#8884d8" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Risk Metrics" />
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Portfolio Beta
                  </Typography>
                  <Typography variant="h6">
                    {analyticsData.beta.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {analyticsData.beta > 1 ? 'Higher' : 'Lower'} volatility than market
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Value at Risk (95%)
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(analyticsData.var95)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Expected worst loss in 95% of cases
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Volatility
                  </Typography>
                  <Typography variant="h6">
                    {analyticsData.volatility.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Annualized standard deviation
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Correlations Tab */}
      <TabPanel value={tabValue} index={3}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3 
          }}
        >
          <Card>
            <CardHeader title="Asset Correlation Matrix" />
            <CardContent>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 8, textAlign: 'left' }}>Asset</th>
                      {analyticsData.correlationMatrix.map(({ asset }) => (
                        <th key={asset} style={{ padding: 8, textAlign: 'center' }}>
                          {asset}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.correlationMatrix.map(({ asset, correlations }) => (
                      <tr key={asset}>
                        <td style={{ padding: 8, fontWeight: 'bold' }}>{asset}</td>
                        {Object.entries(correlations).map(([otherAsset, correlation]) => (
                          <td 
                            key={otherAsset} 
                            style={{ 
                              padding: 8, 
                              textAlign: 'center',
                              backgroundColor: `rgba(136, 132, 216, ${correlation})`,
                              color: correlation > 0.5 ? 'white' : 'black'
                            }}
                          >
                            {correlation.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Diversification Analysis" />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Portfolio Diversification Score
              </Typography>
              <Typography variant="h3" color="primary.main" gutterBottom>
                7.8/10
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Your portfolio shows good diversification across different assets and sectors.
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">
                    Average Correlation: 0.35
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Low correlation reduces overall portfolio risk
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    Concentration Risk: Low
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    No single position dominates the portfolio
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Monte Carlo Tab */}
      <TabPanel value={tabValue} index={4}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3 
          }}
        >
          <Card>
            <CardHeader title="Monte Carlo Simulation Results" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.monteCarloResults.slice(0, 100)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="scenario" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area 
                    type="monotone" 
                    dataKey="finalValue" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Simulation Statistics" />
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    95% Confidence Interval
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(analyticsData.monteCarloResults[49]?.finalValue)} - {formatCurrency(analyticsData.monteCarloResults[949]?.finalValue)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Probability of Loss
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    15.2%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Expected Value (1 Year)
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {formatCurrency(110500)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Best Case Scenario
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(analyticsData.monteCarloResults[999]?.finalValue)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Worst Case Scenario
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    {formatCurrency(analyticsData.monteCarloResults[0]?.finalValue)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Efficient Frontier Tab */}
      <TabPanel value={tabValue} index={5}>
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
            gap: 3 
          }}
        >
          <Card>
            <CardHeader title="Efficient Frontier" />
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid />
                  <XAxis 
                    type="number" 
                    dataKey="risk" 
                    name="Risk (%)" 
                    unit="%" 
                    domain={[5, 25]}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="return" 
                    name="Return (%)" 
                    unit="%" 
                    domain={[5, 30]}
                  />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter 
                    name="Efficient Portfolios" 
                    data={analyticsData.efficientFrontier} 
                    fill="#8884d8" 
                  />
                  <Scatter 
                    name="Current Portfolio" 
                    data={[{ risk: analyticsData.volatility, return: 12.5 }]} 
                    fill="#ff7300" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Portfolio Optimization" />
            <CardContent>
              <Typography variant="body1" paragraph>
                The efficient frontier shows the optimal risk-return combinations. Your current portfolio is plotted as the orange dot.
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">
                    Current Position
                  </Typography>
                  <Typography variant="body2">
                    Risk: {analyticsData.volatility}% | Return: 12.5%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    Optimal Portfolio (Same Risk)
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Expected Return: 14.2% (+1.7%)
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    Minimum Risk Portfolio
                  </Typography>
                  <Typography variant="body2">
                    Risk: 8.5% | Return: 9.8%
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2">
                    Maximum Return Portfolio
                  </Typography>
                  <Typography variant="body2">
                    Risk: 22.1% | Return: 18.9%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>

      {/* Sectors Tab */}
      <TabPanel value={tabValue} index={6}>
        <Card>
          <CardHeader title="Sector Allocation Analysis" />
          <CardContent>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                gap: 3 
              }}
            >
              <Box>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={analyticsData.sectorAllocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ sector, allocation }) => `${sector}: ${allocation}%`}
                    >
                      {analyticsData.sectorAllocation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Sector Breakdown
                </Typography>
                <Stack spacing={2}>
                  {analyticsData.sectorAllocation.map((sector, index) => (
                    <Box key={sector.sector}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          {sector.sector}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {sector.allocation}%
                        </Typography>
                      </Box>
                      <Box 
                        sx={{ 
                          height: 8, 
                          backgroundColor: 'grey.200', 
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                      >
                        <Box 
                          sx={{ 
                            height: '100%', 
                            width: `${sector.allocation}%`, 
                            backgroundColor: COLORS[index % COLORS.length],
                            transition: 'width 0.3s ease'
                          }} 
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {formatCurrency(sector.value)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Benchmarks Tab */}
      <TabPanel value={tabValue} index={7}>
        <Card>
          <CardHeader title="Benchmark Comparison" />
          <CardContent>
            <Box 
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: 3 
              }}
            >
              {analyticsData.benchmarkComparison.map((benchmark) => (
                <Card 
                  key={benchmark.benchmark} 
                  variant="outlined" 
                  sx={{ p: 2 }}
                >
                  <Typography variant="h6" gutterBottom>
                    {benchmark.benchmark}
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Portfolio Return:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatPercent(benchmark.portfolioReturn)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Benchmark Return:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatPercent(benchmark.benchmarkReturn)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Alpha:</Typography>
                      <Typography 
                        variant="body2" 
                        fontWeight="bold"
                        color={benchmark.alpha >= 0 ? "success.main" : "error.main"}
                      >
                        {formatPercent(benchmark.alpha)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Beta:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {benchmark.beta.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      </TabPanel>
    </Box>
  );
};

export default EnhancedPortfolioAnalyticsDashboard;
