import {
  AddTask as CreateStoryIcon,
  Assessment as ReportIcon,
  PlayArrow as StartSprintIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { projectActions } from "../data/projectActions";
import CreateStoryDialog from "./CreateStoryDialog";
import GenerateReportDialog from "./GenerateReportDialog";
import StartSprintDialog from "./StartSprintDialog";

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "CREATE_STORY":
      return <CreateStoryIcon sx={{ color: "#4caf50" }} />;
    case "START_SPRINT":
      return <StartSprintIcon sx={{ color: "#2196f3" }} />;
    case "GENERATE_REPORT":
      return <ReportIcon sx={{ color: "#ff9800" }} />;
    default:
      return <CreateStoryIcon sx={{ color: "#9c27b0" }} />;
  }
};

const ScriptsView: React.FC = () => {
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [startSprintOpen, setStartSprintOpen] = useState(false);
  const [generateReportOpen, setGenerateReportOpen] = useState(false);

  const handleActionClick = (actionType: string) => {
    switch (actionType) {
      case "CREATE_STORY":
        setCreateStoryOpen(true);
        break;
      case "START_SPRINT":
        setStartSprintOpen(true);
        break;
      case "GENERATE_REPORT":
        setGenerateReportOpen(true);
        break;
    }
  };

  const handleCreateStory = (storyData: any) => {
    console.log("Creating story:", storyData);
    // In a real app, this would update the global state or call an API
  };

  const handleStartSprint = (sprintData: any) => {
    console.log("Starting sprint:", sprintData);
    // In a real app, this would update the global state or call an API
  };

  const handleGenerateReport = (reportData: any) => {
    console.log("Generated report:", reportData);
    // In a real app, this would save/display the report
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Project Actions
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        React-based project management actions - no PowerShell scripts needed
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 3,
        }}
      >
        {" "}
        {projectActions.map((action, index: number) => {
          return (
            <Card
              key={action.id}
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                height: "100%",
                borderLeft: `4px solid ${action.color}`,
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  {getActionIcon(action.type)}
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {action.title}
                  </Typography>
                  <Chip
                    label="React"
                    size="small"
                    sx={{
                      backgroundColor: `${action.color}20`,
                      color: action.color,
                    }}
                  />
                </Stack>

                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 3 }}
                >
                  {action.description}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1}
                  flexWrap="wrap"
                  sx={{ mb: 2 }}
                >
                  <Chip
                    label="React"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Chip
                    label="TypeScript"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                  <Chip
                    label="Interactive"
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </Stack>
              </CardContent>

              <CardActions>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleActionClick(action.type)}
                  startIcon={getActionIcon(action.type)}
                  sx={{
                    backgroundColor: action.color,
                    "&:hover": {
                      backgroundColor: action.color,
                      filter: "brightness(0.8)",
                    },
                  }}
                >
                  Execute Action
                </Button>
              </CardActions>
            </Card>
          );
        })}
      </Box>

      {/* Action Dialogs */}
      <CreateStoryDialog
        open={createStoryOpen}
        onClose={() => setCreateStoryOpen(false)}
        onCreateStory={handleCreateStory}
      />

      <StartSprintDialog
        open={startSprintOpen}
        onClose={() => setStartSprintOpen(false)}
        onStartSprint={handleStartSprint}
      />

      <GenerateReportDialog
        open={generateReportOpen}
        onClose={() => setGenerateReportOpen(false)}
        onGenerate={handleGenerateReport}
      />
    </Box>
  );
};

export default ScriptsView;
