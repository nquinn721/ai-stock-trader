import {
  CheckCircle,
  Info,
  Psychology,
  Send,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useState } from "react";
import { FRONTEND_API_CONFIG } from "../../config/api.config";

interface BehavioralSignalResponse {
  symbol: string;
  timestamp: string;
  signal: {
    action: "BUY" | "SELL" | "HOLD";
    confidence: number;
    reasoning: string[];
    risk: "LOW" | "MEDIUM" | "HIGH";
    factors: {
      bullish: number;
      bearish: number;
      net: number;
    };
  };
  confidence: number;
  reasoning: string[];
  riskAssessment: string;
}

export const BehavioralTradingInterface: React.FC = () => {
  const [symbol, setSymbol] = useState("AAPL");
  const [riskTolerance, setRiskTolerance] = useState(0.5);
  const [timeframe, setTimeframe] = useState("1d");
  const [includeEmotional, setIncludeEmotional] = useState(true);
  const [signal, setSignal] = useState<BehavioralSignalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSignal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/behavioral-finance/behavioral-trading-signal`,
        {
          symbol,
          riskTolerance,
          timeframe,
          includeEmotional,
        }
      );

      setSignal(response.data);
    } catch (err) {
      console.error("Error generating behavioral signal:", err);
      setError("Failed to generate behavioral trading signal");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string): "success" | "error" | "default" => {
    if (action === "BUY") return "success";
    if (action === "SELL") return "error";
    return "default";
  };

  const getActionIcon = (action: string) => {
    if (action === "BUY") return <TrendingUp color="success" />;
    if (action === "SELL") return <TrendingDown color="error" />;
    return <Info color="disabled" />;
  };

  const getRiskColor = (risk: string): "success" | "warning" | "error" => {
    if (risk === "LOW") return "success";
    if (risk === "MEDIUM") return "warning";
    return "error";
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "#22c55e"; // High confidence - Green
    if (confidence >= 0.6) return "#f59e0b"; // Medium confidence - Orange
    return "#ef4444"; // Low confidence - Red
  };

  const getRiskToleranceLabel = (value: number): string => {
    if (value <= 0.3) return "Conservative";
    if (value <= 0.7) return "Moderate";
    return "Aggressive";
  };

  return (
    <Box className="p-6 bg-gradient-card">
      {/* Header */}
      <Box className="flex items-center gap-3 mb-6">
        <Psychology color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4" className="text-gradient-primary font-bold">
            Behavioral Trading Interface
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            AI-powered trading signals based on market psychology and behavioral
            finance
          </Typography>
        </Box>
      </Box>

      <div className="grid grid-auto-fit gap-6">
        {/* Input Parameters Card */}
        <Card className="bg-card">
          <CardHeader
            title="Signal Parameters"
            subheader="Configure your behavioral trading signal"
          />
          <CardContent>
            <Box className="space-y-4">
              {/* Symbol Input */}
              <TextField
                label="Symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                fullWidth
                helperText="Enter the stock symbol (e.g., AAPL, TSLA)"
              />

              {/* Timeframe Selection */}
              <FormControl fullWidth>
                <InputLabel>Timeframe</InputLabel>
                <Select
                  value={timeframe}
                  label="Timeframe"
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <MenuItem value="1h">1 Hour</MenuItem>
                  <MenuItem value="4h">4 Hours</MenuItem>
                  <MenuItem value="1d">1 Day</MenuItem>
                  <MenuItem value="1w">1 Week</MenuItem>
                  <MenuItem value="1m">1 Month</MenuItem>
                </Select>
              </FormControl>

              {/* Risk Tolerance Slider */}
              <Box>
                <Typography variant="body2" className="mb-2 font-medium">
                  Risk Tolerance: {getRiskToleranceLabel(riskTolerance)}
                </Typography>
                <Slider
                  value={riskTolerance}
                  onChange={(_, value) => setRiskTolerance(value as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  marks={[
                    { value: 0, label: "Conservative" },
                    { value: 0.5, label: "Moderate" },
                    { value: 1, label: "Aggressive" },
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
                />
              </Box>

              {/* Include Emotional Analysis */}
              <FormControlLabel
                control={
                  <Switch
                    checked={includeEmotional}
                    onChange={(e) => setIncludeEmotional(e.target.checked)}
                    color="primary"
                  />
                }
                label="Include Emotional State Analysis"
              />

              {/* Generate Signal Button */}
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleGenerateSignal}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                className="mt-4"
              >
                {loading
                  ? "Generating Signal..."
                  : "Generate Behavioral Signal"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Signal Results Card */}
        <Card className="bg-card">
          <CardHeader
            title="Trading Signal"
            subheader="AI-generated recommendation based on behavioral analysis"
          />
          <CardContent>
            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            {!signal && !loading && (
              <Alert severity="info">
                Configure parameters and click "Generate Signal" to get
                behavioral trading insights
              </Alert>
            )}

            {signal && (
              <Box className="space-y-4">
                {/* Main Signal */}
                <Box className="text-center">
                  <Box className="flex items-center justify-center gap-2 mb-2">
                    {getActionIcon(signal.signal.action)}
                    <Typography variant="h3" className="font-bold">
                      {signal.signal.action}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${signal.symbol} • ${signal.signal.action}`}
                    color={getActionColor(signal.signal.action)}
                    variant="filled"
                    size="medium"
                    className="mb-2"
                  />
                  <Typography variant="body2" color="textSecondary">
                    Generated: {new Date(signal.timestamp).toLocaleString()}
                  </Typography>
                </Box>

                <Divider />

                {/* Confidence & Risk */}
                <div className="grid grid-2 gap-4">
                  <Box>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="mb-1"
                    >
                      Confidence Level
                    </Typography>
                    <Box className="flex items-center gap-2">
                      <Typography
                        variant="h5"
                        className="font-bold"
                        style={{ color: getConfidenceColor(signal.confidence) }}
                      >
                        {(signal.confidence * 100).toFixed(1)}%
                      </Typography>
                      <Chip
                        label={
                          signal.confidence >= 0.8
                            ? "HIGH"
                            : signal.confidence >= 0.6
                              ? "MEDIUM"
                              : "LOW"
                        }
                        size="small"
                        color={
                          signal.confidence >= 0.8
                            ? "success"
                            : signal.confidence >= 0.6
                              ? "warning"
                              : "error"
                        }
                        variant="outlined"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      className="mb-1"
                    >
                      Risk Assessment
                    </Typography>
                    <Box className="flex items-center gap-2">
                      <Typography variant="h5" className="font-bold">
                        {signal.riskAssessment}
                      </Typography>
                      <Chip
                        label={signal.riskAssessment}
                        size="small"
                        color={getRiskColor(signal.riskAssessment)}
                        variant="filled"
                      />
                    </Box>
                  </Box>
                </div>

                <Divider />

                {/* Signal Factors */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    className="mb-2 font-semibold"
                  >
                    Behavioral Factors
                  </Typography>
                  <div className="grid grid-3 gap-2 text-center">
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Bullish
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold text-success"
                      >
                        {signal.signal.factors.bullish}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Bearish
                      </Typography>
                      <Typography variant="h6" className="font-bold text-error">
                        {signal.signal.factors.bearish}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Net Score
                      </Typography>
                      <Typography
                        variant="h6"
                        className="font-bold"
                        style={{
                          color:
                            signal.signal.factors.net > 0
                              ? "#22c55e"
                              : signal.signal.factors.net < 0
                                ? "#ef4444"
                                : "#64748b",
                        }}
                      >
                        {signal.signal.factors.net > 0 ? "+" : ""}
                        {signal.signal.factors.net}
                      </Typography>
                    </Box>
                  </div>
                </Box>

                <Divider />

                {/* Reasoning */}
                <Box>
                  <Typography
                    variant="subtitle2"
                    className="mb-2 font-semibold"
                  >
                    Signal Reasoning
                  </Typography>
                  <List dense>
                    {signal.reasoning.map((reason, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemIcon>
                          {signal.signal.action === "BUY" ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : signal.signal.action === "SELL" ? (
                            <Warning color="error" fontSize="small" />
                          ) : (
                            <Info color="info" fontSize="small" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2">{reason}</Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Trading Recommendation */}
                <Alert
                  severity={
                    signal.signal.action === "BUY"
                      ? "success"
                      : signal.signal.action === "SELL"
                        ? "warning"
                        : "info"
                  }
                  className="mt-4"
                >
                  <Typography variant="body2" className="font-medium">
                    Behavioral Analysis Recommendation: {signal.signal.action}{" "}
                    {signal.symbol}
                  </Typography>
                  <Typography variant="body2">
                    Confidence: {(signal.confidence * 100).toFixed(1)}% | Risk:{" "}
                    {signal.riskAssessment} | Timeframe: {timeframe}
                  </Typography>
                </Alert>
              </Box>
            )}
          </CardContent>
        </Card>
      </div>
    </Box>
  );
};

export default BehavioralTradingInterface;
