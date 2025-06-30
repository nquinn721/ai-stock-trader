import { AccessTime } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { useWebSocketStore } from "../../stores/StoreContext";
import { useWebSocketConnection } from "../../hooks/useWebSocketConnection";
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
  statsValue?: string | number;
  actionButtons?: PageHeaderActionButton[];
  sticky?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  statsValue,
  actionButtons = [],
  sticky = true,
  className = "",
  children,
}) => {
  // Automatically manage WebSocket connection and get status
  useWebSocketConnection();
  const webSocketStore = useWebSocketStore();
  
  // Automatically update current time every second
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className={`page-header ${sticky ? "sticky" : ""} ${className}`}
      data-testid="page-header"
    >
      <div className="header-left">
        <div className="main-title-section">
          <h1>{title}</h1>
          <div
            className={`live-indicator-main ${
              webSocketStore.isConnected ? "connected" : "disconnected"
            }`}
          >
            <span className="live-dot"></span>
            <span className="live-text">
              {webSocketStore.isConnected ? "LIVE" : "OFFLINE"}
            </span>
          </div>
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
