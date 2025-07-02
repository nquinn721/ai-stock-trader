import {
  Lock,
  Notifications,
  Security,
  Settings as SettingsIcon,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slider,
  Switch,
  TextField,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { ContentCard, LoadingState, TradingButton } from "../ui";
import "./TradingSettings.css";

interface RiskParameters {
  maxPositionSize: number; // Percentage of portfolio
  maxDailyLoss: number; // Dollar amount
  maxTotalPositions: number;
  maxSectorExposure: number; // Percentage
  volatilityThreshold: number; // Percentage
  stopLossPercentage: number;
  takeProfitPercentage: number;
}

interface TradingPreferences {
  executionFrequency: "minute" | "hour" | "daily";
  autoRebalancing: boolean;
  orderTimeout: number; // minutes
  slippageTolerance: number; // percentage
  marketHoursOnly: boolean;
  weekendsEnabled: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  onTrade: boolean;
  onError: boolean;
  onRiskBreach: boolean;
  onStrategyStart: boolean;
  onStrategyStop: boolean;
  emailNotifications: boolean;
  email?: string;
  webhookUrl?: string;
}

interface EmergencyControls {
  globalStopLoss: number; // percentage
  dailyDrawdownLimit: number; // percentage
  emergencyStopEnabled: boolean;
  circuitBreakerThreshold: number; // percentage
}

interface TradingSettingsProps {
  onSave?: (settings: any) => void;
  onReset?: () => void;
}

const TradingSettings: React.FC<TradingSettingsProps> = ({
  onSave,
  onReset,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [riskParameters, setRiskParameters] = useState<RiskParameters>({
    maxPositionSize: 10,
    maxDailyLoss: 1000,
    maxTotalPositions: 10,
    maxSectorExposure: 30,
    volatilityThreshold: 5,
    stopLossPercentage: 2,
    takeProfitPercentage: 4,
  });

  const [tradingPreferences, setTradingPreferences] =
    useState<TradingPreferences>({
      executionFrequency: "minute",
      autoRebalancing: true,
      orderTimeout: 30,
      slippageTolerance: 0.5,
      marketHoursOnly: true,
      weekendsEnabled: false,
    });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      enabled: true,
      onTrade: true,
      onError: true,
      onRiskBreach: true,
      onStrategyStart: true,
      onStrategyStop: true,
      emailNotifications: false,
      email: "",
      webhookUrl: "",
    });

  const [emergencyControls, setEmergencyControls] = useState<EmergencyControls>(
    {
      globalStopLoss: 20,
      dailyDrawdownLimit: 5,
      emergencyStopEnabled: true,
      circuitBreakerThreshold: 10,
    }
  );

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mock implementation - replace with actual API calls
      // In reality, you would load from backend APIs:
      // const response = await fetch('/api/auto-trading/settings');
      // const settings = await response.json();

      // For now, use default values already set
      console.log("Settings loaded successfully");
    } catch (err) {
      console.error("Error loading settings:", err);
      setError("Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const allSettings = {
        riskParameters,
        tradingPreferences,
        notificationSettings,
        emergencyControls,
      };

      // Mock implementation - replace with actual API calls
      // await fetch('/api/auto-trading/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(allSettings),
      // });

      console.log("Saving settings:", allSettings);

      if (onSave) {
        onSave(allSettings);
      }

      setSuccess("Settings saved successfully!");
      setHasChanges(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = () => {
    if (
      window.confirm("Are you sure you want to reset all settings to defaults?")
    ) {
      // Reset to default values
      setRiskParameters({
        maxPositionSize: 10,
        maxDailyLoss: 1000,
        maxTotalPositions: 10,
        maxSectorExposure: 30,
        volatilityThreshold: 5,
        stopLossPercentage: 2,
        takeProfitPercentage: 4,
      });

      setTradingPreferences({
        executionFrequency: "minute",
        autoRebalancing: true,
        orderTimeout: 30,
        slippageTolerance: 0.5,
        marketHoursOnly: true,
        weekendsEnabled: false,
      });

      setNotificationSettings({
        enabled: true,
        onTrade: true,
        onError: true,
        onRiskBreach: true,
        onStrategyStart: true,
        onStrategyStop: true,
        emailNotifications: false,
        email: "",
        webhookUrl: "",
      });

      setEmergencyControls({
        globalStopLoss: 20,
        dailyDrawdownLimit: 5,
        emergencyStopEnabled: true,
        circuitBreakerThreshold: 10,
      });

      setHasChanges(true);
      setSuccess("Settings reset to defaults");

      if (onReset) {
        onReset();
      }
    }
  };

  const handleRiskParameterChange = (
    field: keyof RiskParameters,
    value: number
  ) => {
    setRiskParameters((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleTradingPreferenceChange = (
    field: keyof TradingPreferences,
    value: any
  ) => {
    setTradingPreferences((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleNotificationChange = (
    field: keyof NotificationSettings,
    value: any
  ) => {
    setNotificationSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleEmergencyControlChange = (
    field: keyof EmergencyControls,
    value: any
  ) => {
    setEmergencyControls((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return <LoadingState message="Loading trading settings..." />;
  }

  return (
    <div className="trading-settings">
      {error && (
        <Alert severity="error" className="alert-message">
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" className="alert-message">
          {success}
        </Alert>
      )}

      {/* Settings Header */}
      <div className="settings-header">
        <div className="header-content">
          <SettingsIcon className="header-icon" />
          <div className="header-text">
            <h2>Trading Settings</h2>
            <p>
              Configure risk management, trading preferences, and emergency
              controls
            </p>
          </div>
        </div>

        <div className="header-actions">
          <TradingButton
            variant="secondary"
            size="sm"
            onClick={handleResetSettings}
            disabled={loading}
          >
            Reset to Defaults
          </TradingButton>

          <TradingButton
            variant="primary"
            size="sm"
            onClick={handleSaveSettings}
            disabled={loading || !hasChanges}
          >
            Save Settings
          </TradingButton>
        </div>
      </div>

      {/* Risk Management */}
      <ContentCard
        title="Risk Management"
        variant="gradient"
        className="settings-section"
      >
        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-label">
              <Security className="setting-icon" />
              Max Position Size
              <span className="setting-description">
                Percentage of portfolio per position
              </span>
            </div>
            <div className="setting-control">
              <Slider
                value={riskParameters.maxPositionSize}
                onChange={(_, value) =>
                  handleRiskParameterChange("maxPositionSize", value as number)
                }
                min={1}
                max={50}
                step={1}
                marks={[
                  { value: 5, label: "5%" },
                  { value: 10, label: "10%" },
                  { value: 20, label: "20%" },
                  { value: 50, label: "50%" },
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value}%`}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              <Warning className="setting-icon" />
              Max Daily Loss
              <span className="setting-description">
                Maximum daily loss limit in USD
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={riskParameters.maxDailyLoss}
                onChange={(e) =>
                  handleRiskParameterChange(
                    "maxDailyLoss",
                    Number(e.target.value)
                  )
                }
                InputProps={{
                  startAdornment: <span className="currency-symbol">$</span>,
                }}
                size="small"
                fullWidth
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              Max Total Positions
              <span className="setting-description">
                Maximum number of concurrent positions
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={riskParameters.maxTotalPositions}
                onChange={(e) =>
                  handleRiskParameterChange(
                    "maxTotalPositions",
                    Number(e.target.value)
                  )
                }
                size="small"
                inputProps={{ min: 1, max: 50 }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              Max Sector Exposure
              <span className="setting-description">
                Maximum exposure to any single sector
              </span>
            </div>
            <div className="setting-control">
              <Slider
                value={riskParameters.maxSectorExposure}
                onChange={(_, value) =>
                  handleRiskParameterChange(
                    "maxSectorExposure",
                    value as number
                  )
                }
                min={10}
                max={100}
                step={5}
                marks={[
                  { value: 20, label: "20%" },
                  { value: 50, label: "50%" },
                  { value: 100, label: "100%" },
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value}%`}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              Default Stop Loss
              <span className="setting-description">
                Default stop loss percentage
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={riskParameters.stopLossPercentage}
                onChange={(e) =>
                  handleRiskParameterChange(
                    "stopLossPercentage",
                    Number(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: <span className="percentage-symbol">%</span>,
                }}
                size="small"
                inputProps={{ min: 0.1, max: 20, step: 0.1 }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              Default Take Profit
              <span className="setting-description">
                Default take profit percentage
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={riskParameters.takeProfitPercentage}
                onChange={(e) =>
                  handleRiskParameterChange(
                    "takeProfitPercentage",
                    Number(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: <span className="percentage-symbol">%</span>,
                }}
                size="small"
                inputProps={{ min: 0.1, max: 50, step: 0.1 }}
              />
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Trading Preferences */}
      <ContentCard
        title="Trading Preferences"
        variant="gradient"
        className="settings-section"
      >
        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-label">
              <TrendingUp className="setting-icon" />
              Execution Frequency
              <span className="setting-description">
                How often to check for trading opportunities
              </span>
            </div>
            <div className="setting-control">
              <FormControl size="small" fullWidth>
                <InputLabel>Frequency</InputLabel>
                <Select
                  value={tradingPreferences.executionFrequency}
                  onChange={(e: SelectChangeEvent) =>
                    handleTradingPreferenceChange(
                      "executionFrequency",
                      e.target.value
                    )
                  }
                  label="Frequency"
                >
                  <MenuItem value="minute">Every Minute</MenuItem>
                  <MenuItem value="hour">Every Hour</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              Order Timeout
              <span className="setting-description">
                Minutes before cancelling unfilled orders
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={tradingPreferences.orderTimeout}
                onChange={(e) =>
                  handleTradingPreferenceChange(
                    "orderTimeout",
                    Number(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: <span className="unit-symbol">min</span>,
                }}
                size="small"
                inputProps={{ min: 1, max: 1440 }}
              />
            </div>
          </div>

          <div className="setting-item full-width">
            <FormControlLabel
              control={
                <Switch
                  checked={tradingPreferences.autoRebalancing}
                  onChange={(e) =>
                    handleTradingPreferenceChange(
                      "autoRebalancing",
                      e.target.checked
                    )
                  }
                />
              }
              label="Auto Portfolio Rebalancing"
            />
          </div>

          <div className="setting-item full-width">
            <FormControlLabel
              control={
                <Switch
                  checked={tradingPreferences.marketHoursOnly}
                  onChange={(e) =>
                    handleTradingPreferenceChange(
                      "marketHoursOnly",
                      e.target.checked
                    )
                  }
                />
              }
              label="Trade During Market Hours Only"
            />
          </div>

          <div className="setting-item full-width">
            <FormControlLabel
              control={
                <Switch
                  checked={tradingPreferences.weekendsEnabled}
                  onChange={(e) =>
                    handleTradingPreferenceChange(
                      "weekendsEnabled",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Weekend Trading"
            />
          </div>
        </div>
      </ContentCard>

      {/* Notification Settings */}
      <ContentCard
        title="Notifications"
        variant="gradient"
        className="settings-section"
      >
        <div className="settings-grid">
          <div className="setting-item full-width">
            <FormControlLabel
              control={
                <Switch
                  checked={notificationSettings.enabled}
                  onChange={(e) =>
                    handleNotificationChange("enabled", e.target.checked)
                  }
                />
              }
              label={
                <div className="switch-label">
                  <Notifications className="setting-icon" />
                  Enable Notifications
                </div>
              }
            />
          </div>

          {notificationSettings.enabled && (
            <>
              <div className="notification-checkboxes">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notificationSettings.onTrade}
                      onChange={(e) =>
                        handleNotificationChange("onTrade", e.target.checked)
                      }
                    />
                  }
                  label="Trade Executions"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notificationSettings.onError}
                      onChange={(e) =>
                        handleNotificationChange("onError", e.target.checked)
                      }
                    />
                  }
                  label="Errors & Failures"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notificationSettings.onRiskBreach}
                      onChange={(e) =>
                        handleNotificationChange(
                          "onRiskBreach",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Risk Breaches"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notificationSettings.onStrategyStart}
                      onChange={(e) =>
                        handleNotificationChange(
                          "onStrategyStart",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Strategy Start/Stop"
                />
              </div>

              <div className="setting-item full-width">
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        handleNotificationChange(
                          "emailNotifications",
                          e.target.checked
                        )
                      }
                    />
                  }
                  label="Email Notifications"
                />
              </div>

              {notificationSettings.emailNotifications && (
                <div className="setting-item full-width">
                  <TextField
                    label="Email Address"
                    type="email"
                    value={notificationSettings.email || ""}
                    onChange={(e) =>
                      handleNotificationChange("email", e.target.value)
                    }
                    size="small"
                    fullWidth
                    placeholder="your-email@example.com"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ContentCard>

      {/* Emergency Controls */}
      <ContentCard
        title="Emergency Controls"
        variant="gradient"
        className="settings-section emergency-section"
      >
        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-label">
              <Lock className="setting-icon danger" />
              Global Stop Loss
              <span className="setting-description">
                Emergency portfolio-wide stop loss
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={emergencyControls.globalStopLoss}
                onChange={(e) =>
                  handleEmergencyControlChange(
                    "globalStopLoss",
                    Number(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: <span className="percentage-symbol">%</span>,
                }}
                size="small"
                inputProps={{ min: 1, max: 50, step: 0.1 }}
              />
            </div>
          </div>

          <div className="setting-item">
            <div className="setting-label">
              Daily Drawdown Limit
              <span className="setting-description">
                Maximum daily portfolio drawdown
              </span>
            </div>
            <div className="setting-control">
              <TextField
                type="number"
                value={emergencyControls.dailyDrawdownLimit}
                onChange={(e) =>
                  handleEmergencyControlChange(
                    "dailyDrawdownLimit",
                    Number(e.target.value)
                  )
                }
                InputProps={{
                  endAdornment: <span className="percentage-symbol">%</span>,
                }}
                size="small"
                inputProps={{ min: 0.1, max: 20, step: 0.1 }}
              />
            </div>
          </div>

          <div className="setting-item full-width">
            <FormControlLabel
              control={
                <Switch
                  checked={emergencyControls.emergencyStopEnabled}
                  onChange={(e) =>
                    handleEmergencyControlChange(
                      "emergencyStopEnabled",
                      e.target.checked
                    )
                  }
                />
              }
              label="Enable Emergency Stop System"
            />
          </div>

          <div className="emergency-warning">
            <Warning className="warning-icon" />
            <div className="warning-text">
              <strong>Emergency Controls</strong>
              <br />
              These settings will immediately halt all trading if triggered. Use
              with caution.
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  );
};

export default TradingSettings;
