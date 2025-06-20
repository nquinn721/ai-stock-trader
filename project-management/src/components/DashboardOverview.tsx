import {
  Dashboard as DashboardIcon,
  Assignment as EpicIcon,
  Code as ScriptIcon,
  CalendarToday as SprintIcon,
  ListAlt as StoriesIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { epics } from "../data/epics";
import { scripts } from "../data/scripts";
import { sprints } from "../data/sprints";
import { stories } from "../data/stories";
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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    "aria-controls": `dashboard-tabpanel-${index}`,
  };
}

const DashboardOverview: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate dashboard metrics
  const totalStories = stories.length;
  const completedStories = stories.filter((s) => s.status === "DONE").length;
  const inProgressStories = stories.filter(
    (s) => s.status === "IN_PROGRESS"
  ).length;
  const storyProgress =
    totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;

  const totalEpics = epics.length;
  const completedEpics = epics.filter((e) => e.status === "DONE").length;
  const inProgressEpics = epics.filter(
    (e) => e.status === "IN_PROGRESS"
  ).length;

  const totalSprints = sprints.length;
  const activeSprints = sprints.filter(
    (s) => s.status === "IN_PROGRESS"
  ).length;
  const completedSprints = sprints.filter((s) => s.status === "DONE").length;

  const totalScripts = scripts.length;

  return (
    <Box>
      <Typography
        variant="h3"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#1976d2" }}
      >
        Project Management Dashboard
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              borderLeft: "4px solid #2196f3",
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <StoriesIcon sx={{ fontSize: 40, color: "#2196f3" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {totalStories}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Stories
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={storyProgress}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" color="textSecondary">
                    {storyProgress}% Complete
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              borderLeft: "4px solid #4caf50",
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <EpicIcon sx={{ fontSize: 40, color: "#4caf50" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {totalEpics}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Epics
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={`${completedEpics} Done`}
                      size="small"
                      color="success"
                    />
                    <Chip
                      label={`${inProgressEpics} Active`}
                      size="small"
                      color="warning"
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              borderLeft: "4px solid #ff9800",
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <SprintIcon sx={{ fontSize: 40, color: "#ff9800" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {totalSprints}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Sprints
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Chip
                      label={`${activeSprints} Active`}
                      size="small"
                      color="warning"
                    />
                    <Chip
                      label={`${completedSprints} Done`}
                      size="small"
                      color="success"
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              borderLeft: "4px solid #9c27b0",
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ScriptIcon sx={{ fontSize: 40, color: "#9c27b0" }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    {totalScripts}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Automation Scripts
                  </Typography>
                  <Chip
                    label="PowerShell → React"
                    size="small"
                    sx={{
                      mt: 1,
                      backgroundColor: "#9c27b020",
                      color: "#9c27b0",
                    }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="dashboard tabs"
        >
          <Tab
            icon={<DashboardIcon />}
            label="Overview"
            {...a11yProps(0)}
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<StoriesIcon />}
            label="Stories"
            {...a11yProps(1)}
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<EpicIcon />}
            label="Epics"
            {...a11yProps(2)}
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<SprintIcon />}
            label="Sprints"
            {...a11yProps(3)}
            sx={{ minHeight: 48 }}
          />
          <Tab
            icon={<ScriptIcon />}
            label="Scripts"
            {...a11yProps(4)}
            sx={{ minHeight: 48 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Project Overview
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Comprehensive view of all project management components converted
            from markdown and PowerShell to React.
          </Typography>

          {/* Quick Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity Summary
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      • {completedStories} stories completed out of{" "}
                      {totalStories} total
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      • {inProgressStories} stories currently in progress
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      • {activeSprints} active sprint
                      {activeSprints !== 1 ? "s" : ""}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      • {totalScripts} automation scripts converted to React
                    </Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                sx={{ borderRadius: 3, boxShadow: 2, p: 2, height: "100%" }}
              >
                <Typography variant="h6" gutterBottom>
                  Conversion Status
                </Typography>
                <Stack spacing={1}>
                  <Chip
                    label="✓ Markdown → TypeScript"
                    size="small"
                    color="success"
                  />
                  <Chip
                    label="✓ PowerShell → React"
                    size="small"
                    color="success"
                  />
                  <Chip
                    label="✓ Dashboard Complete"
                    size="small"
                    color="success"
                  />
                  <Chip
                    label="✓ Real-time Updates"
                    size="small"
                    color="success"
                  />
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <StoriesView />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <EpicsView />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <SprintsView />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <ScriptsView />
      </TabPanel>
    </Box>
  );
};

export default DashboardOverview;
