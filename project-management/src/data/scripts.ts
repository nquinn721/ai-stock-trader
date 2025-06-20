// PowerShell scripts as data
export const scripts = [
  {
    name: "generate-report.ps1",
    description: "Generate a sprint/project report in markdown format.",
    usage: "./scripts/generate-report.ps1 -Sprint 2",
  },
  {
    name: "create-story.ps1",
    description: "Create a new story markdown file with a template.",
    usage: "./scripts/create-story.ps1 -Title 'New Feature' -Epic E2",
  },
  {
    name: "start-sprint.ps1",
    description: "Start a new sprint and update progress tracking.",
    usage: "./scripts/start-sprint.ps1 -Sprint 3",
  },
];
