import {
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Unarchive as UnarchiveIcon,
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

const ArchiveView: React.FC = () => {
  const [localStories, setLocalStories] = useState<Story[]>(stories);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<string | null>(null);

  const archivedStories = localStories.filter(
    (story) => story.status === "ARCHIVED"
  );

  const handleUnarchiveStory = (storyId: string) => {
    setLocalStories((prev) =>
      prev.map((story) =>
        story.id === storyId
          ? {
              ...story,
              status: "TODO" as const,
              archivedDate: undefined,
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "#d32f2f";
      case "high":
        return "#f57c00";
      case "medium":
        return "#1976d2";
      case "low":
        return "#388e3c";
      default:
        return "#9e9e9e";
    }
  };

  if (archivedStories.length === 0) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <ArchiveIcon sx={{ fontSize: 80, color: "#bdbdbd", mb: 2 }} />
        <Typography variant="h5" color="textSecondary" gutterBottom>
          No Archived Stories
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Stories that are archived will appear here for reference and potential
          restoration.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">
          Archived Stories ({archivedStories.length})
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Completed stories archived on or after their completion dates
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 3,
        }}
      >
        {archivedStories.map((story) => (
          <Card
            key={story.id}
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              height: "100%",
              opacity: 0.8,
              border: "1px solid #e0e0e0",
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <ArchiveIcon sx={{ color: "#757575" }} />
                <Typography variant="h6" sx={{ flexGrow: 1, color: "#757575" }}>
                  {story.title}
                </Typography>
                <Chip
                  label={story.priority}
                  size="small"
                  sx={{
                    backgroundColor: getPriorityColor(story.priority),
                    color: "white",
                    fontWeight: "bold",
                  }}
                />
              </Stack>

              <Typography variant="body2" color="textSecondary" mb={2}>
                {story.description}
              </Typography>

              <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
                <Chip
                  label={`Epic: ${story.epic}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`Points: ${story.storyPoints}`}
                  size="small"
                  variant="outlined"
                />
                {story.sprint && (
                  <Chip
                    label={`Sprint: ${story.sprint}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
                  {story.assignee?.charAt(0)}
                </Avatar>
                <Typography variant="body2">{story.assignee}</Typography>
                {story.archivedDate && (
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    ml="auto!"
                  >
                    Archived: {story.archivedDate}
                  </Typography>
                )}
              </Stack>

              {story.completedDate && (
                <Typography
                  variant="caption"
                  color="textSecondary"
                  mb={1}
                  display="block"
                >
                  Completed: {story.completedDate}
                </Typography>
              )}

              {story.progress !== undefined && (
                <Box mb={2}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    mb={0.5}
                  >
                    <Typography variant="caption">Progress</Typography>
                    <Typography variant="caption">{story.progress}%</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={story.progress}
                    sx={{ opacity: 0.6 }}
                  />
                </Box>
              )}

              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                <Tooltip title="Restore Story">
                  <IconButton
                    size="small"
                    onClick={() => handleUnarchiveStory(story.id)}
                    sx={{ color: "#4caf50" }}
                  >
                    <UnarchiveIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Permanently">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteStory(story.id)}
                    sx={{ color: "#f44336" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
        <DialogTitle>Delete Story Permanently</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete this story? This action
            cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ArchiveView;
