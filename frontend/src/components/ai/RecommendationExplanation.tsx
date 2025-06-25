import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Alert,
  Skeleton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  MonetizationOn as MonetizationOnIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface TradingRecommendation {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  positionSize?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeHorizon: '1D' | '1W' | '1M';
  timestamp: Date;
  metrics?: {
    marketPrediction?: {
      direction: 'BUY' | 'SELL' | 'HOLD';
      confidence: number;
      priceTarget?: number;
    };
    technicalSignals?: {
      strength: number;
      signals: Array<{
        type: string;
        value: number;
        weight: number;
      }>;
    };
    sentimentAnalysis?: {
      score: number;
      sources: string[];
      confidence: number;
    };
    riskAssessment?: {
      level: 'LOW' | 'MEDIUM' | 'HIGH';
      factors: string[];
      maxDrawdown: number;
      volatility: number;
    };
  };
}

interface RecommendationExplanationProps {
  recommendation: TradingRecommendation;
  onActionClick?: (action: 'buy' | 'sell' | 'hold' | 'analyze') => void;
}

const ConfidenceMeter = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const ActionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const MetricCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
}));

export const RecommendationExplanation: React.FC<RecommendationExplanationProps> = ({
  recommendation,
  onActionClick,
}) => {
  const [explanation, setExplanation] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExplanation();
  }, [recommendation]);

  const loadExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/explain-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: recommendation.symbol,
          action: recommendation.action,
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning,
          riskLevel: recommendation.riskLevel,
          timeHorizon: recommendation.timeHorizon,
          stopLoss: recommendation.stopLoss,
          takeProfit: recommendation.takeProfit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to load explanation');
      }

      const data = await response.json();
      setExplanation(data.explanation);
    } catch (err) {
      console.error('Error loading explanation:', err);
      setError('Unable to load AI explanation. Using fallback analysis.');
      setExplanation(generateFallbackExplanation());
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackExplanation = (): string => {
    const actionText = recommendation.action === 'BUY' ? 'buying' : 
                     recommendation.action === 'SELL' ? 'selling' : 'holding';
    const confidenceText = recommendation.confidence > 0.8 ? 'High' : 
                          recommendation.confidence > 0.6 ? 'Medium' : 'Low';

    return `Based on our technical analysis, we recommend ${actionText} ${recommendation.symbol} with ${confidenceText.toLowerCase()} confidence (${(recommendation.confidence * 100).toFixed(1)}%).

Key factors supporting this recommendation:
${recommendation.reasoning.map(reason => `• ${reason}`).join('\n')}

Risk Level: ${recommendation.riskLevel}
Time Horizon: ${recommendation.timeHorizon}

Please review the detailed metrics below for additional insights.`;
  };

  const getActionIcon = () => {
    switch (recommendation.action) {
      case 'BUY':
        return <TrendingUpIcon color="success" />;
      case 'SELL':
        return <TrendingDownIcon color="error" />;
      case 'HOLD':
        return <TrendingFlatIcon color="warning" />;
    }
  };

  const getActionColor = () => {
    switch (recommendation.action) {
      case 'BUY':
        return 'success';
      case 'SELL':
        return 'error';
      case 'HOLD':
        return 'warning';
    }
  };

  const getRiskColor = () => {
    switch (recommendation.riskLevel) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Header with Action and Confidence */}
        <ActionHeader>
          {getActionIcon()}
          <Typography variant="h5" fontWeight="bold">
            {recommendation.action} {recommendation.symbol}
          </Typography>
          <Chip
            label={recommendation.action}
            color={getActionColor() as any}
            variant="filled"
          />
          <Chip
            label={`${recommendation.riskLevel} Risk`}
            color={getRiskColor() as any}
            variant="outlined"
          />
        </ActionHeader>

        {/* Confidence Meter */}
        <ConfidenceMeter>
          <Typography variant="body2" sx={{ minWidth: 80 }}>
            Confidence:
          </Typography>
          <LinearProgress
            variant="determinate"
            value={recommendation.confidence * 100}
            sx={{ flex: 1, height: 8, borderRadius: 4 }}
            color={recommendation.confidence > 0.8 ? 'success' : 
                   recommendation.confidence > 0.6 ? 'warning' : 'error'}
          />
          <Typography variant="body2" fontWeight="bold">
            {formatPercentage(recommendation.confidence)}
          </Typography>
        </ConfidenceMeter>

        {/* AI Explanation */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <PsychologyIcon color="primary" />
            AI Explanation
          </Typography>
          {loading ? (
            <Box>
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={30} />
              <Skeleton variant="text" height={30} width="80%" />
            </Box>
          ) : error ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {explanation}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Detailed Metrics */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Detailed Analysis
          </Typography>

          {/* Market Prediction */}
          {recommendation.metrics?.marketPrediction && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimelineIcon color="primary" />
                  <Typography variant="subtitle1">Market Prediction</Typography>
                  <Chip
                    label={formatPercentage(recommendation.metrics.marketPrediction.confidence)}
                    size="small"
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Direction"
                      secondary={recommendation.metrics.marketPrediction.direction}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Confidence"
                      secondary={formatPercentage(recommendation.metrics.marketPrediction.confidence)}
                    />
                  </ListItem>
                  {recommendation.metrics.marketPrediction.priceTarget && (
                    <ListItem>
                      <ListItemText
                        primary="Price Target"
                        secondary={formatCurrency(recommendation.metrics.marketPrediction.priceTarget)}
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Technical Signals */}
          {recommendation.metrics?.technicalSignals && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon color="primary" />
                  <Typography variant="subtitle1">Technical Signals</Typography>
                  <Chip
                    label={`${recommendation.metrics.technicalSignals.strength.toFixed(1)}/10`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {recommendation.metrics.technicalSignals.signals.map((signal, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={signal.type}
                        secondary={`Value: ${signal.value.toFixed(2)} | Weight: ${signal.weight.toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Sentiment Analysis */}
          {recommendation.metrics?.sentimentAnalysis && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon color="primary" />
                  <Typography variant="subtitle1">Sentiment Analysis</Typography>
                  <Chip
                    label={recommendation.metrics.sentimentAnalysis.score > 0 ? 'Positive' : 
                           recommendation.metrics.sentimentAnalysis.score < 0 ? 'Negative' : 'Neutral'}
                    size="small"
                    color={recommendation.metrics.sentimentAnalysis.score > 0 ? 'success' : 
                           recommendation.metrics.sentimentAnalysis.score < 0 ? 'error' : 'default'}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Sentiment Score"
                      secondary={recommendation.metrics.sentimentAnalysis.score.toFixed(2)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Confidence"
                      secondary={formatPercentage(recommendation.metrics.sentimentAnalysis.confidence)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Sources"
                      secondary={recommendation.metrics.sentimentAnalysis.sources.join(', ')}
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Risk Assessment */}
          {recommendation.metrics?.riskAssessment && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon color="primary" />
                  <Typography variant="subtitle1">Risk Assessment</Typography>
                  <Chip
                    label={recommendation.metrics.riskAssessment.level}
                    size="small"
                    color={getRiskColor() as any}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary="Risk Level"
                      secondary={recommendation.metrics.riskAssessment.level}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Max Drawdown"
                      secondary={formatPercentage(recommendation.metrics.riskAssessment.maxDrawdown)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Volatility"
                      secondary={formatPercentage(recommendation.metrics.riskAssessment.volatility)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Risk Factors"
                      secondary={
                        <List dense sx={{ mt: 1 }}>
                          {recommendation.metrics.riskAssessment.factors.map((factor, index) => (
                            <ListItem key={index} sx={{ pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <WarningIcon fontSize="small" color="warning" />
                              </ListItemIcon>
                              <ListItemText primary={factor} />
                            </ListItem>
                          ))}
                        </List>
                      }
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          )}
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {recommendation.action === 'BUY' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<MonetizationOnIcon />}
              onClick={() => onActionClick?.('buy')}
            >
              Place Buy Order
            </Button>
          )}
          {recommendation.action === 'SELL' && (
            <Button
              variant="contained"
              color="error"
              startIcon={<MonetizationOnIcon />}
              onClick={() => onActionClick?.('sell')}
            >
              Place Sell Order
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={() => onActionClick?.('analyze')}
          >
            Detailed Analysis
          </Button>
        </Box>

        {/* Trading Parameters */}
        {(recommendation.stopLoss || recommendation.takeProfit || recommendation.positionSize) && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Suggested Trading Parameters:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {recommendation.positionSize && (
                <Typography variant="body2">
                  Position Size: {recommendation.positionSize} shares
                </Typography>
              )}
              {recommendation.stopLoss && (
                <Typography variant="body2">
                  Stop Loss: {formatCurrency(recommendation.stopLoss)}
                </Typography>
              )}
              {recommendation.takeProfit && (
                <Typography variant="body2">
                  Take Profit: {formatCurrency(recommendation.takeProfit)}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationExplanation;
