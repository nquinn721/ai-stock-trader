import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';

interface CorrelationData {
  asset1: string;
  asset2: string;
  correlation: number;
  pValue: number;
  timeframe: string;
}

interface PerformanceData {
  date: string;
  stocks: number;
  crypto: number;
  forex: number;
  commodities: number;
}

interface CrossAssetMetrics {
  correlationStrength: number;
  diversificationRatio: number;
  riskAdjustedReturn: number;
  sharpeRatio: number;
}

export const CrossAssetAnalytics: React.FC = () => {
  const [correlations, setCorrelations] = useState<CorrelationData[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [metrics, setMetrics] = useState<CrossAssetMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCorrelationData();
    fetchPerformanceData();
    fetchMetrics();
  }, []);

  const fetchCorrelationData = async () => {
    try {
      const response = await fetch('/api/multi-asset/correlations');
      if (response.ok) {
        const data = await response.json();
        setCorrelations(data);
      }
    } catch (error) {
      console.error('Error fetching correlation data:', error);
      setCorrelations([]);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/multi-asset/performance');
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setPerformanceData([]);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multi-asset/analytics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching cross-asset metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return '#f44336'; // Strong correlation
    if (abs >= 0.6) return '#ff9800'; // Moderate correlation
    if (abs >= 0.3) return '#ffc107'; // Weak correlation
    return '#4caf50'; // No/Low correlation (good for diversification)
  };

  const getCorrelationLabel = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs >= 0.8) return 'Strong';
    if (abs >= 0.6) return 'Moderate';
    if (abs >= 0.3) return 'Weak';
    return 'Low';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div>
        <Typography variant="h6" gutterBottom>
          Loading Cross-Asset Analytics...
        </Typography>
        <LinearProgress />
      </div>
    );
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        Cross-Asset Analytics
      </Typography>

      {/* Analytics Metrics */}
      <div className="metric-cards-container">
        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Avg Correlation Strength
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.correlationStrength ? formatPercentage(metrics.correlationStrength) : 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Diversification Ratio
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.diversificationRatio?.toFixed(2) || 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Risk-Adjusted Return
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.riskAdjustedReturn ? formatPercentage(metrics.riskAdjustedReturn) : 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Sharpe Ratio
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.sharpeRatio?.toFixed(2) || 'No data'}
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Cross-Asset Performance Comparison
        </Typography>
        {performanceData.length > 0 ? (
          <Box sx={{ width: '100%', height: 400 }}>
            <LineChart
              width={800}
              height={400}
              series={[
                {
                  data: performanceData.map(d => d.stocks),
                  label: 'Stocks',
                  color: '#2196f3'
                },
                {
                  data: performanceData.map(d => d.crypto),
                  label: 'Crypto',
                  color: '#ff9800'
                },
                {
                  data: performanceData.map(d => d.forex),
                  label: 'Forex',
                  color: '#4caf50'
                },
                {
                  data: performanceData.map(d => d.commodities),
                  label: 'Commodities',
                  color: '#9c27b0'
                }
              ]}
              xAxis={[{
                scaleType: 'point',
                data: performanceData.map(d => d.date)
              }]}
            />
          </Box>
        ) : (
          <Box py={4} textAlign="center">
            <Typography color="textSecondary">
              No performance data available for chart display
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Correlation Matrix Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Asset Correlation Matrix
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader aria-label="correlation table">
            <TableHead>
              <TableRow>
                <TableCell>Asset Pair</TableCell>
                <TableCell align="center">Correlation</TableCell>
                <TableCell align="center">Strength</TableCell>
                <TableCell align="center">P-Value</TableCell>
                <TableCell align="center">Timeframe</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {correlations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Box py={4}>
                      <Typography variant="body1" color="textSecondary">
                        No correlation data available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Please check your API connection or try again later
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                correlations.map((corr, index) => (
                  <TableRow key={index} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1" fontWeight="bold">
                        {corr.asset1} / {corr.asset2}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        sx={{ color: getCorrelationColor(corr.correlation) }}
                      >
                        {corr.correlation.toFixed(3)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getCorrelationLabel(corr.correlation)}
                        size="small"
                        sx={{
                          backgroundColor: getCorrelationColor(corr.correlation),
                          color: 'white',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {corr.pValue.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {corr.timeframe}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
};
