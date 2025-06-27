import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ShowChart,
  BarChart,
} from '@mui/icons-material';

interface PerformanceData {
  date: string;
  profit: number;
  loss: number;
  trades: number;
  winRate: number;
}

export const TradingPerformanceChart: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('profit');
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading performance data
    const timer = setTimeout(() => {
      const mockData: PerformanceData[] = [
        { date: '2024-01-01', profit: 1200.50, loss: -300.25, trades: 15, winRate: 73.3 },
        { date: '2024-01-02', profit: 890.75, loss: -150.80, trades: 12, winRate: 66.7 },
        { date: '2024-01-03', profit: 1500.30, loss: -450.60, trades: 18, winRate: 77.8 },
        { date: '2024-01-04', profit: 750.90, loss: -200.40, trades: 10, winRate: 70.0 },
        { date: '2024-01-05', profit: 2100.20, loss: -600.15, trades: 22, winRate: 81.8 },
        { date: '2024-01-06', profit: 950.60, loss: -350.25, trades: 14, winRate: 64.3 },
        { date: '2024-01-07', profit: 1800.45, loss: -400.80, trades: 20, winRate: 75.0 },
      ];
      setPerformanceData(mockData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRange]);

  const totalProfit = performanceData.reduce((sum, data) => sum + data.profit, 0);
  const totalLoss = performanceData.reduce((sum, data) => sum + Math.abs(data.loss), 0);
  const netProfit = totalProfit - totalLoss;
  const totalTrades = performanceData.reduce((sum, data) => sum + data.trades, 0);
  const avgWinRate = performanceData.length > 0 
    ? performanceData.reduce((sum, data) => sum + data.winRate, 0) / performanceData.length 
    : 0;

  if (loading) {
    return (
      <Box className="performance-chart-container">
        <Typography variant="h6">Loading Performance Data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card className="performance-chart-container">
        <CardContent>
          <Box className="chart-controls">
            <Typography variant="h6">
              Trading Performance Analytics
            </Typography>
            <Box className="chart-filters">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  label="Time Range"
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <MenuItem value="1d">1 Day</MenuItem>
                  <MenuItem value="7d">7 Days</MenuItem>
                  <MenuItem value="30d">30 Days</MenuItem>
                  <MenuItem value="90d">90 Days</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                </Select>
              </FormControl>
              
              <ButtonGroup size="small" variant="outlined">
                <Button
                  variant={chartType === 'profit' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('profit')}
                  startIcon={<TrendingUp />}
                >
                  P&L
                </Button>
                <Button
                  variant={chartType === 'trades' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('trades')}
                  startIcon={<BarChart />}
                >
                  Trades
                </Button>
                <Button
                  variant={chartType === 'winrate' ? 'contained' : 'outlined'}
                  onClick={() => setChartType('winrate')}
                  startIcon={<ShowChart />}
                >
                  Win Rate
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

          {/* Summary Stats */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color={netProfit >= 0 ? 'success.main' : 'error.main'}>
                ${netProfit.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Net Profit/Loss
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4">
                {totalTrades}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Trades
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main">
                {avgWinRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average Win Rate
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                ${totalProfit.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Profits
              </Typography>
            </Box>
          </Box>

          {/* Chart Placeholder */}
          <Box 
            sx={{ 
              height: 300, 
              border: '2px dashed #ccc', 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2,
              backgroundColor: '#f9f9f9'
            }}
          >
            {chartType === 'profit' && <TrendingUp sx={{ fontSize: 48, color: '#666' }} />}
            {chartType === 'trades' && <BarChart sx={{ fontSize: 48, color: '#666' }} />}
            {chartType === 'winrate' && <ShowChart sx={{ fontSize: 48, color: '#666' }} />}
            
            <Typography variant="h6" color="textSecondary">
              {chartType === 'profit' && 'Profit & Loss Chart'}
              {chartType === 'trades' && 'Trade Volume Chart'}
              {chartType === 'winrate' && 'Win Rate Trend Chart'}
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              Chart visualization would be implemented here using a charting library like Chart.js or Recharts
            </Typography>
          </Box>

          {/* Data Table */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Daily Performance Summary
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {performanceData.map((data, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    backgroundColor: 'white'
                  }}
                >
                  <Typography variant="body2">
                    {new Date(data.date).toLocaleDateString()}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip 
                      label={`${data.trades} trades`}
                      size="small"
                      variant="outlined"
                    />
                    
                    <Typography 
                      variant="body2" 
                      color={data.profit - Math.abs(data.loss) >= 0 ? 'success.main' : 'error.main'}
                      sx={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}
                    >
                      ${(data.profit - Math.abs(data.loss)).toFixed(2)}
                    </Typography>
                    
                    <Chip 
                      label={`${data.winRate.toFixed(1)}%`}
                      size="small"
                      color={data.winRate >= 70 ? 'success' : data.winRate >= 50 ? 'warning' : 'error'}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TradingPerformanceChart;
