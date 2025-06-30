import { makeAutoObservable, runInAction } from "mobx";
import { io, Socket } from "socket.io-client";
import { FRONTEND_API_CONFIG, getWebSocketConfig } from "../config/api.config";

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

export class WebSocketStore {
  socket: Socket | null = null;
  isConnected = false;
  isConnecting = false;
  error: string | null = null;
  events: WebSocketEvent[] = [];
  reconnectAttempts = 0;
  maxReconnectAttempts = getWebSocketConfig().maxReconnectAttempts;
  private eventListeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    makeAutoObservable(this);
  }

  connect(url: string = FRONTEND_API_CONFIG.backend.wsUrl) {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    console.log("🔌 WebSocket: Attempting connection...");
    console.log("🔌 WebSocket: URL:", url);
    console.log("🔌 WebSocket: Config:", FRONTEND_API_CONFIG.backend);

    runInAction(() => {
      this.isConnecting = true;
      this.error = null;
    });

    this.socket = io(url, {
      transports: ["polling", "websocket"],
      timeout: getWebSocketConfig().heartbeatInterval,
      autoConnect: true,
      forceNew: true, // Force new connection
      upgrade: true,
      rememberUpgrade: false,
      // Add timestamp to avoid caching
      query: {
        t: Date.now(),
      },
    });

    // Add detailed logging for debugging
    console.log("🔌 WebSocket: Creating connection to", url);
    console.log("🔌 WebSocket: Configuration:", {
      transports: ["polling", "websocket"],
      timeout: getWebSocketConfig().heartbeatInterval,
    });

    this.socket.on("connect", () => {
      runInAction(() => {
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.error = null;
      });
      console.log("✅ WebSocket connected successfully!");
      console.log("🔌 Socket ID:", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      runInAction(() => {
        this.isConnected = false;
        this.isConnecting = false;
      });
      console.log("WebSocket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      runInAction(() => {
        this.isConnected = false;
        this.isConnecting = false;
        this.error = error.message;
      });
      console.error("❌ WebSocket connection error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
      });
      this.handleReconnect();
    });

    // Listen for specific events
    this.socket.on("stock_updates", (data) => {
      this.addEvent("stock_updates", data);
    });

    this.socket.on("stock_update", (data) => {
      this.addEvent("stock_update", data);
    });

    // Handle batched stock updates from backend
    this.socket.on("stock_updates_batch", (data) => {
      if (data && data.updates) {
        // Process each update in the batch
        data.updates.forEach((update: any) => {
          this.addEvent("stock_updates", update);
        });
        console.log(
          `📊 Processed batch of ${data.updates.length} stock updates`
        );
      }
    });

    this.socket.on("trading_signal", (data) => {
      this.addEvent("trading_signal", data);
    });

    this.socket.on("portfolio_update", (data) => {
      this.addEvent("portfolio_update", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    runInAction(() => {
      this.isConnected = false;
      this.isConnecting = false;
      this.error = null;
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const wsConfig = getWebSocketConfig();
      const backoffDelay = Math.min(
        Math.pow(2, this.reconnectAttempts) * wsConfig.reconnectInterval,
        30000 // Max 30 seconds
      );

      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnecting... attempt ${this.reconnectAttempts}`);
        this.connect();
      }, backoffDelay);
    }
  }

  addListener(eventType: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  removeListener(eventType: string, callback: (data: any) => void) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private notifyListeners(eventType: string, data: any) {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  private addEvent(type: string, data: any) {
    runInAction(() => {
      const event: WebSocketEvent = {
        type,
        data,
        timestamp: Date.now(),
      };
      this.events.unshift(event);

      // Keep only last 100 events
      if (this.events.length > 100) {
        this.events = this.events.slice(0, 100);
      }

      // Notify listeners
      this.notifyListeners(type, data);
    });
  }

  emit(event: string, data?: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Cannot emit event: WebSocket not connected");
    }
  }

  getEventsByType(type: string): WebSocketEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  clearEvents() {
    this.events = [];
  }

  clearError() {
    this.error = null;
  }
}

export const webSocketStore = new WebSocketStore();
