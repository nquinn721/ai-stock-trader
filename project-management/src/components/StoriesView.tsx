import {
  Block as BlockedIcon,
  TaskAlt as CompleteIcon,
  Delete as DeleteIcon,
  CheckCircle as DoneIcon,
  PauseCircleFilled as PauseCircleFilledIcon,
  RadioButtonUnchecked as TodoIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { stories } from "../data/stories";
import { Story } from "../data/types";

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
  const [localStories, setLocalStories] = useState<Story[]>(stories);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  const handleMarkComplete = (storyId: string) => {
    setLocalStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? {
              ...story,
              status: "DONE" as const,
              progress: 100,
              completedDate: new Date().toISOString().split("T")[0],
            }
          : story
      )
    );
  };

  const handleDeleteStory = (storyId: string) => {
    setStoryToDelete(storyId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (storyToDelete) {
      setLocalStories((prev) =>
        prev.filter((story) => story.id !== storyToDelete)
      );
      setStoryToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const cancelDelete = () => {
    setStoryToDelete(null);
    setDeleteDialogOpen(false);
  };

  if (!localStories.length) {
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
        {" "}
        {localStories.map((story) => {
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

                {/* Management Actions */}
                <Stack
                  direction="row"
                  spacing={1}
                  mb={2}
                  justifyContent="flex-end"
                >
                  {story.status !== "DONE" && (
                    <Tooltip title="Mark as Complete">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleMarkComplete(story.id)}
                        sx={{
                          backgroundColor: "rgba(76, 175, 80, 0.1)",
                          "&:hover": {
                            backgroundColor: "rgba(76, 175, 80, 0.2)",
                          },
                        }}
                      >
                        <CompleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete Story">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteStory(story.id)}
                      sx={{
                        backgroundColor: "rgba(244, 67, 54, 0.1)",
                        "&:hover": {
                          backgroundColor: "rgba(244, 67, 54, 0.2)",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
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
                {story.completedDate && (
                  <Box mt={1}>
                    <Typography variant="caption" color="success.main">
                      Completed: {story.completedDate}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete story {storyToDelete}? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoriesView;
