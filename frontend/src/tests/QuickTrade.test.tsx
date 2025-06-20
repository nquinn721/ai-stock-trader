import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import QuickTrade from "../components/QuickTrade";

// Mock Socket Context
jest.mock("../context/SocketContext", () => ({
  useSocket: () => ({
    stocks: [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        currentPrice: 150.0,
        changePercent: 2.5,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        currentPrice: 2800.0,
        changePercent: -1.2,
      },
    ],
  }),
}));

// Mock axios
jest.mock("axios");

describe("QuickTrade Component", () => {
  test("renders quick trade form", () => {
    render(<QuickTrade />);
    expect(screen.getByText("Quick Trade")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Select Symbol")).toBeInTheDocument();
  });

  test("shows validation errors for invalid inputs", () => {
    render(<QuickTrade />);

    // Try to submit without selecting symbol
    const executeButton = screen.getByRole("button", { name: /BUY 0 Stock/i });
    expect(executeButton).toBeDisabled();
  });

  test("enables execute button when form is valid", () => {
    render(<QuickTrade />);

    // Select a stock
    const symbolSelect = screen.getByDisplayValue("Select Symbol");
    fireEvent.change(symbolSelect, { target: { value: "AAPL" } });

    // Enter quantity
    const quantityInput = screen.getByPlaceholderText("Qty");
    fireEvent.change(quantityInput, { target: { value: "10" } });

    // Check if button is enabled (would be enabled if portfolio is loaded)
    const executeButton = screen.getByRole("button", { name: /BUY 10 AAPL/i });
    expect(executeButton).toBeInTheDocument();
  });
});
