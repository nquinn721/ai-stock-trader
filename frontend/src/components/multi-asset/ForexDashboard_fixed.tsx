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
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { useStore } from "../../stores/StoreContext";

// Remove local interfaces - use the ones from MultiAssetStore

export const ForexDashboard: React.FC = observer(() => {
  const rootStore = useStore();
  const multiAssetStore = rootStore.multiAssetStore;

  useEffect(() => {
    multiAssetStore.fetchForexMarketData();
    multiAssetStore.fetchForexMetrics();
  }, [multiAssetStore]);

  const fetchForexData = async () => {
    // This method is no longer needed - data comes from store
  };

  const fetchForexMetrics = async () => {
    // This method is no longer needed - data comes from store
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

  // Use store data
  const forexData = multiAssetStore.forexPairs;
  const metrics = multiAssetStore.forexMetrics;

  if (multiAssetStore.isLoading) {
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
              Total Volume
            </Typography>
            <Typography variant="h6" component="div">
              {forexData.length > 0
                ? formatVolume(
                    forexData.reduce((sum, pair) => sum + pair.volume, 0)
                  )
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
              {forexData.length || "No data"}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Volatility Index
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.volatility?.toFixed(2) || "No data"}
            </Typography>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Liquidity Level
            </Typography>
            <Typography variant="h6" component="div">
              {metrics?.liquidity?.toFixed(2) || "No data"}
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
                <TableCell align="right">Change</TableCell>
                <TableCell align="right">Volume</TableCell>
                <TableCell align="right">Spread</TableCell>
                <TableCell align="right">Bid/Ask</TableCell>
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
                        {pair.changePercent >= 0 ? (
                          <TrendingUp sx={{ color: "#4caf50", mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: "#f44336", mr: 0.5 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{
                            color: getPriceChangeColor(pair.changePercent),
                          }}
                        >
                          {pair.changePercent?.toFixed(2)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatVolume(pair.volume)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {pair.spread?.toFixed(4) || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {formatCurrency(pair.bid)} / {formatCurrency(pair.ask)}
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
});
