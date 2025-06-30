import React from "react";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  className?: string;
}

/**
 * LoadingSpinner - Reusable loading indicator component
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message,
  className = "",
}) => {
  return (
    <div className={`loading-spinner-container ${size} ${className}`}>
      <div className="loading-spinner">
        <div className="spinner-circle"></div>
      </div>
      {message && <span className="loading-message">{message}</span>}
    </div>
  );
};

export default LoadingSpinner;
