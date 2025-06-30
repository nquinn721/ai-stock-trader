import {
  Cancel,
  CheckCircle,
  Info,
  Timeline,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import "./AutoTradingOrderPreview.css";

// Types
interface AutoTradingOrder {
  id: string;
  portfolioId: string;
  symbol: string;
  action: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT" | "STOP_LOSS" | "STOP_LIMIT";
  quantity: number;
  limitPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  currentPrice?: number;
  estimatedValue?: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  reasoning: string[];
  notes?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXECUTED" | "EXPIRED";
  expiryTime: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderPreviewProps {
  portfolioId: string;
  onOrdersChanged?: () => void;
}

const AutoTradingOrderPreview: React.FC<OrderPreviewProps> = observer(
  ({ portfolioId, onOrdersChanged }) => {
    const [orders, setOrders] = useState<AutoTradingOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [orderDialogOpen, setOrderDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<AutoTradingOrder | null>(
      null
    );
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [orderToReject, setOrderToReject] = useState<string | null>(null);

    // Load pending orders
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/auto-trading/orders/preview/${portfolioId}`
        );
        const data = await response.json();

        if (data.success) {
          setOrders(data.data);
        } else {
          setError(data.message || "Failed to load orders");
        }
      } catch (err) {
        console.error("Error loading orders:", err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (portfolioId) {
        loadOrders();
      }
    }, [portfolioId]);

    // Handle order approval
    const handleApproveOrder = async (orderId: string) => {
      try {
        setActionLoading(orderId);
        const response = await fetch(
          `/api/auto-trading/orders/${orderId}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          await loadOrders();
          onOrdersChanged?.();
        } else {
          setError(data.message || "Failed to approve order");
        }
      } catch (err) {
        console.error("Error approving order:", err);
        setError("Failed to approve order");
      } finally {
        setActionLoading(null);
      }
    };

    // Handle order rejection
    const handleRejectOrder = async (orderId: string, reason: string) => {
      try {
        setActionLoading(orderId);
        const response = await fetch(
          `/api/auto-trading/orders/${orderId}/reject`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ reason }),
          }
        );

        const data = await response.json();
        if (data.success) {
          await loadOrders();
          onOrdersChanged?.();
          setShowRejectDialog(false);
          setOrderToReject(null);
          setRejectReason("");
        } else {
          setError(data.message || "Failed to reject order");
        }
      } catch (err) {
        console.error("Error rejecting order:", err);
        setError("Failed to reject order");
      } finally {
        setActionLoading(null);
      }
    };

    // Handle bulk approve
    const handleBulkApprove = async () => {
      try {
        setActionLoading("bulk");
        const promises = selectedOrders.map((orderId) =>
          fetch(`/api/auto-trading/orders/${orderId}/approve`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          })
        );

        await Promise.all(promises);
        setSelectedOrders([]);
        await loadOrders();
        onOrdersChanged?.();
      } catch (err) {
        console.error("Error bulk approving orders:", err);
        setError("Failed to bulk approve orders");
      } finally {
        setActionLoading(null);
      }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    // Get risk color
    const getRiskColor = (risk: string) => {
      switch (risk) {
        case "LOW":
          return "success";
        case "MEDIUM":
          return "warning";
        case "HIGH":
          return "error";
        default:
          return "default";
      }
    };

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case "PENDING":
          return "warning";
        case "APPROVED":
          return "success";
        case "REJECTED":
          return "error";
        case "EXECUTED":
          return "info";
        case "EXPIRED":
          return "default";
        default:
          return "default";
      }
    };

    if (loading) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      );
    }

    return (
      <div className="auto-trading-order-preview">
        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Pending Trading Orders</Typography>
          {selectedOrders.length > 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleBulkApprove}
              disabled={actionLoading === "bulk"}
              startIcon={
                actionLoading === "bulk" ? (
                  <CircularProgress size={16} />
                ) : (
                  <CheckCircle />
                )
              }
            >
              Approve Selected ({selectedOrders.length})
            </Button>
          )}
        </Box>

        {orders.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                No pending orders found.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        selectedOrders.length === orders.length &&
                        orders.length > 0
                      }
                      indeterminate={
                        selectedOrders.length > 0 &&
                        selectedOrders.length < orders.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrders(orders.map((order) => order.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Symbol</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Risk</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders([...selectedOrders, order.id]);
                          } else {
                            setSelectedOrders(
                              selectedOrders.filter((id) => id !== order.id)
                            );
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" fontWeight="bold">
                          {order.symbol}
                        </Typography>
                        {order.currentPrice && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            ${order.currentPrice.toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          order.action === "BUY" ? (
                            <TrendingUp />
                          ) : (
                            <TrendingDown />
                          )
                        }
                        label={order.action}
                        color={order.action === "BUY" ? "success" : "error"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>{order.quantity}</TableCell>
                    <TableCell>
                      {order.limitPrice
                        ? formatCurrency(order.limitPrice)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {order.estimatedValue
                        ? formatCurrency(order.estimatedValue)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.riskLevel}
                        color={getRiskColor(order.riskLevel) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2">
                          {Math.round(order.confidence * 100)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedOrder(order);
                              setOrderDialogOpen(true);
                            }}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                        {order.status === "PENDING" && (
                          <>
                            <Tooltip title="Approve Order">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApproveOrder(order.id)}
                                disabled={actionLoading === order.id}
                              >
                                {actionLoading === order.id ? (
                                  <CircularProgress size={16} />
                                ) : (
                                  <CheckCircle />
                                )}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Order">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setOrderToReject(order.id);
                                  setShowRejectDialog(true);
                                }}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Order Details Dialog */}
        <Dialog
          open={orderDialogOpen}
          onClose={() => setOrderDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <Timeline />
              Order Details - {selectedOrder?.symbol}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedOrder && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Order Information
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Symbol:</strong> {selectedOrder.symbol}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Action:</strong> {selectedOrder.action}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedOrder.orderType}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Quantity:</strong> {selectedOrder.quantity}
                  </Typography>
                  {selectedOrder.limitPrice && (
                    <Typography variant="body2">
                      <strong>Limit Price:</strong>{" "}
                      {formatCurrency(selectedOrder.limitPrice)}
                    </Typography>
                  )}
                  {selectedOrder.stopLossPrice && (
                    <Typography variant="body2">
                      <strong>Stop Loss:</strong>{" "}
                      {formatCurrency(selectedOrder.stopLossPrice)}
                    </Typography>
                  )}
                  {selectedOrder.takeProfitPrice && (
                    <Typography variant="body2">
                      <strong>Take Profit:</strong>{" "}
                      {formatCurrency(selectedOrder.takeProfitPrice)}
                    </Typography>
                  )}
                </Box>

                <Typography variant="h6" gutterBottom>
                  Analysis
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Risk Level:</strong>{" "}
                    <Chip
                      label={selectedOrder.riskLevel}
                      color={getRiskColor(selectedOrder.riskLevel) as any}
                      size="small"
                    />
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Confidence:</strong>{" "}
                    {Math.round(selectedOrder.confidence * 100)}%
                  </Typography>
                </Box>

                <Typography variant="h6" gutterBottom>
                  Reasoning
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {selectedOrder.reasoning.map((reason, index) => (
                    <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                      • {reason}
                    </Typography>
                  ))}
                </Box>

                {selectedOrder.notes && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Notes
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {selectedOrder.notes}
                    </Typography>
                  </>
                )}

                <Typography variant="h6" gutterBottom>
                  Timestamps
                </Typography>
                <Box>
                  <Typography variant="body2">
                    <strong>Created:</strong>{" "}
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Updated:</strong>{" "}
                    {new Date(selectedOrder.updatedAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Expires:</strong>{" "}
                    {new Date(selectedOrder.expiryTime).toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOrderDialogOpen(false)}>Close</Button>
            {selectedOrder?.status === "PENDING" && (
              <>
                <Button
                  color="error"
                  onClick={() => {
                    setOrderToReject(selectedOrder.id);
                    setShowRejectDialog(true);
                    setOrderDialogOpen(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => {
                    handleApproveOrder(selectedOrder.id);
                    setOrderDialogOpen(false);
                  }}
                  disabled={actionLoading === selectedOrder.id}
                >
                  {actionLoading === selectedOrder.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    "Approve"
                  )}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Reject Order Dialog */}
        <Dialog
          open={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Reject Order</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Please provide a reason for rejecting this order:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              onClick={() =>
                orderToReject && handleRejectOrder(orderToReject, rejectReason)
              }
              disabled={actionLoading === orderToReject}
            >
              {actionLoading === orderToReject ? (
                <CircularProgress size={20} />
              ) : (
                "Reject Order"
              )}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
);

export default AutoTradingOrderPreview;
