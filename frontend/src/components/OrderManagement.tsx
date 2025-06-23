import {
  Add as AddIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Order, Portfolio } from "../types";
import CreateOrderForm from "./CreateOrderForm";

interface OrderManagementProps {
  portfolios: Portfolio[];
  selectedPortfolioId?: number;
}

export default function OrderManagement({
  portfolios,
  selectedPortfolioId,
}: OrderManagementProps) {
  const { socket, createOrder, cancelOrder, getOrderBook } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (socket) {
      // Listen for order events
      socket.on("order_created", handleOrderCreated);
      socket.on("order_canceled", handleOrderCanceled);
      socket.on("order_executed", handleOrderExecuted);
      socket.on("order_execution_failed", handleOrderExecutionFailed);
      socket.on("order_book_update", handleOrderBookUpdate);
      socket.on("order_book_data", handleOrderBookData);
      socket.on("order_error", handleOrderError);

      // Request initial order book
      fetchOrderBook();

      return () => {
        socket.off("order_created", handleOrderCreated);
        socket.off("order_canceled", handleOrderCanceled);
        socket.off("order_executed", handleOrderExecuted);
        socket.off("order_execution_failed", handleOrderExecutionFailed);
        socket.off("order_book_update", handleOrderBookUpdate);
        socket.off("order_book_data", handleOrderBookData);
        socket.off("order_error", handleOrderError);
      };
    }
  }, [socket]);
  const fetchOrderBook = () => {
    getOrderBook();
  };

  const handleOrderCreated = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    setSuccess("Order created successfully");
    setIsCreateOrderOpen(false);
  };

  const handleOrderCanceled = (data: { orderId: number }) => {
    setOrders((prev) => prev.filter((order) => order.id !== data.orderId));
    setSuccess("Order canceled successfully");
  };

  const handleOrderExecuted = (executionData: any) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === executionData.orderId
          ? {
              ...order,
              status: "executed",
              executedPrice: executionData.executedPrice,
            }
          : order
      )
    );
    setSuccess(`Order executed at $${executionData.executedPrice}`);
  };

  const handleOrderExecutionFailed = (failureData: any) => {
    setError(`Order execution failed: ${failureData.message}`);
  };

  const handleOrderBookUpdate = (updateData: any) => {
    // Handle real-time order book updates
    if (updateData.orderId && updateData.status === "canceled") {
      setOrders((prev) =>
        prev.filter((order) => order.id !== updateData.orderId)
      );
    } else if (updateData.id) {
      setOrders((prev) => [
        updateData,
        ...prev.filter((order) => order.id !== updateData.id),
      ]);
    }
  };

  const handleOrderBookData = (orderBookData: Order[]) => {
    setOrders(orderBookData);
  };

  const handleOrderError = (error: any) => {
    setError(error.message || "An error occurred with your order");
  };
  const handleCreateOrder = (orderData: any) => {
    createOrder(orderData);
  };

  const handleCancelOrder = (orderId: number) => {
    cancelOrder(orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "triggered":
        return "info";
      case "executed":
        return "success";
      case "cancelled":
        return "error";
      case "expired":
        return "default";
      default:
        return "default";
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    return price ? `$${price.toFixed(2)}` : "N/A";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter orders by selected portfolio if specified
  const filteredOrders = selectedPortfolioId
    ? orders.filter((order) => order.portfolioId === selectedPortfolioId)
    : orders;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" component="h2">
          Order Management
        </Typography>
        <Box>
          <IconButton onClick={fetchOrderBook} title="Refresh">
            <RefreshIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateOrderOpen(true)}
            disabled={!portfolios.length}
          >
            Create Order
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Portfolio</TableCell>
              <TableCell>Symbol</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Limit Price</TableCell>
              <TableCell>Stop Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  <Typography variant="body2" color="textSecondary">
                    No orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    {portfolios.find((p) => p.id === order.portfolioId)?.name ||
                      `Portfolio ${order.portfolioId}`}
                  </TableCell>
                  <TableCell>{order.symbol}</TableCell>
                  <TableCell>{order.orderType}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.side}
                      size="small"
                      color={order.side === "buy" ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>{formatPrice(order.limitPrice)}</TableCell>
                  <TableCell>{formatPrice(order.stopPrice)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={getStatusColor(order.status) as any}
                    />
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>
                    {(order.status === "pending" ||
                      order.status === "triggered") && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleCancelOrder(order.id)}
                        title="Cancel Order"
                      >
                        <CancelIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Order Dialog */}
      <Dialog
        open={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Order</DialogTitle>
        <DialogContent>
          <CreateOrderForm
            portfolios={portfolios}
            onSubmit={handleCreateOrder}
            onCancel={() => setIsCreateOrderOpen(false)}
            defaultPortfolioId={selectedPortfolioId}
          />
        </DialogContent>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
