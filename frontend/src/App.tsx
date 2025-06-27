import { ThemeProvider } from "@mui/material/styles";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import NotificationToast from "./components/NotificationToast";
import EnterpriseDataIntelligence from "./components/enterprise/EnterpriseDataIntelligence";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import AIAssistantPage from "./pages/AIAssistantPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AutomatedTradingPage from "./pages/AutomatedTradingPage";
import AutonomousTradingPage from "./pages/AutonomousTradingPage";
import DashboardPage from "./pages/DashboardPage";
import MarketScannerPage from "./pages/MarketScannerPage";
import { rootStore } from "./stores/RootStore";
import { StoreProvider } from "./stores/StoreContext";
import { darkTheme } from "./theme";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={darkTheme}>
        <StoreProvider store={rootStore}>
          <SocketProvider>
            <NotificationProvider>
              <Router>
                <div className="App">
                  <Header />
                  <main className="app-main">
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route
                        path="/autonomous-trading"
                        element={<AutonomousTradingPage />}
                      />
                      <Route
                        path="/automated-trading"
                        element={<AutomatedTradingPage />}
                      />
                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route
                        path="/market-scanner"
                        element={<MarketScannerPage />}
                      />
                      <Route
                        path="/ai-assistant"
                        element={<AIAssistantPage />}
                      />
                      <Route
                        path="/enterprise-intelligence"
                        element={<EnterpriseDataIntelligence />}
                      />
                    </Routes>
                  </main>
                  <NotificationToast />
                </div>
              </Router>
            </NotificationProvider>
          </SocketProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
