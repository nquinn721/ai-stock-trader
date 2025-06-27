// Updated types for React-based project management
export type Epic = {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "ON_HOLD" | "ARCHIVED";
  owner: string;
  createdDate: string;
  completedDate?: string;
  archivedDate?: string;
};

export type Story = {
  id: string;
  title: string;
  description: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED" | "REVIEW" | "ARCHIVED";
  priority: "Low" | "Medium" | "High" | "Critical";
  epic: string;
  storyPoints: number;
  sprint?: number;
  assignee: string;
  progress: number;
  dependencies: string[];
  createdDate: string;
  completedDate?: string;
  archivedDate?: string;
};

export type Sprint = {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  stories: string[];
  status: "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  velocity?: number;
};

export type ProjectAction = {
  id: string;
  type: "CREATE_STORY" | "START_SPRINT" | "GENERATE_REPORT";
  title: string;
  description: string;
  icon: string;
  color: string;
};
