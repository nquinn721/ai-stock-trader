import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  RemoveRedEye,
  ExpandMore,
  Assessment,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import axios from 'axios';

interface PsychologyInsight {
  symbol: string;
  fearGreed: {
    index: number;
    label: string;
    components: any;
    interpretation: string;
  };
  herding: {
    score: number;
    direction: 'bullish' | 'bearish' | 'neutral';
    strength: number;
    contrarian_signal: boolean;
  };
  stress: {
    overall: number;
    components: any;
    riskLevel: string;
    implications: string[];
  };
}

interface PsychologyInsightsData {
  timestamp: string;
  insights: PsychologyInsight[];
}

interface PsychologyInsightsPanelProps {
  symbols?: string[];
}

export const PsychologyInsightsPanel: React.FC<PsychologyInsightsPanelProps> = ({
  symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA'],
}) => {
  const [data, setData] = useState<PsychologyInsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPsychologyInsights();
    const interval = setInterval(fetchPsychologyInsights, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [symbols]);

  const fetchPsychologyInsights = async () => {
    try {
      setLoading(true);
      const symbolsParam = symbols.join(',');
      const response = await axios.get(
        `http://localhost:8000/behavioral-finance/psychology-insights?symbols=${symbolsParam}`
      );
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching psychology insights:', err);
      setError('Failed to load psychology insights');
    } finally {
      setLoading(false);
    }
  };

  const getFearGreedColor = (index: number): string => {
    if (index <= 20) return '#dc2626'; // Extreme Fear - Red
    if (index <= 40) return '#f59e0b'; // Fear - Orange
    if (index <= 60) return '#64748b'; // Neutral - Gray
    if (index <= 80) return '#22c55e'; // Greed - Green
    return '#8b5cf6'; // Extreme Greed - Purple
  };

  const getFearGreedLabel = (index: number): string => {
    if (index <= 20) return 'EXTREME FEAR';
    if (index <= 40) return 'FEAR';
    if (index <= 60) return 'NEUTRAL';
    if (index <= 80) return 'GREED';
    return 'EXTREME GREED';
  };

  const getHerdingColor = (direction: string): 'success' | 'error' | 'default' => {
    if (direction === 'bullish') return 'success';
    if (direction === 'bearish') return 'error';
    return 'default';
  };

  const getStressColor = (level: string): 'success' | 'warning' | 'error' => {
    if (level === 'LOW') return 'success';
    if (level === 'MODERATE') return 'warning';
    return 'error';
  };

  const getHerdingIcon = (direction: string) => {
    if (direction === 'bullish') return <TrendingUp color="success" />;
    if (direction === 'bearish') return <TrendingDown color="error" />;
    return <RemoveRedEye color="disabled" />;
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <CircularProgress size={60} />
        <Typography variant="h6" className="ml-4">
          Loading Psychology Insights...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" className="m-4">
        {error}
      </Alert>
    );
  }

  if (!data || !data.insights.length) {
    return (
      <Alert severity="info" className="m-4">
        No psychology insights available
      </Alert>
    );
  }

  return (
    <Box className="p-6 bg-gradient-card">
      {/* Header */}
      <Box className="flex items-center gap-3 mb-6">
        <Psychology color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h4" className="text-gradient-primary font-bold">
            Psychology Insights
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Market sentiment and behavioral analysis • Updated {new Date(data.timestamp).toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Overview Cards */}
      <div className="grid grid-auto-fit gap-4 mb-6">
        {data.insights.map((insight) => (
          <Card key={insight.symbol} className="bg-card hover-lift">
            <CardHeader
              title={insight.symbol}
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              subheader="Market Psychology Overview"
            />
            <CardContent>
              <Box className="space-y-4">
                {/* Fear & Greed Index */}
                <Box>
                  <Box className="flex justify-between items-center mb-2">
                    <Typography variant="body2" className="font-medium">
                      Fear & Greed Index
                    </Typography>
                    <Chip
                      label={getFearGreedLabel(insight.fearGreed.index)}
                      size="small"
                      sx={{
                        backgroundColor: getFearGreedColor(insight.fearGreed.index),
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    />
                  </Box>
                  <Box className="flex items-center gap-2">
                    <Typography variant="h4" className="font-bold">
                      {insight.fearGreed.index}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      / 100
                    </Typography>
                  </Box>
                </Box>

                <Divider />

                {/* Herding Behavior */}
                <Box>
                  <Box className="flex justify-between items-center mb-2">
                    <Typography variant="body2" className="font-medium">
                      Herding Behavior
                    </Typography>
                    <Box className="flex items-center gap-1">
                      {getHerdingIcon(insight.herding.direction)}
                      <Chip
                        label={insight.herding.direction.toUpperCase()}
                        size="small"
                        color={getHerdingColor(insight.herding.direction)}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Box className="flex justify-between">
                    <Typography variant="body2" color="textSecondary">
                      Strength: {(insight.herding.strength * 100).toFixed(0)}%
                    </Typography>
                    {insight.herding.contrarian_signal && (
                      <Chip
                        label="CONTRARIAN SIGNAL"
                        size="small"
                        color="warning"
                        variant="filled"
                      />
                    )}
                  </Box>
                </Box>

                <Divider />

                {/* Stress Level */}
                <Box>
                  <Box className="flex justify-between items-center mb-2">
                    <Typography variant="body2" className="font-medium">
                      Market Stress
                    </Typography>
                    <Chip
                      label={insight.stress.riskLevel}
                      size="small"
                      color={getStressColor(insight.stress.riskLevel)}
                      variant="filled"
                    />
                  </Box>
                  <Typography variant="h6" className="font-semibold">
                    {(insight.stress.overall * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analysis */}
      <Card className="bg-card">
        <CardHeader
          avatar={<Assessment color="primary" />}
          title="Detailed Psychology Analysis"
          subheader="Expand for in-depth behavioral insights"
        />
        <CardContent>
          {data.insights.map((insight) => (
            <Accordion key={`detailed-${insight.symbol}`} className="mb-2">
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" className="font-semibold">
                  {insight.symbol} - Comprehensive Analysis
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box className="space-y-4">
                  {/* Fear & Greed Details */}
                  <Box>
                    <Typography variant="subtitle1" className="font-semibold mb-2">
                      Fear & Greed Analysis
                    </Typography>
                    <Typography variant="body2" color="textSecondary" className="mb-3">
                      {insight.fearGreed.interpretation}
                    </Typography>
                    
                    <Typography variant="body2" className="font-medium mb-2">
                      Component Breakdown:
                    </Typography>
                    <Box className="grid grid-2 gap-2 text-sm">
                      <Box>Volatility: {insight.fearGreed.components?.volatility || 'N/A'}</Box>
                      <Box>Momentum: {insight.fearGreed.components?.momentum || 'N/A'}</Box>
                      <Box>Breadth: {insight.fearGreed.components?.breadth || 'N/A'}</Box>
                      <Box>Put/Call: {insight.fearGreed.components?.putCall || 'N/A'}</Box>
                    </Box>
                  </Box>

                  <Divider />

                  {/* Stress Analysis */}
                  <Box>
                    <Typography variant="subtitle1" className="font-semibold mb-2">
                      Market Stress Analysis
                    </Typography>
                    
                    {insight.stress.implications && insight.stress.implications.length > 0 && (
                      <List dense>
                        {insight.stress.implications.map((implication, index) => (
                          <ListItem key={index} disablePadding>
                            <ListItemIcon>
                              {insight.stress.riskLevel === 'HIGH' ? (
                                <Warning color="error" fontSize="small" />
                              ) : (
                                <CheckCircle color="success" fontSize="small" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2">
                                  {implication}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>

                  <Divider />

                  {/* Trading Recommendations */}
                  <Box>
                    <Typography variant="subtitle1" className="font-semibold mb-2">
                      Behavioral Trading Insights
                    </Typography>
                    
                    <Box className="grid grid-1 gap-2">
                      {insight.herding.contrarian_signal && (
                        <Alert severity="warning" className="text-sm">
                          <strong>Contrarian Opportunity:</strong> Current herding behavior suggests potential reversal
                        </Alert>
                      )}
                      
                      {insight.fearGreed.index <= 20 && (
                        <Alert severity="success" className="text-sm">
                          <strong>Buying Opportunity:</strong> Extreme fear often marks market bottoms
                        </Alert>
                      )}
                      
                      {insight.fearGreed.index >= 80 && (
                        <Alert severity="error" className="text-sm">
                          <strong>Caution Advised:</strong> Extreme greed often precedes market corrections
                        </Alert>
                      )}
                      
                      {insight.stress.overall > 0.7 && (
                        <Alert severity="warning" className="text-sm">
                          <strong>High Stress Alert:</strong> Elevated market stress indicates increased volatility
                        </Alert>
                      )}
                    </Box>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PsychologyInsightsPanel;
