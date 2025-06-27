import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import { PsychologyAlt, TrendingUp, Warning, Psychology } from '@mui/icons-material';
import axios from 'axios';

interface CognitiveBias {
  score: number;
  confidence: number;
  description: string;
}

interface CognitiveBiasAnalysis {
  symbol: string;
  timestamp: string;
  biases: {
    anchoring: CognitiveBias & { priceAnchor: number };
    confirmation: CognitiveBias & { confirmatorySignals: number };
    recency: CognitiveBias & { recentEventsWeight: number };
    availability: CognitiveBias & { recentNewsImpact: number };
    overconfidence: CognitiveBias & { volatilityUnderestimation: number };
  };
  overallBiasScore: number;
  recommendedAction: 'exploit' | 'neutral' | 'avoid';
}

interface EmotionalState {
  dominantEmotion: string;
  intensity: number;
  confidence: number;
  secondaryEmotions: string[];
  marketImpact: {
    expectedVolatility: number;
    expectedDirection: 'bullish' | 'bearish' | 'neutral';
    timeframe: string;
  };
}

interface BubbleRisk {
  riskLevel: number;
  phase: string;
  confidence: number;
  timeToCorrection: number;
  correctionMagnitude: number;
  historicalComparisons: any[];
}

interface BehavioralDashboardData {
  symbol: string;
  timestamp: string;
  cognitiveBiases: CognitiveBiasAnalysis;
  emotionalState: EmotionalState;
  bubbleRisk: BubbleRisk;
}

interface BehavioralAnalyticsDashboardProps {
  symbol: string;
}

