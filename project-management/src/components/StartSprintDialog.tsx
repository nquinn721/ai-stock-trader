import { CalendarToday } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { sprints } from "../data/sprints";
import { stories } from "../data/stories";

interface StartSprintDialogProps {
  open: boolean;
  onClose: () => void;
  onStartSprint: (sprint: any) => void;
}

const StartSprintDialog: React.FC<StartSprintDialogProps> = ({
  open,
  onClose,
  onStartSprint,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    selectedStories: [] as string[],
  });

  const [error, setError] = useState("");

  const availableStories = stories.filter(
    (story) => story.status === "TODO" && !story.sprint
  );

  const handleSubmit = () => {
    if (
      !formData.name ||
      !formData.goal ||
      formData.selectedStories.length === 0
    ) {
      setError(
        "Please fill in all required fields and select at least one story"
      );
      return;
    }

    const newSprint = {
      id: sprints.length + 1,
      name: formData.name,
      goal: formData.goal,
      startDate: formData.startDate,
      endDate: formData.endDate,
      stories: formData.selectedStories,
      status: "ACTIVE",
      velocity: formData.selectedStories.reduce((sum, storyId) => {
        const story = stories.find((s) => s.id === storyId);
        return sum + (story?.storyPoints || 0);
      }, 0),
    };

    onStartSprint(newSprint);
    setFormData({
      name: "",
      goal: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      selectedStories: [],
    });
    setError("");
    onClose();
  };

  const toggleStory = (storyId: string) => {
    const selected = formData.selectedStories.includes(storyId)
      ? formData.selectedStories.filter((id) => id !== storyId)
      : [...formData.selectedStories, storyId];
    setFormData({ ...formData, selectedStories: selected });
  };

  const totalStoryPoints = formData.selectedStories.reduce((sum, storyId) => {
    const story = stories.find((s) => s.id === storyId);
    return sum + (story?.storyPoints || 0);
  }, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Start New Sprint
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Sprint Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="e.g., Sprint 4 - Advanced Features"
            required
          />

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Sprint Goal"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="What do you want to achieve in this sprint?"
            required
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Select Stories for Sprint
          </Typography>

          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip
              label={`${formData.selectedStories.length} stories selected`}
              color="primary"
            />
            <Chip
              label={`${totalStoryPoints} story points`}
              color="secondary"
            />
          </Stack>
          <List sx={{ maxHeight: 300, overflow: "auto" }}>
            {availableStories.map((story) => (
              <ListItem
                key={story.id}
                sx={{ cursor: "pointer" }}
                onClick={() => toggleStory(story.id)}
              >
                <ListItemIcon>
                  <Checkbox
                    checked={formData.selectedStories.includes(story.id)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={`${story.id}: ${story.title}`}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {story.description}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={story.priority} size="small" />
                        <Chip label={`${story.storyPoints} pts`} size="small" />
                        <Chip
                          label={story.epic}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={story.assignee}
                          size="small"
                          color="secondary"
                        />
                      </Stack>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>

          {availableStories.length === 0 && (
            <Alert severity="info">
              No stories available for sprint. Create new stories or complete
              current sprints first.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<CalendarToday />}
        >
          Start Sprint
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartSprintDialog;
