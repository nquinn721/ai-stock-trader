import React from "react";
import "./TwoPhaseLoader.css";

interface TwoPhaseLoaderProps {
  phase1Complete: boolean;
  phase2Complete: boolean;
  phase1Label?: string;
  phase2Label?: string;
  className?: string;
}

/**
 * Visual indicator for two-phase loading process
 * Shows progress for price data (Phase 1) and signal calculations (Phase 2)
 */
export const TwoPhaseLoader: React.FC<TwoPhaseLoaderProps> = ({
  phase1Complete,
  phase2Complete,
  phase1Label = "Loading prices...",
  phase2Label = "Calculating signals...",
  className = "",
}) => {
  // Don't show loader if both phases are complete
  if (phase1Complete && phase2Complete) {
    return null;
  }

  return (
    <div className={`two-phase-loader ${className}`}>
      <div className="phase-container">
        <div
          className={`phase-item ${phase1Complete ? "complete" : "loading"}`}
        >
          <div className="phase-indicator">
            {phase1Complete ? (
              <div className="check-icon">✓</div>
            ) : (
              <div className="spinner"></div>
            )}
          </div>
          <span className="phase-label">{phase1Label}</span>
        </div>

        <div
          className={`phase-item ${phase1Complete ? (phase2Complete ? "complete" : "loading") : "pending"}`}
        >
          <div className="phase-indicator">
            {phase2Complete ? (
              <div className="check-icon">✓</div>
            ) : phase1Complete ? (
              <div className="spinner"></div>
            ) : (
              <div className="pending-icon">⏳</div>
            )}
          </div>
          <span className="phase-label">{phase2Label}</span>
        </div>
      </div>

      {!phase1Complete && (
        <div className="phase-description">Getting live market data...</div>
      )}

      {phase1Complete && !phase2Complete && (
        <div className="phase-description">
          Prices loaded! Calculating trading signals...
        </div>
      )}
    </div>
  );
};
