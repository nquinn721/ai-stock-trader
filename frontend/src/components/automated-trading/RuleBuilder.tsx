import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Divider,
  Alert,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Clear,
} from '@mui/icons-material';

interface Condition {
  id: string;
  indicator: string;
  operator: string;
  value: string;
  timeframe: string;
}

interface Action {
  id: string;
  type: string;
  parameters: {
    symbol?: string;
    quantity?: number;
    orderType?: string;
    stopLoss?: number;
    takeProfit?: number;
  };
}

interface TradingRule {
  id: string;
  name: string;
  strategy: string;
  isActive: boolean;
  conditions: Condition[];
  actions: Action[];
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
}

interface RuleBuilderProps {
  onRuleCreate: (rule: TradingRule) => void;
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ onRuleCreate }) => {
  const [ruleName, setRuleName] = useState('');
  const [strategy, setStrategy] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const indicators = [
    'RSI',
    'MACD',
    'Moving Average',
    'Bollinger Bands',
    'Volume',
    'Price',
    'Stochastic',
    'Williams %R',
  ];

  const operators = [
    'Greater Than',
    'Less Than',
    'Equal To',
    'Crosses Above',
    'Crosses Below',
    'Between',
  ];

  const timeframes = [
    '1m',
    '5m',
    '15m',
    '30m',
    '1h',
    '4h',
    '1d',
  ];

  const strategies = [
    'Trend Following',
    'Mean Reversion',
    'Momentum',
    'Breakout',
    'Scalping',
    'Swing Trading',
  ];

  const actionTypes = [
    'Buy Market',
    'Sell Market',
    'Buy Limit',
    'Sell Limit',
    'Buy Stop',
    'Sell Stop',
    'Close Position',
  ];

  const addCondition = () => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`,
      indicator: '',
      operator: '',
      value: '',
      timeframe: '1h',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: keyof Condition, value: string) => {
    setConditions(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const addAction = () => {
    const newAction: Action = {
      id: `action-${Date.now()}`,
      type: '',
      parameters: {},
    };
    setActions([...actions, newAction]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter(a => a.id !== id));
  };

  const updateAction = (id: string, field: string, value: any) => {
    setActions(actions.map(a => 
      a.id === id 
        ? { 
            ...a, 
            [field === 'type' ? 'type' : 'parameters']: 
              field === 'type' 
                ? value 
                : { ...a.parameters, [field]: value }
          } 
        : a
    ));
  };

  const validateRule = (): string[] => {
    const newErrors: string[] = [];

    if (!ruleName.trim()) {
      newErrors.push('Rule name is required');
    }

    if (!strategy) {
      newErrors.push('Strategy type is required');
    }

    if (conditions.length === 0) {
      newErrors.push('At least one condition is required');
    }

    if (actions.length === 0) {
      newErrors.push('At least one action is required');
    }

    conditions.forEach((condition, index) => {
      if (!condition.indicator) {
        newErrors.push(`Condition ${index + 1}: Indicator is required`);
      }
      if (!condition.operator) {
        newErrors.push(`Condition ${index + 1}: Operator is required`);
      }
      if (!condition.value) {
        newErrors.push(`Condition ${index + 1}: Value is required`);
      }
    });

    actions.forEach((action, index) => {
      if (!action.type) {
        newErrors.push(`Action ${index + 1}: Action type is required`);
      }
    });

    return newErrors;
  };

  const handleSaveRule = () => {
    const validationErrors = validateRule();
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newRule: TradingRule = {
      id: `rule-${Date.now()}`,
      name: ruleName,
      strategy,
      isActive: false,
      conditions,
      actions,
      performance: {
        totalTrades: 0,
        winRate: 0,
        profitLoss: 0,
      },
    };

    onRuleCreate(newRule);
    handleClearRule();
    setErrors([]);
  };

  const handleClearRule = () => {
    setRuleName('');
    setStrategy('');
    setConditions([]);
    setActions([]);
    setErrors([]);
  };

  return (
    <Box className="rule-builder">
      <Typography variant="h5" gutterBottom>
        Rule Builder
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Create custom trading rules by defining conditions and actions. Rules will be executed automatically when conditions are met.
      </Typography>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">Please fix the following errors:</Typography>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Basic Information */}
        <Card className="rule-builder-section">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <TextField
                  fullWidth
                  label="Rule Name"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g., RSI Oversold Strategy"
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <FormControl fullWidth>
                  <InputLabel>Strategy Type</InputLabel>
                  <Select
                    value={strategy}
                    label="Strategy Type"
                    onChange={(e) => setStrategy(e.target.value)}
                  >
                    {strategies.map((strat) => (
                      <MenuItem key={strat} value={strat}>
                        {strat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Conditions and Actions Layout */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* Conditions */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Card className="rule-builder-section">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Conditions ({conditions.length})
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addCondition}
                    variant="outlined"
                    size="small"
                  >
                    Add Condition
                  </Button>
                </Box>

                {conditions.map((condition, index) => (
                  <Card key={condition.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2">
                          Condition {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeCondition(condition.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Indicator</InputLabel>
                            <Select
                              value={condition.indicator}
                              label="Indicator"
                              onChange={(e) => updateCondition(condition.id, 'indicator', e.target.value)}
                            >
                              {indicators.map((indicator) => (
                                <MenuItem key={indicator} value={indicator}>
                                  {indicator}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <FormControl fullWidth size="small">
                            <InputLabel>Operator</InputLabel>
                            <Select
                              value={condition.operator}
                              label="Operator"
                              onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                            >
                              {operators.map((operator) => (
                                <MenuItem key={operator} value={operator}>
                                  {operator}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Value"
                            value={condition.value}
                            onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                            placeholder="e.g., 30, 0.5, 100"
                          />
                          <FormControl fullWidth size="small">
                            <InputLabel>Timeframe</InputLabel>
                            <Select
                              value={condition.timeframe}
                              label="Timeframe"
                              onChange={(e) => updateCondition(condition.id, 'timeframe', e.target.value)}
                            >
                              {timeframes.map((timeframe) => (
                                <MenuItem key={timeframe} value={timeframe}>
                                  {timeframe}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                {conditions.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    No conditions added yet. Click "Add Condition" to get started.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Actions */}
          <Box sx={{ flex: 1, minWidth: 300 }}>
            <Card className="rule-builder-section">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Actions ({actions.length})
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    onClick={addAction}
                    variant="outlined"
                    size="small"
                  >
                    Add Action
                  </Button>
                </Box>

                {actions.map((action, index) => (
                  <Card key={action.id} sx={{ mb: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle2">
                          Action {index + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => removeAction(action.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Action Type</InputLabel>
                          <Select
                            value={action.type}
                            label="Action Type"
                            onChange={(e) => updateAction(action.id, 'type', e.target.value)}
                          >
                            {actionTypes.map((actionType) => (
                              <MenuItem key={actionType} value={actionType}>
                                {actionType}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Symbol"
                            value={action.parameters.symbol || ''}
                            onChange={(e) => updateAction(action.id, 'symbol', e.target.value)}
                            placeholder="e.g., AAPL, TSLA"
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Quantity"
                            type="number"
                            value={action.parameters.quantity || ''}
                            onChange={(e) => updateAction(action.id, 'quantity', parseInt(e.target.value))}
                            placeholder="Shares"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Stop Loss %"
                            type="number"
                            value={action.parameters.stopLoss || ''}
                            onChange={(e) => updateAction(action.id, 'stopLoss', parseFloat(e.target.value))}
                            placeholder="e.g., 5"
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Take Profit %"
                            type="number"
                            value={action.parameters.takeProfit || ''}
                            onChange={(e) => updateAction(action.id, 'takeProfit', parseFloat(e.target.value))}
                            placeholder="e.g., 10"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                {actions.length === 0 && (
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 2 }}>
                    No actions added yet. Click "Add Action" to get started.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Save/Clear Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<Clear />}
            onClick={handleClearRule}
            disabled={!ruleName && !strategy && conditions.length === 0 && actions.length === 0}
          >
            Clear All
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSaveRule}
            disabled={!ruleName || !strategy || conditions.length === 0 || actions.length === 0}
          >
            Save Rule
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RuleBuilder;
