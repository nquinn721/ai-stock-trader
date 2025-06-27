import {
  AccountBalance,
  CurrencyBitcoin,
  Grain,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { AlternativeDataFeed } from "./AlternativeDataFeed";
import { CommoditiesDashboard } from "./CommoditiesDashboard";
import { CrossAssetAnalytics } from "./CrossAssetAnalytics";
import { CryptoDashboard } from "./CryptoDashboard";
import { ForexDashboard } from "./ForexDashboard";
import "./MultiAssetDashboard.css";

interface AssetOverview {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  assetDistribution: {
    stocks: number;
    crypto: number;
    forex: number;
    commodities: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`multi-asset-tabpanel-${index}`}
      aria-labelledby={`multi-asset-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const MultiAssetDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [assetOverview, setAssetOverview] = useState<AssetOverview | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssetOverview();
  }, []);

  const fetchAssetOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/multi-asset/overview");
      if (response.ok) {
        const data = await response.json();
        setAssetOverview(data);
      }
    } catch (error) {
      console.error("Error fetching asset overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "#4caf50" : "#f44336";
  };

  if (loading) {
    return (
      <div className="multi-asset-dashboard">
        <div className="loading-skeleton">
          <Typography variant="h4" gutterBottom>
            Loading Multi-Asset Dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-asset-dashboard">
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: "#2c3e50", fontWeight: "bold" }}
        >
          Multi-Asset Intelligence Platform
        </Typography>
        <Typography variant="subtitle1" sx={{ color: "#7f8c8d" }}>
          Unified view across stocks, crypto, forex, and commodities
        </Typography>
      </Box>

      {/* Asset Overview Cards */}
      <div className="overview-cards-container">
        <Card className="overview-card">
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Portfolio Value
                </Typography>
                <Typography variant="h5" component="div">
                  ${assetOverview?.totalValue?.toLocaleString() || "0"}
                </Typography>
              </Box>
              <TrendingUp color="primary" />
            </Box>
          </CardContent>
        </Card>

        <Card className="overview-card">
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Daily Change
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    color: getChangeColor(assetOverview?.dailyChange || 0),
                  }}
                >
                  ${assetOverview?.dailyChange?.toLocaleString() || "0"}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: getChangeColor(
                      assetOverview?.dailyChangePercent || 0
                    ),
                  }}
                >
                  ({assetOverview?.dailyChangePercent?.toFixed(2) || "0"}%)
                </Typography>
              </Box>
              <AccountBalance color="secondary" />
            </Box>
          </CardContent>
        </Card>

        <Card className="overview-card">
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Crypto Allocation
                </Typography>
                <Typography variant="h5" component="div">
                  {assetOverview?.assetDistribution?.crypto?.toFixed(1) || "0"}%
                </Typography>
              </Box>
              <CurrencyBitcoin sx={{ color: "#f7931a" }} />
            </Box>
          </CardContent>
        </Card>

        <Card className="overview-card">
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Commodities
                </Typography>
                <Typography variant="h5" component="div">
                  {assetOverview?.assetDistribution?.commodities?.toFixed(1) ||
                    "0"}
                  %
                </Typography>
              </Box>
              <Grain sx={{ color: "#8bc34a" }} />
            </Box>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="multi-asset dashboard tabs"
          variant="fullWidth"
          sx={{
            "& .MuiTab-root": {
              fontSize: "1rem",
              fontWeight: "bold",
            },
          }}
        >
          <Tab label="Cross-Asset Analytics" />
          <Tab label="Cryptocurrency" />
          <Tab label="Forex" />
          <Tab label="Commodities" />
          <Tab label="Alternative Data" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        <CrossAssetAnalytics />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <CryptoDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ForexDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <CommoditiesDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <AlternativeDataFeed />
      </TabPanel>
    </div>
  );
};
