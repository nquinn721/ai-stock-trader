import { useEffect } from "react";
import { useWebSocketStore } from "../stores/StoreContext";

/**
 * Custom hook to ensure WebSocket connection is established
 * This hook should be used in every page that needs real-time data
 */
export const useWebSocketConnection = () => {
  const webSocketStore = useWebSocketStore();

  useEffect(() => {
    // Only connect if not already connected or connecting
    if (!webSocketStore.isConnected && !webSocketStore.isConnecting) {
      console.log("useWebSocketConnection: Establishing WebSocket connection");
      webSocketStore.connect();
    } else if (webSocketStore.isConnected) {
      console.log("useWebSocketConnection: WebSocket already connected");
    } else if (webSocketStore.isConnecting) {
      console.log("useWebSocketConnection: WebSocket connection in progress");
    }

    // Don't disconnect on unmount to keep connection alive for other components
    return () => {
      console.log(
        "useWebSocketConnection: Component unmounting, keeping connection alive"
      );
    };
  }, []); // Empty dependency array to run only once

  return {
    isConnected: webSocketStore.isConnected,
    isConnecting: webSocketStore.isConnecting,
    error: webSocketStore.error,
    connect: webSocketStore.connect.bind(webSocketStore),
    disconnect: webSocketStore.disconnect.bind(webSocketStore),
  };
};
