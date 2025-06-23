import {
  AccessTime,
  Close,
  Event,
  ExpandLess,
  ExpandMore,
  Info,
  Security,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Chip,
  Collapse,
  IconButton,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNotifications } from "../context/NotificationContext";
import {
  NotificationPriority,
  NotificationType,
  type Notification,
} from "../types/notification.types";
import "./NotificationToast.css";

interface NotificationToastProps {
  maxToasts?: number;
  autoHideDuration?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

interface ToastNotification extends Notification {
  toastId: string;
  showDetails: boolean;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  maxToasts = 5,
  autoHideDuration = 10000,
  position = "top-right",
}) => {
  const { notifications, markAsRead, markAsDismissed } = useNotifications();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Monitor new notifications and convert to toasts
  useEffect(() => {
    const latestNotifications = notifications
      .filter((n) => n.status === "sent")
      .slice(0, 5); // Only show latest 5

    const newToasts: ToastNotification[] = latestNotifications
      .filter((n) => !toasts.find((t) => t.id === n.id))
      .map((n) => ({
        ...n,
        toastId: `toast-${n.id}-${Date.now()}`,
        showDetails: false,
      }));

    if (newToasts.length > 0) {
      setToasts((prev) => {
        const updated = [...newToasts, ...prev];
        return updated.slice(0, maxToasts);
      });

      // Auto-hide toasts after duration
      newToasts.forEach((toast) => {
        if (toast.priority !== NotificationPriority.CRITICAL) {
          setTimeout(() => {
            removeToast(toast.toastId);
          }, autoHideDuration);
        }
      });
    }
  }, [notifications, maxToasts, autoHideDuration]);

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  const handleDismiss = async (toast: ToastNotification) => {
    await markAsDismissed(toast.id);
    removeToast(toast.toastId);
  };

  const handleMarkRead = async (toast: ToastNotification) => {
    await markAsRead(toast.id);
    removeToast(toast.toastId);
  };

  const toggleDetails = (toastId: string) => {
    setToasts((prev) =>
      prev.map((t) =>
        t.toastId === toastId ? { ...t, showDetails: !t.showDetails } : t
      )
    );
  };

  const getSeverity = (
    priority: NotificationPriority
  ): "error" | "warning" | "info" | "success" => {
    switch (priority) {
      case NotificationPriority.CRITICAL:
        return "error";
      case NotificationPriority.HIGH:
        return "warning";
      case NotificationPriority.MEDIUM:
        return "info";
      case NotificationPriority.LOW:
        return "success";
      default:
        return "info";
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRADING_OPPORTUNITY:
        return <TrendingUp />;
      case NotificationType.PATTERN_ALERT:
        return <TrendingDown />;
      case NotificationType.TECHNICAL_ALERT:
        return <Info />;
      case NotificationType.RISK_MANAGEMENT:
        return <Security />;
      case NotificationType.MARKET_EVENT:
        return <Event />;
      case NotificationType.MULTI_TIMEFRAME:
        return <AccessTime />;
      default:
        return <Info />;
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: "fixed" as const,
      zIndex: 9999,
      maxWidth: "420px",
      minWidth: "320px",
    };

    switch (position) {
      case "top-right":
        return { ...base, top: 80, right: 20 };
      case "top-left":
        return { ...base, top: 80, left: 20 };
      case "bottom-right":
        return { ...base, bottom: 20, right: 20 };
      case "bottom-left":
        return { ...base, bottom: 20, left: 20 };
      default:
        return { ...base, top: 80, right: 20 };
    }
  };

  if (toasts.length === 0) {
    return null;
  }

  return (
    <Box sx={getPositionStyles()}>
      <Stack spacing={2}>
        {toasts.map((toast, index) => (
          <Slide
            key={toast.toastId}
            direction={position.includes("right") ? "left" : "right"}
            in={true}
            timeout={300}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <Alert
              severity={getSeverity(toast.priority)}
              icon={getIcon(toast.type)}
              className={`notification-toast ${toast.priority}`}
              sx={{
                width: "100%",
                "& .MuiAlert-message": {
                  width: "100%",
                  overflow: "hidden",
                },
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
                border: `1px solid ${
                  toast.priority === NotificationPriority.CRITICAL
                    ? "#d32f2f"
                    : toast.priority === NotificationPriority.HIGH
                    ? "#f57c00"
                    : toast.priority === NotificationPriority.MEDIUM
                    ? "#1976d2"
                    : "#616161"
                }`,
              }}
              action={
                <Box display="flex" alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => toggleDetails(toast.toastId)}
                    sx={{ mr: 0.5 }}
                  >
                    {toast.showDetails ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMarkRead(toast)}
                    sx={{ mr: 0.5 }}
                  >
                    <Close />
                  </IconButton>
                </Box>
              }
            >
              <AlertTitle
                sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
              >
                {toast.title}
                {toast.symbol && (
                  <Chip
                    label={toast.symbol}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: "20px" }}
                  />
                )}
                {toast.confidenceScore && (
                  <Chip
                    label={`${toast.confidenceScore}%`}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem", height: "20px" }}
                  />
                )}
              </AlertTitle>

              <Typography variant="body2" sx={{ mb: 1 }}>
                {toast.message}
              </Typography>

              <Collapse in={toast.showDetails}>
                <Box
                  sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                    borderRadius: 1,
                  }}
                >
                  {toast.metadata && (
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        Details:
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {Object.entries(toast.metadata).map(([key, value]) => (
                          <Typography
                            key={key}
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {key}:{" "}
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : value}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {toast.timeframe && (
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      Timeframe: {toast.timeframe}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {new Date(toast.createdAt).toLocaleString()}
                  </Typography>

                  {toast.expiresAt && (
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      Expires: {new Date(toast.expiresAt).toLocaleString()}
                    </Typography>
                  )}

                  <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                    <Chip
                      label={toast.type.replace("_", " ").toUpperCase()}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.6rem", height: "18px" }}
                    />
                    <Chip
                      label={toast.priority.toUpperCase()}
                      size="small"
                      color={getSeverity(toast.priority)}
                      variant="outlined"
                      sx={{ fontSize: "0.6rem", height: "18px" }}
                    />
                  </Box>
                </Box>
              </Collapse>

              {/* Action buttons for specific notification types */}
              {(toast.type === NotificationType.TRADING_OPPORTUNITY ||
                toast.type === NotificationType.RISK_MANAGEMENT) && (
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <button
                    className="toast-action-btn primary"
                    onClick={() => {
                      // Handle action (e.g., open trading interface)
                      console.log(`Action for ${toast.symbol}: ${toast.type}`);
                      handleMarkRead(toast);
                    }}
                  >
                    {toast.type === NotificationType.TRADING_OPPORTUNITY
                      ? "Trade Now"
                      : "Review Risk"}
                  </button>
                  <button
                    className="toast-action-btn secondary"
                    onClick={() => handleDismiss(toast)}
                  >
                    Dismiss
                  </button>
                </Box>
              )}
            </Alert>
          </Slide>
        ))}
      </Stack>
    </Box>
  );
};

export default NotificationToast;
