import "./App.css";
import Dashboard from "./components/Dashboard";
import { SocketProvider } from "./context/SocketContext";
import { rootStore } from "./stores/RootStore";
import { StoreProvider } from "./stores/StoreContext";

function App() {
  return (
    <StoreProvider store={rootStore}>
      <SocketProvider>
        <div className="App">
          <Dashboard />
        </div>
      </SocketProvider>
    </StoreProvider>
  );
}

export default App;
