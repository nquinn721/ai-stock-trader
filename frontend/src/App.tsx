import "./App.css";
import Dashboard from "./components/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";
import NotificationToast from "./components/NotificationToast";
import { NotificationProvider } from "./context/NotificationContext";
import { SocketProvider } from "./context/SocketContext";
import { rootStore } from "./stores/RootStore";
import { StoreProvider } from "./stores/StoreContext";

function App() {
  return (
    <ErrorBoundary>
      <StoreProvider store={rootStore}>
        <SocketProvider>
          <NotificationProvider>
            <div className="App">
              <Dashboard />
              <NotificationToast />
            </div>
          </NotificationProvider>
        </SocketProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}

export default App;
