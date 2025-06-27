import { CircularProgress, Typography } from "@mui/material";
import React from "react";
import "./LoadingState.css";

export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "skeleton" | "pulse";
  fullHeight?: boolean;
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = "md",
  variant = "spinner",
  fullHeight = false,
  className = "",
}) => {
  const containerClasses = [
    "loading-state",
    `loading-state--${size}`,
    `loading-state--${variant}`,
    fullHeight ? "loading-state--full-height" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const getSpinnerSize = () => {
    switch (size) {
      case "sm":
        return 24;
      case "lg":
        return 48;
      default:
        return 32;
    }
  };

  return (
    <div className={containerClasses} data-testid="loading-state">
      {variant === "spinner" && (
        <>
          <CircularProgress
            size={getSpinnerSize()}
            className="loading-spinner"
          />
          {message && (
            <Typography variant="body2" className="loading-message">
              {message}
            </Typography>
          )}
        </>
      )}

      {variant === "skeleton" && (
        <div className="skeleton-container">
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--content" />
          <div className="skeleton-line skeleton-line--content" />
          <div className="skeleton-line skeleton-line--short" />
        </div>
      )}

      {variant === "pulse" && (
        <div className="pulse-container">
          <div className="pulse-circle" />
          {message && (
            <Typography variant="body2" className="loading-message">
              {message}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
};

export default LoadingState;
