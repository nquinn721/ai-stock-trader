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
  Chip,
  Link,
} from '@mui/material';
import { TrendingUp, TrendingDown, Info, Warning } from '@mui/icons-material';

interface AlternativeDataPoint {
  id: string;
  source: string;
  type: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  sentiment: number; // -1 to 1
  timestamp: Date;
  relatedAssets: string[];
  reliability: number; // 0 to 1
}

interface SocialSentiment {
  platform: string;
  sentiment: number;
  volume: number;
  trendingTopics: string[];
}

interface EconomicIndicator {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  impact: 'high' | 'medium' | 'low';
  releaseDate: Date;
}

export const AlternativeDataFeed: React.FC = () => {
  const [alternativeData, setAlternativeData] = useState<AlternativeDataPoint[]>([]);
  const [socialSentiment, setSocialSentiment] = useState<SocialSentiment[]>([]);
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlternativeData();
    fetchSocialSentiment();
    fetchEconomicIndicators();
  }, []);

  const fetchAlternativeData = async () => {
    try {
      const response = await fetch('/api/alternative-data/feed');
      if (response.ok) {
        const data = await response.json();
        setAlternativeData(data);
      }
    } catch (error) {
      console.error('Error fetching alternative data:', error);
      setAlternativeData([]);
    }
  };

  const fetchSocialSentiment = async () => {
    try {
      const response = await fetch('/api/alternative-data/social-sentiment');
      if (response.ok) {
        const data = await response.json();
        setSocialSentiment(data);
      }
    } catch (error) {
      console.error('Error fetching social sentiment:', error);
      setSocialSentiment([]);
    }
  };

  const fetchEconomicIndicators = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/alternative-data/economic-indicators');
      if (response.ok) {
        const data = await response.json();
        setEconomicIndicators(data);
      }
    } catch (error) {
      console.error('Error fetching economic indicators:', error);
      setEconomicIndicators([]);
    } finally {
      setLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#4caf50';
    if (sentiment < -0.3) return '#f44336';
    return '#ff9800';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <TrendingUp />;
    if (sentiment < -0.3) return <TrendingDown />;
    return <Warning />;
  };

  const formatSentiment = (sentiment: number) => {
    if (sentiment > 0.6) return 'Very Positive';
    if (sentiment > 0.3) return 'Positive';
    if (sentiment > -0.3) return 'Neutral';
    if (sentiment > -0.6) return 'Negative';
    return 'Very Negative';
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div>
        <Typography variant="h6" gutterBottom>
          Loading Alternative Data...
        </Typography>
        <LinearProgress />
      </div>
    );
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
        Alternative Data Intelligence
      </Typography>

      {/* Social Sentiment Cards */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Social Media Sentiment
      </Typography>
      <div className="metric-cards-container">
        {socialSentiment.length === 0 ? (
          <Card className="metric-card">
            <CardContent>
              <Typography color="textSecondary" align="center">
                No social sentiment data available
              </Typography>
            </CardContent>
          </Card>
        ) : (
          socialSentiment.map((sentiment, index) => (
            <Card key={index} className="metric-card">
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="h6" component="div">
                    {sentiment.platform}
                  </Typography>
                  {getSentimentIcon(sentiment.sentiment)}
                </Box>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  sx={{ color: getSentimentColor(sentiment.sentiment) }}
                >
                  {formatSentiment(sentiment.sentiment)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Volume: {sentiment.volume.toLocaleString()} mentions
                </Typography>
                <Box mt={1}>
                  {sentiment.trendingTopics.slice(0, 3).map((topic, topicIndex) => (
                    <Chip
                      key={topicIndex}
                      label={topic}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Economic Indicators */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Economic Indicators
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden', mb: 3 }}>
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader aria-label="economic indicators table">
            <TableHead>
              <TableRow>
                <TableCell>Indicator</TableCell>
                <TableCell align="right">Current Value</TableCell>
                <TableCell align="right">Previous</TableCell>
                <TableCell align="right">Change</TableCell>
                <TableCell align="center">Impact</TableCell>
                <TableCell align="right">Release Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {economicIndicators.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={2}>
                      <Typography color="textSecondary">
                        No economic indicators available
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                economicIndicators.map((indicator, index) => (
                  <TableRow key={index} hover>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1" fontWeight="bold">
                        {indicator.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1">
                        {indicator.value.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="textSecondary">
                        {indicator.previousValue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" alignItems="center" justifyContent="flex-end">
                        {indicator.change >= 0 ? (
                          <TrendingUp sx={{ color: '#4caf50', mr: 0.5 }} />
                        ) : (
                          <TrendingDown sx={{ color: '#f44336', mr: 0.5 }} />
                        )}
                        <Typography
                          variant="body2"
                          sx={{ color: indicator.change >= 0 ? '#4caf50' : '#f44336' }}
                        >
                          {indicator.change > 0 ? '+' : ''}{indicator.change.toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={indicator.impact}
                        size="small"
                        sx={{
                          backgroundColor: getImpactColor(indicator.impact),
                          color: 'white',
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {new Date(indicator.releaseDate).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Alternative Data Feed */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
        Alternative Data Feed
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 500 }}>
          <Table stickyHeader aria-label="alternative data table">
            <TableHead>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell>Data Point</TableCell>
                <TableCell align="center">Impact</TableCell>
                <TableCell align="center">Sentiment</TableCell>
                <TableCell align="center">Reliability</TableCell>
                <TableCell>Related Assets</TableCell>
                <TableCell align="right">Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alternativeData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={4}>
                      <Info sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
                      <Typography variant="body1" color="textSecondary">
                        No alternative data available
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Alternative data sources include satellite imagery, social sentiment, 
                        and other non-traditional market data
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                alternativeData.map((dataPoint) => (
                  <TableRow key={dataPoint.id} hover>
                    <TableCell component="th" scope="row">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {dataPoint.source}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {dataPoint.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {dataPoint.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {dataPoint.description.length > 100 
                            ? `${dataPoint.description.substring(0, 100)}...`
                            : dataPoint.description
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={dataPoint.impact}
                        size="small"
                        sx={{
                          backgroundColor: getImpactColor(dataPoint.impact),
                          color: 'white',
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box display="flex" alignItems="center" justifyContent="center">
                        {getSentimentIcon(dataPoint.sentiment)}
                        <Typography
                          variant="body2"
                          sx={{ 
                            ml: 0.5,
                            color: getSentimentColor(dataPoint.sentiment) 
                          }}
                        >
                          {formatSentiment(dataPoint.sentiment)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {formatPercentage(dataPoint.reliability)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {dataPoint.relatedAssets.slice(0, 3).map((asset, assetIndex) => (
                          <Chip
                            key={assetIndex}
                            label={asset}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {dataPoint.relatedAssets.length > 3 && (
                          <Chip
                            label={`+${dataPoint.relatedAssets.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ color: '#666' }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {new Date(dataPoint.timestamp).toLocaleString()}
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
};
