import {
  AccessTime,
  CheckCircle,
  Clear,
  Close,
  Event,
  Info,
  MarkEmailRead,
  Notifications as NotificationIcon,
  NotificationsActive,
  Security,
  Settings,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import {
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Popover,
  Snackbar,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  type Notification,
} from "../types/notification.types";
import "./NotificationCenter.css";

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className,
}) => {
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
  const [selectedType, setSelectedType] = useState<NotificationType | "all">(
    "all"
  );
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const isOpen = Boolean(anchorEl);

  // Filter notifications based on active tab and type
  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    // Filter by tab (status)
    switch (activeTab) {
      case 0: // All
        break;
      case 1: // Unread
        filtered = filtered.filter((n) => n.status === NotificationStatus.SENT);
        break;
      case 2: // Trading
        filtered = filtered.filter(
          (n) =>
            n.type === NotificationType.TRADING_OPPORTUNITY ||
            n.type === NotificationType.PATTERN_ALERT ||
            n.type === NotificationType.TECHNICAL_ALERT
        );
        break;
      case 3: // Risk
        filtered = filtered.filter(
          (n) => n.type === NotificationType.RISK_MANAGEMENT
        );
        break;
      case 4: // Market
        filtered = filtered.filter(
          (n) => n.type === NotificationType.MARKET_EVENT
        );
        break;
    }

    // Filter by type if specified
    if (selectedType !== "all") {
      filtered = filtered.filter((n) => n.type === selectedType);
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

  const handleDismiss = async (
    notification: Notification,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    await markAsDismissed(notification.id);
    showSnackbar(`Notification dismissed`);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = filteredNotifications
      .filter((n) => n.status === NotificationStatus.SENT)
      .map((n) => n.id);

    if (unreadIds.length > 0) {
      await bulkMarkAsRead(unreadIds);
      showSnackbar(`Marked ${unreadIds.length} notifications as read`);
    }
  };

  const handleClearAll = () => {
    clearAll();
    showSnackbar("All notifications cleared");
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getNotificationIcon = (
    type: NotificationType,
    priority: NotificationPriority
  ) => {
    const iconProps = {
      fontSize: "small" as const,
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

  const getPriorityColor = (
    priority: NotificationPriority
  ): "primary" | "secondary" | "warning" | "error" => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return "error";
      case NotificationPriority.HIGH:
        return "warning";
      case NotificationPriority.MEDIUM:
        return "primary";
      case NotificationPriority.LOW:
        return "secondary";
      default:
        return "primary";
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const renderNotificationItem = (notification: Notification) => {
    const isUnread = notification.status === NotificationStatus.SENT;

    return (
      <ListItem
        key={notification.id}
        component="div"
        onClick={() => handleNotificationClick(notification)}
        className={`notification-item ${
          isUnread ? "unread" : "read"
        } priority-${notification.priority}`}
        sx={{
          backgroundColor: "transparent",
          borderRadius: "12px",
          margin: "4px 8px",
          cursor: "pointer",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      >
        <ListItemIcon>
          {getNotificationIcon(notification.type, notification.priority)}
        </ListItemIcon>

        <ListItemText
          primary={
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                variant="body2"
                fontWeight={isUnread ? 600 : 500}
                noWrap
                sx={{
                  maxWidth: "65%",
                  background: isUnread
                    ? "linear-gradient(135deg, #1976d2, #42a5f5)"
                    : "transparent",
                  backgroundClip: isUnread ? "text" : "initial",
                  WebkitBackgroundClip: isUnread ? "text" : "initial",
                  WebkitTextFillColor: isUnread ? "transparent" : "inherit",
                }}
              >
                {notification.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                {notification.symbol && (
                  <Chip
                    label={notification.symbol}
                    size="small"
                    className="symbol-chip"
                    sx={{
                      fontSize: "0.7rem",
                      height: "22px",
                      fontWeight: 600,
                    }}
                  />
                )}
                <Chip
                  label={notification.priority.toUpperCase()}
                  size="small"
                  className={`priority-chip ${notification.priority}`}
                  sx={{
                    fontSize: "0.65rem",
                    height: "20px",
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Box>
          }
          secondary={
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mb: 0.5,
                  lineHeight: 1.4,
                  fontWeight: 400,
                }}
              >
                {notification.message}
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mt: 1 }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    fontWeight: 500,
                    opacity: 0.8,
                  }}
                >
                  {formatTimeAgo(notification.createdAt)}
                </Typography>
                {notification.confidenceScore && (
                  <Chip
                    label={`${notification.confidenceScore}% confidence`}
                    size="small"
                    className="confidence-chip"
                    sx={{
                      fontSize: "0.6rem",
                      height: "18px",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>
          }
        />

        <ListItemSecondaryAction>
          <Tooltip title="Dismiss" placement="left">
            <IconButton
              edge="end"
              size="small"
              onClick={(e) => handleDismiss(notification, e)}
              className="notification-action-button"
              sx={{
                opacity: 0.6,
                "&:hover": {
                  opacity: 1,
                  backgroundColor: "rgba(229, 62, 62, 0.1)",
                  color: "#e53e3e",
                },
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
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
          className={`notification-bell ${className || ""}`}
          color="inherit"
          size="large"
        >
          <Badge badgeContent={unreadCount} color="error" max={99}>
            {unreadCount > 0 ? <NotificationsActive /> : <NotificationIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 600,
            overflow: "visible",
          },
        }}
      >
        <Box className="notification-center">
          {/* Header */}
          <Box
            p={2.5}
            borderBottom={1}
            borderColor="divider"
            sx={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography
                variant="h6"
                fontWeight={700}
                sx={{
                  background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontSize: "1.1rem",
                }}
              >
                Notifications
              </Typography>
              <Box display="flex" gap={0.5}>
                <Tooltip title="Mark all as read" placement="bottom">
                  <IconButton
                    size="small"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                    className="notification-action-button"
                    sx={{
                      opacity: unreadCount === 0 ? 0.4 : 0.8,
                      "&:hover": {
                        opacity: 1,
                        backgroundColor: "rgba(25, 118, 210, 0.1)",
                        color: "#1976d2",
                      },
                    }}
                  >
                    <MarkEmailRead fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear all" placement="bottom">
                  <IconButton
                    size="small"
                    onClick={handleClearAll}
                    className="notification-action-button"
                    sx={{
                      opacity: 0.8,
                      "&:hover": {
                        opacity: 1,
                        backgroundColor: "rgba(229, 62, 62, 0.1)",
                        color: "#e53e3e",
                      },
                    }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings" placement="bottom">
                  <IconButton
                    size="small"
                    className="notification-action-button"
                    sx={{
                      opacity: 0.8,
                      "&:hover": {
                        opacity: 1,
                        backgroundColor: "rgba(107, 114, 128, 0.1)",
                        color: "#6b7280",
                      },
                    }}
                  >
                    <Settings fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Enhanced Tabs */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mt: 1.5,
                minHeight: 36,
                "& .MuiTab-root": {
                  minHeight: 36,
                  py: 0.5,
                  px: 2,
                  borderRadius: "8px",
                  margin: "0 2px",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  "&:hover": {
                    backgroundColor: "rgba(25, 118, 210, 0.1)",
                  },
                  "&.Mui-selected": {
                    background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                    color: "white",
                    fontWeight: 600,
                  },
                },
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              <Tab label="All" />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    Unread
                    {unreadCount > 0 && (
                      <Chip
                        label={unreadCount}
                        size="small"
                        sx={{
                          height: "16px",
                          fontSize: "0.6rem",
                          backgroundColor: "#e53e3e",
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    )}
                  </Box>
                }
              />
              <Tab label="Trading" />
              <Tab label="Risk" />
              <Tab label="Market" />
            </Tabs>
          </Box>

          {/* Loading */}
          {isLoading && <LinearProgress />}

          {/* Content */}
          <Box sx={{ maxHeight: 420, overflow: "auto" }}>
            {filteredNotifications.length === 0 ? (
              <Box
                p={4}
                textAlign="center"
                className="notification-empty-state"
              >
                <CheckCircle
                  sx={{
                    fontSize: 56,
                    mb: 2,
                    color: "#3b82f6",
                    filter: "drop-shadow(0 4px 8px rgba(59, 130, 246, 0.2))",
                  }}
                />
                <Typography
                  variant="h6"
                  color="text.primary"
                  fontWeight={600}
                  sx={{ mb: 1 }}
                >
                  {activeTab === 1 ? "All caught up!" : "No notifications"}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: "280px", mx: "auto", lineHeight: 1.5 }}
                >
                  {activeTab === 1
                    ? "You've read all your notifications. New alerts will appear here when they're available."
                    : "New trading alerts, market updates, and important notifications will appear here."}
                </Typography>
              </Box>
            ) : (
              <List disablePadding sx={{ py: 1 }}>
                {filteredNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    {renderNotificationItem(notification)}
                    {index < filteredNotifications.length - 1 && (
                      <Divider
                        sx={{
                          mx: 2,
                          opacity: 0.6,
                          background:
                            "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>

          {/* Enhanced Footer */}
          {filteredNotifications.length > 0 && (
            <Box
              p={2}
              borderTop={1}
              borderColor="divider"
              sx={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                onClick={() => {
                  // Navigate to full notifications page
                  console.log("Navigate to full notifications");
                }}
                sx={{
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 600,
                  border: "2px solid",
                  borderColor: "rgba(25, 118, 210, 0.3)",
                  background:
                    "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(25, 118, 210, 0.02) 100%)",
                  "&:hover": {
                    borderColor: "rgba(25, 118, 210, 0.6)",
                    background:
                      "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(25, 118, 210, 0.05) 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 16px rgba(25, 118, 210, 0.2)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                View All Notifications
              </Button>
            </Box>
          )}
        </Box>
      </Popover>

      {/* Enhanced Snackbar for actions */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            background: "linear-gradient(135deg, #10b981, #34d399)",
            borderRadius: "12px",
            color: "white",
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.3)",
          },
        }}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setSnackbarOpen(false)}
            sx={{
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default NotificationCenter;
