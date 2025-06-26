// Market Scanner Dashboard Component - Real-time stock screening and alerts
import {
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  PlayArrow as ScanIcon,
  Stop as StopIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { marketScannerApi } from "../../services/marketScannerApi";
import {
  ScanCriteria,
  ScanMatch,
  ScreenerTemplate,
} from "../../types/marketScanner";
import { AlertManager } from "./AlertManager";
import "./MarketScannerDashboard.css";
import { PresetTemplates } from "./PresetTemplates";
import { ScanResults } from "./ScanResults";
import { ScreenerBuilder } from "./ScreenerBuilder";

interface MarketScannerDashboardProps {
  onStockSelect?: (symbol: string) => void;
}

export const MarketScannerDashboard: React.FC<MarketScannerDashboardProps> = ({
  onStockSelect,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanMatch[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ScreenerTemplate | null>(null);
  const [customCriteria, setCustomCriteria] = useState<ScanCriteria | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<{
    isScanning: boolean;
    lastScanTime: Date | null;
    activeAlerts: number;
    availableTemplates: number;
  } | null>(null);

  useEffect(() => {
    loadScanStatus();
  }, []);

  const loadScanStatus = async () => {
    try {
      const status = await marketScannerApi.getStatus();
      setScanStatus(status.data);
    } catch (err) {
      console.error("Failed to load scan status:", err);
    }
  };

  const handleScan = async () => {
    if (!selectedTemplate && !customCriteria) {
      setError("Please select a template or create custom criteria");
      return;
    }

    setLoading(true);
    setIsScanning(true);
    setError(null);

    try {
      const criteria = selectedTemplate?.criteria || customCriteria!;
      const result = await marketScannerApi.scanMarket(criteria);
      setScanResults(result.data);
    } catch (err: any) {
      setError(err.message || "Scan failed");
    } finally {
      setLoading(false);
      setIsScanning(false);
      loadScanStatus();
    }
  };

  const handlePresetScan = async (template: ScreenerTemplate) => {
    setLoading(true);
    setIsScanning(true);
    setError(null);

    try {
      const result = await marketScannerApi.scanWithPreset(template.id);
      setScanResults(result.data);
      setSelectedTemplate(result.template);
    } catch (err: any) {
      setError(err.message || "Preset scan failed");
    } finally {
      setLoading(false);
      setIsScanning(false);
      loadScanStatus();
    }
  };

  const handleExport = async () => {
    if (scanResults.length === 0) {
      setError("No results to export");
      return;
    }

    try {
      const criteria = selectedTemplate?.criteria || customCriteria!;
      const result = await marketScannerApi.exportResults(criteria);

      // Download CSV
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `market-scan-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "Export failed");
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className="market-scanner-dashboard">
      {/* Header */}
      <div className="scanner-header">
        <div className="scanner-status">
          <TrendingUpIcon className="scanner-icon" />
          <Typography className="scanner-title" variant="h4" component="h1">
            Market Scanner
          </Typography>
          {isScanning && (
            <Chip
              icon={<CircularProgress size={16} />}
              label="Scanning..."
              className="scanning-chip"
              variant="outlined"
            />
          )}
        </div>

        <div className="header-actions">
          <Tooltip title="Refresh Status">
            <IconButton onClick={loadScanStatus} className="refresh-button">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={isScanning ? <StopIcon /> : <ScanIcon />}
            onClick={handleScan}
            disabled={loading}
            className="scan-button"
          >
            {isScanning ? "Stop" : "Scan Market"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={scanResults.length === 0}
            className="export-button"
          >
            Export
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      {scanStatus && (
        <div className="status-cards-grid">
          <Card className="status-card">
            <CardContent>
              <Typography className="status-label" gutterBottom>
                Last Scan
              </Typography>
              <Typography className="status-value" variant="h6">
                {scanStatus.lastScanTime
                  ? new Date(scanStatus.lastScanTime).toLocaleTimeString()
                  : "Never"}
              </Typography>
              <Typography className="status-description">
                Most recent scan execution
              </Typography>
            </CardContent>
          </Card>
          <Card className="status-card">
            <CardContent>
              <Typography className="status-label" gutterBottom>
                Active Alerts
              </Typography>
              <Typography className="status-value" variant="h6">
                {scanStatus.activeAlerts}
              </Typography>
              <Typography className="status-description">
                Real-time notifications enabled
              </Typography>
            </CardContent>
          </Card>
          <Card className="status-card">
            <CardContent>
              <Typography className="status-label" gutterBottom>
                Templates
              </Typography>
              <Typography className="status-value" variant="h6">
                {scanStatus.availableTemplates}
              </Typography>
              <Typography className="status-description">
                Pre-built screening strategies
              </Typography>
            </CardContent>
          </Card>
          <Card className="status-card">
            <CardContent>
              <Typography className="status-label" gutterBottom>
                Results
              </Typography>
              <Typography className="status-value" variant="h6">
                {scanResults.length}
              </Typography>
              <Typography className="status-description">
                Stocks matching criteria
              </Typography>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          className="error-alert"
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Card className="main-content-card">
        <div className="scanner-tabs">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Screener Builder" className="scanner-tab" />
            <Tab label="Preset Templates" className="scanner-tab" />
            <Tab label="Scan Results" className="scanner-tab" />
            <Tab label="Alerts" className="scanner-tab" />
          </Tabs>
        </div>

        <div className="tab-content">
          {activeTab === 0 && (
            <ScreenerBuilder
              onCriteriaChange={setCustomCriteria}
              onTemplateSelect={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          )}

          {activeTab === 1 && (
            <PresetTemplates
              onTemplateSelect={setSelectedTemplate}
              onQuickScan={handlePresetScan}
              selectedTemplate={selectedTemplate}
            />
          )}

          {activeTab === 2 && (
            <ScanResults
              results={scanResults}
              onStockSelect={onStockSelect}
              loading={loading}
            />
          )}

          {activeTab === 3 && <AlertManager />}
        </div>
      </Card>
    </div>
  );
};
