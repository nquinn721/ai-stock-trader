import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Button,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { tradingAssistantService, TradingRecommendation } from '../services/tradingAssistantService';

interface RecommendationExplanationProps {
  recommendation: TradingRecommendation;
  onActionClick?: (action: string, symbol: string) => void;
}

const RecommendationExplanation: React.FC<RecommendationExplanationProps> = ({
  recommendation,
  onActionClick,
}) => {
  const theme = useTheme();
  const [explanation, setExplanation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (recommendation) {
      loadExplanation();
    }
  }, [recommendation]);

  const loadExplanation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const explanationText = await tradingAssistantService.explainRecommendation(recommendation);
      setExplanation(explanationText);
    } catch (err) {
      console.error('Failed to load explanation:', err);
      setError('Failed to load AI explanation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadExplanation();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'BUY':
        return <TrendingUpIcon color="success" />;
      case 'SELL':
        return <TrendingDownIcon color="error" />;
      case 'HOLD':
        return <TrendingFlatIcon color="warning" />;
      default:
        return <InfoIcon />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BUY':
        return theme.palette.success.main;
      case 'SELL':
        return theme.palette.error.main;
      case 'HOLD':
        return theme.palette.warning.main;
      default:
        return theme.palette.info.main;
    }
  };

  const getRiskChipColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatExplanation = (text: string) => {
    // Simple markdown-like formatting
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/•/g, '•')
      .split('\n')
      .map((line, index) => (
        <Typography
          key={index}
          variant="body2"
          component="div"
          sx={{ 
            mb: line.trim() ? 1 : 0.5,
            '& strong': { fontWeight: 600 },
            '& em': { fontStyle: 'italic' },
          }}
          dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
        />
      ));
  };

  return (
    <Paper elevation={2} sx={{ mb: 2 }}>
      <Accordion 
        expanded={expanded} 
        onChange={() => setExpanded(!expanded)}
        sx={{
          '&:before': { display: 'none' },
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: alpha(getActionColor(recommendation.action), 0.1),
            borderRadius: expanded ? '4px 4px 0 0' : '4px',
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 2,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            {getActionIcon(recommendation.action)}
            <Typography variant="h6" fontWeight="bold">
              AI Explanation: {recommendation.action} {recommendation.symbol}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, ml: 'auto', mr: 2 }}>
            <Chip
              label={`${(recommendation.confidence * 100).toFixed(1)}% Confidence`}
              color={recommendation.confidence > 0.7 ? 'success' : recommendation.confidence > 0.5 ? 'warning' : 'error'}
              size="small"
            />
            <Chip
              label={`${recommendation.riskLevel} Risk`}
              color={getRiskChipColor(recommendation.riskLevel) as any}
              size="small"
            />
            <Chip
              label={recommendation.timeHorizon}
              variant="outlined"
              size="small"
            />
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ pt: 0 }}>
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="primary">
              Why {recommendation.action} {recommendation.symbol}?
            </Typography>
            
            <Tooltip title="Refresh Explanation">
              <IconButton size="small" onClick={handleRefresh} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {isLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 3 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Generating AI explanation...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {explanation && !isLoading && (
            <Box sx={{ mb: 2 }}>
              {formatExplanation(explanation)}
            </Box>
          )}

          {/* Quick Actions */}
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={getActionIcon(recommendation.action)}
              onClick={() => onActionClick?.(recommendation.action, recommendation.symbol)}
              sx={{
                bgcolor: getActionColor(recommendation.action),
                '&:hover': {
                  bgcolor: getActionColor(recommendation.action),
                  filter: 'brightness(0.9)',
                },
              }}
            >
              {recommendation.action} {recommendation.symbol}
            </Button>
            
            <Button
              variant="outlined"
              size="small"
              onClick={() => onActionClick?.('VIEW_DETAILS', recommendation.symbol)}
            >
              View Details
            </Button>
            
            {recommendation.stopLoss && (
              <Chip
                label={`Stop Loss: $${recommendation.stopLoss.toFixed(2)}`}
                variant="outlined"
                size="small"
                color="error"
              />
            )}
            
            {recommendation.takeProfit && (
              <Chip
                label={`Target: $${recommendation.takeProfit.toFixed(2)}`}
                variant="outlined"
                size="small"
                color="success"
              />
            )}
          </Box>

          {/* Reasoning Summary */}
          {recommendation.reasoning && recommendation.reasoning.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Key Factors:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                {recommendation.reasoning.map((reason, index) => (
                  <Typography
                    key={index}
                    component="li"
                    variant="body2"
                    sx={{ mb: 0.5 }}
                  >
                    {reason}
                  </Typography>
                ))}
              </Box>
            </>
          )}
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export default RecommendationExplanation;
