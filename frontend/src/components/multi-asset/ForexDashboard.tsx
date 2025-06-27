import { TrendingDown, TrendingUp } from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

interface ForexPair {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  spread: number;
  interestRateDiff?: number;
}

interface ForexMetrics {
  totalVolume: number;
  activePairs: number;
  volatilityIndex: number;
  majorPairsCount: number;
}

export const ForexDashboard: React.FC = () => {
  const [forexData, setForexData] = useState<ForexPair[]>([]);
  const [metrics, setMetrics] = useState<ForexMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForexData();
    fetchForexMetrics();
  }, []);

  const fetchForexData = async () => {
    try {
      const response = await fetch("/api/forex/market-data");
      if (response.ok) {
        const data = await response.json();
        setForexData(data);
      }
    } catch (error) {
      console.error("Error fetching forex data:", error);
      setForexData([]);
    }
  };

  const fetchForexMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/forex/metrics");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Error fetching forex metrics:", error);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(4);
  };

  const formatVolume = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const getPriceChangeColor = (change: number) => {
    return change >= 0 ? "#4caf50" : "#f44336";
  };

  if (loading) {
    return (
      <div>
        <Typography variant="h6" gutterBottom>
          Loading Forex Data...
        </Typography>
        <LinearProgress />
      </div>
    );
  }

  return (
    <div>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ color: "#2c3e50", fontWeight: "bold" }}
      >
        Forex Market
      </Typography>

      {/* Market Metrics */}
      <div className="metric-cards-container">
        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Daily Volume
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.totalVolume
                ? formatVolume(metrics.totalVolume)
                : "No data"}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Active Pairs
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.activePairs || "No data"}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Volatility Index
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.volatilityIndex?.toFixed(2) || "No data"}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Major Pairs
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.majorPairsCount || "No data"}
            </Typography>
          </CardContent>
        </Card>
      </div>

      {/* Forex Table */}
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="forex table">
            <TableHead>
              <TableRow>
                <TableCell>Currency Pair</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">24h Change</TableCell>
                <TableCell align="right">Volume (24h)</TableCell>
                <TableCell align="right">Spread</TableCell>
                <TableCell align="right">Interest Rate Diff</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {forexData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={4}>
                      <Typography variant="body1" color="textSecondary">
                        No forex data available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Please check your API connection or try again later
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                forexData.map((pair) => (
                  <TableRow key={pair.symbol} hover>
                    <TableCell component="th" scope="row">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {pair.symbol}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {pair.baseCurrency}/{pair.quoteCurrency}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(pair.price)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        {pair.changePercent24h >= 0 ? (
                          <TrendingUp sx={{ color: "#4caf50", mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: "#f44336", mr: 0.5 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: getPriceChangeColor(pair.changePercent24h),
                          }}
                        >
                          {pair.changePercent24h?.toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatVolume(pair.volume24h)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {pair.spread?.toFixed(4) || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {pair.interestRateDiff ? (
                        <Typography
                          variant="body2"
                          sx={{
                            color: getPriceChangeColor(pair.interestRateDiff),
                          }}
                        >
                          {pair.interestRateDiff.toFixed(2)}%
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
