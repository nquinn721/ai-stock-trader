import {
  Analytics as AnalyticsIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { notificationService } from "../../services/notificationService";
import { Notification, NotificationType } from "../../types/notification.types";

interface NotificationManagementProps {
  userId: string;
}

interface NotificationAnalytics {
  summary: {
    total: number;
    unread: number;
    recent: number;
    readRate: string;
  };
  byType: Array<{ type: string; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  dailyActivity: Array<{ date: string; count: number }>;
}

const NotificationManagement: React.FC<NotificationManagementProps> = ({
  userId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(
    null
  );
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    priority: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analyticsDialogOpen, setAnalyticsDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"history" | "search">(
    "history"
  );

  useEffect(() => {
    loadNotificationHistory();
    loadAnalytics();
  }, [userId, page, filters]);

  const loadNotificationHistory = async () => {
    setLoading(true);
    try {
      const filterData = {
        type: filters.type as NotificationType | undefined,
        priority: filters.priority || undefined,
        status: filters.status || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      };

      const result = await notificationService.getNotificationHistory(
        userId,
        page,
        20,
        filterData
      );

      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to load notification history:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await notificationService.getNotificationAnalytics(
        userId
      );
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setCurrentView("history");
      loadNotificationHistory();
      return;
    }

    setLoading(true);
    setCurrentView("search");
    try {
      const result = await notificationService.searchNotifications(
        userId,
        searchQuery,
        page,
        20
      );

      setNotifications(result.notifications);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error("Failed to search notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await notificationService.bulkDeleteNotifications(
        userId,
        selectedNotifications
      );
      setSelectedNotifications([]);
      if (currentView === "history") {
        loadNotificationHistory();
      } else {
        handleSearch();
      }
      loadAnalytics();
    } catch (error) {
      console.error("Failed to bulk delete notifications:", error);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      await notificationService.bulkArchiveNotifications(
        userId,
        selectedNotifications
      );
      setSelectedNotifications([]);
      if (currentView === "history") {
        loadNotificationHistory();
      } else {
        handleSearch();
      }
      loadAnalytics();
    } catch (error) {
      console.error("Failed to bulk archive notifications:", error);
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      const filterData = {
        type: filters.type as NotificationType | undefined,
        priority: filters.priority || undefined,
        status: filters.status || undefined,
        dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
        dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
      };

      const result = await notificationService.exportNotifications(
        userId,
        format,
        filterData
      );

      notificationService.downloadFile(
        result.data,
        result.filename,
        result.contentType
      );
    } catch (error) {
      console.error("Failed to export notifications:", error);
    }
  };

  const handleNotificationSelection = (
    notificationId: string,
    selected: boolean
  ) => {
    if (selected) {
      setSelectedNotifications((prev) => [...prev, notificationId]);
    } else {
      setSelectedNotifications((prev) =>
        prev.filter((id) => id !== notificationId)
      );
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Notification Management
      </Typography>

      {/* Analytics Summary */}
      {analytics && (
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title="Quick Stats"
            action={
              <Button
                startIcon={<AnalyticsIcon />}
                onClick={() => setAnalyticsDialogOpen(true)}
              >
                View Analytics
              </Button>
            }
          />
          <CardContent>
            {" "}
            <Box sx={{ display: "flex", gap: 3 }}>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="h6">{analytics.summary.total}</Typography>
                <Typography variant="body2">Total Notifications</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="h6">{analytics.summary.unread}</Typography>
                <Typography variant="body2">Unread</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="h6">{analytics.summary.recent}</Typography>
                <Typography variant="body2">Recent (30 days)</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "center" }}>
                <Typography variant="h6">
                  {analytics.summary.readRate}%
                </Typography>
                <Typography variant="body2">Read Rate</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          {" "}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: "1 1 300px", minWidth: "300px" }}>
              <TextField
                fullWidth
                label="Search notifications"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                InputProps={{
                  endAdornment: (
                    <Button onClick={handleSearch} size="small">
                      <SearchIcon />
                    </Button>
                  ),
                }}
              />
            </Box>
            <Box sx={{ flex: "1 1 150px", minWidth: "150px" }}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, type: e.target.value }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="trading_opportunity">Trading</MenuItem>
                  <MenuItem value="pattern_alert">Pattern</MenuItem>
                  <MenuItem value="technical_alert">Technical</MenuItem>
                  <MenuItem value="risk_management">Risk</MenuItem>
                  <MenuItem value="market_event">Market Event</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 150px", minWidth: "150px" }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: "1 1 150px", minWidth: "150px" }}>
              <TextField
                fullWidth
                type="date"
                label="From Date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box sx={{ flex: "1 1 150px", minWidth: "150px" }}>
              <TextField
                fullWidth
                type="date"
                label="To Date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Typography variant="body1">
                {selectedNotifications.length} notifications selected
              </Typography>
              <Button
                startIcon={<ArchiveIcon />}
                onClick={handleBulkArchive}
                variant="outlined"
              >
                Archive Selected
              </Button>
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                variant="outlined"
                color="error"
              >
                Delete Selected
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport("json")}
                variant="outlined"
              >
                Export JSON
              </Button>
              <Button
                startIcon={<DownloadIcon />}
                onClick={() => handleExport("csv")}
                variant="outlined"
              >
                Export CSV
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Notifications Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedNotifications.length > 0 &&
                        selectedNotifications.length < notifications.length
                      }
                      checked={
                        notifications.length > 0 &&
                        selectedNotifications.length === notifications.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(
                            notifications.map((n) => n.id.toString())
                          );
                        } else {
                          setSelectedNotifications([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedNotifications.includes(
                          notification.id.toString()
                        )}
                        onChange={(e) =>
                          handleNotificationSelection(
                            notification.id.toString(),
                            e.target.checked
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={notification.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={getPriorityColor(notification.priority) as any}
                      />
                    </TableCell>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>
                      {notification.message?.substring(0, 100)}...
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notification.status}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(notification.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Analytics Dialog */}
      <Dialog
        open={analyticsDialogOpen}
        onClose={() => setAnalyticsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Notification Analytics</DialogTitle>
        <DialogContent>
          {analytics && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                <Box sx={{ flex: 1, minWidth: "250px" }}>
                  <Typography variant="h6" gutterBottom>
                    By Type
                  </Typography>
                  {analytics.byType.map((item) => (
                    <Box
                      key={item.type}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>{item.type}</Typography>
                      <Typography>{item.count}</Typography>
                    </Box>
                  ))}
                </Box>
                <Box sx={{ flex: 1, minWidth: "250px" }}>
                  <Typography variant="h6" gutterBottom>
                    By Priority
                  </Typography>
                  {analytics.byPriority.map((item) => (
                    <Box
                      key={item.priority}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>{item.priority}</Typography>
                      <Typography>{item.count}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Daily Activity (Last 30 Days)
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                  {analytics.dailyActivity.map((day) => (
                    <Box
                      key={day.date}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography>{day.date}</Typography>
                      <Typography>{day.count}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManagement;
