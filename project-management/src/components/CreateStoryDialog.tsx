import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { epics } from "../data/epics";
import { stories } from "../data/stories";

interface CreateStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateStory: (story: any) => void;
}

const CreateStoryDialog: React.FC<CreateStoryDialogProps> = ({
  open,
  onClose,
  onCreateStory,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    epic: "",
    priority: "Medium",
    storyPoints: 5,
    assignee: "",
    dependencies: [] as string[],
  });

  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.epic ||
      !formData.assignee
    ) {
      setError("Please fill in all required fields");
      return;
    }

    const newStory = {
      id: `S${stories.length + 1}`,
      title: formData.title,
      description: formData.description,
      status: "TODO",
      priority: formData.priority,
      epic: formData.epic,
      storyPoints: formData.storyPoints,
      assignee: formData.assignee,
      progress: 0,
      dependencies: formData.dependencies,
      createdDate: new Date().toISOString().split("T")[0],
    };

    onCreateStory(newStory);
    setFormData({
      title: "",
      description: "",
      epic: "",
      priority: "Medium",
      storyPoints: 5,
      assignee: "",
      dependencies: [],
    });
    setError("");
    onClose();
  };

  const teamMembers = ["Alice", "Bob", "Carol", "Dave", "Eve", "Frank"];
  const priorities = ["Low", "Medium", "High", "Critical"];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div">
          Create New Story
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
            label="Story Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            sx={{ mb: 2 }}
            required
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            sx={{ mb: 2 }}
            required
          />

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <TextField
              select
              label="Epic"
              value={formData.epic}
              onChange={(e) =>
                setFormData({ ...formData, epic: e.target.value })
              }
              sx={{ flex: 1 }}
              required
            >
              {epics.map((epic) => (
                <MenuItem key={epic.id} value={epic.id}>
                  {epic.id}: {epic.title}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              sx={{ flex: 1 }}
            >
              {priorities.map((priority) => (
                <MenuItem key={priority} value={priority}>
                  {priority}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography gutterBottom>
              Story Points: {formData.storyPoints}
            </Typography>
            <Slider
              value={formData.storyPoints}
              onChange={(_, value) =>
                setFormData({ ...formData, storyPoints: value as number })
              }
              min={1}
              max={21}
              marks={[
                { value: 1, label: "1" },
                { value: 5, label: "5" },
                { value: 8, label: "8" },
                { value: 13, label: "13" },
                { value: 21, label: "21" },
              ]}
              step={1}
            />
          </Box>

          <TextField
            select
            label="Assignee"
            value={formData.assignee}
            onChange={(e) =>
              setFormData({ ...formData, assignee: e.target.value })
            }
            fullWidth
            sx={{ mb: 2 }}
            required
          >
            {teamMembers.map((member) => (
              <MenuItem key={member} value={member}>
                {member}
              </MenuItem>
            ))}
          </TextField>

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Dependencies (optional)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {stories
                .filter((story) => story.status === "DONE")
                .map((story) => (
                  <Chip
                    key={story.id}
                    label={`${story.id}: ${story.title}`}
                    variant={
                      formData.dependencies.includes(story.id)
                        ? "filled"
                        : "outlined"
                    }
                    onClick={() => {
                      const deps = formData.dependencies.includes(story.id)
                        ? formData.dependencies.filter((id) => id !== story.id)
                        : [...formData.dependencies, story.id];
                      setFormData({ ...formData, dependencies: deps });
                    }}
                    size="small"
                  />
                ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Story
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStoryDialog;
