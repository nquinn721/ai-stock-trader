// Project management scripts data
export interface ScriptAction {
  id: string;
  name: string;
  description: string;
  command: string;
  category: "story" | "sprint" | "report" | "maintenance";
  icon: string;
  color: string;
}

export const scripts: ScriptAction[] = [
  {
    id: "create-story",
    name: "Create New Story",
    description: "Generate a new user story with template structure",
    command: "npm run create-story",
    category: "story",
    icon: "AddTask",
    color: "#4caf50",
  },
  {
    id: "start-sprint",
    name: "Start Sprint",
    description: "Initialize a new sprint and move selected stories",
    command: "npm run start-sprint",
    category: "sprint",
    icon: "PlayArrow",
    color: "#2196f3",
  },
  {
    id: "generate-report",
    name: "Generate Report",
    description: "Create sprint and project progress reports",
    command: "npm run generate-report",
    category: "report",
    icon: "Assessment",
    color: "#ff9800",
  },
  {
    id: "update-progress",
    name: "Update Progress",
    description: "Refresh project progress and metrics",
    command: "npm run update-progress",
    category: "maintenance",
    icon: "Refresh",
    color: "#9c27b0",
  },
];

export default scripts;
