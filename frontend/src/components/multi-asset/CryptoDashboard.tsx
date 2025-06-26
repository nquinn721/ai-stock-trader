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
  Chip,
  LinearProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';
import './CryptoDashboard.css';

interface CryptoData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  dominance?: number;
  fundingRate?: number;
}

interface CryptoMetrics {
  totalMarketCap: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  activeCoins: number;
}

export const CryptoDashboard: React.FC = () => {
  const [cryptoData, setCryptoData] = useState<CryptoData[]>([]);
  const [metrics, setMetrics] = useState<CryptoMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCryptoData();
    fetchCryptoMetrics();
  }, []);

  const fetchCryptoData = async () => {
    try {
      const response = await fetch('/api/crypto/market-data');
      if (response.ok) {
        const data = await response.json();
        setCryptoData(data);
      }
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      // Show empty state instead of mock data
      setCryptoData([]);
    }
  };

  const fetchCryptoMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crypto/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching crypto metrics:', error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? '#4caf50' : '#f44336';
  };

  const getFearGreedColor = (index: number) => {
    if (index >= 75) return '#4caf50'; // Extreme Greed
    if (index >= 55) return '#8bc34a'; // Greed
    if (index >= 45) return '#ffc107'; // Neutral
    if (index >= 25) return '#ff9800'; // Fear
    return '#f44336'; // Extreme Fear
  };

  const getFearGreedLabel = (index: number) => {
    if (index >= 75) return 'Extreme Greed';
    if (index >= 55) return 'Greed';
    if (index >= 45) return 'Neutral';
    if (index >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  if (loading) {
    return (
      <div className="crypto-dashboard">
        <Typography variant="h6" gutterBottom>
          Loading Cryptocurrency Data...
        </Typography>
        <LinearProgress />
      </div>
    );
  }

  return (
    <div className="crypto-dashboard">
      <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        Cryptocurrency Market
      </Typography>

      {/* Market Metrics */}
      <div className="metric-cards-container">
        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Market Cap
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.totalMarketCap ? formatCurrency(metrics.totalMarketCap) : 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              BTC Dominance
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.btcDominance ? `${metrics.btcDominance.toFixed(1)}%` : 'No data'}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Fear & Greed Index
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography
                variant="h6"
                component="div"
                sx={{ color: getFearGreedColor(metrics?.fearGreedIndex || 50) }}
              >
                {metrics?.fearGreedIndex || 'N/A'}
              </Typography>
              <Chip
                label={getFearGreedLabel(metrics?.fearGreedIndex || 50)}
                size="small"
                sx={{
                  ml: 1,
                  backgroundColor: getFearGreedColor(metrics?.fearGreedIndex || 50),
                  color: 'white',
                }}
              />
            </Box>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Coins
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.activeCoins?.toLocaleString() || 'No data'}
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Crypto Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="crypto table">
            <TableHead>
              <TableRow>
                <TableCell>Cryptocurrency</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">24h Change</TableCell>
                <TableCell align="right">Volume (24h)</TableCell>
                <TableCell align="right">Market Cap</TableCell>
                <TableCell align="right">Funding Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cryptoData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <Typography variant="body1" color="textSecondary">
                        No cryptocurrency data available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Please check your API connection or try again later
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                cryptoData.map((crypto) => (
                  <TableRow key={crypto.symbol} hover>
                    <TableCell component="th" scope="row">
                      <Box display="flex" alignItems="center">
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {crypto.symbol}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {crypto.name}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(crypto.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {crypto.changePercent24h >= 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: '#f44336', mr: 0.5 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{ color: getPriceChangeColor(crypto.changePercent24h) }}
                        >
                          {crypto.changePercent24h?.toFixed(2)}%
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ color: getPriceChangeColor(crypto.change24h) }}
                      >
                        {formatCurrency(Math.abs(crypto.change24h))}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(crypto.volume24h)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(crypto.marketCap)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {crypto.fundingRate ? (
                        <Typography
                          variant="body2"
                          sx={{ color: getPriceChangeColor(crypto.fundingRate) }}
                        >
                          {(crypto.fundingRate * 100).toFixed(4)}%
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          N/A
                        </Typography>
                      )}
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
