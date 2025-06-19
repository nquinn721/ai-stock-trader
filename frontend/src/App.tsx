import React from 'react';
import { SocketProvider } from './context/SocketContext';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <div className="App">
        <Dashboard />
      </div>
    </SocketProvider>
  );
}

export default App;
