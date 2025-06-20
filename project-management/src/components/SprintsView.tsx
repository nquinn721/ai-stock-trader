import {
  CheckCircle as DoneIcon,
  PauseCircleFilled as InProgressIcon,
  CalendarToday as SprintIcon,
  RadioButtonUnchecked as TodoIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { sprints } from "../data/sprints";
import { stories } from "../data/stories";
import { Sprint } from "../data/types";

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

const SprintsView: React.FC = () => {
  if (!sprints.length) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5" color="textSecondary">
          No sprints found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Sprint Management
      </Typography>
      <Grid container spacing={3}>
        {sprints.map((sprint: Sprint) => {
          const statusMeta = getStatusMeta(sprint.status);
          const sprintStories = stories.filter((story) =>
            sprint.stories.includes(story.id)
          );
          const completedStories = sprintStories.filter(
            (story) => story.status === "DONE"
          );
          const inProgressStories = sprintStories.filter(
            (story) => story.status === "IN_PROGRESS"
          );
          const todoStories = sprintStories.filter(
            (story) => story.status === "TODO"
          );
          const progress =
            sprintStories.length > 0
              ? Math.round(
                  (completedStories.length / sprintStories.length) * 100
                )
              : 0;

          const totalStoryPoints = sprintStories.reduce(
            (sum, story) => sum + story.storyPoints,
            0
          );
          const completedStoryPoints = completedStories.reduce(
            (sum, story) => sum + story.storyPoints,
            0
          );

          const startDate = new Date(sprint.startDate);
          const endDate = new Date(sprint.endDate);
          const today = new Date();
          const totalDays = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const daysElapsed = Math.max(
            0,
            Math.ceil(
              (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
          );
          const timeProgress = Math.min(
            100,
            Math.max(0, (daysElapsed / totalDays) * 100)
          );

          return (
            <Grid item xs={12} md={6} key={sprint.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  height: "100%",
                  borderLeft: `4px solid ${statusMeta.color}`,
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <SprintIcon
                      sx={{ color: statusMeta.color, fontSize: 28 }}
                    />
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>
                      {sprint.name}
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

                  <Typography
                    variant="body1"
                    sx={{ mb: 2, fontStyle: "italic" }}
                  >
                    Goal: {sprint.goal}
                  </Typography>

                  <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                    <Chip
                      label={`${sprint.startDate} - ${sprint.endDate}`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${sprintStories.length} Stories`}
                      size="small"
                    />
                    <Chip label={`${totalStoryPoints} Points`} size="small" />
                  </Stack>

                  {/* Story Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Story Progress: {progress}% ({completedStories.length}/
                      {sprintStories.length} completed)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  {/* Story Points Progress */}
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
                      value={
                        totalStoryPoints > 0
                          ? (completedStoryPoints / totalStoryPoints) * 100
                          : 0
                      }
                      sx={{ height: 6, borderRadius: 3 }}
                      color="secondary"
                    />
                  </Box>

                  {/* Time Progress */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Time Progress: {Math.round(timeProgress)}% ({daysElapsed}/
                      {totalDays} days)
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={timeProgress}
                      sx={{ height: 6, borderRadius: 3 }}
                      color={timeProgress > progress ? "warning" : "success"}
                    />
                  </Box>

                  {/* Story Status Breakdown */}
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

                  {/* Sprint Stories */}
                  {sprintStories.length > 0 && (
                    <Box>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 1 }}
                      >
                        Sprint Stories:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {sprintStories.map((story) => (
                          <Chip
                            key={story.id}
                            label={`${story.id}: ${story.title.substring(
                              0,
                              20
                            )}${story.title.length > 20 ? "..." : ""}`}
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
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default SprintsView;
