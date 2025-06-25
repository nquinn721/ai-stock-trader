import { 
  Add, 
  Delete, 
  Edit, 
  NotificationsActive, 
  NotificationsOff,
  PlayArrow,
  Stop,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

interface MarketAlert {
  id: number;
  name: string;
  isActive: boolean;
  criteria: string;
  matchCount: number;
  lastTriggered?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Mock data for demonstration
const mockAlerts: MarketAlert[] = [
  {
    id: 1,
    name: "High Volume Breakout",
    isActive: true,
    criteria: "Volume > 2x average AND Price > 20-day MA",
    matchCount: 7,
    lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
    priority: 'HIGH',
  },
  {
    id: 2,
    name: "RSI Oversold Alert",
    isActive: false,
    criteria: "RSI < 30 AND Price near support",
    matchCount: 3,
    lastTriggered: new Date(Date.now() - 5 * 60 * 60 * 1000),
    priority: 'MEDIUM',
  },
  {
    id: 3,
    name: "Gap Down Recovery",
    isActive: true,
    criteria: "Gap down > 3% AND Price recovery > 50%",
    matchCount: 2,
    lastTriggered: new Date(Date.now() - 1 * 60 * 60 * 1000),
    priority: 'CRITICAL',
  },
];

export const AlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<MarketAlert[]>(mockAlerts);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<MarketAlert | null>(null);
  const [newAlert, setNewAlert] = useState({
    name: '',
    criteria: '',
    priority: 'MEDIUM' as const,
  });

  const handleToggleAlert = (id: number) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const handleDeleteAlert = (id: number) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const handleCreateAlert = () => {
    const alert: MarketAlert = {
      id: Date.now(),
      name: newAlert.name,
      isActive: true,
      criteria: newAlert.criteria,
      matchCount: 0,
      priority: newAlert.priority,
    };
    setAlerts([...alerts, alert]);
    setCreateDialogOpen(false);
    setNewAlert({ name: '', criteria: '', priority: 'MEDIUM' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return '#e53e3e';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#3b82f6';
      case 'LOW': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={3}
        sx={{
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)",
          borderRadius: "16px",
          p: 3,
          border: "1px solid rgba(59, 130, 246, 0.2)",
        }}
      >
        <Box>
          <Typography 
            variant="h5" 
            fontWeight={700}
            sx={{
              background: "linear-gradient(135deg, #1976d2, #42a5f5)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 0.5,
            }}
          >
            Alert Manager
          </Typography>
          <Typography color="textSecondary" variant="body2">
            Create and manage real-time market alerts for trading opportunities
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Chip
            icon={<NotificationsActive />}
            label={`${alerts.filter(a => a.isActive).length} Active`}
            color="primary"
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            icon={<TrendingUp />}
            label={`${alerts.reduce((sum, a) => sum + a.matchCount, 0)} Matches Today`}
            color="success"
            variant="filled"
            sx={{ fontWeight: 600 }}
          />
        </Box>
      </Box>

      {/* Quick Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
        {[
          { label: "Total Alerts", value: alerts.length, color: "#3b82f6" },
          { label: "Active Alerts", value: alerts.filter(a => a.isActive).length, color: "#10b981" },
          { label: "Triggered Today", value: alerts.filter(a => a.lastTriggered && a.lastTriggered > new Date(Date.now() - 24*60*60*1000)).length, color: "#f59e0b" },
          { label: "Critical Alerts", value: alerts.filter(a => a.priority === 'CRITICAL').length, color: "#e53e3e" },
        ].map((stat, index) => (
          <Paper
            key={index}
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}08 100%)`,
              border: `1px solid ${stat.color}30`,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: `0 8px 32px ${stat.color}20`,
              },
            }}
          >
            <Typography variant="h4" fontWeight={700} color={stat.color}>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="textSecondary" fontWeight={500}>
              {stat.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Alerts List */}
      <Card 
        elevation={0}
        sx={{
          borderRadius: "16px",
          background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {alerts.length === 0 ? (
            <Box p={6} textAlign="center">
              <NotificationsOff sx={{ fontSize: 64, color: "#6b7280", mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No alerts configured
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={3}>
                Create your first alert to get notified about market opportunities
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                  "&:hover": {
                    background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  },
                }}
              >
                Create Alert
              </Button>
            </Box>
          ) : (
            <List disablePadding>
              {alerts.map((alert, index) => (
                <React.Fragment key={alert.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 3,
                      "&:hover": {
                        backgroundColor: "rgba(59, 130, 246, 0.04)",
                      },
                    }}
                  >
                    <Box display="flex" alignItems="center" width="100%">
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="h6" fontWeight={600}>
                            {alert.name}
                          </Typography>
                          <Chip
                            label={alert.priority}
                            size="small"
                            sx={{
                              backgroundColor: getPriorityColor(alert.priority),
                              color: "white",
                              fontWeight: 600,
                              fontSize: "0.7rem",
                            }}
                          />
                          {alert.isActive && (
                            <Chip
                              icon={<PlayArrow />}
                              label="Active"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="textSecondary" 
                          sx={{ mb: 1, fontFamily: "monospace" }}
                        >
                          {alert.criteria}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="caption" color="textSecondary">
                            {alert.matchCount} matches today
                          </Typography>
                          {alert.lastTriggered && (
                            <Typography variant="caption" color="textSecondary">
                              Last triggered: {formatTimeAgo(alert.lastTriggered)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Tooltip title={alert.isActive ? "Disable Alert" : "Enable Alert"}>
                          <Switch
                            checked={alert.isActive}
                            onChange={() => handleToggleAlert(alert.id)}
                            color="primary"
                          />
                        </Tooltip>
                        <Tooltip title="Edit Alert">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAlert(alert);
                              setEditDialogOpen(true);
                            }}
                            sx={{
                              "&:hover": {
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                color: "#3b82f6",
                              },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Alert">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAlert(alert.id)}
                            sx={{
                              "&:hover": {
                                backgroundColor: "rgba(229, 62, 62, 0.1)",
                                color: "#e53e3e",
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < alerts.length - 1 && (
                    <Box 
                      sx={{ 
                        height: 1, 
                        background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
                        mx: 3,
                      }} 
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setCreateDialogOpen(true)}
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          "&:hover": {
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            transform: "scale(1.1)",
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Add />
      </Fab>

      {/* Create Alert Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
          Create New Alert
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Alert Name"
              value={newAlert.name}
              onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Criteria"
              multiline
              rows={3}
              value={newAlert.criteria}
              onChange={(e) => setNewAlert({ ...newAlert, criteria: e.target.value })}
              sx={{ mb: 2 }}
              placeholder="e.g., Volume > 2x average AND RSI > 70"
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newAlert.priority}
                onChange={(e) => setNewAlert({ ...newAlert, priority: e.target.value as any })}
                label="Priority"
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="CRITICAL">Critical</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{ borderRadius: "8px" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAlert} 
            variant="contained"
            disabled={!newAlert.name || !newAlert.criteria}
            sx={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
              "&:hover": {
                background: "linear-gradient(135deg, #2563eb, #3b82f6)",
              },
            }}
          >
            Create Alert
          </Button>
        </DialogActions>
      </Dialog>

      {/* Info Alert */}
      <Alert 
        severity="info" 
        sx={{ 
          mt: 3, 
          borderRadius: "12px",
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        }}
      >
        <Typography variant="body2">
          <strong>Pro Tip:</strong> Use technical indicators like RSI, MACD, and volume ratios in your alert criteria for more accurate signals.
        </Typography>
      </Alert>
    </Box>
  );
};
