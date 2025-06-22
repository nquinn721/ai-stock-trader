import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StockAutocomplete from "./StockAutocomplete";

const mockStocks = [
  { symbol: "AAPL", name: "Apple Inc." },
  { symbol: "GOOGL", name: "Alphabet Inc." },
  { symbol: "MSFT", name: "Microsoft Corporation" },
  { symbol: "AMZN", name: "Amazon.com Inc." },
  { symbol: "TSLA", name: "Tesla Inc." },
];

describe("StockAutocomplete", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders input field", () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("displays placeholder text", () => {
    render(
      <StockAutocomplete
        stocks={mockStocks}
        value=""
        onChange={mockOnChange}
        placeholder="Select stock"
      />
    );
    expect(screen.getByPlaceholderText("Select stock")).toBeInTheDocument();
  });
  it("shows dropdown when typing", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "A");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("AMZN")).toBeInTheDocument();
    });
  });
  it("filters stocks based on input", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "APP");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.queryByText("GOOGL")).not.toBeInTheDocument();
    });
  });

  it("calls onChange when option is selected", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "A");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("AAPL"));
    expect(mockOnChange).toHaveBeenCalledWith("AAPL");
  });

  it("hides dropdown when clicking outside", async () => {
    render(
      <div>
        <StockAutocomplete
          stocks={mockStocks}
          value=""
          onChange={mockOnChange}
        />
        <button>Outside</button>
      </div>
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "A");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Outside"));

    await waitFor(() => {
      expect(screen.queryByText("AAPL")).not.toBeInTheDocument();
    });
  });

  it("handles keyboard navigation", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "A");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard("{Enter}");

    expect(mockOnChange).toHaveBeenCalledWith("AAPL");
  });

  it('displays "No matches found" when no stocks match', async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "XYZ");

    await waitFor(() => {
      expect(screen.getByText("No matches found")).toBeInTheDocument();
    });
  });
});
