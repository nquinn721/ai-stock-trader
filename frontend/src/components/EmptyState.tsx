import React from "react";
import "./EmptyState.css";

export interface EmptyStateProps {
  /** The main icon or illustration to display */
  icon?: React.ReactNode;
  /** Primary title/heading for the empty state */
  title: string;
  /** Description or additional message */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
  /** Custom class name for styling */
  className?: string;
  /** Size variant for different contexts */
  size?: "small" | "medium" | "large";
  /** Type for different use cases */
  type?: "no-data" | "loading" | "error" | "search" | "portfolio" | "general";
}

/**
 * EmptyState Component
 *
 * A reusable component to display when no data is available.
 * Follows the NO MOCK DATA policy by providing proper empty states
 * instead of showing fake/mock data.
 *
 * @example
 * // Basic usage
 * <EmptyState
 *   title="No stocks available"
 *   description="Check your API connection or try again later."
 * />
 *
 * @example
 * // With action button
 * <EmptyState
 *   icon="📊"
 *   title="No portfolio data"
 *   description="Create your first portfolio to get started."
 *   action={{
 *     label: "Create Portfolio",
 *     onClick: () => createNewPortfolio()
 *   }}
 * />
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
  size = "medium",
  type = "general",
}) => {
  // Default icons based on type
  const getDefaultIcon = () => {
    switch (type) {
      case "no-data":
        return "📊";
      case "loading":
        return "⏳";
      case "error":
        return "⚠️";
      case "search":
        return "🔍";
      case "portfolio":
        return "💼";
      default:
        return "📭";
    }
  };

  const displayIcon = icon || getDefaultIcon();

  return (
    <div
      className={`empty-state empty-state--${size} empty-state--${type} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="empty-state__content">
        {displayIcon && (
          <div className="empty-state__icon" aria-hidden="true">
            {typeof displayIcon === "string" ? (
              <span className="empty-state__emoji">{displayIcon}</span>
            ) : (
              displayIcon
            )}
          </div>
        )}

        <div className="empty-state__text">
          <h3 className="empty-state__title">{title}</h3>
          {description && (
            <p className="empty-state__description">{description}</p>
          )}
        </div>

        {action && (
          <div className="empty-state__actions">
            <button
              type="button"
              className={`empty-state__action empty-state__action--${
                action.variant || "primary"
              }`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
