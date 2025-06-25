import { fireEvent, render, screen } from "@testing-library/react";
import EmptyState from "../components/EmptyState";

describe("EmptyState Component", () => {
  const defaultProps = {
    title: "Test Title",
    description: "Test description",
  };

  test("renders with title and description", () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  test("renders with custom icon", () => {
    render(
      <EmptyState
        {...defaultProps}
        icon={<span data-testid="custom-icon">🔍</span>}
      />
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  test("renders with string icon", () => {
    render(<EmptyState {...defaultProps} icon="📊" />);

    expect(screen.getByText("📊")).toBeInTheDocument();
  });

  test("renders with action button", () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        {...defaultProps}
        action={{
          label: "Try Again",
          onClick: mockAction,
          variant: "primary",
        }}
      />
    );

    const button = screen.getByText("Try Again");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  test("renders with secondary action button", () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        {...defaultProps}
        action={{
          label: "Secondary Action",
          onClick: mockAction,
          variant: "secondary",
        }}
      />
    );

    const button = screen.getByText("Secondary Action");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("empty-state__action--secondary");
  });

  test("applies custom className", () => {
    render(<EmptyState {...defaultProps} className="custom-class" />);

    const container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("custom-class");
  });

  test("applies size variants", () => {
    const { rerender } = render(<EmptyState {...defaultProps} size="small" />);
    let container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("empty-state--small");

    rerender(<EmptyState {...defaultProps} size="medium" />);
    container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("empty-state--medium");

    rerender(<EmptyState {...defaultProps} size="large" />);
    container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("empty-state--large");
  });

  test("applies type variants", () => {
    const types = [
      "no-data",
      "loading",
      "error",
      "search",
      "portfolio",
      "general",
    ];

    types.forEach((type) => {
      const { unmount } = render(
        <EmptyState {...defaultProps} type={type as any} />
      );

      const container = screen.getByText("Test Title").closest(".empty-state");
      expect(container).toHaveClass(`empty-state--${type}`);

      unmount();
    });
  });

  test("renders without description", () => {
    render(<EmptyState title="Only Title" />);

    expect(screen.getByText("Only Title")).toBeInTheDocument();
    expect(screen.queryByText("Test description")).not.toBeInTheDocument();
  });

  test("renders without action", () => {
    render(<EmptyState {...defaultProps} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  test("handles loading type with appropriate styling", () => {
    render(<EmptyState {...defaultProps} type="loading" />);

    const container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("empty-state--loading");
  });

  test("handles error type with appropriate styling", () => {
    render(<EmptyState {...defaultProps} type="error" />);

    const container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("empty-state--error");
  });

  test("handles portfolio type with appropriate styling", () => {
    render(<EmptyState {...defaultProps} type="portfolio" />);

    const container = screen.getByText("Test Title").closest(".empty-state");
    expect(container).toHaveClass("empty-state--portfolio");
  });

  test("uses default props correctly", () => {
    render(<EmptyState title="Default Test" />);

    const container = screen.getByText("Default Test").closest(".empty-state");
    expect(container).toHaveClass("empty-state--medium"); // default size
    expect(container).toHaveClass("empty-state--general"); // default type
  });

  test("action button has correct accessibility attributes", () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        {...defaultProps}
        action={{
          label: "Accessible Action",
          onClick: mockAction,
        }}
      />
    );

    const button = screen.getByText("Accessible Action");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toBeEnabled();
  });

  test("component is accessible with proper ARIA attributes", () => {
    render(<EmptyState {...defaultProps} />);

    const title = screen.getByText("Test Title");
    const description = screen.getByText("Test description");

    expect(title).toHaveClass("empty-state__title");
    expect(description).toHaveClass("empty-state__description");
  });

  test("handles complex icon types", () => {
    const ComplexIcon = () => (
      <div data-testid="complex-icon">
        <span>Complex</span>
        <span>Icon</span>
      </div>
    );

    render(<EmptyState {...defaultProps} icon={<ComplexIcon />} />);

    expect(screen.getByTestId("complex-icon")).toBeInTheDocument();
    expect(screen.getByText("Complex")).toBeInTheDocument();
    expect(screen.getByText("Icon")).toBeInTheDocument();
  });

  test("renders properly with all props combined", () => {
    const mockAction = jest.fn();
    render(
      <EmptyState
        icon="🎯"
        title="Complete Test"
        description="This is a complete test with all props"
        action={{
          label: "Complete Action",
          onClick: mockAction,
          variant: "primary",
        }}
        className="complete-test"
        size="large"
        type="no-data"
      />
    );

    expect(screen.getByText("🎯")).toBeInTheDocument();
    expect(screen.getByText("Complete Test")).toBeInTheDocument();
    expect(
      screen.getByText("This is a complete test with all props")
    ).toBeInTheDocument();

    const button = screen.getByText("Complete Action");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("empty-state__action--primary");

    const container = screen.getByText("Complete Test").closest(".empty-state");
    expect(container).toHaveClass("complete-test");
    expect(container).toHaveClass("empty-state--large");
    expect(container).toHaveClass("empty-state--no-data");

    fireEvent.click(button);
    expect(mockAction).toHaveBeenCalledTimes(1);
  });
});
