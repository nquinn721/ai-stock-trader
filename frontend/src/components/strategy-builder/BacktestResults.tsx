import {
  AccountBalance,
  ShowChart,
  Timeline,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";

interface BacktestResult {
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  totalReturnPercent: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortino: number;
  calmarRatio: number;
  volatility: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  maxWin: number;
  maxLoss: number;
  avgTradeDuration: number;
  trades: Trade[];
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
}

interface Trade {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  entryDate: string;
  exitDate: string;
  pnl: number;
  pnlPercent: number;
  duration: number;
  commission: number;
}

interface EquityPoint {
  date: string;
  equity: number;
  drawdown: number;
}

interface DrawdownPoint {
  date: string;
  drawdown: number;
}

interface BacktestResultsProps {
  results: BacktestResult;
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({
  results,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    return value >= 0 ? "success" : "error";
  };

  const getReturnIcon = (value: number) => {
    return value >= 0 ? <TrendingUp /> : <TrendingDown />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Backtest Results
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {results.startDate} to {results.endDate}
      </Typography>

      {/* Key Metrics Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr 1fr",
          },
          gap: 3,
          mb: 4,
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <AccountBalance color="primary" sx={{ mr: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Total Return
              </Typography>
            </Box>
            <Typography
              variant="h4"
              color={getReturnColor(results.totalReturn)}
            >
              {formatCurrency(results.totalReturn)}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              {getReturnIcon(results.totalReturn)}
              <Typography
                variant="body2"
                color={getReturnColor(results.totalReturn)}
                sx={{ ml: 0.5 }}
              >
                {formatPercent(results.totalReturnPercent)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <ShowChart color="primary" sx={{ mr: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Sharpe Ratio
              </Typography>
            </Box>
            <Typography variant="h4">
              {results.sharpeRatio.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Risk-adjusted return
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Timeline color="error" sx={{ mr: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Max Drawdown
              </Typography>
            </Box>
            <Typography variant="h4" color="error">
              {formatPercent(results.maxDrawdown)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Largest peak-to-trough decline
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <TrendingUp color="success" sx={{ mr: 1 }} />
              <Typography color="text.secondary" gutterBottom>
                Win Rate
              </Typography>
            </Box>
            <Typography variant="h4" color="success">
              {formatPercent(results.winRate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {results.winningTrades} of {results.totalTrades} trades
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Detailed Metrics Table */}
      <Paper sx={{ mb: 4 }}>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Performance Metrics
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell>
                    <strong>Initial Capital</strong>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(results.initialCapital)}
                  </TableCell>
                  <TableCell>
                    <strong>Final Capital</strong>
                  </TableCell>
                  <TableCell>{formatCurrency(results.finalCapital)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Total Trades</strong>
                  </TableCell>
                  <TableCell>{results.totalTrades}</TableCell>
                  <TableCell>
                    <strong>Winning Trades</strong>
                  </TableCell>
                  <TableCell>{results.winningTrades}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Losing Trades</strong>
                  </TableCell>
                  <TableCell>{results.losingTrades}</TableCell>
                  <TableCell>
                    <strong>Win Rate</strong>
                  </TableCell>
                  <TableCell>{formatPercent(results.winRate)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Profit Factor</strong>
                  </TableCell>
                  <TableCell>{results.profitFactor.toFixed(2)}</TableCell>
                  <TableCell>
                    <strong>Sortino Ratio</strong>
                  </TableCell>
                  <TableCell>{results.sortino.toFixed(2)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Calmar Ratio</strong>
                  </TableCell>
                  <TableCell>{results.calmarRatio.toFixed(2)}</TableCell>
                  <TableCell>
                    <strong>Volatility</strong>
                  </TableCell>
                  <TableCell>{formatPercent(results.volatility)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Average Win</strong>
                  </TableCell>
                  <TableCell>{formatCurrency(results.avgWin)}</TableCell>
                  <TableCell>
                    <strong>Average Loss</strong>
                  </TableCell>
                  <TableCell>{formatCurrency(results.avgLoss)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Max Win</strong>
                  </TableCell>
                  <TableCell>{formatCurrency(results.maxWin)}</TableCell>
                  <TableCell>
                    <strong>Max Loss</strong>
                  </TableCell>
                  <TableCell>{formatCurrency(results.maxLoss)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <strong>Avg Trade Duration</strong>
                  </TableCell>
                  <TableCell colSpan={3}>
                    {results.avgTradeDuration.toFixed(1)} days
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>

      {/* Recent Trades Table */}
      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Trades (Last 10)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Entry Price</TableCell>
                  <TableCell>Exit Price</TableCell>
                  <TableCell>P&L</TableCell>
                  <TableCell>P&L %</TableCell>
                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.trades.slice(-10).map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell>{trade.symbol}</TableCell>
                    <TableCell>
                      <Chip
                        label={trade.side.toUpperCase()}
                        color={trade.side === "buy" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell>{formatCurrency(trade.entryPrice)}</TableCell>
                    <TableCell>{formatCurrency(trade.exitPrice)}</TableCell>
                    <TableCell>
                      <Typography color={getReturnColor(trade.pnl)}>
                        {formatCurrency(trade.pnl)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography color={getReturnColor(trade.pnlPercent)}>
                        {formatPercent(trade.pnlPercent)}
                      </Typography>
                    </TableCell>
                    <TableCell>{trade.duration.toFixed(1)} days</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
};
