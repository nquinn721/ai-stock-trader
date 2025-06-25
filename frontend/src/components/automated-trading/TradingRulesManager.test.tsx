import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RootStore } from "../../stores/RootStore";
import { StoreProvider } from "../../stores/StoreContext";
import { TradingRule } from "../../types/autoTrading.types";
import { TradingRulesManager } from "./TradingRulesManager";

// Mock the RuleBuilder component
jest.mock("./RuleBuilder", () => {
  return function MockRuleBuilder({ onSave, onCancel }: any) {
    return (
      <div data-testid="rule-builder">
        <button
          onClick={() =>
            onSave({ name: "Test Rule", description: "Test Description" })
          }
        >
          Save Rule
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

// Mock trading rules data
const mockTradingRules: TradingRule[] = [
  {
    id: "1",
    portfolioId: "portfolio-1",
    name: "Buy Signal Rule",
    description: "Buy when RSI is oversold",
    isActive: true,
    priority: 1,
    ruleType: "entry",
    conditions: [
      {
        id: "1",
        field: "rsi",
        operator: "less_than",
        value: 30,
      },
    ],
    actions: [
      {
        id: "1",
        type: "buy",
        parameters: {
          sizingMethod: "fixed",
          sizeValue: 100,
        },
      },
    ],
    lastTriggered: new Date(),
    performance: {
      successRate: 75.5,
      totalPnL: 1250.3,
      totalTrades: 25,
      successfulTrades: 19,
      averagePnL: 50.01,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    portfolioId: "portfolio-1",
    name: "Sell Signal Rule",
    description: "Sell when RSI is overbought",
    isActive: false,
    priority: 2,
    ruleType: "exit",
    conditions: [
      {
        id: "2",
        field: "rsi",
        operator: "greater_than",
        value: 70,
      },
    ],
    actions: [
      {
        id: "2",
        type: "sell",
        parameters: {
          sizingMethod: "percentage",
          sizeValue: 50,
        },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe("TradingRulesManager", () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      autoTradingStore: {
        tradingRules: mockTradingRules,
        isLoading: false,
        error: null,
        loadTradingRules: jest.fn(),
        updateTradingRule: jest.fn(),
        deleteTradingRule: jest.fn(),
        createTradingRule: jest.fn(),
        importTradingRules: jest.fn(),
      },
    };
  });

  const renderComponent = (portfolioId?: string) => {
    return render(
      <StoreProvider store={mockStore as RootStore}>
        <TradingRulesManager portfolioId={portfolioId} />
      </StoreProvider>
    );
  };

  describe("Component Rendering", () => {
    it("renders trading rules manager with header", () => {
      renderComponent();
      expect(screen.getByText("Trading Rules")).toBeInTheDocument();
      expect(screen.getByText("Create Rule")).toBeInTheDocument();
    });

    it("renders portfolio-specific header when portfolioId provided", () => {
      renderComponent("portfolio-1");
      expect(
        screen.getByText("Trading Rules for Portfolio portfolio-1")
      ).toBeInTheDocument();
    });

    it("displays loading state when isLoading is true", () => {
      mockStore.autoTradingStore.isLoading = true;
      renderComponent();
      expect(screen.getByText("Loading trading rules...")).toBeInTheDocument();
    });

    it("displays error message when error exists", () => {
      mockStore.autoTradingStore.error = "Failed to load rules";
      renderComponent();
      expect(
        screen.getByText("Error: Failed to load rules")
      ).toBeInTheDocument();
    });
  });

  describe("Trading Rules Display", () => {
    it("renders list of trading rules", () => {
      renderComponent();
      expect(screen.getByText("Buy Signal Rule")).toBeInTheDocument();
      expect(screen.getByText("Sell Signal Rule")).toBeInTheDocument();
    });

    it("displays rule status badges correctly", () => {
      renderComponent();
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
    });

    it("displays rule performance metrics", () => {
      renderComponent();
      expect(screen.getByText("75.5%")).toBeInTheDocument();
      expect(screen.getByText("$1250.30")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
    });

    it("shows no rules message when no rules exist", () => {
      mockStore.autoTradingStore.tradingRules = [];
      renderComponent();
      expect(screen.getByText("No trading rules found")).toBeInTheDocument();
      expect(screen.getByText("Create Your First Rule")).toBeInTheDocument();
    });
  });

  describe("Rule Filtering", () => {
    it("filters rules by status", async () => {
      renderComponent();

      const statusFilter = screen.getByDisplayValue("All Rules");
      fireEvent.change(statusFilter, { target: { value: "active" } });

      // Should show only active rules
      expect(screen.getByText("Buy Signal Rule")).toBeInTheDocument();
      expect(screen.queryByText("Sell Signal Rule")).not.toBeInTheDocument();
    });

    it("filters rules by portfolio when portfolioId provided", () => {
      renderComponent("portfolio-2");
      // Should not show rules from portfolio-1
      expect(screen.queryByText("Buy Signal Rule")).not.toBeInTheDocument();
    });
  });

  describe("Rule Actions", () => {
    it("toggles rule active status", async () => {
      renderComponent();

      const toggleButton = screen.getAllByTitle("Deactivate rule")[0];
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(
          mockStore.autoTradingStore.updateTradingRule
        ).toHaveBeenCalledWith("1", {
          isActive: false,
        });
      });
    });

    it("deletes rule with confirmation", async () => {
      window.confirm = jest.fn(() => true);
      renderComponent();

      const deleteButton = screen.getAllByTitle("Delete rule")[0];
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(
          mockStore.autoTradingStore.deleteTradingRule
        ).toHaveBeenCalledWith("1");
      });
    });

    it("cancels delete when user rejects confirmation", () => {
      window.confirm = jest.fn(() => false);
      renderComponent();

      const deleteButton = screen.getAllByTitle("Delete rule")[0];
      fireEvent.click(deleteButton);

      expect(
        mockStore.autoTradingStore.deleteTradingRule
      ).not.toHaveBeenCalled();
    });

    it("duplicates rule correctly", async () => {
      renderComponent();

      const duplicateButton = screen.getAllByTitle("Duplicate rule")[0];
      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(
          mockStore.autoTradingStore.createTradingRule
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Buy Signal Rule (Copy)",
            isActive: false,
          })
        );
      });
    });
  });

  describe("Rule Builder Modal", () => {
    it("opens rule builder modal for new rule", () => {
      renderComponent();

      const createButton = screen.getByText("Create Rule");
      fireEvent.click(createButton);

      expect(screen.getByText("Create New Rule")).toBeInTheDocument();
      expect(screen.getByTestId("rule-builder")).toBeInTheDocument();
    });

    it("opens rule builder modal for editing existing rule", () => {
      renderComponent();

      const editButton = screen.getAllByTitle("Edit rule")[0];
      fireEvent.click(editButton);

      expect(screen.getByText("Edit Rule")).toBeInTheDocument();
      expect(screen.getByTestId("rule-builder")).toBeInTheDocument();
    });

    it("closes modal when cancel is clicked", () => {
      renderComponent();

      const createButton = screen.getByText("Create Rule");
      fireEvent.click(createButton);

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId("rule-builder")).not.toBeInTheDocument();
    });

    it("saves rule and closes modal", async () => {
      renderComponent();

      const createButton = screen.getByText("Create Rule");
      fireEvent.click(createButton);

      const saveButton = screen.getByText("Save Rule");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          mockStore.autoTradingStore.createTradingRule
        ).toHaveBeenCalledWith({
          name: "Test Rule",
          description: "Test Description",
        });
      });

      expect(screen.queryByTestId("rule-builder")).not.toBeInTheDocument();
    });
  });

  describe("Import/Export Functionality", () => {
    it("renders export button with correct count", () => {
      renderComponent();
      expect(screen.getByText("Export (2)")).toBeInTheDocument();
    });

    it("disables export button when no rules exist", () => {
      mockStore.autoTradingStore.tradingRules = [];
      renderComponent();

      const exportButton = screen.getByText("Export (0)");
      expect(exportButton).toBeDisabled();
    });

    it("handles file import", async () => {
      renderComponent();

      const file = new File(['[{"name": "Imported Rule"}]'], "rules.json", {
        type: "application/json",
      });

      const importInput = screen.getByLabelText("Import");
      Object.defineProperty(importInput, "files", {
        value: [file],
      });

      fireEvent.change(importInput);

      // Wait for file to be processed
      await waitFor(() => {
        expect(
          mockStore.autoTradingStore.importTradingRules
        ).toHaveBeenCalled();
      });
    });
  });

  describe("Component Lifecycle", () => {
    it("loads trading rules on mount", () => {
      renderComponent("portfolio-1");
      expect(mockStore.autoTradingStore.loadTradingRules).toHaveBeenCalledWith(
        "portfolio-1"
      );
    });

    it("reloads rules when portfolioId changes", () => {
      const { rerender } = renderComponent("portfolio-1");

      rerender(
        <StoreProvider store={mockStore as RootStore}>
          <TradingRulesManager portfolioId="portfolio-2" />
        </StoreProvider>
      );

      expect(mockStore.autoTradingStore.loadTradingRules).toHaveBeenCalledWith(
        "portfolio-2"
      );
    });
  });
});
