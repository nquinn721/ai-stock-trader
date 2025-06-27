import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import ArchiveView from "./ArchiveView";
import EpicsView from "./EpicsView";
import ScriptsView from "./ScriptsView";
import SprintsView from "./SprintsView";
import StoriesView from "./StoriesView";

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const DashboardOverview: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography
        variant="h3"
        component="h1"
        gutterBottom
        sx={{ mb: 4, textAlign: "center" }}
      >
        Project Management Dashboard
      </Typography>

      <Paper sx={{ width: "100%", mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="project management tabs"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          {" "}
          <Tab label="Stories" {...a11yProps(0)} />
          <Tab label="Epics" {...a11yProps(1)} />
          <Tab label="Sprints" {...a11yProps(2)} />
          <Tab label="Actions" {...a11yProps(3)} />
          <Tab label="Archive" {...a11yProps(4)} />
        </Tabs>

        <TabPanel value={value} index={0}>
          <StoriesView />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <EpicsView />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <SprintsView />
        </TabPanel>
        <TabPanel value={value} index={3}>
          <ScriptsView />
        </TabPanel>
        <TabPanel value={value} index={4}>
          <ArchiveView />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default DashboardOverview;
