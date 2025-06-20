// Types for project management data
export type Epic = {
  id: string;
  title: string;
  description: string;
  status: string;
  owner: string;
};

export type Story = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  epic: string;
  storyPoints: number;
  sprint: number;
  assignee: string;
  progress: number;
  dependencies: string[];
};

export type Sprint = {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  stories: string[];
  status: string;
};

export type Script = {
  name: string;
  description: string;
  usage: string;
};
