import {
  Block as BlockedIcon,
  CheckCircle as DoneIcon,
  PauseCircleFilled as PauseCircleFilledIcon,
  RadioButtonUnchecked as TodoIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { stories } from "../data/stories";

const getStatusMeta = (status: string) => {
  switch (status) {
    case "DONE":
      return { icon: <DoneIcon sx={{ color: "#4caf50" }} />, label: "Done" };
    case "IN_PROGRESS":
      return {
        icon: <PauseCircleFilledIcon sx={{ color: "#ff9800" }} />,
        label: "In Progress",
      };
    case "TODO":
      return { icon: <TodoIcon sx={{ color: "#2196f3" }} />, label: "To Do" };
    case "BLOCKED":
      return {
        icon: <BlockedIcon sx={{ color: "#f44336" }} />,
        label: "Blocked",
      };
    case "ON_HOLD":
      return {
        icon: <PauseCircleFilledIcon sx={{ color: "#bdbdbd" }} />,
        label: "On Hold",
      };
    case "REVIEW":
      return { icon: <TodoIcon sx={{ color: "#9c27b0" }} />, label: "Review" };
    default:
      return { icon: <TodoIcon sx={{ color: "#757575" }} />, label: status };
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "error";
    case "Medium":
      return "warning";
    case "Low":
      return "success";
    default:
      return "default";
  }
};

const StoriesView: React.FC = () => {
  if (!stories.length) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5" color="textSecondary">
          No stories found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Storyboard
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 3,
        }}
      >
        {stories.map((story) => {
          const statusMeta = getStatusMeta(story.status);
          return (
            <Card
              key={story.id}
              sx={{ borderRadius: 3, boxShadow: 3, height: "100%" }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Tooltip title={statusMeta.label}>
                    <span>{statusMeta.icon}</span>
                  </Tooltip>
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {story.title}
                  </Typography>
                  <Chip
                    label={story.priority}
                    size="small"
                    color={getPriorityColor(story.priority) as any}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 1 }}
                >
                  {story.description}
                </Typography>
                <Stack direction="row" spacing={1} mb={1} flexWrap="wrap">
                  <Chip
                    label={`ID: ${story.id}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={`Epic: ${story.epic}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip label={`${story.storyPoints} pts`} size="small" />
                  {story.sprint && (
                    <Chip
                      label={`Sprint ${story.sprint}`}
                      size="small"
                      color="primary"
                    />
                  )}
                  {story.assignee && (
                    <Chip
                      avatar={<Avatar>{story.assignee[0]}</Avatar>}
                      label={story.assignee}
                      size="small"
                      color="secondary"
                    />
                  )}
                </Stack>
                {typeof story.progress === "number" && story.progress > 0 && (
                  <Box mb={1}>
                    <Typography variant="caption" color="textSecondary">
                      Progress: {story.progress}%
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={story.progress}
                      sx={{ height: 8, borderRadius: 4, mt: 0.5 }}
                    />
                  </Box>
                )}
                {story.dependencies && story.dependencies.length > 0 && (
                  <Box mt={1}>
                    <Typography variant="caption" color="textSecondary">
                      Dependencies:
                    </Typography>
                    <Stack direction="row" spacing={1} mt={0.5} flexWrap="wrap">
                      {story.dependencies.map((dep) => (
                        <Chip
                          key={dep}
                          label={dep}
                          size="small"
                          variant="outlined"
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

export default StoriesView;
