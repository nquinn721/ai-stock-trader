import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  FormGroup,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  Slider,
  Chip,
  Alert,
  Divider,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  TrendingUp,
  Security,
  Event,
  AccessTime,
  VolumeUp,
  VolumeOff,
  Schedule,
  Notifications,
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';
import { 
  NotificationType, 
  NotificationPriority,
  DeliveryChannel,
  type NotificationPreference 
} from '../types/notification.types';

interface NotificationSettingsProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ paddingTop: 16 }}>
    {value === index && children}
  </div>
);

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ open, onClose }) => {
  const { preferences, updatePreference, loadPreferences } = useNotifications();
  const [activeTab, setActiveTab] = useState(0);
  const [localPreferences, setLocalPreferences] = useState<NotificationPreference[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadPreferences();
    }
  }, [open, loadPreferences]);

  useEffect(() => {
    setLocalPreferences([...preferences]);
  }, [preferences]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getPreference = (type: NotificationType): NotificationPreference => {
    return localPreferences.find(p => p.type === type) || {
      userId: 'default_user',
      type,
      enabled: true,
      deliveryChannels: [DeliveryChannel.IN_APP, DeliveryChannel.WEBSOCKET],
      minimumPriority: NotificationPriority.MEDIUM,
    };
  };

  const updateLocalPreference = (type: NotificationType, updates: Partial<NotificationPreference>) => {
    setLocalPreferences(prev => {
      const index = prev.findIndex(p => p.type === type);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };
        return updated;
      } else {
        return [...prev, { ...getPreference(type), ...updates }];
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const preference of localPreferences) {
        await updatePreference(preference.type, preference);
      }
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences([...preferences]);
    setHasChanges(false);
  };

  const getNotificationTypeIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRADING_OPPORTUNITY:
        return <TrendingUp color="primary" />;
      case NotificationType.PATTERN_ALERT:
        return <TrendingUp color="secondary" />;
      case NotificationType.TECHNICAL_ALERT:
        return <AccessTime color="info" />;
      case NotificationType.RISK_MANAGEMENT:
        return <Security color="warning" />;
      case NotificationType.MARKET_EVENT:
        return <Event color="action" />;
      default:
        return <Notifications color="action" />;
    }
  };

  const getNotificationTypeDescription = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TRADING_OPPORTUNITY:
        return 'Buy/sell signals with confidence scores and entry/exit recommendations';
      case NotificationType.PATTERN_ALERT:
        return 'Breakout confirmations, pattern completions, and support/resistance breaks';
      case NotificationType.TECHNICAL_ALERT:
        return 'RSI overbought/oversold, MACD crossovers, Bollinger Band squeezes, volume spikes';
      case NotificationType.RISK_MANAGEMENT:
        return 'Stop-loss triggers, take-profit targets, position sizing alerts';
      case NotificationType.MARKET_EVENT:
        return 'News sentiment changes, earnings announcements, analyst upgrades/downgrades';
      case NotificationType.MULTI_TIMEFRAME:
        return 'Scalping opportunities, momentum shifts, trend changes across timeframes';
      default:
        return 'Various other market alerts and notifications';
    }
  };

  const renderNotificationTypeSettings = (type: NotificationType) => {
    const preference = getPreference(type);
    
    return (
      <Card key={type} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            {getNotificationTypeIcon(type)}
            <Box ml={2} flex={1}>
              <Typography variant="h6" gutterBottom>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getNotificationTypeDescription(type)}
              </Typography>
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={preference.enabled}
                  onChange={(e) => updateLocalPreference(type, { enabled: e.target.checked })}
                />
              }
              label="Enabled"
            />
          </Box>

          {preference.enabled && (
            <>
              <Divider sx={{ my: 2 }} />
                <Box>
                {/* Minimum Priority */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>Minimum Priority</InputLabel>
                      <Select
                        value={preference.minimumPriority}
                        label="Minimum Priority"
                        onChange={(e) => updateLocalPreference(type, { 
                          minimumPriority: e.target.value as NotificationPriority 
                        })}
                      >
                        <MenuItem value={NotificationPriority.LOW}>Low</MenuItem>
                        <MenuItem value={NotificationPriority.MEDIUM}>Medium</MenuItem>
                        <MenuItem value={NotificationPriority.HIGH}>High</MenuItem>
                        <MenuItem value={NotificationPriority.CRITICAL}>Critical</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Delivery Channels */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      Delivery Channels
                    </Typography>
                    <FormGroup row>
                      {Object.values(DeliveryChannel).map(channel => (
                        <FormControlLabel
                          key={channel}
                          control={
                            <Switch
                              checked={preference.deliveryChannels.includes(channel)}
                              onChange={(e) => {
                                const channels = e.target.checked
                                  ? [...preference.deliveryChannels, channel]
                                  : preference.deliveryChannels.filter(c => c !== channel);
                                updateLocalPreference(type, { deliveryChannels: channels });
                              }}
                              size="small"
                            />
                          }
                          label={channel.replace('_', ' ').toUpperCase()}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                </Box>

                {/* Custom Thresholds for specific types */}
                {type === NotificationType.TRADING_OPPORTUNITY && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Minimum Confidence Score: {preference.customThresholds?.minConfidence || 70}%
                    </Typography>
                    <Slider
                      value={preference.customThresholds?.minConfidence || 70}
                      onChange={(_, value) => updateLocalPreference(type, {
                        customThresholds: {
                          ...preference.customThresholds,
                          minConfidence: value as number,
                        }
                      })}
                      min={50}
                      max={100}
                      marks={[
                        { value: 50, label: '50%' },
                        { value: 70, label: '70%' },
                        { value: 85, label: '85%' },
                        { value: 100, label: '100%' },
                      ]}
                      valueLabelDisplay="auto"                    />
                  </Box>
                )}

                {type === NotificationType.TECHNICAL_ALERT && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Alert Types
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {['RSI', 'MACD', 'Bollinger Bands', 'Volume'].map(indicator => (
                        <Chip
                          key={indicator}
                          label={indicator}
                          clickable
                          color={preference.customThresholds?.indicators?.includes(indicator) ? 'primary' : 'default'}
                          onClick={() => {
                            const indicators = preference.customThresholds?.indicators || [];
                            const updated = indicators.includes(indicator)
                              ? indicators.filter((i: string) => i !== indicator)
                              : [...indicators, indicator];
                            updateLocalPreference(type, {
                              customThresholds: {
                                ...preference.customThresholds,
                                indicators: updated,
                              }
                            });
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderQuietHoursSettings = () => {
    const globalPreference = getPreference(NotificationType.TRADING_OPPORTUNITY);
    
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 3 }}>
          Quiet hours apply to all non-critical notifications. Critical alerts will always be delivered.
        </Alert>

        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Schedule color="primary" />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Quiet Hours
              </Typography>
              <Box ml="auto">
                <FormControlLabel
                  control={
                    <Switch
                      checked={globalPreference.quietHours?.enabled || false}                      onChange={(e) => {
                        // Update all preferences with quiet hours setting
                        Object.values(NotificationType).forEach(type => {
                          const currentQuietHours = getPreference(type).quietHours || { enabled: false, start: '22:00', end: '08:00' };
                          updateLocalPreference(type, {
                            quietHours: {
                              enabled: e.target.checked,
                              start: currentQuietHours.start,
                              end: currentQuietHours.end,
                            }
                          });
                        });
                      }}
                    />
                  }
                  label="Enable Quiet Hours"
                />
              </Box>
            </Box>            {globalPreference.quietHours?.enabled && (
              <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="Start Time"
                    type="time"
                    value={globalPreference.quietHours?.start || '22:00'}
                    onChange={(e) => {
                      Object.values(NotificationType).forEach(type => {
                        const currentQuietHours = getPreference(type).quietHours || { enabled: false, start: '22:00', end: '08:00' };
                        updateLocalPreference(type, {
                          quietHours: {
                            enabled: currentQuietHours.enabled,
                            start: e.target.value,
                            end: currentQuietHours.end,
                          }
                        });
                      });
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    label="End Time"
                    type="time"
                    value={globalPreference.quietHours?.end || '08:00'}
                    onChange={(e) => {
                      Object.values(NotificationType).forEach(type => {
                        const currentQuietHours = getPreference(type).quietHours || { enabled: false, start: '22:00', end: '08:00' };
                        updateLocalPreference(type, {
                          quietHours: {
                            enabled: currentQuietHours.enabled,
                            start: currentQuietHours.start,
                            end: e.target.value,
                          }
                        });
                      });
                    }}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <Notifications sx={{ mr: 2 }} />
          Notification Settings
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Alert Types" />
          <Tab label="Quiet Hours" />
          <Tab label="Browser" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure which types of notifications you want to receive and how they should be delivered.
          </Typography>
          {Object.values(NotificationType).map(renderNotificationTypeSettings)}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderQuietHoursSettings()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Browser notifications require permission. Click the button below to enable them.
          </Alert>
          <Button
            variant="outlined"
            startIcon={<VolumeUp />}
            onClick={() => {
              if ('Notification' in window) {
                Notification.requestPermission();
              }
            }}
            disabled={!('Notification' in window) || Notification.permission === 'granted'}
          >
            {Notification.permission === 'granted' ? 'Browser Notifications Enabled' : 'Enable Browser Notifications'}
          </Button>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleReset} disabled={!hasChanges}>
          Reset
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationSettings;
