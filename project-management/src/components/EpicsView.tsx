import {
  Archive as ArchiveIcon,
  TaskAlt as CompleteIcon,
  Delete as DeleteIcon,
  CheckCircle as DoneIcon,
  Business as EpicIcon,
  PauseCircleFilled as InProgressIcon,
  RadioButtonUnchecked as TodoIcon,
  Unarchive as UnarchiveIcon,
} from "@mui/icons-material";
import {
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
    case "ARCHIVED":
      return {
        icon: <ArchiveIcon sx={{ color: "#795548" }} />,
        label: "Archived",
        color: "#795548",
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
  const [localEpics, setLocalEpics] = useState<Epic[]>(epics);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [epicToDelete, setEpicToDelete] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const handleMarkComplete = (epicId: string) => {
    setLocalEpics((prev) =>
      prev.map((epic) =>
        epic.id === epicId
          ? {
              ...epic,
              status: "DONE" as const,
              completedDate: new Date().toISOString().split("T")[0],
            }
          : epic
      )
    );
  };

  const handleArchiveEpic = (epicId: string) => {
    setLocalEpics((prev) =>
      prev.map((epic) =>
        epic.id === epicId
          ? {
              ...epic,
              status: "ARCHIVED" as const,
              archivedDate: new Date().toISOString().split("T")[0],
            }
          : epic
      )
    );
  };

  const handleUnarchiveEpic = (epicId: string) => {
    setLocalEpics((prev) =>
      prev.map((epic) =>
        epic.id === epicId
          ? {
              ...epic,
              status: "TODO" as const,
              archivedDate: undefined,
            }
          : epic
      )
    );
  };

  const handleDeleteEpic = (epicId: string) => {
    setEpicToDelete(epicId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (epicToDelete) {
      setLocalEpics((prev) => prev.filter((epic) => epic.id !== epicToDelete));
      setEpicToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const cancelDelete = () => {
    setEpicToDelete(null);
    setDeleteDialogOpen(false);
  };

  const filteredEpics = localEpics.filter((epic) => 
    showArchived ? epic.status === "ARCHIVED" : epic.status !== "ARCHIVED"
  );

  if (!filteredEpics.length) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5" color="textSecondary">
          {showArchived ? "No archived epics found." : "No active epics found."}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setShowArchived(!showArchived)}
          sx={{ mt: 2 }}
        >
          {showArchived ? "Show Active Epics" : "Show Archived Epics"}
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          {showArchived ? "Archived Epics" : "Epic Management"}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => setShowArchived(!showArchived)}
          startIcon={showArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
        >
          {showArchived ? "Show Active Epics" : "Show Archived Epics"}
        </Button>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(500px, 1fr))",
          gap: 3,
        }}
      >
        {filteredEpics.map((epic: Epic) => {
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
                {" "}
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
                {/* Management Actions */}
                <Stack
                  direction="row"
                  spacing={1}
                  mb={2}
                  justifyContent="flex-end"
                >
                  {epic.status !== "DONE" && epic.status !== "ARCHIVED" && (
                    <Tooltip title="Mark as Complete">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleMarkComplete(epic.id)}
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
                  {epic.status === "ARCHIVED" ? (
                    <Tooltip title="Unarchive Epic">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleUnarchiveEpic(epic.id)}
                        sx={{
                          backgroundColor: "rgba(33, 150, 243, 0.1)",
                          "&:hover": {
                            backgroundColor: "rgba(33, 150, 243, 0.2)",
                          },
                        }}
                      >
                        <UnarchiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Archive Epic">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleArchiveEpic(epic.id)}
                        sx={{
                          backgroundColor: "rgba(121, 85, 72, 0.1)",
                          "&:hover": {
                            backgroundColor: "rgba(121, 85, 72, 0.2)",
                          },
                        }}
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Delete Epic">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteEpic(epic.id)}
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
                )}{" "}
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
                {/* Completion Date */}
                {epic.completedDate && (
                  <Box mt={2}>
                    <Typography variant="caption" color="success.main">
                      Completed: {epic.completedDate}
                    </Typography>
                  </Box>
                )}
                {epic.archivedDate && (
                  <Box mt={2}>
                    <Typography variant="caption" color="warning.main">
                      Archived: {epic.archivedDate}
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
            Are you sure you want to delete epic {epicToDelete}? This action
            cannot be undone and may affect related stories.
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

export default EpicsView;
