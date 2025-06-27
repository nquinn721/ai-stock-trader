import {
  Download,
  FilterList,
  Info,
  Refresh,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

interface TradeRecord {
  id: string;
  timestamp: Date;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  totalValue: number;
  profitLoss: number;
  strategy: string;
  status: "executed" | "pending" | "cancelled" | "failed";
  ruleId: string;
  ruleName: string;
}

export const AutoTradeHistory: React.FC = () => {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [filteredTrades, setFilteredTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [symbolFilter, setSymbolFilter] = useState("");
  const [strategyFilter, setStrategyFilter] = useState("all");

  useEffect(() => {
    // Simulate loading trade history
    const timer = setTimeout(() => {
      const mockTrades: TradeRecord[] = [
        {
          id: "trade-001",
          timestamp: new Date("2024-01-07T10:30:00"),
          symbol: "AAPL",
          side: "buy",
          quantity: 50,
          price: 185.5,
          totalValue: 9275.0,
          profitLoss: 125.5,
          strategy: "RSI Oversold",
          status: "executed",
          ruleId: "rule-001",
          ruleName: "RSI Oversold Strategy",
        },
        {
          id: "trade-002",
          timestamp: new Date("2024-01-07T11:15:00"),
          symbol: "TSLA",
          side: "sell",
          quantity: 25,
          price: 245.75,
          totalValue: 6143.75,
          profitLoss: -89.25,
          strategy: "Momentum Breakout",
          status: "executed",
          ruleId: "rule-002",
          ruleName: "Momentum Breakout",
        },
        {
          id: "trade-003",
          timestamp: new Date("2024-01-07T14:20:00"),
          symbol: "MSFT",
          side: "buy",
          quantity: 30,
          price: 375.2,
          totalValue: 11256.0,
          profitLoss: 245.8,
          strategy: "Mean Reversion",
          status: "executed",
          ruleId: "rule-003",
          ruleName: "MSFT Mean Reversion",
        },
        {
          id: "trade-004",
          timestamp: new Date("2024-01-07T15:45:00"),
          symbol: "GOOGL",
          side: "buy",
          quantity: 15,
          price: 142.3,
          totalValue: 2134.5,
          profitLoss: 0,
          strategy: "Trend Following",
          status: "pending",
          ruleId: "rule-004",
          ruleName: "GOOGL Trend Strategy",
        },
        {
          id: "trade-005",
          timestamp: new Date("2024-01-06T16:30:00"),
          symbol: "NVDA",
          side: "sell",
          quantity: 20,
          price: 520.45,
          totalValue: 10409.0,
          profitLoss: 340.6,
          strategy: "Breakout",
          status: "executed",
          ruleId: "rule-005",
          ruleName: "NVDA Breakout Strategy",
        },
        {
          id: "trade-006",
          timestamp: new Date("2024-01-06T09:15:00"),
          symbol: "AMD",
          side: "buy",
          quantity: 40,
          price: 145.8,
          totalValue: 5832.0,
          profitLoss: -45.2,
          strategy: "RSI Oversold",
          status: "executed",
          ruleId: "rule-001",
          ruleName: "RSI Oversold Strategy",
        },
        {
          id: "trade-007",
          timestamp: new Date("2024-01-05T13:45:00"),
          symbol: "META",
          side: "sell",
          quantity: 18,
          price: 355.9,
          totalValue: 6406.2,
          profitLoss: 156.3,
          strategy: "Momentum",
          status: "failed",
          ruleId: "rule-006",
          ruleName: "META Momentum Strategy",
        },
      ];
      setTrades(mockTrades);
      setFilteredTrades(mockTrades);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let filtered = trades;

    if (statusFilter !== "all") {
      filtered = filtered.filter((trade) => trade.status === statusFilter);
    }

    if (symbolFilter) {
      filtered = filtered.filter((trade) =>
        trade.symbol.toLowerCase().includes(symbolFilter.toLowerCase())
      );
    }

    if (strategyFilter !== "all") {
      filtered = filtered.filter((trade) => trade.strategy === strategyFilter);
    }

    setFilteredTrades(filtered);
    setPage(0);
  }, [trades, statusFilter, symbolFilter, strategyFilter]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log("Exporting trade history...");
  };

  const getStatusChip = (status: string) => {
    const statusConfig = {
      executed: { color: "success" as const, label: "Executed" },
      pending: { color: "warning" as const, label: "Pending" },
      cancelled: { color: "default" as const, label: "Cancelled" },
      failed: { color: "error" as const, label: "Failed" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] ||
      statusConfig.executed;
    return <Chip size="small" color={config.color} label={config.label} />;
  };

  const getSideChip = (side: string) => {
    return (
      <Chip
        size="small"
        icon={side === "buy" ? <TrendingUp /> : <TrendingDown />}
        label={side.toUpperCase()}
        color={side === "buy" ? "success" : "error"}
        variant="outlined"
      />
    );
  };

  const totalProfitLoss = filteredTrades.reduce(
    (sum, trade) => sum + trade.profitLoss,
    0
  );
  const totalVolume = filteredTrades.reduce(
    (sum, trade) => sum + trade.totalValue,
    0
  );
  const executedTrades = filteredTrades.filter(
    (trade) => trade.status === "executed"
  ).length;

  if (loading) {
    return (
      <Box>
        <Typography variant="h6">Loading Trade History...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6">Automated Trade History</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export to CSV">
                <IconButton onClick={handleExport}>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Summary Stats */}
          <Box sx={{ display: "flex", gap: 3, mb: 3, flexWrap: "wrap" }}>
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                color={totalProfitLoss >= 0 ? "success.main" : "error.main"}
              >
                ${totalProfitLoss.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total P&L
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5">{executedTrades}</Typography>
              <Typography variant="body2" color="textSecondary">
                Executed Trades
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="h5">${totalVolume.toFixed(2)}</Typography>
              <Typography variant="body2" color="textSecondary">
                Total Volume
              </Typography>
            </Box>
          </Box>

          {/* Filters */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mb: 3,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <FilterList />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="executed">Executed</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Symbol"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value)}
              placeholder="AAPL, TSLA..."
              sx={{ minWidth: 120 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Strategy</InputLabel>
              <Select
                value={strategyFilter}
                label="Strategy"
                onChange={(e) => setStrategyFilter(e.target.value)}
              >
                <MenuItem value="all">All Strategies</MenuItem>
                <MenuItem value="RSI Oversold">RSI Oversold</MenuItem>
                <MenuItem value="Momentum Breakout">Momentum Breakout</MenuItem>
                <MenuItem value="Mean Reversion">Mean Reversion</MenuItem>
                <MenuItem value="Trend Following">Trend Following</MenuItem>
                <MenuItem value="Breakout">Breakout</MenuItem>
                <MenuItem value="Momentum">Momentum</MenuItem>
              </Select>
            </FormControl>

            {(statusFilter !== "all" ||
              symbolFilter ||
              strategyFilter !== "all") && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setStatusFilter("all");
                  setSymbolFilter("");
                  setStrategyFilter("all");
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>

          {/* Trade Table */}
          <TableContainer className="history-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                  <TableCell align="right">P&L</TableCell>
                  <TableCell>Strategy</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTrades
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((trade) => (
                    <TableRow key={trade.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {trade.timestamp.toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {trade.timestamp.toLocaleTimeString()}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight="600">
                          {trade.symbol}
                        </Typography>
                      </TableCell>

                      <TableCell>{getSideChip(trade.side)}</TableCell>

                      <TableCell align="right">{trade.quantity}</TableCell>

                      <TableCell align="right">
                        ${trade.price.toFixed(2)}
                      </TableCell>

                      <TableCell align="right">
                        ${trade.totalValue.toFixed(2)}
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          className={
                            trade.profitLoss >= 0 ? "profit-cell" : "loss-cell"
                          }
                          fontWeight="600"
                        >
                          {trade.profitLoss >= 0 ? "+" : ""}$
                          {trade.profitLoss.toFixed(2)}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {trade.strategy}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {trade.ruleName}
                        </Typography>
                      </TableCell>

                      <TableCell>{getStatusChip(trade.status)}</TableCell>

                      <TableCell align="center">
                        <Tooltip title="Trade Details">
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTrades.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default AutoTradeHistory;
