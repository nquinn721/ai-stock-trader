import {
  CheckCircle as DoneIcon,
  Business as EpicIcon,
  PauseCircleFilled as InProgressIcon,
  RadioButtonUnchecked as TodoIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { epics } from "../data/epics";
import { stories } from "../data/stories";
import { Epic } from "../data/types";

const getStatusMeta = (status: string) => {
  switch (status) {
    case "DONE":
      return {
        icon: <DoneIcon sx={{ color: "#4caf50" }} />,
        label: "Completed",
        color: "#4caf50",
      };
    case "IN_PROGRESS":
      return {
        icon: <InProgressIcon sx={{ color: "#ff9800" }} />,
        label: "In Progress",
        color: "#ff9800",
      };
    case "TODO":
      return {
        icon: <TodoIcon sx={{ color: "#2196f3" }} />,
        label: "Planned",
        color: "#2196f3",
      };
    default:
      return {
        icon: <TodoIcon sx={{ color: "#757575" }} />,
        label: status,
        color: "#757575",
      };
  }
};

const EpicsView: React.FC = () => {
  if (!epics.length) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5" color="textSecondary">
          No epics found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Epic Management
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: 3,
        }}
      >
        {epics.map((epic: Epic) => {
          const statusMeta = getStatusMeta(epic.status);
          const epicStories = stories.filter((story) => story.epic === epic.id);
          const completedStories = epicStories.filter(
            (story) => story.status === "DONE"
          );
          const inProgressStories = epicStories.filter(
            (story) => story.status === "IN_PROGRESS"
          );
          const todoStories = epicStories.filter(
            (story) => story.status === "TODO"
          );
          const progress =
            epicStories.length > 0
              ? Math.round((completedStories.length / epicStories.length) * 100)
              : 0;

          const totalStoryPoints = epicStories.reduce(
            (sum, story) => sum + story.storyPoints,
            0
          );
          const completedStoryPoints = completedStories.reduce(
            (sum, story) => sum + story.storyPoints,
            0
          );

          return (
            <Card
              key={epic.id}
              sx={{
                borderRadius: 3,
                boxShadow: 3,
                height: "100%",
                borderLeft: `4px solid ${statusMeta.color}`,
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <EpicIcon sx={{ color: statusMeta.color, fontSize: 32 }} />
                  <Typography variant="h5" sx={{ flexGrow: 1 }}>
                    {epic.title}
                  </Typography>
                  <Chip
                    icon={statusMeta.icon}
                    label={statusMeta.label}
                    size="small"
                    sx={{
                      backgroundColor: `${statusMeta.color}20`,
                      color: statusMeta.color,
                    }}
                  />
                </Stack>

                <Typography variant="body1" sx={{ mb: 2 }}>
                  {epic.description}
                </Typography>

                <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={`ID: ${epic.id}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Owner: ${epic.owner}`}
                    size="small"
                    color="secondary"
                  />
                  <Chip label={`${epicStories.length} Stories`} size="small" />
                  <Chip label={`${totalStoryPoints} Points`} size="small" />
                </Stack>

                {/* Story Progress */}
                {epicStories.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Story Progress: {progress}% ({completedStories.length}/
                      {epicStories.length} completed)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                )}

                {/* Story Points Progress */}
                {totalStoryPoints > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Story Points: {completedStoryPoints}/{totalStoryPoints}{" "}
                      completed
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(completedStoryPoints / totalStoryPoints) * 100}
                      sx={{ height: 6, borderRadius: 3 }}
                      color="secondary"
                    />
                  </Box>
                )}

                {/* Story Status Breakdown */}
                {epicStories.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Story Status:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {completedStories.length > 0 && (
                        <Chip
                          label={`${completedStories.length} Done`}
                          size="small"
                          sx={{
                            backgroundColor: "#4caf5020",
                            color: "#4caf50",
                          }}
                        />
                      )}
                      {inProgressStories.length > 0 && (
                        <Chip
                          label={`${inProgressStories.length} In Progress`}
                          size="small"
                          sx={{
                            backgroundColor: "#ff980020",
                            color: "#ff9800",
                          }}
                        />
                      )}
                      {todoStories.length > 0 && (
                        <Chip
                          label={`${todoStories.length} Todo`}
                          size="small"
                          sx={{
                            backgroundColor: "#2196f320",
                            color: "#2196f3",
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Epic Stories */}
                {epicStories.length > 0 && (
                  <Box>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Epic Stories:
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {epicStories.map((story) => (
                        <Chip
                          key={story.id}
                          label={`${story.id}: ${story.title.substring(0, 15)}${
                            story.title.length > 15 ? "..." : ""
                          }`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default EpicsView;
