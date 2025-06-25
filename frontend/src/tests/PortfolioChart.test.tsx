import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/react";
import PortfolioChart from "../components/PortfolioChart";
import { renderWithStoreProvider } from "./test-utils";

// Mock the CSS import
jest.mock("../components/PortfolioChart.css", () => ({}));

describe("PortfolioChart Component", () => {
  test("renders portfolio chart with default props", async () => {
    renderWithStoreProvider(<PortfolioChart portfolioId={1} />);

    // Check if loading state appears first
    expect(screen.getByText("Loading performance data...")).toBeInTheDocument();

    // Wait for chart to load
    await waitFor(
      () => {
        expect(screen.getByText("Portfolio Performance")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("renders with custom timeframe", async () => {
    renderWithStoreProvider(<PortfolioChart portfolioId={1} timeframe="1W" />);

    await waitFor(
      () => {
        expect(screen.getByText("Portfolio Performance")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Check if 1W timeframe button is active
    const weekButton = screen.getByText("1W");
    expect(weekButton).toHaveClass("active");
  });

  test("handles timeframe changes", async () => {
    const mockOnTimeframeChange = jest.fn();

    renderWithStoreProvider(
      <PortfolioChart
        portfolioId={1}
        timeframe="1M"
        onTimeframeChange={mockOnTimeframeChange}
      />
    );

    await waitFor(
      () => {
        expect(screen.getByText("Portfolio Performance")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Click on 1Y timeframe
    const yearButton = screen.getByText("1Y");
    yearButton.click();

    expect(mockOnTimeframeChange).toHaveBeenCalledWith("1Y");
  });

  test("displays performance metrics", async () => {
    renderWithStoreProvider(<PortfolioChart portfolioId={1} />);

    await waitFor(
      () => {
        expect(screen.getByText("Total Return")).toBeInTheDocument();
        expect(screen.getByText("Max Drawdown")).toBeInTheDocument();
        expect(screen.getByText("Volatility")).toBeInTheDocument();
        expect(screen.getByText("Sharpe Ratio")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("renders metric selector buttons", async () => {
    renderWithStoreProvider(<PortfolioChart portfolioId={1} />);

    await waitFor(
      () => {
        expect(screen.getByText("Value")).toBeInTheDocument();
        expect(screen.getByText("Return %")).toBeInTheDocument();
        expect(screen.getByText("P&L")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
