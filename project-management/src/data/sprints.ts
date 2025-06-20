// Sprints data - updated for trading focus
import { Sprint } from "./types";

export const sprints: Sprint[] = [
  {
    id: 1,
    name: "Sprint 1 - Foundation",
    goal: "Establish real-time data foundation and basic trading infrastructure.",
    startDate: "2025-06-01",
    endDate: "2025-06-14",
    stories: ["S1"],
    status: "COMPLETED",
    velocity: 8,
  },
  {
    id: 2,
    name: "Sprint 2 - Core Trading",
    goal: "Implement core trading features and portfolio management.",
    startDate: "2025-06-15",
    endDate: "2025-06-28",
    stories: ["S2", "S3", "S4"],
    status: "ACTIVE",
    velocity: 21,
  },
  {
    id: 3,
    name: "Sprint 3 - Analytics",
    goal: "Add technical analysis and advanced portfolio tools.",
    startDate: "2025-06-29",
    endDate: "2025-07-12",
    stories: ["S5", "S6"],
    status: "PLANNING",
    velocity: 21,
  },
];
