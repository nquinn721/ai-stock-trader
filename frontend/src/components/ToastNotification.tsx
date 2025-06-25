import { Close } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  IconButton,
  Slide,
  Snackbar,
  Typography,
} from "@mui/material";
import React from "react";
import {
  NotificationPriority,
  NotificationType,
  type Notification,
} from "../types/notification.types";

interface ToastNotificationProps {
  notification: Notification;
  open: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  open,
  onClose,
  autoHideDuration = 6000,
}) => {
  const getSeverity = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return "error" as const;
      case NotificationPriority.HIGH:
        return "warning" as const;
      case NotificationPriority.MEDIUM:
        return "info" as const;
      case NotificationPriority.LOW:
        return "success" as const;
      default:
        return "info" as const;
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    // You can customize icons per type here
    return null;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return `${Math.floor(diffMins / 60)}h ago`;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      TransitionComponent={Slide}
      sx={{
        "& .MuiSnackbarContent-root": {
          padding: 0,
          backgroundColor: "transparent",
          boxShadow: "none",
        },
      }}
    >
      <Alert
        severity={getSeverity(notification.priority)}
        onClose={onClose}
        sx={{
          width: "400px",
          borderRadius: "16px",
          background: (theme) => {
            const colors = {
              error: "linear-gradient(135deg, rgba(229, 62, 62, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)",
              warning: "linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%)",
              info: "linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%)",
              success: "linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)",
            };
            return colors[getSeverity(notification.priority)];
          },
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 64px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)",
          "& .MuiAlert-icon": {
            color: "white",
            filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))",
          },
          "& .MuiAlert-action": {
            color: "white",
            "& .MuiIconButton-root": {
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            },
          },
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClose}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle sx={{ fontWeight: 700, mb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            {notification.title}
            {notification.symbol && (
              <Chip
                label={notification.symbol}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  height: "20px",
                }}
              />
            )}
          </Box>
        </AlertTitle>
        
        <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.4 }}>
          {notification.message}
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            {formatTimeAgo(notification.createdAt)}
          </Typography>
          
          <Box display="flex" gap={0.5}>
            <Chip
              label={notification.priority}
              size="small"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "white",
                fontWeight: 600,
                fontSize: "0.65rem",
                height: "18px",
              }}
            />
            {notification.confidenceScore && (
              <Chip
                label={`${notification.confidenceScore}%`}
                size="small"
                sx={{
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  fontWeight: 600,
                  fontSize: "0.65rem",
                  height: "18px",
                }}
              />
            )}
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default ToastNotification;
