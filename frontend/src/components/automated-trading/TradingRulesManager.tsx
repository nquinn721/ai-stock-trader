import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Switch,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Edit,
  Delete,
  PlayArrow,
  Pause,
  Add,
  ContentCopy,
} from '@mui/icons-material';

interface TradingRule {
  id: string;
  name: string;
  strategy: string;
  isActive: boolean;
  conditions: any[];
  actions: any[];
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
}

interface TradingRulesManagerProps {
  rules: TradingRule[];
  onRuleUpdate: (rules: TradingRule[]) => void;
}

export const TradingRulesManager: React.FC<TradingRulesManagerProps> = ({
  rules,
  onRuleUpdate,
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule =>
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    );
    onRuleUpdate(updatedRules);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      const updatedRules = rules.filter(rule => rule.id !== ruleToDelete);
      onRuleUpdate(updatedRules);
    }
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const handleDuplicateRule = (rule: TradingRule) => {
    const duplicatedRule = {
      ...rule,
      id: `${rule.id}-copy-${Date.now()}`,
      name: `${rule.name} (Copy)`,
      isActive: false,
    };
    onRuleUpdate([...rules, duplicatedRule]);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Box>
      <Card>
        <CardHeader
          title="Trading Rules Management"
          subheader="Create, edit, and manage your automated trading rules"
          action={
            <Button
              variant="contained"
              startIcon={<Add />}
              color="primary"
            >
              Create New Rule
            </Button>
          }
        />
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule Name</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Performance</TableCell>
                <TableCell>Trades</TableCell>
                <TableCell>Win Rate</TableCell>
                <TableCell>P&L</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Typography variant="subtitle2">
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.strategy}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={rule.isActive}
                      onChange={() => handleToggleRule(rule.id)}
                      color="primary"
                    />
                    <Chip
                      label={rule.isActive ? 'Active' : 'Inactive'}
                      color={rule.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.performance.profitLoss > 0 ? 'Profitable' : 'Loss'}
                      color={rule.performance.profitLoss > 0 ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{rule.performance.totalTrades}</TableCell>
                  <TableCell>{rule.performance.winRate.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Typography
                      color={rule.performance.profitLoss > 0 ? 'success.main' : 'error.main'}
                    >
                      {formatCurrency(rule.performance.profitLoss)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleDuplicateRule(rule)}
                      >
                        <ContentCopy />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this trading rule? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingRulesManager;
