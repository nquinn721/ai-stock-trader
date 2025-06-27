import {
  Analytics,
  Dashboard,
  PlayArrow,
  Refresh,
  Settings,
  Stop,
} from "@mui/icons-material";
import { Typography } from "@mui/material";
import React, { useState } from "react";
import {
  ContentCard,
  LoadingState,
  PageHeader,
  StatusChip,
  TradingButton,
} from "../components/ui";

const ComponentLibraryDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(true);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const toggleConnection = () => {
    setConnectionStatus(!connectionStatus);
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Component Library Demo"
        currentTime={new Date()}
        isConnected={connectionStatus}
        sticky={true}
        statsValue="5 components • Design System"
        actionButtons={[
          {
            icon: <Dashboard />,
            onClick: () => console.log("Navigate to Dashboard"),
            tooltip: "Go to Dashboard",
            className: "nav-btn",
            label: "Dashboard",
          },
          {
            icon: <Analytics />,
            onClick: () => console.log("Navigate to Analytics"),
            tooltip: "View Analytics",
            className: "action-btn",
            label: "Analytics",
          },
          {
            icon: <Settings />,
            onClick: () => console.log("Open Settings"),
            tooltip: "Settings",
            className: "action-btn",
            label: "Settings",
          },
          {
            icon: <Refresh />,
            onClick: handleRefresh,
            tooltip: "Refresh Data",
            className: "action-btn",
            label: "Refresh",
          },
        ]}
      />

      <div className="page-content">
        <div className="content-grid">
          {/* TradingButton Examples */}
          <ContentCard
            title="TradingButton Component"
            subtitle="Standardized button styles with multiple variants"
            variant="gradient"
            padding="lg"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <TradingButton
                variant="primary"
                size="md"
                icon={<PlayArrow />}
                onClick={() => console.log("Primary action")}
              >
                Primary Action
              </TradingButton>

              <TradingButton
                variant="success"
                size="md"
                loading={isLoading}
                onClick={() => console.log("Success action")}
              >
                {isLoading ? "Processing..." : "Success Action"}
              </TradingButton>

              <TradingButton
                variant="danger"
                size="md"
                icon={<Stop />}
                onClick={() => console.log("Danger action")}
              >
                Stop Trading
              </TradingButton>

              <TradingButton
                variant="ghost"
                size="sm"
                onClick={() => console.log("Ghost action")}
              >
                Ghost Button
              </TradingButton>
            </div>
          </ContentCard>

          {/* StatusChip Examples */}
          <ContentCard
            title="StatusChip Component"
            subtitle="Status indicators with animations and color coding"
            variant="default"
            padding="lg"
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <StatusChip status="active" size="md" animated={true}>
                  Active
                </StatusChip>
                <StatusChip status="ready" size="md">
                  Ready
                </StatusChip>
                <StatusChip status="loading" size="md" animated={true}>
                  Loading
                </StatusChip>
                <StatusChip status="error" size="md">
                  Error
                </StatusChip>
                <StatusChip status="warning" size="md">
                  Warning
                </StatusChip>
                <StatusChip status="inactive" size="md">
                  Inactive
                </StatusChip>
              </div>

              <Typography variant="body2" color="text.secondary">
                Size variants: sm, md, lg • Animated option available
              </Typography>
            </div>
          </ContentCard>

          {/* ContentCard Variants */}
          <ContentCard
            title="ContentCard Variants"
            subtitle="Different background styles and padding options"
            variant="glass"
            padding="lg"
          >
            <Typography variant="body1" style={{ marginBottom: "16px" }}>
              This card uses the "glass" variant with glassmorphism effect.
            </Typography>

            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Variant:</span>
                <strong>glass</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Padding:</span>
                <strong>lg</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Hover:</span>
                <strong>enabled</strong>
              </div>
            </div>
          </ContentCard>

          {/* LoadingState Examples */}
          <ContentCard
            title="LoadingState Component"
            subtitle="Multiple loading indicator styles"
            variant="minimal"
            padding="md"
          >
            {isLoading ? (
              <LoadingState
                variant="spinner"
                size="md"
                message="Loading demo content..."
              />
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Typography variant="body1" style={{ marginBottom: "16px" }}>
                  Click the refresh button in the header to see loading states.
                </Typography>
                <TradingButton
                  variant="secondary"
                  size="sm"
                  onClick={handleRefresh}
                  icon={<Refresh />}
                >
                  Trigger Loading
                </TradingButton>
              </div>
            )}
          </ContentCard>

          {/* Interactive Demo */}
          <ContentCard
            title="Interactive Demo"
            subtitle="Test component interactions"
            variant="default"
            padding="lg"
            headerActions={
              <TradingButton variant="nav" size="sm" onClick={toggleConnection}>
                Toggle Connection
              </TradingButton>
            }
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              <div>
                <Typography variant="subtitle2" style={{ marginBottom: "8px" }}>
                  Connection Status:
                </Typography>
                <StatusChip
                  status={connectionStatus ? "active" : "inactive"}
                  size="md"
                  animated={connectionStatus}
                >
                  {connectionStatus ? "Connected" : "Disconnected"}
                </StatusChip>
              </div>

              <div>
                <Typography variant="subtitle2" style={{ marginBottom: "8px" }}>
                  Loading Demo:
                </Typography>
                <TradingButton
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  onClick={handleRefresh}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Start Process"}
                </TradingButton>
              </div>
            </div>
          </ContentCard>

          {/* Usage Guide */}
          <ContentCard
            title="Usage Guide"
            subtitle="How to use the component library"
            variant="gradient"
            padding="xl"
          >
            <Typography variant="body1" style={{ marginBottom: "16px" }}>
              This component library provides standardized UI components
              following the dashboard design patterns.
            </Typography>

            <Typography variant="subtitle2" style={{ marginBottom: "8px" }}>
              Import components:
            </Typography>
            <pre
              style={{
                background: "rgba(0,0,0,0.3)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "12px",
                overflow: "auto",
                marginBottom: "16px",
              }}
            >
              {`import { 
  PageHeader, 
  ContentCard, 
  TradingButton, 
  StatusChip, 
  LoadingState 
} from "../components/ui";`}
            </pre>

            <Typography variant="body2" color="text.secondary">
              All components use the shared CSS variables and follow the trading
              app theme. See the README.md in the ui folder for complete
              documentation.
            </Typography>
          </ContentCard>
        </div>
      </div>
    </div>
  );
};

export default ComponentLibraryDemo;
