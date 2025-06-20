import { Assessment as ReportIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { sprints } from "../data/sprints";
import { stories } from "../data/stories";

interface GenerateReportDialogProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (reportData: any) => void;
}

const GenerateReportDialog: React.FC<GenerateReportDialogProps> = ({
  open,
  onClose,
  onGenerate,
}) => {
  const [sprintId, setSprintId] = useState<number | "">("");
  const [reportType, setReportType] = useState("sprint-summary");
  const [customTitle, setCustomTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!sprintId) return;

    setIsGenerating(true);

    const selectedSprint = sprints.find((s) => s.id === sprintId);
    const sprintStories = stories.filter((story) =>
      selectedSprint?.stories.includes(story.id)
    );

    const reportData = {
      id: `report-${Date.now()}`,
      type: reportType,
      title:
        customTitle ||
        `${
          reportType === "sprint-summary" ? "Sprint Summary" : "Velocity Report"
        } - ${selectedSprint?.name}`,
      sprintId,
      sprintName: selectedSprint?.name,
      generatedAt: new Date().toISOString(),
      data: {
        sprint: selectedSprint,
        stories: sprintStories,
        totalStories: sprintStories.length,
        completedStories: sprintStories.filter((s) => s.status === "DONE")
          .length,
        totalStoryPoints: sprintStories.reduce(
          (sum, s) => sum + s.storyPoints,
          0
        ),
        completedStoryPoints: sprintStories
          .filter((s) => s.status === "DONE")
          .reduce((sum, s) => sum + s.storyPoints, 0),
        velocity: sprintStories
          .filter((s) => s.status === "DONE")
          .reduce((sum, s) => sum + s.storyPoints, 0),
        burndownData: generateBurndownData(sprintStories),
      },
    };

    // Simulate report generation delay
    setTimeout(() => {
      onGenerate(reportData);
      setIsGenerating(false);
      onClose();

      // Reset form
      setSprintId("");
      setReportType("sprint-summary");
      setCustomTitle("");
    }, 1500);
  };

  const generateBurndownData = (sprintStories: any[]) => {
    const totalPoints = sprintStories.reduce(
      (sum, s) => sum + s.storyPoints,
      0
    );
    const completedPoints = sprintStories
      .filter((s) => s.status === "done")
      .reduce((sum, s) => sum + s.storyPoints, 0);

    return [
      { day: 0, remaining: totalPoints, ideal: totalPoints },
      { day: 1, remaining: totalPoints * 0.9, ideal: totalPoints * 0.85 },
      { day: 2, remaining: totalPoints * 0.8, ideal: totalPoints * 0.7 },
      { day: 3, remaining: totalPoints * 0.6, ideal: totalPoints * 0.55 },
      { day: 4, remaining: totalPoints * 0.4, ideal: totalPoints * 0.4 },
      { day: 5, remaining: totalPoints * 0.2, ideal: totalPoints * 0.25 },
      {
        day: 6,
        remaining: totalPoints - completedPoints,
        ideal: totalPoints * 0.1,
      },
      {
        day: 7,
        remaining: Math.max(0, totalPoints - completedPoints),
        ideal: 0,
      },
    ];
  };
  const selectedSprint = sprints.find((s) => s.id === sprintId);
  const sprintStories = selectedSprint
    ? stories.filter((story) => selectedSprint.stories.includes(story.id))
    : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <ReportIcon color="warning" />
        Generate Sprint Report
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Sprint</InputLabel>{" "}
            <Select
              value={sprintId}
              label="Select Sprint"
              onChange={(e) => setSprintId(e.target.value as number)}
            >
              {sprints.map((sprint) => (
                <MenuItem key={sprint.id} value={sprint.id}>
                  {sprint.name} ({sprint.status})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={reportType}
              label="Report Type"
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="sprint-summary">Sprint Summary</MenuItem>
              <MenuItem value="velocity-report">Velocity Report</MenuItem>
              <MenuItem value="burndown-chart">Burndown Analysis</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Custom Report Title (Optional)"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Leave blank for auto-generated title"
          />

          {selectedSprint && (
            <Box
              sx={{
                p: 2,
                backgroundColor: "background.paper",
                borderRadius: 2,
                border: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Sprint Preview: {selectedSprint.name}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip
                  label={`${sprintStories.length} stories`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`${sprintStories.reduce(
                    (sum, s) => sum + s.storyPoints,
                    0
                  )} story points`}
                  size="small"
                  color="secondary"
                />{" "}
                <Chip
                  label={`${
                    sprintStories.filter((s) => s.status === "DONE").length
                  } completed`}
                  size="small"
                  color="success"
                />
              </Stack>

              <Typography variant="body2" color="textSecondary">
                Duration: {selectedSprint.startDate} - {selectedSprint.endDate}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Status: {selectedSprint.status}
              </Typography>
            </Box>
          )}

          {sprintId && reportType && (
            <Alert severity="info">
              This will generate a comprehensive {reportType.replace("-", " ")}{" "}
              report with velocity metrics, burndown charts, and story
              completion analysis.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isGenerating}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!sprintId || isGenerating}
          startIcon={<ReportIcon />}
        >
          {isGenerating ? "Generating..." : "Generate Report"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GenerateReportDialog;
