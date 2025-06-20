// Project actions - React-based functionality to replace PowerShell scripts
export const projectActions = [
  {
    id: "create-story",
    type: "CREATE_STORY",
    title: "Create New Story",
    description:
      "Add a new user story to the backlog with epic assignment and details.",
    icon: "AddTask",
    color: "#4caf50",
  },
  {
    id: "start-sprint",
    type: "START_SPRINT",
    title: "Start New Sprint",
    description:
      "Initialize a new sprint with selected stories and set sprint goals.",
    icon: "PlayArrow",
    color: "#2196f3",
  },
  {
    id: "generate-report",
    type: "GENERATE_REPORT",
    title: "Generate Sprint Report",
    description:
      "Create comprehensive sprint reports with velocity and burndown charts.",
    icon: "Assessment",
    color: "#ff9800",
  },
];
