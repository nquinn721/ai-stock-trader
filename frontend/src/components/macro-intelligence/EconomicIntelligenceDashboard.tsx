import {
  AccountBalance,
  Assessment,
  Public,
  Refresh,
  ShowChart,
  TrendingDown,
  TrendingUp,
  Warning,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import macroIntelligenceService, {
  EconomicAnalysis,
  GeopoliticalRisk,
  MonetaryPolicyAnalysis,
} from "../../services/macroIntelligenceService";
import "../../shared-styles.css";
import ContentCard from "../ui/ContentCard";
import LoadingState from "../ui/LoadingState";
import StatusChip from "../ui/StatusChip";
import "./EconomicIntelligenceDashboard.css";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`economic-intelligence-tabpanel-${index}`}
      aria-labelledby={`economic-intelligence-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `economic-intelligence-tab-${index}`,
    "aria-controls": `economic-intelligence-tabpanel-${index}`,
  };
}

interface EconomicIntelligenceDashboardProps {
  currentTime?: Date;
  isConnected?: boolean;
  onNavigateBack?: () => void;
}

const EconomicIntelligenceDashboard: React.FC<
  EconomicIntelligenceDashboardProps
> = ({ currentTime = new Date(), isConnected = true, onNavigateBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("US");

  // Real API data - no more mock data
  const [economicData, setEconomicData] = useState<EconomicAnalysis | null>(
    null
  );
  const [monetaryData, setMonetaryData] =
    useState<MonetaryPolicyAnalysis | null>(null);
  const [geopoliticalData, setGeopoliticalData] = useState<GeopoliticalRisk[]>(
    []
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const loadEconomicData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load real data from API
      const data =
        await macroIntelligenceService.getDashboardData(selectedCountry);

      setEconomicData(data.economic);
      setMonetaryData(data.monetary);
      setGeopoliticalData(data.geopolitical);

      setLoading(false);
    } catch (err: any) {
      console.error("Error loading economic intelligence data:", err);

      // Handle API errors gracefully with proper "no data" states
      if (err.response?.status === 404) {
        setError(
          `No economic data available for ${selectedCountry}. Please try another country.`
        );
      } else if (err.response?.status >= 500) {
        setError(
          "Economic intelligence service is temporarily unavailable. Please try again later."
        );
      } else if (err.code === "ECONNREFUSED") {
        setError(
          "Unable to connect to the economic intelligence service. Please check if the backend is running."
        );
      } else {
        setError(
          `Failed to load economic intelligence data: ${err.message || "Unknown error"}`
        );
      }

      // Clear data on error to show empty states
      setEconomicData(null);
      setMonetaryData(null);
      setGeopoliticalData([]);

      setLoading(false);
    }
  };

  useEffect(() => {
    loadEconomicData();
  }, [selectedCountry]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising":
        return <TrendingUp color="success" fontSize="small" />;
      case "falling":
        return <TrendingDown color="error" fontSize="small" />;
      default:
        return <ShowChart color="action" fontSize="small" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return "error";
    if (risk >= 50) return "warning";
    return "success";
  };

  const renderEconomicAnalysisTab = () => (
    <div className="economic-analysis-tab">
      {economicData ? (
        <>
          {/* Overview Cards */}
          <div className="content-grid">
            <ContentCard
              title="Economic Health Score"
              variant="gradient"
              padding="lg"
              headerActions={
                <Chip
                  label={`${economicData.overallHealth}/100`}
                  color={
                    economicData.overallHealth >= 70
                      ? "success"
                      : economicData.overallHealth >= 50
                        ? "warning"
                        : "error"
                  }
                  size="small"
                />
              }
            >
              <div className="metric-display">
                <LinearProgress
                  variant="determinate"
                  value={economicData.overallHealth}
                  color={
                    economicData.overallHealth >= 70
                      ? "success"
                      : economicData.overallHealth >= 50
                        ? "warning"
                        : "error"
                  }
                  sx={{ height: 8, borderRadius: 4, mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {economicData.outlook.charAt(0).toUpperCase() +
                    economicData.outlook.slice(1)}{" "}
                  outlook with {economicData.confidence}% confidence
                </Typography>
              </div>
            </ContentCard>

            <ContentCard
              title="Key Economic Trends"
              variant="default"
              padding="lg"
            >
              <div className="trends-grid">
                <div className="trend-item">
                  <Typography variant="body2" color="text.secondary">
                    GDP Growth
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    +{economicData.trends.gdpGrowth}%
                  </Typography>
                </div>
                <div className="trend-item">
                  <Typography variant="body2" color="text.secondary">
                    Inflation
                  </Typography>
                  <Typography variant="h6" color="warning.main">
                    {economicData.trends.inflation}%
                  </Typography>
                </div>
                <div className="trend-item">
                  <Typography variant="body2" color="text.secondary">
                    Unemployment
                  </Typography>
                  <Typography variant="h6" color="info.main">
                    {economicData.trends.unemployment}%
                  </Typography>
                </div>
                <div className="trend-item">
                  <Typography variant="body2" color="text.secondary">
                    Productivity
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    +{economicData.trends.productivity}%
                  </Typography>
                </div>
              </div>
            </ContentCard>
          </div>

          {/* Economic Indicators */}
          <ContentCard
            title="Economic Indicators"
            subtitle="Real-time analysis of key economic metrics"
            variant="default"
            padding="lg"
          >
            {economicData.indicators.length > 0 ? (
              <div className="indicators-grid">
                {economicData.indicators.map((indicator, index) => (
                  <div key={index} className="indicator-card">
                    <div className="indicator-header">
                      <Typography variant="body2" fontWeight="medium">
                        {indicator.indicator}
                      </Typography>
                      <div className="indicator-trend">
                        {getTrendIcon(indicator.trend)}
                        <Chip
                          label={indicator.impact}
                          size="small"
                          color={getImpactColor(indicator.impact)}
                          variant="outlined"
                        />
                      </div>
                    </div>
                    <div className="indicator-values">
                      <Typography variant="h6" color="primary">
                        {indicator.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Previous: {indicator.previousValue} | Forecast:{" "}
                        {indicator.forecast}
                      </Typography>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert severity="info">
                No economic indicators available for {selectedCountry}. Data may
                be updating.
              </Alert>
            )}
          </ContentCard>

          {/* Risks and Opportunities */}
          <div className="content-grid">
            <ContentCard
              title="Economic Risks"
              variant="default"
              padding="lg"
              headerActions={<Warning color="warning" />}
            >
              <div className="risk-list">
                {economicData.risks.length > 0 ? (
                  economicData.risks.map((risk, index) => (
                    <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                      {risk}
                    </Alert>
                  ))
                ) : (
                  <Alert severity="info">
                    No economic risks identified for {selectedCountry}.
                  </Alert>
                )}
              </div>
            </ContentCard>

            <ContentCard
              title="Opportunities"
              variant="default"
              padding="lg"
              headerActions={<TrendingUp color="success" />}
            >
              <div className="opportunity-list">
                {economicData.opportunities.length > 0 ? (
                  economicData.opportunities.map((opportunity, index) => (
                    <Alert key={index} severity="success" sx={{ mb: 1 }}>
                      {opportunity}
                    </Alert>
                  ))
                ) : (
                  <Alert severity="info">
                    No economic opportunities identified for {selectedCountry}.
                  </Alert>
                )}
              </div>
            </ContentCard>
          </div>
        </>
      ) : (
        <ContentCard
          title="No Economic Data Available"
          variant="default"
          padding="lg"
        >
          <Alert severity="info" sx={{ mb: 2 }}>
            Economic analysis data is not available for {selectedCountry}. This
            could be due to:
          </Alert>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Data is still being processed</li>
            <li>Country not supported by our economic intelligence system</li>
            <li>Temporary service unavailability</li>
          </Typography>
          <Button
            variant="outlined"
            onClick={loadEconomicData}
            sx={{ mt: 2 }}
            startIcon={<Refresh />}
          >
            Try Again
          </Button>
        </ContentCard>
      )}
    </div>
  );

  const renderMonetaryPolicyTab = () => (
    <div className="monetary-policy-tab">
      {monetaryData ? (
        <>
          <div className="content-grid">
            <ContentCard
              title="Current Policy Stance"
              variant="gradient"
              padding="lg"
              headerActions={<AccountBalance />}
            >
              <div className="policy-stance">
                <StatusChip
                  status={
                    monetaryData.currentStance === "hawkish"
                      ? "error"
                      : monetaryData.currentStance === "dovish"
                        ? "success"
                        : "warning"
                  }
                  label={monetaryData.currentStance.toUpperCase()}
                  size="lg"
                />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {monetaryData.centralBank} maintains a{" "}
                  {monetaryData.currentStance} policy stance
                </Typography>
              </div>
            </ContentCard>

            <ContentCard
              title="Rate Expectations"
              variant="default"
              padding="lg"
            >
              <div className="rate-expectations">
                <div className="rate-item">
                  <Typography variant="body2" color="text.secondary">
                    Next Meeting
                  </Typography>
                  <Typography variant="h6">
                    {monetaryData.rateExpectations.nextMeeting}%
                  </Typography>
                </div>
                <div className="rate-item">
                  <Typography variant="body2" color="text.secondary">
                    6 Months
                  </Typography>
                  <Typography variant="h6">
                    {monetaryData.rateExpectations.sixMonth}%
                  </Typography>
                </div>
                <div className="rate-item">
                  <Typography variant="body2" color="text.secondary">
                    1 Year
                  </Typography>
                  <Typography variant="h6">
                    {monetaryData.rateExpectations.oneYear}%
                  </Typography>
                </div>
              </div>
            </ContentCard>

            <ContentCard title="QE Probability" variant="default" padding="lg">
              <div className="qe-probability">
                <Typography variant="h4" color="primary">
                  {monetaryData.qeProbability}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={monetaryData.qeProbability}
                  color="primary"
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Probability of quantitative easing within 12 months
                </Typography>
              </div>
            </ContentCard>
          </div>

          <ContentCard
            title="Market Impact Assessment"
            variant="default"
            padding="lg"
          >
            <div className="market-impact-grid">
              <div className="impact-item">
                <Typography variant="body2" fontWeight="medium">
                  Equities
                </Typography>
                <StatusChip
                  status={
                    monetaryData.marketImpact.equities === "positive"
                      ? "success"
                      : monetaryData.marketImpact.equities === "negative"
                        ? "error"
                        : "warning"
                  }
                  label={monetaryData.marketImpact.equities}
                />
              </div>
              <div className="impact-item">
                <Typography variant="body2" fontWeight="medium">
                  Bonds
                </Typography>
                <StatusChip
                  status={
                    monetaryData.marketImpact.bonds === "positive"
                      ? "success"
                      : monetaryData.marketImpact.bonds === "negative"
                        ? "error"
                        : "warning"
                  }
                  label={monetaryData.marketImpact.bonds}
                />
              </div>
              <div className="impact-item">
                <Typography variant="body2" fontWeight="medium">
                  Currency
                </Typography>
                <StatusChip
                  status={
                    monetaryData.marketImpact.currency === "positive"
                      ? "success"
                      : monetaryData.marketImpact.currency === "negative"
                        ? "error"
                        : "warning"
                  }
                  label={monetaryData.marketImpact.currency}
                />
              </div>
            </div>
          </ContentCard>
        </>
      ) : (
        <ContentCard
          title="No Monetary Policy Data Available"
          variant="default"
          padding="lg"
        >
          <Alert severity="info" sx={{ mb: 2 }}>
            Monetary policy analysis data is not available for {selectedCountry}
            . This could be due to:
          </Alert>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Central bank communication data is being processed</li>
            <li>Country's monetary policy not tracked by our system</li>
            <li>Temporary service unavailability</li>
          </Typography>
          <Button
            variant="outlined"
            onClick={loadEconomicData}
            sx={{ mt: 2 }}
            startIcon={<Refresh />}
          >
            Try Again
          </Button>
        </ContentCard>
      )}
    </div>
  );

  const renderGeopoliticalTab = () => (
    <div className="geopolitical-tab">
      {geopoliticalData.length > 0 ? (
        <div className="content-grid">
          {geopoliticalData.map((region, index) => (
            <ContentCard
              key={index}
              title={region.region}
              variant="default"
              padding="lg"
              headerActions={
                <Chip
                  label={`Risk: ${region.overallRisk}`}
                  color={getRiskColor(region.overallRisk)}
                  size="small"
                />
              }
            >
              <div className="geopolitical-metrics">
                <div className="metric-row">
                  <Typography variant="body2">Political Stability</Typography>
                  <div className="metric-bar">
                    <LinearProgress
                      variant="determinate"
                      value={region.politicalStability}
                      color={getRiskColor(100 - region.politicalStability)}
                      sx={{ flexGrow: 1, mx: 1 }}
                    />
                    <Typography variant="body2">
                      {region.politicalStability}%
                    </Typography>
                  </div>
                </div>

                <div className="metric-row">
                  <Typography variant="body2">Conflict Risk</Typography>
                  <div className="metric-bar">
                    <LinearProgress
                      variant="determinate"
                      value={region.conflictRisk}
                      color={getRiskColor(100 - region.conflictRisk)}
                      sx={{ flexGrow: 1, mx: 1 }}
                    />
                    <Typography variant="body2">
                      {region.conflictRisk}%
                    </Typography>
                  </div>
                </div>

                <div className="metric-row">
                  <Typography variant="body2">Trade Risk</Typography>
                  <div className="metric-bar">
                    <LinearProgress
                      variant="determinate"
                      value={region.tradeRisk}
                      color={getRiskColor(100 - region.tradeRisk)}
                      sx={{ flexGrow: 1, mx: 1 }}
                    />
                    <Typography variant="body2">{region.tradeRisk}%</Typography>
                  </div>
                </div>

                <div className="key-events">
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    sx={{ mb: 1 }}
                  >
                    Key Events
                  </Typography>
                  {region.keyEvents.length > 0 ? (
                    region.keyEvents.map((event, eventIndex) => (
                      <Chip
                        key={eventIndex}
                        label={event}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No major events reported
                    </Typography>
                  )}
                </div>

                <div className="sanctions-status">
                  <Typography variant="body2" fontWeight="medium">
                    Sanctions Active: {region.sanctions ? "Yes" : "No"}
                  </Typography>
                  <StatusChip
                    status={region.sanctions ? "error" : "success"}
                    label={`Market Impact: ${region.marketImpact}`}
                    size="sm"
                  />
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      ) : (
        <ContentCard
          title="No Geopolitical Data Available"
          variant="default"
          padding="lg"
        >
          <Alert severity="info" sx={{ mb: 2 }}>
            Geopolitical risk analysis data is not available. This could be due
            to:
          </Alert>
          <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
            <li>Geopolitical events data is being processed</li>
            <li>
              No significant geopolitical risks detected for selected regions
            </li>
            <li>Temporary service unavailability</li>
          </Typography>
          <Button
            variant="outlined"
            onClick={loadEconomicData}
            sx={{ mt: 2 }}
            startIcon={<Refresh />}
          >
            Try Again
          </Button>
        </ContentCard>
      )}
    </div>
  );

  return (
    <div className="economic-intelligence-dashboard">
      <div className="dashboard-content">
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ContentCard variant="glass" padding="sm" className="tabs-container">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="economic intelligence tabs"
            className="main-tabs"
          >
            <Tab
              icon={<Assessment />}
              label="Economic Analysis"
              {...a11yProps(0)}
            />
            <Tab
              icon={<AccountBalance />}
              label="Monetary Policy"
              {...a11yProps(1)}
            />
            <Tab
              icon={<Public />}
              label="Geopolitical Risk"
              {...a11yProps(2)}
            />
          </Tabs>
        </ContentCard>

        {loading && (
          <LoadingState
            variant="spinner"
            message="Loading economic intelligence data..."
            size="lg"
            fullHeight={false}
          />
        )}

        <TabPanel value={activeTab} index={0}>
          {renderEconomicAnalysisTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderMonetaryPolicyTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderGeopoliticalTab()}
        </TabPanel>
      </div>
    </div>
  );
};

export default EconomicIntelligenceDashboard;
