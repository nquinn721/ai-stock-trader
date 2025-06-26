import { ThemeProvider, createTheme } from "@mui/material/styles";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { tradingAssistantService } from "../services/tradingAssistantService";
import TradingAssistantChat from "./TradingAssistantChat";

// Mock the trading assistant service
jest.mock("../services/tradingAssistantService", () => ({
  tradingAssistantService: {
    sendMessage: jest.fn(),
    createNewConversation: jest.fn(),
    endConversation: jest.fn(),
  },
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("TradingAssistantChat", () => {
  const mockOnStockSelect = jest.fn();
  const mockOnOrderAction = jest.fn();
  const mockOnViewAnalysis = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render initial welcome message", () => {
    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    expect(screen.getByText("AI Trading Assistant")).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome to your AI Trading Assistant/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ask me about any stock's performance/)
    ).toBeInTheDocument();
  });

  it("should show input field and send button", () => {
    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    expect(
      screen.getByPlaceholderText(/Ask me about stocks/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
  });

  it("should send message when send button is clicked", async () => {
    const mockResponse = {
      response: "AAPL is currently showing strong technical indicators...",
      confidence: 0.85,
      sources: ["Technical Analysis"],
      actions: [
        {
          type: "VIEW_STOCK" as const,
          symbol: "AAPL",
          description: "View detailed analysis for AAPL",
        },
      ],
    };

    (tradingAssistantService.sendMessage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    const sendButton = screen.getByRole("button", { name: /send/i });

    await userEvent.type(input, "What do you think about AAPL?");
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(tradingAssistantService.sendMessage).toHaveBeenCalledWith(
        "What do you think about AAPL?",
        undefined
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/AAPL is currently showing strong/)
      ).toBeInTheDocument();
    });
  });

  it("should send message when Enter key is pressed", async () => {
    const mockResponse = {
      response: "Market is showing mixed signals today...",
      confidence: 0.7,
      sources: ["Market Analysis"],
      actions: [],
    };

    (tradingAssistantService.sendMessage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);

    await userEvent.type(input, "How are markets today?");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(tradingAssistantService.sendMessage).toHaveBeenCalledWith(
        "How are markets today?",
        undefined
      );
    });
  });

  it("should not send empty messages", async () => {
    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const sendButton = screen.getByRole("button", { name: /send/i });

    // Button should be disabled when input is empty
    expect(sendButton).toBeDisabled();

    await userEvent.click(sendButton);

    expect(tradingAssistantService.sendMessage).not.toHaveBeenCalled();
  });

  it("should display confidence scores for AI responses", async () => {
    const mockResponse = {
      response: "Based on technical analysis...",
      confidence: 0.92,
      sources: ["Technical Analysis"],
      actions: [],
    };

    (tradingAssistantService.sendMessage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    await userEvent.type(input, "Analyze TSLA");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("92% confidence")).toBeInTheDocument();
    });
  });

  it("should render action buttons for AI suggestions", async () => {
    const mockResponse = {
      response: "Consider buying AAPL based on current trends.",
      confidence: 0.8,
      sources: ["Market Data"],
      actions: [
        {
          type: "VIEW_STOCK" as const,
          symbol: "AAPL",
          description: "View AAPL Details",
        },
        {
          type: "PLACE_ORDER" as const,
          description: "Place Buy Order",
          parameters: { action: "BUY" },
          symbol: "AAPL",
        },
      ],
    };

    (tradingAssistantService.sendMessage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    await userEvent.type(input, "Should I buy AAPL?");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("View AAPL Details")).toBeInTheDocument();
      expect(screen.getByText("Place Buy Order")).toBeInTheDocument();
    });
  });

  it("should call callback functions when action buttons are clicked", async () => {
    const mockResponse = {
      response: "Here are your options for AAPL.",
      confidence: 0.8,
      sources: ["Market Data"],
      actions: [
        {
          type: "VIEW_STOCK" as const,
          symbol: "AAPL",
          description: "View Stock Details",
        },
        {
          type: "PLACE_ORDER" as const,
          description: "Buy AAPL",
          parameters: { action: "BUY" },
          symbol: "AAPL",
        },
        {
          type: "VIEW_ANALYSIS" as const,
          description: "View Portfolio",
          parameters: { view: "portfolio" },
        },
      ],
    };

    (tradingAssistantService.sendMessage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    await userEvent.type(input, "What about AAPL?");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText("View Stock Details")).toBeInTheDocument();
    });

    // Click view stock action
    await userEvent.click(screen.getByText("View Stock Details"));
    expect(mockOnStockSelect).toHaveBeenCalledWith("AAPL");

    // Click place order action
    await userEvent.click(screen.getByText("Buy AAPL"));
    expect(mockOnOrderAction).toHaveBeenCalledWith("BUY", "AAPL");

    // Click view analysis action
    await userEvent.click(screen.getByText("View Portfolio"));
    expect(mockOnViewAnalysis).toHaveBeenCalledWith("portfolio");
  });

  it("should show loading indicator while processing", async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (tradingAssistantService.sendMessage as jest.Mock).mockReturnValue(
      delayedPromise
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    await userEvent.type(input, "Tell me about the market");
    await userEvent.keyboard("{Enter}");

    // Should show loading indicator
    expect(screen.getByText("AI is thinking...")).toBeInTheDocument();

    // Resolve the promise
    resolvePromise!({
      response: "Market analysis complete.",
      confidence: 0.8,
      sources: ["Analysis"],
      actions: [],
    });

    await waitFor(() => {
      expect(screen.queryByText("AI is thinking...")).not.toBeInTheDocument();
    });
  });

  it("should handle API errors gracefully", async () => {
    (tradingAssistantService.sendMessage as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    await userEvent.type(input, "What should I do?");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByText(/having trouble connecting/)).toBeInTheDocument();
    });
  });

  it("should create new conversation when refresh button is clicked", async () => {
    (
      tradingAssistantService.createNewConversation as jest.Mock
    ).mockResolvedValue("new-conversation-id");

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const refreshButton = screen.getByTitle("Start New Conversation");
    await userEvent.click(refreshButton);

    await waitFor(() => {
      expect(tradingAssistantService.createNewConversation).toHaveBeenCalled();
    });
  });

  it("should display message timestamps", async () => {
    const mockResponse = {
      response: "Market update complete.",
      confidence: 0.8,
      sources: ["Market Data"],
      actions: [],
    };

    (tradingAssistantService.sendMessage as jest.Mock).mockResolvedValue(
      mockResponse
    );

    renderWithTheme(
      <TradingAssistantChat
        onStockSelect={mockOnStockSelect}
        onOrderAction={mockOnOrderAction}
        onViewAnalysis={mockOnViewAnalysis}
      />
    );

    const input = screen.getByPlaceholderText(/Ask me about stocks/);
    await userEvent.type(input, "Update me");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => {
      // Check that timestamps are displayed (they show current time)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });
});
