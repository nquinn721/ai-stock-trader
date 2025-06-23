import "./App.css";
import Dashboard from "./components/Dashboard";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/NotificationToast";
import { rootStore } from "./stores/RootStore";
import { StoreProvider } from "./stores/StoreContext";

function App() {
  return (
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
  );
}

export default App;
