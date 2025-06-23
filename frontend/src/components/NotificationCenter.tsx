import React, { useState, useEffect, useMemo } from 'react';
import {
  Badge,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Tabs,
  Tab,
  Tooltip,
  Alert,
  Snackbar,
  LinearProgress,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsActive,
  TrendingUp,
  TrendingDown,
  Warning,
  Info,
  Security,
  Event,
  AccessTime,
  Close,
  MarkEmailRead,
  Clear,
  Settings,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import { 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus,
  type Notification 
} from '../types/notification.types';
import './NotificationCenter.css';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAsDismissed,
    bulkMarkAsRead,
    clearAll,
    filterNotifications,
  } = useNotifications();

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedType, setSelectedType] = useState<NotificationType | 'all'>('all');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const isOpen = Boolean(anchorEl);

  // Filter notifications based on active tab and type
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab (status)
    switch (activeTab) {
      case 0: // All
        break;
      case 1: // Unread
        filtered = filtered.filter(n => n.status === NotificationStatus.SENT);
        break;
      case 2: // Trading
        filtered = filtered.filter(n => 
          n.type === NotificationType.TRADING_OPPORTUNITY || 
          n.type === NotificationType.PATTERN_ALERT ||
          n.type === NotificationType.TECHNICAL_ALERT
        );
        break;
      case 3: // Risk
        filtered = filtered.filter(n => n.type === NotificationType.RISK_MANAGEMENT);
        break;
      case 4: // Market
        filtered = filtered.filter(n => n.type === NotificationType.MARKET_EVENT);
        break;
    }

    // Filter by type if specified
    if (selectedType !== 'all') {
      filtered = filtered.filter(n => n.type === selectedType);
    }

    return filtered.slice(0, 50); // Limit to 50 for performance
  }, [notifications, activeTab, selectedType]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === NotificationStatus.SENT) {
      await markAsRead(notification.id);
    }

    // Handle notification-specific actions
    if (notification.symbol) {
      // Could navigate to stock details
      console.log(`Navigate to ${notification.symbol}`);
    }
    
    if (notification.portfolioId) {
      // Could navigate to portfolio
      console.log(`Navigate to portfolio ${notification.portfolioId}`);
    }
  };

  const handleDismiss = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation();
    await markAsDismissed(notification.id);
    showSnackbar(`Notification dismissed`);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = filteredNotifications
      .filter(n => n.status === NotificationStatus.SENT)
      .map(n => n.id);

    if (unreadIds.length > 0) {
      await bulkMarkAsRead(unreadIds);
      showSnackbar(`Marked ${unreadIds.length} notifications as read`);
    }
  };

  const handleClearAll = () => {
    clearAll();
    showSnackbar('All notifications cleared');
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getNotificationIcon = (type: NotificationType, priority: NotificationPriority) => {
    const iconProps = {
      fontSize: 'small' as const,
      color: getPriorityColor(priority),
    };

    switch (type) {
      case NotificationType.TRADING_OPPORTUNITY:
        return <TrendingUp {...iconProps} />;
      case NotificationType.PATTERN_ALERT:
        return <TrendingDown {...iconProps} />;
      case NotificationType.TECHNICAL_ALERT:
        return <Info {...iconProps} />;
      case NotificationType.RISK_MANAGEMENT:
        return <Security {...iconProps} />;
      case NotificationType.MARKET_EVENT:
        return <Event {...iconProps} />;
      case NotificationType.MULTI_TIMEFRAME:
        return <AccessTime {...iconProps} />;
      default:
        return <NotificationIcon {...iconProps} />;
    }
  };

  const getPriorityColor = (priority: NotificationPriority): 'primary' | 'secondary' | 'warning' | 'error' => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return 'error';
      case NotificationPriority.HIGH:
        return 'warning';
      case NotificationPriority.MEDIUM:
        return 'primary';
      case NotificationPriority.LOW:
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const getPriorityChip = (priority: NotificationPriority) => {
    return (
      <Chip
        label={priority.toUpperCase()}
        size="small"
        color={getPriorityColor(priority)}
        variant="outlined"
        sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
      />
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderNotificationItem = (notification: Notification) => {
    const isUnread = notification.status === NotificationStatus.SENT;
    
    return (      <ListItem
        key={notification.id}
        component="div"
        onClick={() => handleNotificationClick(notification)}
        className={`notification-item ${isUnread ? 'unread' : 'read'} priority-${notification.priority}`}
        sx={{
          backgroundColor: isUnread ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          borderLeft: isUnread ? '3px solid #1976d2' : '3px solid transparent',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
        }}
      >
        <ListItemIcon>
          {getNotificationIcon(notification.type, notification.priority)}
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography
                variant="body2"
                fontWeight={isUnread ? 600 : 400}
                noWrap
                sx={{ maxWidth: '70%' }}
              >
                {notification.title}
              </Typography>
              <Box display="flex" alignItems="center">
                {notification.symbol && (
                  <Chip
                    label={notification.symbol}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mr: 0.5, fontSize: '0.7rem', height: '20px' }}
                  />
                )}
                {getPriorityChip(notification.priority)}
              </Box>
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {notification.message}
              </Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  {formatTimeAgo(notification.createdAt)}
                </Typography>
                {notification.confidenceScore && (
                  <Chip
                    label={`${notification.confidenceScore}% confidence`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: '0.6rem', height: '18px' }}
                  />
                )}
              </Box>
            </Box>
          }
        />
        
        <ListItemSecondaryAction>
          <Tooltip title="Dismiss">
            <IconButton
              edge="end"
              size="small"
              onClick={(e) => handleDismiss(notification, e)}
              sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Tooltip>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  return (
    <>
      <Tooltip title={`${unreadCount} unread notifications`}>
        <IconButton
          onClick={handleClick}
          className={`notification-bell ${className || ''}`}
          color="inherit"
          size="large"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? (
              <NotificationsActive />
            ) : (
              <NotificationIcon />
            )}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 600,
            overflow: 'visible',
          },
        }}
      >
        <Box className="notification-center">
          {/* Header */}
          <Box p={2} borderBottom={1} borderColor="divider">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={600}>
                Notifications
              </Typography>
              <Box>
                <Tooltip title="Mark all as read">
                  <IconButton size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                    <MarkEmailRead fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear all">
                  <IconButton size="small" onClick={handleClearAll}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton size="small">
                    <Settings fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mt: 1, minHeight: 32 }}
            >
              <Tab label="All" sx={{ minHeight: 32, py: 0.5 }} />
              <Tab label={`Unread (${unreadCount})`} sx={{ minHeight: 32, py: 0.5 }} />
              <Tab label="Trading" sx={{ minHeight: 32, py: 0.5 }} />
              <Tab label="Risk" sx={{ minHeight: 32, py: 0.5 }} />
              <Tab label="Market" sx={{ minHeight: 32, py: 0.5 }} />
            </Tabs>
          </Box>

          {/* Loading */}
          {isLoading && (
            <LinearProgress />
          )}

          {/* Content */}
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredNotifications.length === 0 ? (
              <Box p={4} textAlign="center">
                <CheckCircle color="action" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  {activeTab === 1 ? 'No unread notifications' : 'No notifications'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 1 
                    ? 'You\'re all caught up!' 
                    : 'New alerts will appear here when they\'re available.'
                  }
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    {renderNotificationItem(notification)}
                    {index < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <Box p={2} borderTop={1} borderColor="divider">
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  // Navigate to full notifications page
                  console.log('Navigate to full notifications');
                }}
              >
                View All Notifications
              </Button>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Snackbar for actions */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <IconButton size="small" color="inherit" onClick={() => setSnackbarOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default NotificationCenter;
