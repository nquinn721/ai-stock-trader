import {
  CheckCircle as DoneIcon,
  Assignment as EpicIcon,
  PauseCircleFilled as InProgressIcon,
  RadioButtonUnchecked as TodoIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Tooltip,
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
        label: "Done",
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
        label: "To Do",
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
        Epic Overview
      </Typography>
      <Grid container spacing={3}>
        {epics.map((epic: Epic) => {
          const statusMeta = getStatusMeta(epic.status);
          const relatedStories = stories.filter(
            (story) => story.epic === epic.id
          );
          const completedStories = relatedStories.filter(
            (story) => story.status === "DONE"
          );
          const progress =
            relatedStories.length > 0
              ? Math.round(
                  (completedStories.length / relatedStories.length) * 100
                )
              : 0;

          return (
            <Grid item xs={12} sm={6} md={6} key={epic.id}>
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
                    <EpicIcon sx={{ color: statusMeta.color, fontSize: 28 }} />
                    <Typography variant="h5" sx={{ flexGrow: 1 }}>
                      {epic.title}
                    </Typography>
                    <Tooltip title={statusMeta.label}>
                      <span>{statusMeta.icon}</span>
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
                      avatar={
                        <Avatar sx={{ bgcolor: "#1976d2" }}>
                          {epic.owner[0]}
                        </Avatar>
                      }
                      label={epic.owner}
                      size="small"
                      color="primary"
                    />
                    <Chip
                      label={`${relatedStories.length} Stories`}
                      size="small"
                    />
                  </Stack>

                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      sx={{ mb: 1 }}
                    >
                      Progress: {progress}% ({completedStories.length}/
                      {relatedStories.length} stories completed)
                    </Typography>
                    <Box
                      sx={{
                        width: "100%",
                        height: 8,
                        backgroundColor: "#e0e0e0",
                        borderRadius: 4,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${progress}%`,
                          height: "100%",
                          backgroundColor: statusMeta.color,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>

                  {relatedStories.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 1 }}
                      >
                        Related Stories:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {relatedStories.slice(0, 3).map((story) => (
                          <Chip
                            key={story.id}
                            label={story.id}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        ))}
                        {relatedStories.length > 3 && (
                          <Chip
                            label={`+${relatedStories.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        )}
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

export default EpicsView;
