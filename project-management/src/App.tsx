import { Box, Container, Tab, Tabs } from "@mui/material";
import React from "react";
import "./App.css";
import DashboardOverview from "./components/DashboardOverview";
import EpicsView from "./components/EpicsView";
import Header from "./components/Header";
import StoriesView from "./components/StoriesView";

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    "aria-controls": `dashboard-tabpanel-${index}`,
  };
}

const App: React.FC = () => {
  const [tab, setTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTab(newValue);
  };

  return (
    <Box>
      <Header />
      <Container maxWidth="xl">
        <Tabs
          value={tab}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
          sx={{ mb: 3 }}
        >
          <Tab label="Overview" {...a11yProps(0)} />
          <Tab label="Stories" {...a11yProps(1)} />
          <Tab label="Epics" {...a11yProps(2)} />
        </Tabs>
        <Box hidden={tab !== 0}>
          <DashboardOverview />
        </Box>
        <Box hidden={tab !== 1}>
          <StoriesView />
        </Box>
        <Box hidden={tab !== 2}>
          <EpicsView />
        </Box>
      </Container>
    </Box>
  );
};

export default App;
