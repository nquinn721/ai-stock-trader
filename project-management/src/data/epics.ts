// Epics data - removed user management epic since there's no login/registration
import { Epic } from "./types";

export const epics: Epic[] = [
  {
    id: "E1",
    title: "Real-Time Stock Trading",
    description:
      "Implement real-time trading, order placement, and portfolio management with live market data.",
    status: "IN_PROGRESS",
    owner: "Trading Team",
    createdDate: "2025-06-01",
  },
  {
    id: "E2",
    title: "News & Analytics Integration",
    description:
      "Integrate real news feeds and analytics for informed trading decisions.",
    status: "IN_PROGRESS",
    owner: "Data Team",
    createdDate: "2025-06-01",
  },
  {
    id: "E3",
    title: "Advanced Portfolio Analytics",
    description:
      "Build comprehensive portfolio analytics with risk assessment and performance tracking.",
    status: "TODO",
    owner: "Analytics Team",
    createdDate: "2025-06-15",
  },
  {
    id: "E4",
    title: "Project Management Dashboard",
    description:
      "React-based project management system with dark theme and automated workflows.",
    status: "DONE",
    owner: "DevOps Team",
    createdDate: "2025-06-10",
    completedDate: "2025-06-20",
  },
];
