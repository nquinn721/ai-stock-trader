import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow as ScanIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  FileDownload as ExportIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { ScreenerBuilder } from './ScreenerBuilder';
import { ScanResults } from './ScanResults';
import { PresetTemplates } from './PresetTemplates';
import { AlertManager } from './AlertManager';
import { marketScannerApi } from '../../services/marketScannerApi';
import { ScanMatch, ScreenerTemplate, ScanCriteria } from '../../types/marketScanner';

interface MarketScannerDashboardProps {
  onStockSelect?: (symbol: string) => void;
}

export const MarketScannerDashboard: React.FC<MarketScannerDashboardProps> = ({
  onStockSelect,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanMatch[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ScreenerTemplate | null>(null);
  const [customCriteria, setCustomCriteria] = useState<ScanCriteria | null>(null);
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
      console.error('Failed to load scan status:', err);
    }
  };

  const handleScan = async () => {
    if (!selectedTemplate && !customCriteria) {
      setError('Please select a template or create custom criteria');
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
      setError(err.message || 'Scan failed');
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
      setError(err.message || 'Preset scan failed');
    } finally {
      setLoading(false);
      setIsScanning(false);
      loadScanStatus();
    }
  };

  const handleExport = async () => {
    if (scanResults.length === 0) {
      setError('No results to export');
      return;
    }

    try {
      const criteria = selectedTemplate?.criteria || customCriteria!;
      const result = await marketScannerApi.exportResults(criteria);
      
      // Download CSV
      const blob = new Blob([result.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `market-scan-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUpIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Market Scanner
          </Typography>
          {isScanning && (
            <Chip
              icon={<CircularProgress size={16} />}
              label="Scanning..."
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Status">
            <IconButton onClick={loadScanStatus}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={isScanning ? <StopIcon /> : <ScanIcon />}
            onClick={handleScan}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {isScanning ? 'Stop' : 'Scan Market'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
            disabled={scanResults.length === 0}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Status Cards */}
      {scanStatus && (
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 2,
          mb: 3 
        }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Last Scan
              </Typography>
              <Typography variant="h6">
                {scanStatus.lastScanTime 
                  ? new Date(scanStatus.lastScanTime).toLocaleTimeString()
                  : 'Never'
                }
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Alerts
              </Typography>
              <Typography variant="h6">
                {scanStatus.activeAlerts}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Templates
              </Typography>
              <Typography variant="h6">
                {scanStatus.availableTemplates}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Results
              </Typography>
              <Typography variant="h6">
                {scanResults.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Screener Builder" />
            <Tab label="Preset Templates" />
            <Tab label="Scan Results" />
            <Tab label="Alerts" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 0 }}>
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
          
          {activeTab === 3 && (
            <AlertManager />
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