export const BehavioralAnalyticsDashboard: React.FC<BehavioralAnalyticsDashboardProps> = ({
  symbol,
}) => {
  const [data, setData] = useState<BehavioralDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBehavioralData();
    const interval = setInterval(fetchBehavioralData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchBehavioralData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/behavioral-finance/behavioral-dashboard/${symbol}`
      );
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching behavioral data:', err);
      setError('Failed to load behavioral analytics data');
    } finally {
      setLoading(false);
    }
  };

  const getBiasColor = (score: number): string => {
    if (score > 0.7) return 'error';
    if (score > 0.4) return 'warning';
    return 'success';
  };

  const getEmotionColor = (emotion: string): string => {
    const emotionColors: Record<string, string> = {
      fear: '#ef4444',
      greed: '#f59e0b',
      euphoria: '#8b5cf6',
      panic: '#dc2626',
      optimism: '#22c55e',
      pessimism: '#6b7280',
      neutral: '#64748b',
    };
    return emotionColors[emotion.toLowerCase()] || '#64748b';
  };

  const getRiskLevel = (risk: number): string => {
    if (risk > 0.8) return 'EXTREME';
    if (risk > 0.6) return 'HIGH';
    if (risk > 0.4) return 'MODERATE';
    if (risk > 0.2) return 'LOW';
    return 'MINIMAL';
  };

  const getRiskColor = (risk: number): 'error' | 'warning' | 'info' | 'success' => {
    if (risk > 0.8) return 'error';
    if (risk > 0.6) return 'warning';
    if (risk > 0.4) return 'info';
    return 'success';
  };

  if (loading) {
    return (
      <Box className="flex items-center justify-center p-8">
        <CircularProgress size={60} />
        <Typography variant="h6" className="ml-4">
          Loading Behavioral Analytics...
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

  if (!data) {
    return (
      <Alert severity="info" className="m-4">
        No behavioral data available for {symbol}
      </Alert>
    );
  }

  return (
    <Box className="p-6 bg-gradient-card">
      {/* Header */}
      <Box className="flex items-center justify-between mb-6">
        <Box className="flex items-center gap-3">
          <Psychology color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" className="text-gradient-primary font-bold">
              Behavioral Analytics
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {symbol} • Updated {new Date(data.timestamp).toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={data.cognitiveBiases.recommendedAction.toUpperCase()}
          color={data.cognitiveBiases.recommendedAction === 'exploit' ? 'success' : 
                 data.cognitiveBiases.recommendedAction === 'avoid' ? 'error' : 'default'}
          variant="filled"
          size="medium"
        />
      </Box>

      <div className="grid grid-auto-fit gap-6">
        {/* Cognitive Biases Card */}
        <Card className="bg-card hover-lift">
          <CardHeader
            avatar={<PsychologyAlt color="secondary" />}
            title="Cognitive Biases"
            subheader={`Overall Score: ${(data.cognitiveBiases.overallBiasScore * 100).toFixed(1)}%`}
          />
          <CardContent>
            <Box className="space-y-4">
              {Object.entries(data.cognitiveBiases.biases).map(([biasName, bias]) => (
                <Box key={biasName}>
                  <Box className="flex justify-between items-center mb-2">
                    <Typography variant="body2" className="capitalize font-medium">
                      {biasName}
                    </Typography>
                    <Chip
                      label={`${(bias.score * 100).toFixed(0)}%`}
                      size="small"
                      color={getBiasColor(bias.score) as any}
                      variant="outlined"
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={bias.score * 100}
                    color={getBiasColor(bias.score) as any}
                    className="mb-1"
                  />
                  <Typography variant="caption" color="textSecondary">
                    {bias.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Emotional State Card */}
        <Card className="bg-card hover-lift">
          <CardHeader
            avatar={<TrendingUp color="primary" />}
            title="Market Emotional State"
            subheader={`Intensity: ${(data.emotionalState.intensity * 100).toFixed(1)}%`}
          />
          <CardContent>
            <Box className="text-center mb-4">
              <Typography 
                variant="h3" 
                className="font-bold mb-2"
                style={{ color: getEmotionColor(data.emotionalState.dominantEmotion) }}
              >
                {data.emotionalState.dominantEmotion.toUpperCase()}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.emotionalState.intensity * 100}
                sx={{ height: 8, borderRadius: 4 }}
                className="mb-3"
              />
            </Box>

            <Divider className="my-3" />

            <Box>
              <Typography variant="subtitle2" className="mb-2">
                Secondary Emotions:
              </Typography>
              <Box className="flex flex-wrap gap-1 mb-3">
                {data.emotionalState.secondaryEmotions.map((emotion, index) => (
                  <Chip
                    key={index}
                    label={emotion}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
              </Box>

              <Typography variant="subtitle2" className="mb-2">
                Market Impact:
              </Typography>
              <Box className="grid grid-2 gap-2 text-sm">
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Direction:
                  </Typography>
                  <Chip
                    label={data.emotionalState.marketImpact.expectedDirection}
                    size="small"
                    color={
                      data.emotionalState.marketImpact.expectedDirection === 'bullish'
                        ? 'success'
                        : data.emotionalState.marketImpact.expectedDirection === 'bearish'
                        ? 'error'
                        : 'default'
                    }
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Volatility:
                  </Typography>
                  <Typography variant="body2" className="font-medium">
                    {(data.emotionalState.marketImpact.expectedVolatility * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Bubble Risk Card */}
        <Card className="bg-card hover-lift">
          <CardHeader
            avatar={<Warning color="warning" />}
            title="Bubble Risk Assessment"
            subheader={`Phase: ${data.bubbleRisk.phase}`}
          />
          <CardContent>
            <Box className="text-center mb-4">
              <Typography variant="h2" className="font-bold mb-2">
                {getRiskLevel(data.bubbleRisk.riskLevel)}
              </Typography>
              <Chip
                label={`${(data.bubbleRisk.riskLevel * 100).toFixed(1)}% Risk`}
                color={getRiskColor(data.bubbleRisk.riskLevel)}
                size="medium"
                variant="filled"
              />
            </Box>

            <Box className="grid grid-2 gap-4 mt-4">
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Time to Correction:
                </Typography>
                <Typography variant="h6" className="font-semibold">
                  {data.bubbleRisk.timeToCorrection} days
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Expected Correction:
                </Typography>
                <Typography variant="h6" className="font-semibold text-error">
                  -{(data.bubbleRisk.correctionMagnitude * 100).toFixed(1)}%
                </Typography>
              </Box>
            </Box>

            <Box className="mt-4">
              <Typography variant="body2" color="textSecondary" className="mb-2">
                Confidence Level:
              </Typography>
              <LinearProgress
                variant="determinate"
                value={data.bubbleRisk.confidence * 100}
                color="info"
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
};

export default BehavioralAnalyticsDashboard;
