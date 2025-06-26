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
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

interface CommodityData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  openInterest?: number;
  category: string;
}

interface CommodityMetrics {
  totalVolume: number;
  activeCommodities: number;
  energyIndex: number;
  metalsIndex: number;
  agricultureIndex: number;
}

export const CommoditiesDashboard: React.FC = () => {
  const [commodityData, setCommodityData] = useState<CommodityData[]>([]);
  const [metrics, setMetrics] = useState<CommodityMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommodityData();
    fetchCommodityMetrics();
  }, []);

  const fetchCommodityData = async () => {
    try {
      const response = await fetch('/api/commodities/market-data');
      if (response.ok) {
        const data = await response.json();
        setCommodityData(data);
      }
    } catch (error) {
      console.error('Error fetching commodity data:', error);
      setCommodityData([]);
    }
  };

  const fetchCommodityMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/commodities/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching commodity metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toString();
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? '#4caf50' : '#f44336';
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'energy': return '#ff9800';
      case 'metals': return '#9c27b0';
      case 'agriculture': return '#4caf50';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div>
        <Typography variant="h6" gutterBottom>
          Loading Commodities Data...
        </Typography>
        <LinearProgress />
      </div>
    );
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        Commodities Market
      </Typography>

      {/* Market Metrics */}
      <div className="metric-cards-container">
        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Daily Volume
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.totalVolume ? formatVolume(metrics.totalVolume) : 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Energy Index
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.energyIndex?.toFixed(2) || 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Metals Index
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.metalsIndex?.toFixed(2) || 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Agriculture Index
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.agricultureIndex?.toFixed(2) || 'No data'}
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Commodities Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="commodities table">
            <TableHead>
              <TableRow>
                <TableCell>Commodity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">24h Change</TableCell>
                <TableCell align="right">Volume (24h)</TableCell>
                <TableCell align="right">Open Interest</TableCell>
                <TableCell align="center">Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {commodityData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <Typography variant="body1" color="textSecondary">
                        No commodities data available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Please check your API connection or try again later
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                commodityData.map((commodity) => (
                  <TableRow key={commodity.symbol} hover>
                    <TableCell component="th" scope="row">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {commodity.symbol}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {commodity.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatPrice(commodity.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {commodity.changePercent24h >= 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: '#f44336', mr: 0.5 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{ color: getPriceChangeColor(commodity.changePercent24h) }}
                        >
                          {commodity.changePercent24h?.toFixed(2)}%
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: getPriceChangeColor(commodity.change24h) }}
                      >
                        {formatPrice(Math.abs(commodity.change24h))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatVolume(commodity.volume24h)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {commodity.openInterest ? (
                        <Typography variant="body2">
                          {formatVolume(commodity.openInterest)}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: getCategoryColor(commodity.category),
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                        }}
                      >
                        {commodity.category}
                      </Box>
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
