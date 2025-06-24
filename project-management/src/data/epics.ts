// Epics data - removed user management epic since there's no login/registration
import { Epic } from "./types";

export const epics: Epic[] = [
  {
    id: "E1",
    title: "Core Trading Infrastructure",
    description:
      "Implement real-time trading, portfolio management, and live market data integration with no mock data.",
    status: "IN_PROGRESS",
    owner: "Trading Team",
    createdDate: "2025-06-01",
  },
  {
    id: "E2",
    title: "Testing & Quality Assurance",
    description:
      "Comprehensive testing suite including unit tests, integration tests, and E2E testing with Playwright.",
    status: "TODO",
    owner: "QA Team",
    createdDate: "2025-06-21",
  },
  {
    id: "E3",
    title: "User Experience & Interface",
    description:
      "Enhanced UI/UX with FontAwesome icons, improved navigation, and responsive design.",
    status: "TODO",
    owner: "Frontend Team",
    createdDate: "2025-06-21",
  },
  {
    id: "E4",
    title: "AI Day Trading Analytics",
    description:
      "Advanced technical analysis, pattern recognition, and day trading indicators using AI/ML models.",
    status: "TODO",
    owner: "Data Science Team",
    createdDate: "2025-06-21",
  },
  {
    id: "E5",
    title: "Intelligent Recommendations System",
    description:
      "AI-powered real-time trading recommendations combining technical analysis, news sentiment, and market patterns.",
    status: "TODO",
    owner: "AI Team",
    createdDate: "2025-06-21",
  },
  {
    id: "E28",
    title: "ML Trading Enhancement",
    description:
      "Enhance the trading platform with advanced machine learning capabilities including sentiment analysis, portfolio optimization, and pattern recognition to improve trading decision-making and portfolio performance.",
    status: "IN_PROGRESS",
    owner: "AI Assistant",
    createdDate: "2025-06-23",
  },
];
