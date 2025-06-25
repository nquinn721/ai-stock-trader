import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/react";
import PriceChart from "../components/PriceChart";
import { renderWithStoreProvider } from "./test-utils";

// Mock the CSS import
jest.mock("../components/PriceChart.css", () => ({}));

describe("PriceChart Component", () => {
  const defaultProps = {
    symbol: "AAPL",
    currentPrice: 150.25,
    changePercent: 2.5,
  };

  test("renders price chart with default props", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} />);

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("1H")).toBeInTheDocument();

    // Wait for chart to load
    await waitFor(
      () => {
        expect(screen.getByText("+2.50%")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("displays real-time indicator when market is open", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} showRealTime={true} />);

    await waitFor(
      () => {
        expect(screen.getByText("LIVE")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("shows negative price change styling", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} changePercent={-1.5} />);

    await waitFor(
      () => {
        const changeElement = screen.getByText("-1.50%");
        expect(changeElement).toHaveClass("negative");
      },
      { timeout: 3000 }
    );
  });

  test("shows positive price change styling", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} />);

    await waitFor(
      () => {
        const changeElement = screen.getByText("+2.50%");
        expect(changeElement).toHaveClass("positive");
      },
      { timeout: 3000 }
    );
  });

  test("renders with custom height", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} height={200} />);

    const chartContainer = screen.getByText("AAPL").closest(".price-chart");
    expect(chartContainer).toHaveStyle("height: 200px");
  });

  test("displays volume information", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} />);

    await waitFor(
      () => {
        expect(screen.getByText(/Vol:/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test("renders different time periods", async () => {
    renderWithStoreProvider(<PriceChart {...defaultProps} period="1D" />);

    expect(screen.getByText("1D")).toBeInTheDocument();
  });
});
