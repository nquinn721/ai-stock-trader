import { Box, Tab, Tabs, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import AutonomousAgentDashboard from "../components/autonomous-trading/AutonomousAgentDashboard";
import RLAgentDashboard from "../components/autonomous-trading/RLAgentDashboard";
import "./AutonomousTradingPage.css";

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
      id={`autonomous-trading-tabpanel-${index}`}
      aria-labelledby={`autonomous-trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `autonomous-trading-tab-${index}`,
    "aria-controls": `autonomous-trading-tabpanel-${index}`,
  };
}

const AutonomousTradingPage: React.FC = observer(() => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <div className="autonomous-trading-page">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 600 }}>
          Autonomous Trading
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="autonomous trading tabs"
            sx={{
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "1rem",
                minWidth: 200,
              },
              "& .Mui-selected": {
                color: "primary.main",
              },
            }}
          >
            <Tab
              label="Rule-Based Agents"
              {...a11yProps(0)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(25, 118, 210, 0.1)",
                },
              }}
            />
            <Tab
              label="Deep RL Agents"
              {...a11yProps(1)}
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(156, 39, 176, 0.1)",
                },
              }}
            />
          </Tabs>
        </Box>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <AutonomousAgentDashboard />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <RLAgentDashboard />
      </TabPanel>
    </div>
  );
});

export default AutonomousTradingPage;
