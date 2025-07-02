import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock mobx-react-lite observer to return the component as-is
jest.mock("mobx-react-lite", () => ({
  observer: (component: any) => component,
}));

import AutoTradingOrderPreview from "./AutoTradingOrderPreview";

// Debug the import
console.log("AutoTradingOrderPreview imported:", AutoTradingOrderPreview);
console.log("Type of AutoTradingOrderPreview:", typeof AutoTradingOrderPreview);

// Mock fetch globally
global.fetch = jest.fn();

const mockOrders = [
  {
    id: "order-1",
    portfolioId: "1",
    symbol: "AAPL",
    action: "BUY",
    orderType: "LIMIT",
    quantity: 100,
    limitPrice: 150.0,
    stopLossPrice: 140.0,
    takeProfitPrice: 160.0,
    currentPrice: 149.5,
    estimatedValue: 14950,
    riskLevel: "MEDIUM",
    confidence: 0.85,
    reasoning: ["Strong earnings report", "Positive market sentiment"],
    notes: "High confidence buy signal",
    status: "PENDING",
    expiryTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "order-2",
    portfolioId: "1",
    symbol: "GOOGL",
    action: "SELL",
    orderType: "MARKET",
    quantity: 50,
    currentPrice: 2800.0,
    estimatedValue: 140000,
    riskLevel: "LOW",
    confidence: 0.92,
    reasoning: ["Technical resistance level", "Overbought conditions"],
    status: "PENDING",
    expiryTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe("AutoTradingOrderPreview", () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders component with loading state initially", () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AutoTradingOrderPreview portfolioId="1" />);

    expect(screen.getByText("Loading pending orders...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders orders table when orders are loaded", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Pending Auto Trading Orders")
      ).toBeInTheDocument();
    });

    // Check summary stats
    expect(screen.getByText("Total Orders")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Buy Orders")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Sell Orders")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Quantity")).toBeInTheDocument();
    expect(screen.getByText("Risk")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();

    // Check order data
    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("GOOGL")).toBeInTheDocument();
    expect(screen.getByText("BUY")).toBeInTheDocument();
    expect(screen.getByText("SELL")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("shows no data message when no orders exist", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    await waitFor(() => {
      expect(
        screen.getByText("No pending auto trading orders")
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "Orders will appear here when the recommendation engine generates trading signals"
      )
    ).toBeInTheDocument();
  });

  it("displays error message on fetch failure", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<AutoTradingOrderPreview portfolioId="1" />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load pending orders")
      ).toBeInTheDocument();
    });
  });

  it("handles order approval", async () => {
    // Mock initial orders fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    // Mock approval API call
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: "Order approved successfully",
      }),
    });

    // Mock refresh call after approval
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ ...mockOrders[0], status: "APPROVED" }, mockOrders[1]],
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Find and click approve button for first order
    const approveButtons = screen.getAllByTitle("Approve Order");
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auto-trading/orders/approve/order-1",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  it("handles order rejection with reason", async () => {
    // Mock initial orders fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Find and click reject button for first order
    const rejectButtons = screen.getAllByTitle("Reject Order");
    fireEvent.click(rejectButtons[0]);

    // Reject dialog should open
    await waitFor(() => {
      expect(screen.getByText("Reject Order")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to reject this order?")
      ).toBeInTheDocument();
    });

    // Type rejection reason
    const reasonInput = screen.getByLabelText("Rejection Reason (Optional)");
    fireEvent.change(reasonInput, { target: { value: "Risk too high" } });

    // Mock rejection API call
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: "Order rejected successfully",
      }),
    });

    // Mock refresh call after rejection
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [mockOrders[1]], // First order removed after rejection
      }),
    });

    // Click reject button in dialog
    const confirmRejectButton = screen.getByRole("button", {
      name: "Reject Order",
    });
    fireEvent.click(confirmRejectButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auto-trading/orders/reject/order-1",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "Risk too high" }),
        })
      );
    });
  });

  it("opens order details dialog", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Find and click view details button for first order
    const detailsButtons = screen.getAllByTitle("View Details");
    fireEvent.click(detailsButtons[0]);

    // Details dialog should open
    await waitFor(() => {
      expect(screen.getByText("Order Details - AAPL")).toBeInTheDocument();
      expect(screen.getByText("Order Information")).toBeInTheDocument();
      expect(screen.getByText("Pricing")).toBeInTheDocument();
      expect(screen.getByText("Recommendation Reasoning")).toBeInTheDocument();
    });

    // Check reasoning is displayed
    expect(screen.getByText("• Strong earnings report")).toBeInTheDocument();
    expect(screen.getByText("• Positive market sentiment")).toBeInTheDocument();

    // Check notes are displayed
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("High confidence buy signal")).toBeInTheDocument();
  });

  it("handles bulk order selection and approval", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Select all orders checkbox
    const selectAllCheckbox = screen.getAllByRole("checkbox")[0];
    fireEvent.click(selectAllCheckbox);

    // Bulk actions should appear
    await waitFor(() => {
      expect(screen.getByText("2 orders selected")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Approve All" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Reject All" })
      ).toBeInTheDocument();
    });

    // Mock bulk approval API call
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: "Orders approved successfully",
      }),
    });

    // Mock refresh call after bulk approval
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    // Click approve all
    const approveAllButton = screen.getByRole("button", {
      name: "Approve All",
    });
    fireEvent.click(approveAllButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/auto-trading/orders/bulk/approve",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderIds: ["order-1", "order-2"] }),
        })
      );
    });
  });

  it("refreshes orders periodically", async () => {
    jest.useFakeTimers();

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    render(<AutoTradingOrderPreview portfolioId="1" />);

    // Initial load
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    // Fast forward 30 seconds
    jest.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    jest.useRealTimers();
  });

  it("calls onOrdersChanged callback when provided", async () => {
    const mockOnOrdersChanged = jest.fn();

    // Mock initial orders fetch
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: mockOrders,
      }),
    });

    // Mock approval API call
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: "Order approved successfully",
      }),
    });

    // Mock refresh call after approval
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
      }),
    });

    render(
      <AutoTradingOrderPreview
        portfolioId="1"
        onOrdersChanged={mockOnOrdersChanged}
      />
    );

    // Wait for orders to load
    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Find and click approve button for first order
    const approveButtons = screen.getAllByTitle("Approve Order");
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockOnOrdersChanged).toHaveBeenCalled();
    });
  });
});
