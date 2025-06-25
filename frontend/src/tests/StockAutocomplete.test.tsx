import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import StockAutocomplete from "../components/StockAutocomplete";

describe("StockAutocomplete", () => {
  const mockStocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "TSLA", name: "Tesla Inc." },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("renders input field with placeholder", () => {
    render(
      <StockAutocomplete
        stocks={mockStocks}
        value=""
        onChange={mockOnChange}
        placeholder="Search stocks..."
      />
    );

    expect(screen.getByPlaceholderText("Search stocks...")).toBeInTheDocument();
  });

  it("displays all stocks when input is focused and empty", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("GOOGL")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Corporation")).toBeInTheDocument();
    });
  });

  it("filters stocks by symbol when typing", async () => {
    const TestComponent = () => {
      const [value, setValue] = useState("");
      return (
        <StockAutocomplete
          stocks={mockStocks}
          value={value}
          onChange={setValue}
        />
      );
    };

    render(<TestComponent />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "AAP");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
      expect(screen.queryByText("GOOGL")).not.toBeInTheDocument();
    });
  });

  it("filters stocks by company name when typing", async () => {
    const TestComponent = () => {
      const [value, setValue] = useState("");
      return (
        <StockAutocomplete
          stocks={mockStocks}
          value={value}
          onChange={setValue}
        />
      );
    };

    render(<TestComponent />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "apple");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
      expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
      expect(screen.queryByText("GOOGL")).not.toBeInTheDocument();
    });
  });

  it("shows no results message when no stocks match", async () => {
    const TestComponent = () => {
      const [value, setValue] = useState("");
      return (
        <StockAutocomplete
          stocks={mockStocks}
          value={value}
          onChange={setValue}
        />
      );
    };

    render(<TestComponent />);

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "XYZ");

    await waitFor(() => {
      expect(screen.getByText("No stocks found")).toBeInTheDocument();
      expect(
        screen.getByText(/Try searching for: AAPL, GOOGL/)
      ).toBeInTheDocument();
    });
  });

  it("selects stock when option is clicked", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("AAPL"));

    expect(mockOnChange).toHaveBeenCalledWith("AAPL");
  });

  it("handles keyboard navigation with arrow keys", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    }); // Navigate down
    userEvent.keyboard("{ArrowDown}");
    userEvent.keyboard("{ArrowDown}");

    // Select with Enter
    userEvent.keyboard("{Enter}");

    expect(mockOnChange).toHaveBeenCalledWith("GOOGL");
  });

  it("closes dropdown on Escape key", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    userEvent.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByText("AAPL")).not.toBeInTheDocument();
    });
  });

  it("converts input to uppercase", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "aapl");

    expect(mockOnChange).toHaveBeenLastCalledWith("L");
  });

  it("is disabled when disabled prop is true", () => {
    render(
      <StockAutocomplete
        stocks={mockStocks}
        value=""
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("closes dropdown when clicking outside", async () => {
    render(
      <div>
        <StockAutocomplete
          stocks={mockStocks}
          value=""
          onChange={mockOnChange}
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const input = screen.getByRole("textbox");
    await userEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    // Click outside
    await userEvent.click(screen.getByTestId("outside"));

    await waitFor(() => {
      expect(screen.queryByText("AAPL")).not.toBeInTheDocument();
    });
  });

  it("maintains case-insensitive filtering", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "microsoft");

    await waitFor(() => {
      expect(screen.getByText("MSFT")).toBeInTheDocument();
      expect(screen.getByText("Microsoft Corporation")).toBeInTheDocument();
    });
  });

  it("highlights first option when typing and Enter selects it", async () => {
    render(
      <StockAutocomplete stocks={mockStocks} value="" onChange={mockOnChange} />
    );

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "AAP");

    await waitFor(() => {
      expect(screen.getByText("AAPL")).toBeInTheDocument();
    });

    userEvent.keyboard("{Enter}");

    expect(mockOnChange).toHaveBeenCalledWith("AAPL");
  });

  it("applies custom className", () => {
    const { container } = render(
      <StockAutocomplete
        stocks={mockStocks}
        value=""
        onChange={mockOnChange}
        className="custom-class"
      />
    );

    expect(
      container.querySelector(".stock-autocomplete.custom-class")
    ).toBeInTheDocument();
  });
});
