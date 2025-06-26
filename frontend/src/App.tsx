import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import NotificationToast from "./components/NotificationToast";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import AIAssistantPage from "./pages/AIAssistantPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AutonomousTradingPage from "./pages/AutonomousTradingPage";
import DashboardPage from "./pages/DashboardPage";
import MarketScannerPage from "./pages/MarketScannerPage";
import { rootStore } from "./stores/RootStore";
import { StoreProvider } from "./stores/StoreContext";

function App() {
  return (
    <ErrorBoundary>
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
                    <Route path="/analytics" element={<AnalyticsPage />} />
                    <Route
                      path="/market-scanner"
                      element={<MarketScannerPage />}
                    />
                    <Route path="/ai-assistant" element={<AIAssistantPage />} />
                  </Routes>
                </main>
                <NotificationToast />
              </div>
            </Router>
          </NotificationProvider>
        </SocketProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
