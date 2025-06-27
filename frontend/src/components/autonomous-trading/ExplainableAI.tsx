import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Remove,
  Psychology,
  Refresh,
} from '@mui/icons-material';
import { Grid } from '../common/GridWrapper';
import rlTradingService, { ExplainableAIData } from '../../services/rlTradingService';

interface ExplainableAIProps {
  agentId: string;
}

const ExplainableAI: React.FC<ExplainableAIProps> = ({ agentId }) => {
  const [data, setData] = useState<ExplainableAIData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExplainableData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await rlTradingService.getExplainableAIData(agentId);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to load explainable AI data');
      }
    } catch (err) {
      setError('Failed to load explainable AI data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (agentId) {
      loadExplainableData();
    }
  }, [agentId]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading explainable AI data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <IconButton onClick={loadExplainableData} size="small">
            <Refresh />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert severity="info">
        No explainable AI data available for this agent.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 1 }} />
          Explainable AI Dashboard
        </Typography>
        <IconButton onClick={loadExplainableData} disabled={isLoading}>
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Explainable AI Features
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This component will display detailed explanations of the RL agent's decisions,
                feature importance, model performance metrics, and recent trading decisions.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExplainableAI;
