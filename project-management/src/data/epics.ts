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
  {
    id: "E7",
    title: "Enterprise Intelligence & Advanced Trading Systems",
    description:
      "Transform the platform into an institutional-grade system with enterprise data infrastructure, behavioral finance AI, autonomous market making, and macroeconomic intelligence for professional trading operations.",
    status: "TODO",
    owner: "Enterprise Team",
    createdDate: "2025-06-25",
  },
  {
    id: "E8",
    title: "Quantum Computing & Next-Generation Technologies",
    description:
      "Implement cutting-edge quantum computing capabilities for portfolio optimization and risk management, providing exponential improvements over classical computing methods for complex financial problems.",
    status: "TODO",
    owner: "Quantum Research Team",
    createdDate: "2025-06-25",
  },
];
