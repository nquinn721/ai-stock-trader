import { AccessTime } from "@mui/icons-material";
import React from "react";
import "./PageHeader.css";

export interface PageHeaderActionButton {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  className?: string;
  label?: string;
}

export interface PageHeaderProps {
  title: string;
  currentTime?: Date;
  isConnected?: boolean;
  statsValue?: string | number;
  actionButtons?: PageHeaderActionButton[];
  showLiveIndicator?: boolean;
  sticky?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  currentTime = new Date(),
  isConnected = true,
  statsValue,
  actionButtons = [],
  showLiveIndicator = true,
  sticky = false,
  className = "",
  children,
}) => {
  return (
    <div
      className={`page-header dashboard-header ${sticky ? "sticky" : ""} ${className}`}
      data-testid="page-header"
    >
      <div className="header-left">
        <div className="main-title-section">
          <h1>{title}</h1>
          {showLiveIndicator && (
            <div
              className={`live-indicator-main ${
                isConnected ? "connected" : "disconnected"
              }`}
            >
              <span className="live-dot"></span>
              <span className="live-text">
                {isConnected ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          )}
        </div>
        <div className="market-time">
          <AccessTime />
          <span>{currentTime.toLocaleTimeString()}</span>
          <span className="date">{currentTime.toLocaleDateString()}</span>
        </div>
      </div>

      <div className="header-info">
        {actionButtons.map((btn, index) => (
          <button
            key={index}
            className={btn.className || "action-btn"}
            onClick={btn.onClick}
            title={btn.tooltip}
          >
            {btn.icon}
            {btn.label && <span>{btn.label}</span>}
          </button>
        ))}

        {statsValue && (
          <div className="stats">
            <span>{statsValue}</span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default PageHeader;
